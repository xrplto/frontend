import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import styled from '@emotion/styled';
import { Client } from 'xrpl';
import { AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { getNftCoverUrl, parseTransaction, BLACKHOLE_ACCOUNTS } from 'src/utils/parseUtils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Wallet,
  Copy,
  MessageCircle,
  ExternalLink,
  Coins,
  Image,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertTriangle,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  GitBranch,
  Code2,
  Sparkles,
  Tag,
  Trash2,
  Shield,
  Star,
  Gem,
  User
} from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import CryptoJS from 'crypto-js';

// Same wrapper as index.js for consistent width
const PageWrapper = styled.div`
  overflow: hidden;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const AccountInfoDetails = ({ accountInfo, isDark }) => {
  if (!accountInfo) return null;
  const details = [
    accountInfo.inception && { label: 'Created', value: new Date(accountInfo.inception).toLocaleDateString() },
    accountInfo.reserve > 0 && { label: 'Reserve', value: `${accountInfo.reserve} XRP` },
    accountInfo.ownerCount > 0 && { label: 'Objects', value: accountInfo.ownerCount },
    accountInfo.domain && { label: 'Domain', value: <a href={`https://${accountInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">{accountInfo.domain}</a> },
    accountInfo.parent && { label: 'Activated by', value: <a href={`/address/${accountInfo.parent}`} className="text-[#3b82f6] hover:underline">{`${accountInfo.parent.slice(0,6)}...`}</a> }
  ].filter(Boolean);

  if (details.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-1 text-[11px] mt-2', isDark ? 'text-white/40' : 'text-gray-500')}>
      {details.map((d, i) => <span key={i}><span className="font-medium">{d.label}:</span> {d.value}</span>)}
    </div>
  );
};

const StatCard = ({ title, value, subValue, valueClass, isDark }) => (
  <div className={cn('p-3 rounded-lg border-[1.5px]', isDark ? 'border-white/10' : 'border-gray-200')}>
    <p className={cn('text-[10px] uppercase tracking-wider mb-0.5', isDark ? 'text-white/40' : 'text-gray-500')}>
      {title}
    </p>
    <p className={cn('text-[20px] font-medium tabular-nums', valueClass, isDark ? 'text-white' : 'text-gray-900')}>
      {value}
    </p>
    {subValue && <p className={cn('text-[10px] tabular-nums', isDark ? 'text-white/30' : 'text-gray-400')}>{subValue}</p>}
  </div>
);

const TradingStat = ({ label, value, color, isDark }) => (
  <div className="text-center flex-1">
    <p className={cn('text-[9px] uppercase tracking-wider mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>
      {label}
    </p>
    <p className={cn('text-[14px] font-semibold tabular-nums', color)}>
      {value}
    </p>
  </div>
);

// NFT Image component with lazy loading and tooltip
const NftImage = ({ nftTokenId, className, fallback }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [nftData, setNftData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const ref = useState(null);

  useEffect(() => {
    if (!nftTokenId) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    axios
      .get(`https://api.xrpl.to/v1/nft/${nftTokenId}`)
      .then((res) => {
        if (cancelled) return;
        const nft = res.data;
        setNftData(nft);
        const coverUrl = getNftCoverUrl(nft, 'small', 'image');
        if (coverUrl) {
          setImageUrl(coverUrl);
        } else if (nft.meta?.image) {
          const metaImage = nft.meta.image;
          if (metaImage.startsWith('ipfs://')) {
            setImageUrl(`https://ipfs.io/ipfs/${metaImage.replace('ipfs://', '')}`);
          } else {
            setImageUrl(metaImage);
          }
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [nftTokenId]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    setShowTooltip(true);
  };

  if (loading) {
    return <div className={cn(className, 'bg-white/10 animate-pulse')} />;
  }
  if (error || !imageUrl) {
    return fallback || null;
  }

  const largeImageUrl = nftData ? (getNftCoverUrl(nftData, 'medium', 'image') || imageUrl) : imageUrl;

  return (
    <>
      <img
        src={imageUrl}
        alt=""
        className={className}
        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && nftData && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999
          }}
          className={cn(
            'rounded-xl p-3 min-w-[200px] max-w-[280px] shadow-xl border backdrop-blur-xl',
            isDark ? 'bg-black/90 border-white/10' : 'bg-white/95 border-gray-200'
          )}
        >
          <div className="flex gap-3">
            <img src={largeImageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {nftData.name || nftData.meta?.name || 'Unnamed'}
              </p>
              {nftData.collection && (
                <p className={cn('text-[11px] truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
                  {nftData.collection}
                </p>
              )}
              {nftData.rarity_rank > 0 && (
                <p className="text-[10px] text-purple-400 mt-1">Rank #{nftData.rarity_rank}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const OverView = ({ account }) => {
  const { themeName, accountProfile, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOwnAccount = accountProfile?.account === account;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;
  const [data, setData] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [filteredTxHistory, setFilteredTxHistory] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [txMarker, setTxMarker] = useState(null);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const txTypes = ['all', 'Payment', 'OfferCreate', 'OfferCancel', 'TrustSet', 'AMMDeposit', 'AMMWithdraw', 'NFTokenMint', 'NFTokenAcceptOffer', 'NFTokenCreateOffer', 'NFTokenBurn', 'CheckCreate', 'CheckCash', 'EscrowCreate', 'EscrowFinish', 'AccountSet'];
  const [holdings, setHoldings] = useState(null);
  const [holdingsPage, setHoldingsPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState(null);
  const [aiExplanation, setAiExplanation] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [tokenSearch, setTokenSearch] = useState('');
  // Trading performance pagination (server-side)
  const [tradingPerfOffset, setTradingPerfOffset] = useState(0);
  const [tradingPerfSort, setTradingPerfSort] = useState('volume');
  const [tradingPerfLoading, setTradingPerfLoading] = useState(false);
  const TRADING_PERF_LIMIT = 20;
  const [hideZeroHoldings, setHideZeroHoldings] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');
  const [xrpPrice, setXrpPrice] = useState(null);
  const [accountAI, setAccountAI] = useState(null);
  const [accountAILoading, setAccountAILoading] = useState(false);
  const [nftStats, setNftStats] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [isBlackholed, setIsBlackholed] = useState(false);
  const [nftCollections, setNftCollections] = useState([]);
  const [nftCollectionsLoading, setNftCollectionsLoading] = useState(false);
  const [selectedNftCollection, setSelectedNftCollection] = useState(null);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);
  const [historyView, setHistoryView] = useState('onchain');
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [tokenHistoryCursor, setTokenHistoryCursor] = useState(null);
  const [tokenHistoryHasMore, setTokenHistoryHasMore] = useState(false);
  const [tokenHistoryType, setTokenHistoryType] = useState('all');
  const [tokenHistoryPairType, setTokenHistoryPairType] = useState('');
  const [nftCollectionStats, setNftCollectionStats] = useState([]);
  const [nftCollectionStatsLoading, setNftCollectionStatsLoading] = useState(false);
  const [nftHistory, setNftHistory] = useState([]);
  const [tokenHistoryPage, setTokenHistoryPage] = useState(0);
  const [nftTradesPage, setNftTradesPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Ancestry state
  const [ancestry, setAncestry] = useState(null);
  const [ancestryLoading, setAncestryLoading] = useState(false);

  // Wallet label from logged-in user
  const [walletLabel, setWalletLabel] = useState(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [labelSaving, setLabelSaving] = useState(false);

  // User perks
  const [userPerks, setUserPerks] = useState(null);

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
    setTxMarker(null);
    setTxHasMore(false);
    setHoldings(null);
    setHoldingsPage(0);
    setTxPage(0);
    setTxSearch('');
    setTxFilter('all');
    setLoading(true);
    setTradingPerfOffset(0);
    setTradingPerfSort('volume');
    setAccountAI(null);
    setAccountAILoading(false);
    setNftStats(null);
    setNftCollections([]);
    setSelectedNftCollection(null);
    setCollectionNfts([]);
    setNftTrades([]);
    setNftCollectionStats([]);
    setNftHistory([]);
    setAncestry(null);
    setWalletLabel(null);
    setUserPerks(null);

    const fetchData = async () => {
      try {
        // Fetch profile data, holdings, and NFT stats
        const timedFetch = async (name, fn) => {
          const start = performance.now();
          const result = await fn();
          console.log(`[PERF] ${name}: ${(performance.now() - start).toFixed(0)}ms`);
          return result;
        };
        const [profileRes, holdingsRes, nftRes, balanceRes, liveRes] = await Promise.all([
          timedFetch('traders', () => axios.get(`https://api.xrpl.to/v1/traders/${account}?limit=${TRADING_PERF_LIMIT}&offset=0&sortTokensBy=volume`).catch(() => ({ data: null }))),
          timedFetch('trustlines', () => axios
            .get(`https://api.xrpl.to/v1/trustlines/${account}?limit=20&offset=0&format=full`)
            .catch(() => axios.get(`https://api.xrpl.to/v1/trustlines/${account}?limit=20&offset=0`))
            .catch(() => ({ data: null }))),
          timedFetch('nft-analytics', () => axios
            .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}`)
            .catch(() => ({ data: null }))),
          timedFetch('balance', () => axios
            .get(`https://api.xrpl.to/v1/account/balance/${account}?rank=true`)
            .catch(() => ({ data: null }))),
          timedFetch('account-info', () => axios
            .get(`https://api.xrpl.to/v1/account/info/${account}`)
            .catch(() => ({ data: null })))
        ]);

        const profile = profileRes.data || {};
        if (!profile.rank && balanceRes.data?.rank) profile.rank = balanceRes.data.rank;
        setData(profile.error ? { ...profile, rank: balanceRes.data?.rank } : profile);
        setHoldings(holdingsRes.data);
        setNftStats(nftRes.data);
        setAccountInfo(balanceRes.data);

        // Check if account is blackholed
        const liveData = liveRes?.data?.account_data;
        if (liveData || balanceRes.data) {
          const lsfDisableMaster = 0x00100000;
          const flags = balanceRes.data?.flags || liveData?.Flags || 0;
          const masterDisabled = (flags & lsfDisableMaster) !== 0;
          const regularKeyBlackholed = !liveData?.RegularKey || BLACKHOLE_ACCOUNTS.includes(liveData?.RegularKey);
          setIsBlackholed(BLACKHOLE_ACCOUNTS.includes(account) || (masterDisabled && regularKeyBlackholed));
        }
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

  // Fetch wallet label from logged-in user's labels
  useEffect(() => {
    if (!account || !accountProfile?.account || isOwnAccount) return;
    const fetchLabel = async () => {
      try {
        const res = await axios.get(`https://api.xrpl.to/api/user/${accountProfile.account}/labels`);
        if (res.data?.labels) {
          const found = res.data.labels.find(l => l.wallet === account);
          if (found) setWalletLabel(found.label);
        }
      } catch (e) {}
    };
    fetchLabel();
  }, [account, accountProfile?.account, isOwnAccount]);

  // Fetch user perks
  useEffect(() => {
    if (!account) return;
    const fetchPerks = async () => {
      try {
        const res = await axios.get(`https://api.xrpl.to/api/user/${account}/perks`);
        if (res.data) setUserPerks(res.data);
      } catch (e) {}
    };
    fetchPerks();
  }, [account]);

  const handleSaveLabel = async () => {
    if (!accountProfile?.account || !labelInput.trim()) return;
    setLabelSaving(true);
    try {
      if (walletLabel) {
        // Delete old then add new
        await axios.delete(`https://api.xrpl.to/api/user/${accountProfile.account}/labels/${account}`);
      }
      const res = await axios.post(`https://api.xrpl.to/api/user/${accountProfile.account}/labels`, {
        wallet: account,
        label: labelInput.trim()
      });
      setWalletLabel(res.data?.label || labelInput.trim());
      setEditingLabel(false);
    } catch (e) {}
    setLabelSaving(false);
  };

  const handleDeleteLabel = async () => {
    if (!accountProfile?.account || !walletLabel) return;
    setLabelSaving(true);
    try {
      await axios.delete(`https://api.xrpl.to/api/user/${accountProfile.account}/labels/${account}`);
      setWalletLabel(null);
      setEditingLabel(false);
      setLabelInput('');
    } catch (e) {}
    setLabelSaving(false);
  };

  useEffect(() => {
    if (!account) return;
    const isInitialLoad = holdingsPage === 0 && !holdings;
    if (isInitialLoad) return;

    axios
      .get(`https://api.xrpl.to/v1/trustlines/${account}?limit=20&offset=${holdingsPage * 20}&format=full`)
      .then((res) => setHoldings(res.data))
      .catch((err) => console.error('Failed to fetch holdings page:', err));
  }, [holdingsPage]);

  // Fetch trading performance when offset or sort changes
  useEffect(() => {
    if (!account || loading) return;
    const isInitialLoad = tradingPerfOffset === 0 && tradingPerfSort === 'volume';
    if (isInitialLoad) return;

    setTradingPerfLoading(true);
    axios
      .get(`https://api.xrpl.to/v1/traders/${account}?limit=${TRADING_PERF_LIMIT}&offset=${tradingPerfOffset}&sortTokensBy=${tradingPerfSort}`)
      .then((res) => {
        if (res.data && !res.data.error) {
          setData(prev => ({
            ...prev,
            tokenPerformance: res.data.tokenPerformance || [],
            pagination: res.data.pagination
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch trading performance:', err))
      .finally(() => setTradingPerfLoading(false));
  }, [tradingPerfOffset, tradingPerfSort]);

  // Fetch NFT collections when tab changes to 'nfts'
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftCollections.length > 0) return;
    setNftCollectionsLoading(true);
    axios
      .get(`https://api.xrpl.to/v1/nft/account/${account}/nfts`)
      .then((res) => {
        const cols = res.data?.collections || [];
        setNftCollections(
          cols.map((c) => ({
            id: c._id || c.cid || c.id,
            name: c.name,
            slug: c.slug,
            logo: c.logoImage ? `https://s1.xrpl.to/nft-collection/${c.logoImage}` : '',
            count: c.count || 0,
            value: c.value || 0
          }))
        );
      })
      .catch((err) => console.error('Failed to fetch NFT collections:', err))
      .finally(() => setNftCollectionsLoading(false));
  }, [activeTab, account]);

  // Fetch NFT collection trading stats when NFTs tab is viewed
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftCollectionStats.length > 0) return;
    setNftCollectionStatsLoading(true);
    axios
      .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}/collections?limit=100`)
      .then((res) => {
        const collections = res.data?.collections || [];
        collections.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        setNftCollectionStats(collections);
      })
      .catch(() => setNftCollectionStats([]))
      .finally(() => setNftCollectionStatsLoading(false));
  }, [activeTab, account]);

  // Fetch NFT trading history when NFTs tab is viewed
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftHistory.length > 0) return;
    axios
      .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}/history?limit=365`)
      .then((res) => setNftHistory(res.data?.history || []))
      .catch(() => setNftHistory([]));
  }, [activeTab, account]);

  // Fetch NFTs when a collection is selected
  useEffect(() => {
    if (!selectedNftCollection || !account) return;
    setCollectionNftsLoading(true);
    axios
      .get(
        `https://api.xrpl.to/v1/nft/collections/${selectedNftCollection.slug}/nfts?limit=50&skip=0&owner=${account}`
      )
      .then((res) => {
        const nfts = res.data?.nfts || [];
        setCollectionNfts(
          nfts.map((nft) => ({
            id: nft._id || nft.NFTokenID,
            nftId: nft.NFTokenID || nft._id,
            name: nft.name || nft.meta?.name || 'Unnamed NFT',
            image: getNftCoverUrl(nft, 'large') || '',
            rarity: nft.rarity_rank || 0
          }))
        );
      })
      .catch((err) => console.error('Failed to fetch collection NFTs:', err))
      .finally(() => setCollectionNftsLoading(false));
  }, [selectedNftCollection, account]);

  // Fetch ancestry data when ancestry tab is selected
  useEffect(() => {
    if (activeTab !== 'ancestry' || !account || ancestry) return;
    setAncestryLoading(true);
    axios
      .get(`https://api.xrpl.to/api/account/ancestry/${account}?include_tokens=true&token_limit=50`)
      .then((res) => setAncestry(res.data))
      .catch((err) => {
        console.error('Failed to fetch ancestry:', err);
        setAncestry(null);
      })
      .finally(() => setAncestryLoading(false));
  }, [activeTab, account]);

  // Fetch onchain history directly from XRP Ledger node via WebSocket
  const fetchTxHistory = async (marker = null) => {
    if (!account) return;
    setTxLoading(true);
    const client = new Client('wss://s1.ripple.com');
    try {
      await client.connect();
      const request = {
        command: 'account_tx',
        account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 50
      };
      if (marker) request.marker = marker;
      const response = await client.request(request);
      const txs = response.result?.transactions || [];
      setTxHistory((prev) => (marker ? [...prev, ...txs] : txs));
      setFilteredTxHistory((prev) => (marker ? [...prev, ...txs] : txs));
      setTxMarker(response.result?.marker || null);
      setTxHasMore(!!response.result?.marker);
    } catch (err) {
      console.error('TX history fetch failed:', err);
    } finally {
      client.disconnect();
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'activity' || historyView !== 'onchain' || !account) return;
    if (txHistory.length > 0) return;
    fetchTxHistory();
  }, [activeTab, historyView, account, txHistory.length]);

  // Fetch NFT trades when activity tab is viewed
  useEffect(() => {
    if (activeTab !== 'activity' || !account || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    axios
      .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}/trades?offset=0&limit=50`)
      .then((res) => setNftTrades(res.data?.trades || []))
      .catch(() => setNftTrades([]))
      .finally(() => setNftTradesLoading(false));
  }, [activeTab, account]);

  // Build token history URL with filters
  const buildTokenHistoryUrl = (cursor = null) => {
    let url = `https://api.xrpl.to/v1/history?account=${account}&limit=50`;
    if (tokenHistoryType && tokenHistoryType !== 'all') url += `&type=${tokenHistoryType}`;
    if (tokenHistoryPairType) url += `&pairType=${tokenHistoryPairType}`;
    if (cursor) url += `&cursor=${cursor}`;
    return url;
  };

  // Fetch token history when tokens view is selected or filters change
  useEffect(() => {
    if (activeTab !== 'activity' || historyView !== 'tokens' || !account) return;
    setTokenHistoryLoading(true);
    axios
      .get(buildTokenHistoryUrl())
      .then((res) => {
        setTokenHistory(res.data?.data || []);
        setTokenHistoryCursor(res.data?.meta?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.meta?.nextCursor);
      })
      .catch((err) => console.error('Failed to fetch token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  }, [activeTab, historyView, account, tokenHistoryType, tokenHistoryPairType]);

  const loadMoreTokenHistory = () => {
    if (!tokenHistoryCursor || tokenHistoryLoading) return;
    setTokenHistoryLoading(true);
    axios
      .get(buildTokenHistoryUrl(tokenHistoryCursor))
      .then((res) => {
        setTokenHistory((prev) => [...prev, ...(res.data?.data || [])]);
        setTokenHistoryCursor(res.data?.meta?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.meta?.nextCursor);
      })
      .catch((err) => console.error('Failed to fetch more token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  };

  useEffect(() => {
    let filtered = txHistory;

    // Filter by transaction type
    if (txFilter !== 'all') {
      filtered = filtered.filter((tx) => {
        const txData = tx.tx_json || tx.tx || tx;
        return txData.TransactionType === txFilter;
      });
    }

    // Filter by search term
    if (txSearch.trim()) {
      const search = txSearch.toLowerCase().trim();
      filtered = filtered.filter((tx) => {
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

        return (
          hash.includes(search) ||
          account.includes(search) ||
          destination.includes(search) ||
          txType.includes(search) ||
          amountCurr.includes(search) ||
          sendMaxCurr.includes(search) ||
          takerGetsCurr.includes(search) ||
          takerPaysCurr.includes(search)
        );
      });
    }

    setFilteredTxHistory(filtered);
    setTxPage(0);
  }, [txFilter, txSearch, txHistory]);

  const getAvailableTxTypes = () => {
    const types = new Set(['all']);
    txHistory.forEach((tx) => {
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
    } catch {
      return code.substring(0, 6);
    }
  };

  // Use shared parseTransaction from parseUtils.js
  const parseTx = (tx) => parseTransaction(tx, account, decodeCurrency);

  const handleAccountAI = async () => {
    if (accountAILoading || accountAI) return;
    setAccountAILoading(true);
    try {
      const res = await axios.get(`https://api.xrpl.to/v1/account-tx-explain/${account}?limit=200`);
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
        <div className="mx-auto max-w-[1920px] w-full px-4 mt-4 flex-1">
          <div className="flex flex-col gap-4">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-6 w-48 rounded animate-pulse',
                  isDark ? 'bg-white/10' : 'bg-gray-200'
                )}
              />
              <div
                className={cn(
                  'h-5 w-5 rounded animate-pulse',
                  isDark ? 'bg-white/5' : 'bg-gray-100'
                )}
              />
            </div>
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={cn(
                      'h-3 w-16 rounded animate-pulse',
                      isDark ? 'bg-white/5' : 'bg-gray-100'
                    )}
                  />
                  <div
                    className={cn(
                      'h-7 w-24 rounded animate-pulse',
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-3 w-20 rounded animate-pulse',
                      isDark ? 'bg-white/5' : 'bg-gray-100'
                    )}
                  />
                </div>
              ))}
            </div>
            {/* Holdings skeleton */}
            <div
              className={cn(
                'rounded-xl border p-4',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}
            >
              <div
                className={cn(
                  'h-4 w-32 rounded animate-pulse mb-3',
                  isDark ? 'bg-white/10' : 'bg-gray-200'
                )}
              />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-10 rounded animate-pulse mb-2',
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <ScrollToTop />
        <Footer />
      </PageWrapper>
    );
  }

  const winRate = data?.totalTrades > 0 ? ((data.winningTrades || 0) / data.totalTrades) * 100 : 0;
  const totalPnL = data?.totalProfit || data?.profit || 0;
  const hasNoTradingData = !data || data.error;

  return (
    <PageWrapper>
      <div className="h-0" id="back-to-top-anchor" />
      <Header />
      {!isMobile && <TokenTabs currentMd5={account} />}
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
        {account} Profile on XRPL
      </h1>

      <div className="mx-auto max-w-[1920px] w-full px-4 mt-4 flex-1">
        <div className="flex flex-col">
          <div className="w-full">
            {/* Account Header */}
            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2
                    className={cn(
                      'text-xl md:text-2xl font-mono',
                      isBlackholed ? 'text-red-400' : isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    <span className="md:hidden">
                      {account.substring(0, 8)}...{account.substring(account.length - 6)}
                    </span>
                    <span className="hidden md:inline">{account}</span>
                  </h2>
                  {!isOwnAccount && accountProfile?.account && (
                    editingLabel ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value.slice(0, 30))}
                          placeholder="Label"
                          autoFocus
                          className={cn('w-24 px-2 py-0.5 rounded-md text-[12px] outline-none', isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-gray-100 text-gray-900 border border-gray-300')}
                        />
                        <button onClick={handleSaveLabel} disabled={labelSaving || !labelInput.trim()} className="px-2 py-0.5 rounded-md text-[11px] bg-[#137DFE] text-white disabled:opacity-50">Save</button>
                        {walletLabel && <button onClick={handleDeleteLabel} disabled={labelSaving} className={cn('p-1 rounded', isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50')}><Trash2 size={12} /></button>}
                        <button onClick={() => setEditingLabel(false)} className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>Cancel</button>
                      </div>
                    ) : walletLabel ? (
                      <button onClick={() => { setLabelInput(walletLabel); setEditingLabel(true); }} className={cn('text-[12px] px-2 py-0.5 rounded-md flex items-center gap-1 hover:opacity-80', isDark ? 'bg-[#137DFE]/15 text-[#137DFE]' : 'bg-blue-100 text-blue-600')}>
                        {walletLabel}
                      </button>
                    ) : (
                      <button onClick={() => { setLabelInput(''); setEditingLabel(true); }} className={cn('p-1 rounded-md transition-colors', isDark ? 'text-white/30 hover:text-white/50 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')} title="Add label">
                        <Tag size={14} />
                      </button>
                    )
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigator.clipboard.writeText(account)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isDark
                          ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                      title="Copy address"
                    >
                      <Copy size={14} />
                    </button>
                    {!isOwnAccount && (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: account } }))}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark
                            ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        )}
                        title="Message"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                    <ApiButton />
                  </div>
                  {isOwnAccount && (
                    <button
                      onClick={() => setOpenWalletModal(true)}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Wallet size={14} />
                      Manage
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {typeof data?.washTradingScore === 'number' && (
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border',
                        data.washTradingScore > 50
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : isDark
                            ? 'bg-white/[0.03] text-white/60 border-white/10'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                      )}
                      title="Wash Trading Score"
                    >
                      {data.washTradingScore > 50 && <AlertTriangle size={13} />}
                      <span>Wash {data.washTradingScore}</span>
                    </div>
                  )}
                  {data?.isAMM && (
                    <span className="text-[11px] h-5 px-2 rounded bg-[#3b82f6]/10 text-[#3b82f6] font-normal flex items-center">
                      AMM
                    </span>
                  )}
                  {userPerks?.groups?.map(group => {
                    const groupConfig = {
                      member: { icon: User, bg: isDark ? 'bg-white/[0.03]' : 'bg-gray-100', text: isDark ? 'text-white/60' : 'text-gray-600', border: isDark ? 'border-white/10' : 'border-gray-200' },
                      admin: { icon: Shield, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
                      verified: { icon: Check, bg: 'bg-[#08AA09]/10', text: 'text-[#08AA09]', border: 'border-[#08AA09]/20' },
                      diamond: { icon: Gem, bg: 'bg-[#650CD4]/10', text: 'text-[#a855f7]', border: 'border-[#650CD4]/20' },
                      nova: { icon: Star, bg: 'bg-[#F6AF01]/10', text: 'text-[#F6AF01]', border: 'border-[#F6AF01]/20' },
                      vip: { icon: Sparkles, bg: 'bg-[#137DFE]/10', text: 'text-[#137DFE]', border: 'border-[#137DFE]/20' }
                    };
                    const config = groupConfig[group] || { icon: null, bg: isDark ? 'bg-white/[0.03]' : 'bg-gray-100', text: isDark ? 'text-white/60' : 'text-gray-600', border: isDark ? 'border-white/10' : 'border-gray-200' };
                    const Icon = config.icon;
                    return (
                      <div key={group} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border', config.bg, config.text, config.border)}>
                        {Icon && <Icon size={13} />}
                        <span>{group.charAt(0).toUpperCase() + group.slice(1)}</span>
                      </div>
                    );
                  })}
                  {isBlackholed && (
                    <div className="relative group/blackhole">
                      <span className="text-[11px] h-5 px-2 rounded bg-red-500/10 text-red-400 font-normal flex items-center cursor-help">
                        Blackholed
                      </span>
                      <div className={cn(
                        'pointer-events-none absolute left-0 top-full mt-1.5 p-2.5 rounded-lg text-[11px] w-52 opacity-0 invisible group-hover/blackhole:opacity-100 group-hover/blackhole:visible transition-all duration-150 z-50',
                        isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-200 shadow-lg'
                      )}>
                        <div className="font-medium text-red-400 text-[12px] mb-1">Blackholed Account</div>
                        <div className={cn('leading-snug', isDark ? 'text-white/50' : 'text-gray-500')}>
                          Master key disabled, no valid regular key.
                        </div>
                        {accountInfo && (
                          <div className={cn('mt-2 pt-2 border-t space-y-1', isDark ? 'border-white/10' : 'border-gray-100')}>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Balance</span>
                              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>{accountInfo.total?.toFixed(2)} XRP</span>
                            </div>
                            {accountInfo.rank && (
                              <div className="flex justify-between">
                                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Rank</span>
                                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>#{accountInfo.rank.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!accountAI && !accountAILoading && (
                    <button
                      onClick={handleAccountAI}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-200',
                        isDark
                          ? 'border-[#8b5cf6]/25 hover:border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/15 text-[#c4b5fd] hover:text-[#ddd6fe]'
                          : 'border-[#8b5cf6]/30 hover:border-[#8b5cf6]/50 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#7c3aed] hover:text-[#6d28d9]'
                      )}
                    >
                      <Sparkles size={12} />
                      Explain with AI
                    </button>
                  )}
                  {accountAILoading && (
                    <span
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]',
                        isDark
                          ? 'border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]'
                          : 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#7c3aed]'
                      )}
                    >
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Analyzing...
                    </span>
                  )}
                </div>
              </div>
              <AccountInfoDetails accountInfo={accountInfo} isDark={isDark} />
              {data?.firstTradeDate && (
                <div
                  className={cn(
                    'text-[12px] md:text-[13px] mt-2',
                    isDark ? 'text-white/40' : 'text-gray-400'
                  )}
                >
                  Trading period: {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
                </div>
              )}
            </div>

            {/* AI Analysis Panel */}
            {(accountAILoading || accountAI) && (
              <div
                className={cn(
                  'mb-4 p-4 rounded-xl border-[1.5px]',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}
              >
                {accountAILoading ? (
                  <div className="space-y-2.5">
                    {[95, 80, 88, 65, 92, 100, 70].map((w, i) => (
                      <div
                        key={i}
                        className="h-[6px] rounded-sm overflow-hidden relative"
                        style={{ width: `${w}%` }}
                      >
                        <div
                          className="absolute inset-0 rounded-sm animate-pulse"
                          style={{
                            background:
                              i === 5
                                ? 'rgba(139,92,246,0.4)'
                                : isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.06)'
                          }}
                        />
                      </div>
                    ))}
                    <p
                      className={cn('mt-3 text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}
                    >
                      Analyzing account activity...
                    </p>
                  </div>
                ) : accountAI?.error ? (
                  <p className="text-[13px] text-[#ef4444]">{accountAI.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-[11px] font-medium uppercase',
                            accountAI.analysis?.profile === 'trader'
                              ? 'bg-[#3b82f6]/10 text-[#60a5fa]'
                              : accountAI.analysis?.profile === 'bot'
                                ? 'bg-[#f59e0b]/10 text-[#fbbf24]'
                                : accountAI.analysis?.profile === 'holder'
                                  ? 'bg-[#22c55e]/10 text-[#4ade80]'
                                  : 'bg-white/10 text-white/60'
                          )}
                        >
                          {accountAI.analysis?.profile || 'User'}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-[11px]',
                            accountAI.analysis?.riskLevel === 'low'
                              ? 'bg-[#22c55e]/10 text-[#4ade80]'
                              : accountAI.analysis?.riskLevel === 'medium'
                                ? 'bg-[#f59e0b]/10 text-[#fbbf24]'
                                : 'bg-[#ef4444]/10 text-[#f87171]'
                          )}
                        >
                          {accountAI.analysis?.riskLevel || 'unknown'} risk
                        </span>
                        <span
                          className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}
                        >
                          {accountAI.period}
                        </span>
                      </div>
                      <button
                        onClick={() => setAccountAI(null)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark
                            ? 'hover:bg-white/5 text-white/30'
                            : 'hover:bg-gray-100 text-gray-400'
                        )}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p
                      className={cn(
                        'text-[14px] leading-relaxed',
                        isDark ? 'text-white/80' : 'text-gray-700'
                      )}
                    >
                      {accountAI.analysis?.headline}
                    </p>
                    {accountAI.analysis?.riskReason && (
                      <p className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                        {accountAI.analysis.riskReason}
                      </p>
                    )}
                    {accountAI.stats && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                        <div>
                          <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Txns:</span>{' '}
                          <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                            {accountAI.txCount}
                          </span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                            Success:
                          </span>{' '}
                          <span className="text-[#22c55e]">{accountAI.stats.successRate}%</span>
                        </div>
                        {accountAI.stats.tradeCount > 0 && (
                          <div>
                            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                              Trades:
                            </span>{' '}
                            <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                              {accountAI.stats.tradeCount}
                            </span>
                          </div>
                        )}
                        {accountAI.stats.swapCount > 0 && (
                          <div>
                            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                              Swaps:
                            </span>{' '}
                            <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                              {accountAI.stats.swapCount}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Fees:</span>{' '}
                          <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                            {accountAI.stats.totalFees} XRP
                          </span>
                        </div>
                        {accountAI.stats.xrpNet !== 0 && (
                          <div>
                            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                              XRP Net:
                            </span>{' '}
                            <span
                              className={
                                accountAI.stats.xrpNet >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                              }
                            >
                              {accountAI.stats.xrpNet >= 0 ? '+' : ''}
                              {accountAI.stats.xrpNet}
                            </span>
                          </div>
                        )}
                        {accountAI.stats.tokens?.length > 0 && (
                          <div>
                            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                              Tokens:
                            </span>{' '}
                            <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                              {accountAI.stats.tokens.slice(0, 5).join(', ')}
                              {accountAI.stats.tokens.length > 5
                                ? ` +${accountAI.stats.tokens.length - 5}`
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {accountAI.analysis?.keyFindings?.length > 0 && (
                      <ul className="space-y-1.5">
                        {accountAI.analysis.keyFindings.map((f, i) => (
                          <li
                            key={i}
                            className={cn(
                              'text-[12px] flex items-start gap-2',
                              isDark ? 'text-white/60' : 'text-gray-500'
                            )}
                          >
                            <span className="text-[#8b5cf6]">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {accountAI.topAddresses?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}
                        >
                          Top:
                        </span>
                        {accountAI.topAddresses.slice(0, 3).map((a, i) => (
                          <Link
                            key={i}
                            href={`/address/${a.address}`}
                            className={cn(
                              'text-[11px] px-2 py-0.5 rounded',
                              isDark
                                ? 'bg-white/5 text-white/50 hover:text-white/70'
                                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                            )}
                          >
                            {a.label || `${a.address.slice(0, 6)}...`} ({a.interactions})
                          </Link>
                        ))}
                      </div>
                    )}
                    <p
                      className={cn(
                        'text-[10px] pt-2 border-t',
                        isDark ? 'border-white/5 text-white/30' : 'border-gray-100 text-gray-400'
                      )}
                    >
                      {accountAI.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Account Not Activated */}
            {holdings?.accountActive === false && (
              <div
                className={cn(
                  'text-center py-10 mb-4 rounded-xl border',
                  isDark ? 'border-[#ef4444]/20 bg-[#ef4444]/5' : 'border-red-200 bg-red-50'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center',
                    isDark ? 'bg-[#ef4444]/10' : 'bg-red-100'
                  )}
                >
                  <Wallet size={20} className="text-[#ef4444]" />
                </div>
                <p className={cn('text-[15px] font-medium', 'text-[#ef4444]')}>
                  Account not activated
                </p>
                <p className={cn('text-[13px] mt-1', isDark ? 'text-white/40' : 'text-gray-500')}>
                  This account has been deleted or was never funded
                </p>
              </div>
            )}

            {/* No Trading Data Message */}
            {hasNoTradingData && holdings?.accountActive !== false && (
              <div
                className={cn(
                  'text-center py-8 mb-4 rounded-xl border-[1.5px]',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center',
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  )}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isDark ? 'text-white/30' : 'text-gray-400'}
                  >
                    <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
                  </svg>
                </div>
                <p className={cn('text-[14px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                  No trading history
                </p>
              </div>
            )}

            {/* Summary Stats */}
            {(data || nftStats) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard
                  isDark={isDark}
                  title="XRP Balance"
                  value={
                    fCurrency5(holdings?.accountData?.total || holdings?.xrp?.value || 0) + ' XRP'
                  }
                  subValue={
                    holdings?.accountData?.reserve > 0
                      ? `${fCurrency5(holdings.xrp?.value || 0)} Avail | ${holdings.accountData.reserve} Reserve`
                      : accountInfo?.rank ? `#${accountInfo.rank.toLocaleString()} Rank` : ''
                  }
                />
                <StatCard
                  isDark={isDark}
                  title="Total P&L"
                  value={`${totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? '+' : ''}${fCurrency5(
                    totalPnL + (nftStats?.combinedProfit || 0)
                  )} XRP`}
                  valueClass={
                    totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                  }
                />
                <StatCard
                  isDark={isDark}
                  title="Total Trades"
                  value={fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}
                />
                <StatCard
                  isDark={isDark}
                  title="Total Volume"
                  value={`${fCurrency5(
                    (data?.dexVolume || 0) + (data?.ammVolume || 0) + (nftStats?.totalVolume || 0)
                  )} XRP`}
                />
              </div>
            )}

            {/* Two-column trading breakdown */}
            {(data || nftStats) && (
              <div className={cn('grid md:grid-cols-2 gap-3 mb-4')}>
                {/* Token Trading */}
                <div
                  className={cn(
                    'p-4 rounded-xl border-[1.5px] h-full flex flex-col',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                >
                  {data && !data.error ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center',
                              isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                            )}
                          >
                            <Coins size={12} className="text-emerald-500" />
                          </div>
                          <span
                            className={cn(
                              'text-[11px] font-semibold',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}
                          >
                            Token Trading
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px]',
                            isDark ? 'bg-white/[0.05]' : 'bg-gray-100/50'
                          )}
                        >
                          <span className="text-emerald-500 tabular-nums">
                            {fCurrency5(data.buyCount || 0)}
                          </span>
                          <span className={isDark ? 'text-white/20' : 'text-gray-300'}>|</span>
                          <span className="text-red-500 tabular-nums">
                            {fCurrency5(data.sellCount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        <TradingStat label="P&L" value={fCurrency5(totalPnL)} color={totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="ROI" value={`${(data.roi || 0).toFixed(1)}%`} color={(data.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="WIN" value={`${winRate.toFixed(0)}%`} color={isDark ? 'text-white' : 'text-gray-900'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="VOL" value={fCurrency5((data.dexVolume || 0) + (data.ammVolume || 0))} color={isDark ? 'text-white' : 'text-gray-900'} isDark={isDark} />
                      </div>
                      <div
                        className={cn(
                          'flex items-center justify-between pt-2.5 text-[10px] mt-auto',
                          isDark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>
                            <span className={isDark ? 'text-white/30' : 'text-gray-400'}>DEX</span>{' '}
                            <span
                              className={cn(
                                'tabular-nums font-medium',
                                (data.dexProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                              )}
                            >
                              {(data.dexProfit || 0) >= 0 ? '+' : ''}
                              {fCurrency5(data.dexProfit || 0)}
                            </span>
                          </span>
                          <span>
                            <span className={isDark ? 'text-white/30' : 'text-gray-400'}>AMM</span>{' '}
                            <span
                              className={cn(
                                'tabular-nums font-medium',
                                (data.ammProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                              )}
                            >
                              {(data.ammProfit || 0) >= 0 ? '+' : ''}
                              {fCurrency5(data.ammProfit || 0)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: '24H', value: data.profit24h || 0 },
                            { label: '7D', value: data.profit7d || 0 },
                            { label: '30D', value: data.profit30d || 0 },
                          ].map((p) => (
                            <span key={p.label}>
                              <span className={isDark ? 'text-white/25' : 'text-gray-300'}>
                                {p.label}
                              </span>{' '}
                              <span
                                className={cn(
                                  'tabular-nums',
                                  p.value >= 0 ? 'text-emerald-500' : 'text-red-500'
                                )}
                              >
                                {p.value >= 0 ? '+' : ''}
                                {fCurrency5(p.value)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[140px]">
                      <div
                        className={cn(
                          'w-9 h-9 mb-2 rounded-xl flex items-center justify-center',
                          isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                        )}
                      >
                        <Coins
                          size={16}
                          className={isDark ? 'text-emerald-500/50' : 'text-emerald-400'}
                        />
                      </div>
                      <p
                        className={cn(
                          'text-[11px] font-semibold tracking-wide mb-0.5',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        No Token Trades
                      </p>
                      <p className={cn('text-[10px]', isDark ? 'text-white/25' : 'text-gray-400')}>
                        Activity will appear here
                      </p>
                    </div>
                  )}
                </div>

                {/* NFT Trading */}
                <div
                  className={cn(
                    'p-4 rounded-xl border-[1.5px] h-full flex flex-col',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                >
                  {nftStats && (nftStats.totalVolume > 0 || nftStats.holdingsCount > 0) ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center',
                              isDark ? 'bg-violet-500/10' : 'bg-violet-50'
                            )}
                          >
                            <Image size={12} className="text-violet-500" />
                          </div>
                          <span
                            className={cn(
                              'text-[11px] font-semibold',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}
                          >
                            NFT Trading
                          </span>
                          {nftStats.holdingsCount > 0 && (
                            <span
                              className={cn(
                                'text-[9px] px-1.5 py-0.5 rounded-md font-medium',
                                isDark
                                  ? 'bg-violet-500/10 text-violet-400'
                                  : 'bg-violet-50 text-violet-500'
                              )}
                            >
                              {nftStats.holdingsCount} held
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px]',
                            isDark ? 'bg-white/[0.05]' : 'bg-gray-100/50'
                          )}
                        >
                          <span className="text-emerald-500 tabular-nums">
                            {fCurrency5(nftStats.buyCount || 0)}
                          </span>
                          <span className={isDark ? 'text-white/20' : 'text-gray-300'}>|</span>
                          <span className="text-red-500 tabular-nums">
                            {fCurrency5(nftStats.sellCount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        <TradingStat label="REALIZED" value={fCurrency5(nftStats.profit || 0)} color={(nftStats.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="UNREAL." value={fCurrency5(nftStats.unrealizedProfit || 0)} color={(nftStats.unrealizedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-amber-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="ROI" value={`${(nftStats.roi || 0).toFixed(1)}%`} color={(nftStats.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="WIN" value={`${(nftStats.winRate || 0).toFixed(0)}%`} color={isDark ? 'text-white' : 'text-gray-900'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                        <TradingStat label="VOL" value={fCurrency5(nftStats.totalVolume || 0)} color={isDark ? 'text-white' : 'text-gray-900'} isDark={isDark} />
                      </div>
                      <div
                        className={cn(
                          'flex items-center justify-between pt-2.5 text-[10px] mt-auto',
                          isDark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>
                            <span className={isDark ? 'text-white/30' : 'text-gray-400'}>
                              FLIPS
                            </span>{' '}
                            <span
                              className={cn(
                                'tabular-nums font-medium',
                                isDark ? 'text-white/70' : 'text-gray-600'
                              )}
                            >
                              {nftStats.flips || 0}
                            </span>
                          </span>
                          <span>
                            <span className={isDark ? 'text-white/30' : 'text-gray-400'}>HOLD</span>{' '}
                            <span
                              className={cn(
                                'tabular-nums font-medium',
                                isDark ? 'text-white/70' : 'text-gray-600'
                              )}
                            >
                              {(nftStats.avgHoldingDays || 0).toFixed(0)}d
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: '24H', value: nftStats.profit24h || 0 },
                            { label: '7D', value: nftStats.profit7d || 0 },
                            { label: '30D', value: nftStats.profit30d || 0 },
                          ].map((p) => (
                            <span key={p.label}>
                              <span className={isDark ? 'text-white/25' : 'text-gray-300'}>
                                {p.label}
                              </span>{' '}
                              <span
                                className={cn(
                                  'tabular-nums',
                                  p.value >= 0 ? 'text-emerald-500' : 'text-red-500'
                                )}
                              >
                                {p.value >= 0 ? '+' : ''}
                                {fCurrency5(p.value)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[140px]">
                      <div className="relative w-12 h-12 mb-2">
                        <div className={cn('absolute -top-0.5 left-0 w-4 h-4 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                          <div className={cn('absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        </div>
                        <div className={cn('absolute -top-0.5 right-0 w-4 h-4 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                          <div className={cn('absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        </div>
                        <div className={cn('absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-9 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-300/50')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
                            ))}
                          </div>
                          <div className="absolute top-2.5 left-1.5 w-2.5 h-2.5 flex items-center justify-center">
                            <div className={cn('absolute w-2 h-[1.5px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                            <div className={cn('absolute w-2 h-[1.5px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                          </div>
                          <div className="absolute top-2.5 right-1.5 w-2.5 h-2.5 flex items-center justify-center">
                            <div className={cn('absolute w-2 h-[1.5px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                            <div className={cn('absolute w-2 h-[1.5px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                          </div>
                          <div className={cn('absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                            <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-300')} />
                          </div>
                        </div>
                      </div>
                      <p className={cn('text-[10px] font-medium tracking-wider', isDark ? 'text-white/60' : 'text-gray-500')}>
                        NO NFT TRADES
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1.5 mb-4">
              {[
                { id: 'tokens', label: 'TOKENS', icon: Coins, count: (holdings?.total || holdings?.lines?.length || 0) + ((holdings?.accountData?.total > 0 || holdings?.xrp?.value > 0) ? 1 : 0) },
                { id: 'nfts', label: 'NFTS', icon: Image, count: nftStats?.holdingsCount || 0 },
                { id: 'activity', label: 'HISTORY', icon: Clock },
                { id: 'ancestry', label: 'ANCESTRY', icon: GitBranch, count: ancestry?.stats?.ancestorDepth || '' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium tracking-wider rounded-md border transition-all',
                    activeTab === tab.id
                      ? cn(isDark ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900')
                      : cn(
                          isDark
                            ? 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/15'
                            : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )
                  )}
                >
                  <tab.icon size={13} strokeWidth={1.5} />
                  {tab.label}
                  <span
                    className={cn(
                      'text-[10px]',
                      activeTab === tab.id
                        ? isDark
                          ? 'text-white/50'
                          : 'text-gray-500'
                        : isDark
                          ? 'text-white/20'
                          : 'text-gray-400'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tokens Tab */}
            {activeTab === 'tokens' && (
              <>
                {/* Holdings */}
                {holdings &&
                  holdings.accountActive !== false &&
                  (() => {
                    const filteredLines = hideZeroHoldings
                      ? holdings.lines?.filter((l) => parseFloat(l.balance) !== 0) || []
                      : holdings.lines || [];
                    const zeroCount = (holdings.lines?.length || 0) - filteredLines.length;
                    const totalValue = filteredLines.reduce((sum, l) => sum + (l.value || 0), 0);

                    return (
                      <div
                        className={cn(
                          'rounded-xl border-[1.5px] mb-4 overflow-hidden',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5',
                            isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[12px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              Holdings{' '}
                              <span
                                className={cn(
                                  'font-normal ml-1',
                                  isDark ? 'text-white/30' : 'text-gray-400'
                                )}
                              >
                                {(holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)}
                              </span>
                            </span>
                            {zeroCount > 0 && (
                              <button
                                onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                                className={cn(
                                  'text-[9px] px-2 py-0.5 rounded-full transition-all duration-200',
                                  hideZeroHoldings
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                    : isDark
                                      ? 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                )}
                              >
                                {hideZeroHoldings ? `+${zeroCount} hidden` : 'Hide empty'}
                              </button>
                            )}
                          </div>
                          {(filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) && (
                            <div className="flex items-baseline gap-1">
                              <span
                                className={cn(
                                  'text-[18px] font-semibold tabular-nums tracking-tight',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {fCurrency5(
                                  totalValue + (holdings.accountData?.total || holdings.xrp?.value || 0)
                                )}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-medium',
                                  isDark ? 'text-white/30' : 'text-gray-400'
                                )}
                              >
                                XRP
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-3">
                          {(filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? (
                            <div className="space-y-0">
                              {/* Table Header */}
                              <div
                                className="grid px-2 py-2 mb-0.5"
                                style={{ gridTemplateColumns: '2fr 1.1fr 1.1fr 1.1fr 0.7fr' }}
                              >
                                <span
                                  className={cn(
                                    'text-[9px] uppercase tracking-wider font-medium',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Token
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] uppercase tracking-wider font-medium text-right',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Balance
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] uppercase tracking-wider font-medium text-right',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Value
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] uppercase tracking-wider font-medium text-right',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Price
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] uppercase tracking-wider font-medium text-right',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  24h
                                </span>
                              </div>
                              {/* XRP Row */}
                              {(holdings.accountData?.total > 0 || holdings.xrp?.value > 0) && (
                                <Link
                                  href="/token/xrpl-xrp"
                                  className={cn(
                                    'grid px-2 py-2.5 items-center rounded-lg transition-all duration-200 group border-b',
                                    isDark
                                      ? 'hover:bg-white/[0.03] border-white/[0.08]'
                                      : 'hover:bg-gray-50 border-gray-100'
                                  )}
                                  style={{ gridTemplateColumns: '2fr 1.1fr 1.1fr 1.1fr 0.7fr' }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={cn(
                                        'w-7 h-7 rounded-full overflow-hidden ring-2 transition-all duration-200',
                                        isDark
                                          ? 'ring-white/[0.06] group-hover:ring-white/[0.12]'
                                          : 'ring-gray-100 group-hover:ring-gray-200'
                                      )}
                                    >
                                      <img
                                        src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                                        className="w-full h-full object-cover"
                                        alt=""
                                      />
                                    </div>
                                    <span
                                      className={cn(
                                        'text-[12px] font-medium group-hover:text-[#4285f4] transition-colors',
                                        isDark ? 'text-white' : 'text-gray-900'
                                      )}
                                    >
                                      XRP
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className={cn(
                                        'text-[12px] tabular-nums block',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fCurrency5(holdings.accountData?.total || holdings.xrp.value)}
                                    </span>
                                    {holdings.accountData?.reserve > 0 && (
                                      <span
                                        className={cn(
                                          'text-[9px] tabular-nums',
                                          isDark ? 'text-white/25' : 'text-gray-400'
                                        )}
                                      >
                                        {fCurrency5(holdings.xrp.value)} avail
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-[12px] text-right tabular-nums font-semibold',
                                      isDark ? 'text-white' : 'text-gray-900'
                                    )}
                                  >
                                    {xrpPrice
                                      ? `$${fCurrency5((holdings.accountData?.total || holdings.xrp.value) * xrpPrice)}`
                                      : `${fCurrency5(holdings.accountData?.total || holdings.xrp.value)} XRP`}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[12px] text-right tabular-nums',
                                      isDark ? 'text-white/50' : 'text-gray-500'
                                    )}
                                  >
                                    {xrpPrice ? `$${parseFloat(xrpPrice).toFixed(4)}` : '—'}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[11px] text-right tabular-nums font-medium',
                                      holdings?.xrp?.pro24h >= 0
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                    )}
                                  >
                                    {holdings?.xrp?.pro24h
                                      ? `${holdings.xrp.pro24h >= 0 ? '+' : ''}${holdings.xrp.pro24h.toFixed(1)}%`
                                      : '—'}
                                  </span>
                                </Link>
                              )}
                              {/* Table Rows */}
                              {filteredLines.map((line, idx) => {
                                const priceInXrp = line.token?.exch || 0;
                                const change24h = line.token?.pro24h || 0;
                                const pctOwned = line.percentOwned || 0;
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      'grid px-2 py-2.5 items-center rounded-lg transition-all duration-200 group',
                                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50',
                                      idx < filteredLines.length - 1 &&
                                        (isDark
                                          ? 'border-b border-white/[0.08]'
                                          : 'border-b border-gray-100')
                                    )}
                                    style={{ gridTemplateColumns: '2fr 1.1fr 1.1fr 1.1fr 0.7fr' }}
                                  >
                                    <Link
                                      href={`/token/${line.token?.md5}`}
                                      className="flex items-center gap-2.5"
                                    >
                                      <div
                                        className={cn(
                                          'w-7 h-7 rounded-full overflow-hidden ring-2 transition-all duration-200 flex-shrink-0',
                                          isDark
                                            ? 'ring-white/[0.06] group-hover:ring-white/[0.12]'
                                            : 'ring-gray-100 group-hover:ring-gray-200'
                                        )}
                                      >
                                        <img
                                          src={`https://s1.xrpl.to/token/${line.token?.md5}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.parentElement.style.display = 'none';
                                          }}
                                          alt=""
                                        />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={cn(
                                              'text-[12px] font-medium group-hover:text-[#4285f4] transition-colors truncate',
                                              isDark ? 'text-white' : 'text-gray-900'
                                            )}
                                          >
                                            {line.token?.name || line.currency}
                                          </span>
                                          {line.token?.verified >= 1 && (
                                            <span
                                              className={cn(
                                                'px-1 py-0.5 rounded text-[8px] font-medium flex-shrink-0',
                                                isDark
                                                  ? 'bg-emerald-500/10 text-emerald-400'
                                                  : 'bg-emerald-50 text-emerald-600'
                                              )}
                                            >
                                              Verified
                                            </span>
                                          )}
                                        </div>
                                        {pctOwned > 0.01 && (
                                          <span
                                            className={cn(
                                              'text-[9px]',
                                              isDark ? 'text-white/30' : 'text-gray-400'
                                            )}
                                          >
                                            {pctOwned.toFixed(2)}% supply
                                          </span>
                                        )}
                                      </div>
                                    </Link>
                                    <span
                                      className={cn(
                                        'text-[12px] text-right tabular-nums',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fCurrency5(Math.abs(parseFloat(line.balance)))}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[12px] text-right tabular-nums font-semibold',
                                        isDark ? 'text-white' : 'text-gray-900'
                                      )}
                                    >
                                      {fCurrency5(line.value)} XRP
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[12px] text-right tabular-nums',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {priceInXrp ? `${fCurrency5(priceInXrp)}` : '—'}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[11px] text-right tabular-nums font-medium',
                                        change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                      )}
                                    >
                                      {change24h
                                        ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%`
                                        : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                              {/* Pagination */}
                              <div
                                className={cn(
                                  'flex items-center justify-end gap-1 mt-3 pt-3 border-t',
                                  isDark ? 'border-white/[0.08]' : 'border-gray-100'
                                )}
                              >
                                <button
                                  onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                                  disabled={holdingsPage === 0}
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center text-[13px] transition-all duration-200',
                                    holdingsPage === 0
                                      ? isDark
                                        ? 'text-white/10'
                                        : 'text-gray-200'
                                      : isDark
                                        ? 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  )}
                                >
                                  ‹
                                </button>
                                <span
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] tabular-nums font-medium',
                                    isDark
                                      ? 'bg-white/[0.04] text-white/60'
                                      : 'bg-gray-100 text-gray-600'
                                  )}
                                >
                                  {holdingsPage + 1}
                                </span>
                                <button
                                  onClick={() => setHoldingsPage(holdingsPage + 1)}
                                  disabled={holdingsPage >= Math.ceil(((holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 20) - 1}
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center text-[13px] transition-all duration-200',
                                    holdingsPage >= Math.ceil(((holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 20) - 1
                                      ? isDark
                                        ? 'text-white/10'
                                        : 'text-gray-200'
                                      : isDark
                                        ? 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  )}
                                >
                                  ›
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6">
                              <div className="relative w-14 h-14 mb-3">
                                <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                                  <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                                </div>
                                <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                                  <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                                </div>
                                <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                                  <div className="absolute inset-0 rounded-full overflow-hidden">
                                    {[...Array(5)].map((_, i) => (
                                      <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-300/50')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
                                    ))}
                                  </div>
                                  <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
                                    <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                                    <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                                  </div>
                                  <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
                                    <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                                    <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                                  </div>
                                  <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                                    <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-300')} />
                                  </div>
                                </div>
                              </div>
                              <p className={cn('text-[10px] font-medium tracking-wider mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                                {hideZeroHoldings ? 'NO TOKENS WITH BALANCE' : 'NO TOKEN HOLDINGS'}
                              </p>
                              <a href="/" className="text-[9px] text-[#137DFE] hover:underline">Browse tokens</a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* Issued Tokens */}
                {holdings?.issued?.length > 0 && (
                  <div
                    className={cn(
                      'rounded-xl border-[1.5px] mb-4 overflow-hidden',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5',
                        isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                      )}
                    >
                      <span className={cn('text-[12px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                        Issued Tokens{' '}
                        <span className={cn('font-normal ml-1', isDark ? 'text-white/30' : 'text-gray-400')}>
                          {holdings.issued.length}
                        </span>
                      </span>
                    </div>
                    <div className="p-2">
                      {holdings.issued.map((token, idx) => (
                        <Link
                          key={idx}
                          href={`/token/${token.md5}`}
                          className={cn(
                            'grid px-2 py-2.5 items-center rounded-lg transition-all duration-200 group',
                            isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50',
                            idx < holdings.issued.length - 1 && (isDark ? 'border-b border-white/[0.08]' : 'border-b border-gray-100')
                          )}
                          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full overflow-hidden ring-2 flex-shrink-0',
                                isDark ? 'ring-white/[0.06]' : 'ring-gray-100'
                              )}
                            >
                              <img
                                src={`https://s1.xrpl.to/token/${token.md5}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                alt=""
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={cn('text-[12px] font-medium group-hover:text-[#4285f4] truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                {token.name || token.currency}
                              </span>
                              <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                                {token.user}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn('text-[12px] tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                              {fCurrency5(parseFloat(token.supply))}
                            </div>
                            <div className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>Supply</div>
                          </div>
                          <div className="text-right">
                            <div className={cn('text-[12px] tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                              {token.holders?.toLocaleString()}
                            </div>
                            <div className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>Holders</div>
                          </div>
                          <div className="text-right">
                            <div className={cn('text-[12px] tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                              ${fCurrency5(parseFloat(token.supply) * parseFloat(token.usd || 0))}
                            </div>
                            <div className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>Market Cap</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trading Performance */}
                {(data?.tokenPerformance?.length > 0 || tradingPerfLoading) &&
                  (() => {
                    const filteredTokens = (data?.tokenPerformance || []).filter(
                      (t) =>
                        !tokenSearch || t.name?.toLowerCase().includes(tokenSearch.toLowerCase())
                    );
                    const displayTokens = filteredTokens;
                    const totalCount = data?.pagination?.totalTokens || data?.totalTokensTraded || data?.tokenPerformance?.length || 0;
                    const currentPage = Math.floor(tradingPerfOffset / TRADING_PERF_LIMIT);
                    const totalPages = Math.ceil(totalCount / TRADING_PERF_LIMIT);
                    const hasMore = data?.pagination?.hasMore ?? (tradingPerfOffset + TRADING_PERF_LIMIT < totalCount);

                    return (
                      <div
                        className={cn(
                          'rounded-xl border-[1.5px] mb-4 overflow-hidden relative',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 gap-2 flex-wrap',
                            isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[12px] font-medium',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}
                          >
                            Trading Performance{' '}
                            <span
                              className={cn(
                                'font-normal ml-1',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              {totalCount}
                            </span>
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={tradingPerfSort}
                              onChange={(e) => {
                                setTradingPerfSort(e.target.value);
                                setTradingPerfOffset(0);
                              }}
                              className={cn(
                                'text-[11px] px-2 py-1.5 rounded-md border-none outline-none cursor-pointer',
                                isDark
                                  ? 'bg-white/[0.04] text-white/70'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              <option value="volume">Sort: Volume</option>
                              <option value="profit">Sort: PNL</option>
                              <option value="roi">Sort: ROI</option>
                              <option value="trades">Sort: Trades</option>
                              <option value="lastTradeDate">Sort: Recent</option>
                            </select>
                            <div
                              className={cn(
                                'flex items-center rounded-md overflow-hidden',
                                isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                              )}
                            >
                              <input
                                type="text"
                                placeholder="Search..."
                                value={tokenSearch}
                                onChange={(e) => setTokenSearch(e.target.value)}
                                className={cn(
                                  'text-[11px] px-2.5 py-1.5 bg-transparent border-none outline-none w-24',
                                  isDark
                                    ? 'text-white/70 placeholder:text-white/30'
                                    : 'text-gray-600 placeholder:text-gray-400'
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Table */}
                        <div className="px-3 py-3 overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th
                                  className={cn(
                                    'py-2 pr-2 text-left text-[9px] font-medium uppercase tracking-wider rounded-l-lg',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  Token
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  Volume
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  Trades
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-emerald-400/60 bg-white/[0.02]'
                                      : 'text-emerald-600/70 bg-gray-50'
                                  )}
                                >
                                  Bought
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-red-400/60 bg-white/[0.02]'
                                      : 'text-red-600/70 bg-gray-50'
                                  )}
                                >
                                  Sold
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-blue-400/60 bg-white/[0.02]'
                                      : 'text-blue-600/70 bg-gray-50'
                                  )}
                                >
                                  Holding
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  ROI
                                </th>
                                <th
                                  className={cn(
                                    'py-2 px-2 text-right text-[9px] font-medium uppercase tracking-wider',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  PNL
                                </th>
                                <th
                                  className={cn(
                                    'py-2 pl-2 text-right text-[9px] font-medium uppercase tracking-wider rounded-r-lg',
                                    isDark
                                      ? 'text-white/40 bg-white/[0.02]'
                                      : 'text-gray-500 bg-gray-50'
                                  )}
                                >
                                  Period
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayTokens.map((token, idx) => {
                                const roi = token.totalRoi ?? token.roi ?? 0;
                                const profit = token.totalPnl ?? token.profit ?? 0;
                                const bought = token.xrpBought || 0;
                                const sold = token.xrpSold || 0;
                                const holdingValue = token.holdingValue || 0;
                                const unrealizedPnl = token.unrealizedPnl || 0;
                                return (
                                  <tr
                                    key={idx}
                                    className={cn(
                                      'group transition-all duration-200 border-b',
                                      isDark
                                        ? 'hover:bg-white/[0.02] border-white/[0.08] last:border-transparent'
                                        : 'hover:bg-gray-50 border-gray-100 last:border-transparent'
                                    )}
                                  >
                                    <td className="py-2.5 pr-2">
                                      <Link
                                        href={`/token/${token.tokenId}`}
                                        className="flex items-center gap-2"
                                      >
                                        <div
                                          className={cn(
                                            'w-6 h-6 rounded-full overflow-hidden ring-2 transition-all duration-200 flex-shrink-0',
                                            isDark
                                              ? 'ring-white/[0.06] group-hover:ring-white/[0.12]'
                                              : 'ring-gray-100 group-hover:ring-gray-200'
                                          )}
                                        >
                                          <img
                                            src={`https://s1.xrpl.to/token/${token.tokenId}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.parentElement.style.display = 'none';
                                            }}
                                            alt=""
                                          />
                                        </div>
                                        <span
                                          className={cn(
                                            'text-[11px] font-medium group-hover:text-[#4285f4] transition-colors',
                                            isDark ? 'text-white/80' : 'text-gray-700'
                                          )}
                                        >
                                          {token.name}
                                        </span>
                                      </Link>
                                    </td>
                                    <td
                                      className={cn(
                                        'py-2.5 px-2 text-right text-[11px] tabular-nums',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fCurrency5(token.volume || 0)}
                                    </td>
                                    <td
                                      className={cn(
                                        'py-2.5 px-2 text-right text-[11px] tabular-nums',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fCurrency5(token.trades || 0)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      <span className="text-[11px] tabular-nums font-medium text-emerald-400">
                                        {fCurrency5(bought)}
                                      </span>
                                      {token.avgBuyPrice > 0 && (
                                        <span
                                          className={cn(
                                            'text-[8px] ml-0.5',
                                            isDark ? 'text-white/25' : 'text-gray-400'
                                          )}
                                        >
                                          @
                                          {token.avgBuyPrice < 0.001
                                            ? token.avgBuyPrice.toExponential(1)
                                            : fCurrency5(token.avgBuyPrice)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      <span className="text-[11px] tabular-nums font-medium text-red-400">
                                        {fCurrency5(sold)}
                                      </span>
                                      {token.avgSellPrice > 0 && (
                                        <span
                                          className={cn(
                                            'text-[8px] ml-0.5',
                                            isDark ? 'text-white/25' : 'text-gray-400'
                                          )}
                                        >
                                          @
                                          {token.avgSellPrice < 0.001
                                            ? token.avgSellPrice.toExponential(1)
                                            : fCurrency5(token.avgSellPrice)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      {holdingValue > 0 ? (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[11px] tabular-nums font-medium text-blue-400">
                                            {fCurrency5(holdingValue)}
                                          </span>
                                          {unrealizedPnl !== 0 && (
                                            <span
                                              className={cn(
                                                'text-[8px] tabular-nums',
                                                unrealizedPnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                                              )}
                                            >
                                              {unrealizedPnl >= 0 ? '+' : ''}{fCurrency5(unrealizedPnl)}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className={cn('text-[11px]', isDark ? 'text-white/20' : 'text-gray-300')}>—</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      <span
                                        className={cn(
                                          'text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded',
                                          roi >= 0
                                            ? isDark
                                              ? 'text-emerald-400 bg-emerald-500/10'
                                              : 'text-emerald-600 bg-emerald-50'
                                            : isDark
                                              ? 'text-red-400 bg-red-500/10'
                                              : 'text-red-600 bg-red-50'
                                        )}
                                      >
                                        {roi >= 0 ? '+' : ''}
                                        {roi.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      <span
                                        className={cn(
                                          'text-[11px] font-semibold tabular-nums',
                                          profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        )}
                                      >
                                        {profit >= 0 ? '+' : ''}
                                        {fCurrency5(profit)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pl-2 text-right">
                                      <span
                                        className={cn(
                                          'text-[9px] tabular-nums whitespace-nowrap',
                                          isDark ? 'text-white/30' : 'text-gray-400'
                                        )}
                                      >
                                        {token.firstTradeDate
                                          ? new Date(token.firstTradeDate).toLocaleDateString(
                                              'en-GB',
                                              { day: '2-digit', month: 'short', year: '2-digit' }
                                            )
                                          : '—'}
                                        {token.lastTradeDate &&
                                          token.firstTradeDate !== token.lastTradeDate && (
                                            <>
                                              {' '}
                                              →{' '}
                                              {new Date(token.lastTradeDate).toLocaleDateString(
                                                'en-GB',
                                                { day: '2-digit', month: 'short', year: '2-digit' }
                                              )}
                                            </>
                                          )}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        {totalCount > TRADING_PERF_LIMIT && (
                          <div
                            className={cn(
                              'flex items-center justify-between px-3 py-2 border-t',
                              isDark ? 'border-white/[0.08]' : 'border-gray-100'
                            )}
                          >
                            <span className={cn('text-[10px] tabular-nums', isDark ? 'text-white/30' : 'text-gray-400')}>
                              {tradingPerfOffset + 1}-{Math.min(tradingPerfOffset + TRADING_PERF_LIMIT, totalCount)} of {totalCount}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setTradingPerfOffset(Math.max(0, tradingPerfOffset - TRADING_PERF_LIMIT))}
                                disabled={tradingPerfOffset === 0 || tradingPerfLoading}
                                className={cn(
                                  'p-1 rounded transition-colors',
                                  tradingPerfOffset === 0 || tradingPerfLoading
                                    ? isDark ? 'text-white/10 cursor-not-allowed' : 'text-gray-200 cursor-not-allowed'
                                    : isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                )}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className={cn('text-[10px] tabular-nums min-w-[60px] text-center', isDark ? 'text-white/40' : 'text-gray-500')}>
                                {currentPage + 1} / {totalPages}
                              </span>
                              <button
                                onClick={() => setTradingPerfOffset(tradingPerfOffset + TRADING_PERF_LIMIT)}
                                disabled={!hasMore || tradingPerfLoading}
                                className={cn(
                                  'p-1 rounded transition-colors',
                                  !hasMore || tradingPerfLoading
                                    ? isDark ? 'text-white/10 cursor-not-allowed' : 'text-gray-200 cursor-not-allowed'
                                    : isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                )}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Loading overlay */}
                        {tradingPerfLoading && (
                          <div className={cn(
                            'absolute inset-0 flex items-center justify-center',
                            isDark ? 'bg-black/40' : 'bg-white/60'
                          )}>
                            <div className="w-5 h-5 border-2 border-[#137DFE] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark
                    ? 'border-white/10 bg-white/[0.02] backdrop-blur-xl'
                    : 'border-gray-200 bg-white/80 backdrop-blur-xl'
                )}
              >
                {selectedNftCollection ? (
                  <div className="p-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => {
                          setSelectedNftCollection(null);
                          setCollectionNfts([]);
                        }}
                        className={cn(
                          'text-[11px] transition-colors',
                          isDark
                            ? 'text-white/35 hover:text-white/70'
                            : 'text-gray-400 hover:text-gray-600'
                        )}
                      >
                        All Collections
                      </button>
                      <span className={isDark ? 'text-white/20' : 'text-gray-300'}>/</span>
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          isDark ? 'text-white/90' : 'text-gray-900'
                        )}
                      >
                        {selectedNftCollection.name}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedNftCollection(null);
                          setCollectionNfts([]);
                        }}
                        className={cn(
                          'ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors',
                          isDark
                            ? 'bg-white/[0.04] text-white/50 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                      >
                        Clear
                      </button>
                    </div>
                    {/* NFTs Grid */}
                    {collectionNftsLoading ? (
                      <div
                        className={cn(
                          'p-12 text-center text-[13px]',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Loading NFTs...
                      </div>
                    ) : collectionNfts.length === 0 ? (
                      <div
                        className={cn(
                          'rounded-xl p-12 text-center border',
                          isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
                        )}
                      >
                        <Image
                          size={32}
                          className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-gray-300')}
                        />
                        <p
                          className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}
                        >
                          No NFTs found in this collection
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {collectionNfts.map((nft) => (
                          <Link
                            key={nft.id}
                            href={`/nft/${nft.nftId}`}
                            className={cn(
                              'rounded-xl border overflow-hidden group transition-colors',
                              isDark
                                ? 'border-white/[0.06] bg-white/[0.015] hover:border-white/15'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            )}
                          >
                            <div className="relative">
                              {nft.image ? (
                                <img
                                  src={nft.image}
                                  alt={nft.name}
                                  className="w-full aspect-square object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-full aspect-square flex items-center justify-center text-[10px]',
                                    isDark
                                      ? 'bg-white/5 text-white/30'
                                      : 'bg-gray-100 text-gray-400'
                                  )}
                                >
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p
                                className={cn(
                                  'text-[12px] font-medium truncate',
                                  isDark ? 'text-white/90' : 'text-gray-900'
                                )}
                              >
                                {nft.name}
                              </p>
                              {nft.rarity > 0 && (
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  Rank #{nft.rarity}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : nftCollectionsLoading ? (
                  <div
                    className={cn(
                      'p-12 text-center text-[13px]',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  >
                    Loading collections...
                  </div>
                ) : nftCollections.length === 0 ? (
                  <div className="py-12 px-8 text-center">
                    <div className="relative w-14 h-14 mx-auto mb-4">
                      <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                        <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                      </div>
                      <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                        <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                      </div>
                      <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-300/50')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
                          ))}
                        </div>
                        <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
                          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                        </div>
                        <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
                          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                        </div>
                        <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                          <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-300')} />
                        </div>
                      </div>
                    </div>
                    <p className={cn('text-[10px] font-medium tracking-wider mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                      NO NFTS FOUND
                    </p>
                    <p className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                      NFTs will appear here once acquired
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div
                      className={cn(
                        'flex items-center justify-between px-4 py-3',
                        isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[12px] font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        Collections{' '}
                        <span
                          className={cn(
                            'font-normal ml-1',
                            isDark ? 'text-white/30' : 'text-gray-400'
                          )}
                        >
                          {nftCollections.length}
                        </span>
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {nftCollections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => setSelectedNftCollection(col)}
                          className={cn(
                            'rounded-xl border overflow-hidden text-left group transition-colors',
                            isDark
                              ? 'border-white/[0.06] bg-white/[0.015] hover:border-white/15'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          )}
                        >
                          <div className="relative">
                            {col.logo ? (
                              <img
                                src={col.logo}
                                alt={col.name}
                                className="w-full aspect-square object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className={cn(
                                  'w-full aspect-square flex items-center justify-center text-[10px]',
                                  isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                                )}
                              >
                                No image
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p
                              className={cn(
                                'text-[12px] font-medium truncate',
                                isDark ? 'text-white/90' : 'text-gray-900'
                              )}
                            >
                              {col.name}
                            </p>
                            <p
                              className={cn(
                                'text-[10px]',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              {col.count} item{col.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* NFT Trading History Chart */}
                {nftHistory.length > 0 && !selectedNftCollection && (
                  <div
                    className={cn(
                      'rounded-xl border mt-4 overflow-hidden',
                      isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'p-4 border-b flex items-center justify-between',
                        isDark ? 'border-white/10' : 'border-gray-100'
                      )}
                    >
                      <p
                        className={cn(
                          'text-[11px] font-medium uppercase tracking-wider',
                          isDark ? 'text-white/50' : 'text-gray-500'
                        )}
                      >
                        Trading Activity (90d)
                      </p>
                      <span
                        className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}
                      >
                        {nftHistory.length} days
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-end gap-[2px] h-[80px]">
                        {(() => {
                          const maxVol = Math.max(...nftHistory.map((d) => d.volume || 0), 1);
                          return nftHistory.map((d, i) => (
                            <div
                              key={d.date}
                              className="flex-1 flex flex-col justify-end gap-[1px] group relative"
                              title={`${d.date}\nVol: ${(d.volume || 0).toFixed(1)} XRP\nTrades: ${d.trades || 0}`}
                            >
                              {d.sellVolume > 0 && (
                                <div
                                  className="w-full bg-red-400/60 rounded-t-sm"
                                  style={{
                                    height: `${(d.sellVolume / maxVol) * 100}%`,
                                    minHeight: d.sellVolume > 0 ? 2 : 0
                                  }}
                                />
                              )}
                              {d.buyVolume > 0 && (
                                <div
                                  className="w-full bg-emerald-400/60 rounded-t-sm"
                                  style={{
                                    height: `${(d.buyVolume / maxVol) * 100}%`,
                                    minHeight: d.buyVolume > 0 ? 2 : 0
                                  }}
                                />
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                      <div
                        className={cn(
                          'flex justify-between mt-2 text-[9px]',
                          isDark ? 'text-white/25' : 'text-gray-300'
                        )}
                      >
                        <span>{nftHistory[0]?.date}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-emerald-400/60" /> Buy
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-red-400/60" /> Sell
                          </span>
                        </div>
                        <span>{nftHistory[nftHistory.length - 1]?.date}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collection Trading Stats */}
                {nftCollectionStats.length > 0 && !selectedNftCollection && (
                  <div
                    className={cn(
                      'rounded-xl border-[1.5px] mt-4 overflow-hidden',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'px-4 py-3 flex items-center justify-between',
                        isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        Trading Stats by Collection
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr
                            className={cn(
                              isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                            )}
                          >
                            <th
                              className={cn(
                                'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              Collection
                            </th>
                            <th
                              className={cn(
                                'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              Volume
                            </th>
                            <th
                              className={cn(
                                'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              P/L
                            </th>
                            <th
                              className={cn(
                                'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              ROI
                            </th>
                            <th
                              className={cn(
                                'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                isDark ? 'text-white/40' : 'text-gray-500'
                              )}
                            >
                              Trades
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={cn(
                            'divide-y',
                            isDark ? 'divide-white/[0.06]' : 'divide-gray-100'
                          )}
                        >
                          {nftCollectionStats.slice(0, 15).map((c) => (
                            <tr
                              key={c.cid}
                              className={cn(
                                'transition-colors',
                                isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                              )}
                            >
                              <td className="px-4 py-3">
                                <Link
                                  href={`/collection/${c.slug}`}
                                  className="flex items-center gap-2 group"
                                >
                                  {c.logo && (
                                    <img
                                      src={`https://s1.xrpl.to/nft-collection/${c.logo}`}
                                      alt=""
                                      className="w-6 h-6 rounded object-cover"
                                    />
                                  )}
                                  <span
                                    className={cn(
                                      'text-[13px] group-hover:text-[#4285f4] truncate max-w-[120px]',
                                      isDark ? 'text-white' : 'text-gray-900'
                                    )}
                                  >
                                    {c.name}
                                  </span>
                                </Link>
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right text-[12px] tabular-nums',
                                  isDark ? 'text-white/70' : 'text-gray-700'
                                )}
                              >
                                {c.volume?.toFixed(1) || 0} XRP
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right text-[12px] tabular-nums font-medium',
                                  c.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                                )}
                              >
                                {c.profit >= 0 ? '+' : ''}
                                {c.profit?.toFixed(1) || 0}
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right text-[12px] tabular-nums',
                                  c.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                                )}
                              >
                                {c.roi?.toFixed(1) || 0}%
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right text-[12px] tabular-nums',
                                  isDark ? 'text-white/50' : 'text-gray-500'
                                )}
                              >
                                {c.trades || 0}
                              </td>
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
                <div
                  className={cn(
                    'flex items-center border-b mb-4',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                >
                  {[
                    { id: 'onchain', label: 'ONCHAIN', icon: Code2 },
                    { id: 'tokens', label: 'TOKENS', icon: Coins }
                  ].map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setHistoryView(view.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-[12px] font-medium tracking-wide transition-colors border-b-2 -mb-px',
                        historyView === view.id
                          ? cn(
                              'border-white',
                              isDark ? 'text-white' : 'text-gray-900 border-gray-900'
                            )
                          : cn(
                              'border-transparent',
                              isDark
                                ? 'text-white/40 hover:text-white/60'
                                : 'text-gray-500 hover:text-gray-700'
                            )
                      )}
                    >
                      <view.icon size={14} />
                      {view.label}
                    </button>
                  ))}
                </div>

                {/* Onchain History - Styled like screenshot */}
                {historyView === 'onchain' && (
                  <div
                    className={cn(
                      'rounded-xl border-[1.5px] overflow-hidden',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}
                  >
                    {/* Header */}
                    <div
                      className={cn(
                        'px-4 py-3 flex items-center justify-between',
                        isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        Transactions
                      </span>
                      <div className="flex items-center gap-1">
                        {['all', 'Payment', 'OfferCreate', 'TrustSet'].map(t => (
                          <button
                            key={t}
                            onClick={() => setTxTypeFilter(t)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
                              txTypeFilter === t
                                ? (isDark ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900')
                                : (isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')
                            )}
                          >
                            {t === 'all' ? 'All' : t === 'OfferCreate' ? 'Trade' : t}
                          </button>
                        ))}
                        <select
                          value={['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter) ? '' : txTypeFilter}
                          onChange={(e) => e.target.value && setTxTypeFilter(e.target.value)}
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-medium outline-none cursor-pointer transition-colors',
                            !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter)
                              ? (isDark ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900')
                              : (isDark ? 'bg-transparent text-white/40 hover:text-white/70' : 'bg-transparent text-gray-400 hover:text-gray-600'),
                            isDark ? '[&>option]:bg-[#1a1a1a] [&>option]:text-white' : ''
                          )}
                        >
                          <option value="" disabled>More ▾</option>
                          {txTypes.filter(t => !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(t)).map(t => (
                            <option key={t} value={t}>{t.replace('NFToken', 'NFT ').replace('AMM', 'AMM ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {txHistory.length === 0 ? (
                      <div className={cn('p-8 text-center text-[13px]', isDark ? 'text-white/35' : 'text-gray-400')}>
                        {txLoading ? 'Loading...' : 'No transactions found'}
                      </div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[24px_40px_minmax(120px,1fr)_70px_minmax(140px,1fr)_minmax(160px,1.2fr)_90px_32px] gap-3 px-4 py-2.5 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/30 border-white/[0.06]' : 'text-gray-400 border-gray-100')}>
                          <span></span>
                          <span>Asset</span>
                          <span>Type</span>
                          <span>Tag</span>
                          <span>Details</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Date</span>
                          <span></span>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/[0.08]' : 'divide-gray-50')}>
                          {txHistory.filter(tx => txTypeFilter === 'all' || (tx.tx_json || tx.tx || tx).TransactionType === txTypeFilter).map((tx) => {
                            const parsed = parseTx(tx);
                            return (
                              <div
                                key={parsed.id}
                                className={cn('grid grid-cols-[24px_40px_minmax(120px,1fr)_70px_minmax(140px,1fr)_minmax(160px,1.2fr)_90px_32px] gap-3 px-4 py-3 items-center cursor-pointer group', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                                onClick={() => window.open(`/tx/${parsed.hash}`, '_blank')}
                              >
                                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center', parsed.type === 'failed' ? 'bg-amber-500' : parsed.type === 'in' ? 'bg-emerald-500' : 'bg-red-500')}>
                                  {parsed.type === 'failed' ? <AlertTriangle size={10} className="text-white" /> : parsed.type === 'in' ? <ArrowDownLeft size={10} className="text-white" /> : <ArrowUpRight size={10} className="text-white" />}
                                </div>
                                <div>
                                  {parsed.nftTokenId ? (
                                    <NftImage
                                      nftTokenId={parsed.nftTokenId}
                                      className="w-7 h-7 rounded-lg object-cover bg-white/10"
                                      fallback={
                                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-100')}>
                                          <Image size={14} className="text-purple-400" />
                                        </div>
                                      }
                                    />
                                  ) : parsed.tokenCurrency ? (
                                    <img
                                      src={`https://s1.xrpl.to/token/${parsed.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : CryptoJS.MD5(`${parsed.tokenIssuer}_${parsed.tokenCurrency}`).toString()}`}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover bg-white/10"
                                      onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                    />
                                  ) : (
                                    <div className={cn('w-7 h-7 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{parsed.label}</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {parsed.type === 'failed' && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium', isDark ? 'bg-amber-500/15 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Failed</span>}
                                  {parsed.isDust && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium', isDark ? 'bg-amber-500/10 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Dust</span>}
                                  {parsed.sourceTag && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium', isDark ? 'bg-[#137DFE]/15 text-[#137DFE]' : 'bg-blue-100 text-blue-600')}>{parsed.sourceTagName || `${parsed.sourceTag}`}</span>}
                                </div>
                                <p className={cn('text-[11px] font-mono truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
                                  {parsed.counterparty ? (parsed.counterparty.startsWith('r') ? <Link href={`/address/${parsed.counterparty}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#137DFE] hover:underline">{parsed.counterparty.slice(0, 10)}...{parsed.counterparty.slice(-6)}</Link> : parsed.counterparty) : parsed.fromAmount ? 'DEX Swap' : '—'}
                                </p>
                                <div className="flex items-center justify-end gap-2">
                                  {parsed.fromAmount && parsed.toAmount ? (
                                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', isDark ? 'bg-white/[0.06]' : 'bg-gray-100')}>
                                      <span className="text-[11px] font-semibold tabular-nums text-red-400">{parsed.fromAmount}</span>
                                      <span className={cn('text-[9px]', isDark ? 'text-white/25' : 'text-gray-400')}>→</span>
                                      <span className="text-[11px] font-semibold tabular-nums text-[#08AA09]">{parsed.toAmount}</span>
                                    </div>
                                  ) : parsed.amount ? (
                                    parsed.amount.includes('→') ? (
                                      <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', parsed.type === 'failed' ? 'bg-amber-500/10' : isDark ? 'bg-white/[0.06]' : 'bg-gray-100')}>
                                        {parsed.amount.split('→').map((part, i) => (
                                          <span key={i} className={cn('text-[11px] font-semibold tabular-nums', i === 0 ? 'text-red-400' : 'text-[#08AA09]')}>
                                            {i > 0 && <span className={cn('text-[9px] mr-1.5', isDark ? 'text-white/25' : 'text-gray-400')}>→</span>}
                                            {part.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className={cn(
                                        'text-[11px] font-semibold tabular-nums px-2.5 py-1.5 rounded-lg',
                                        parsed.type === 'failed' ? 'text-[#F6AF01] bg-amber-500/10' :
                                        parsed.type === 'in' ? 'text-[#08AA09] bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                                      )}>
                                        {parsed.type !== 'failed' && (parsed.type === 'in' ? '+' : '-')}{parsed.amount}
                                      </span>
                                    )
                                  ) : (
                                    <span className={cn('text-[10px] px-2 py-1 rounded-lg', isDark ? 'text-white/20 bg-white/[0.04]' : 'text-gray-400 bg-gray-100')}>—</span>
                                  )}
                                </div>
                                <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {parsed.time ? new Date(parsed.time).toLocaleDateString() : '—'}
                                </p>
                                <ExternalLink size={12} className={cn('justify-self-end opacity-0 group-hover:opacity-100 transition-opacity', isDark ? 'text-white/40' : 'text-gray-400')} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {txHasMore && (
                      <button
                        onClick={() => fetchTxHistory(txMarker)}
                        disabled={txLoading}
                        className={cn(
                          'w-full text-center py-3.5 text-[12px] font-medium border-t transition-all duration-200',
                          isDark
                            ? 'border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                            : 'border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {txLoading ? 'Loading...' : `Load more transactions`}
                      </button>
                    )}
                  </div>
                )}

                {/* Token History - Styled like screenshot */}
                {historyView === 'tokens' &&
                  (() => {
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
                        } catch {
                          return c.slice(0, 6);
                        }
                      }
                      return c;
                    };
                    const getTokenMd5 = (t) =>
                      t?.currency === 'XRP'
                        ? '84e5efeb89c4eae8f68188982dc290d8'
                        : t?.issuer
                          ? CryptoJS.MD5(`${t.issuer}_${t.currency}`).toString()
                          : null;

                    const totalPages = Math.ceil(tokenHistory.length / ITEMS_PER_PAGE);
                    const paginatedHistory = tokenHistory.slice(
                      tokenHistoryPage * ITEMS_PER_PAGE,
                      (tokenHistoryPage + 1) * ITEMS_PER_PAGE
                    );

                    return (
                      <div
                        className={cn(
                          'rounded-xl border-[1.5px] overflow-hidden',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      >
                        {/* Header with filters */}
                        <div
                          className={cn(
                            'px-4 py-3 flex items-center justify-between',
                            isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={cn(
                                'text-[13px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              Token Trades
                            </span>
                            <div className="flex gap-1">
                              {['all', 'trades', 'liquidity'].map((t) => (
                                <button
                                  key={t}
                                  onClick={() => {
                                    setTokenHistoryType(t);
                                    setTokenHistoryPage(0);
                                  }}
                                  className={cn(
                                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors capitalize',
                                    tokenHistoryType === t
                                      ? isDark
                                        ? 'bg-white/10 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                      : isDark
                                        ? 'text-white/40 hover:text-white/60'
                                        : 'text-gray-500 hover:text-gray-700'
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors',
                              isDark
                                ? 'text-white/60 hover:bg-white/5'
                                : 'text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            <span>Filters</span>
                            <Filter size={14} />
                          </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr
                                className={cn(
                                  isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                                )}
                              >
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '15%' }}
                                >
                                  Type
                                </th>
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '40%' }}
                                >
                                  Info
                                </th>
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '20%' }}
                                >
                                  Time
                                </th>
                                <th
                                  className={cn(
                                    'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '25%' }}
                                >
                                  Signature
                                </th>
                              </tr>
                            </thead>
                            <tbody
                              className={cn(
                                'divide-y',
                                isDark ? 'divide-white/[0.06]' : 'divide-gray-100'
                              )}
                            >
                              {tokenHistoryLoading && tokenHistory.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className={cn(
                                      'px-4 py-8 text-center text-[13px]',
                                      isDark ? 'text-white/35' : 'text-gray-400'
                                    )}
                                  >
                                    Loading...
                                  </td>
                                </tr>
                              ) : paginatedHistory.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className={cn(
                                      'px-4 py-8 text-center text-[13px]',
                                      isDark ? 'text-white/35' : 'text-gray-400'
                                    )}
                                  >
                                    No transactions found
                                  </td>
                                </tr>
                              ) : (
                                paginatedHistory.map((trade) => {
                                  const paidIsXRP = trade.paid?.currency === 'XRP';
                                  const gotIsXRP = trade.got?.currency === 'XRP';
                                  const isTokenToToken = !paidIsXRP && !gotIsXRP;
                                  const isBuy = paidIsXRP;
                                  const tradeType = trade.isLiquidity
                                    ? 'Transaction'
                                    : isTokenToToken
                                      ? 'Swap'
                                      : isBuy
                                        ? 'Transaction'
                                        : 'Transaction';
                                  const paidMd5 = getTokenMd5(trade.paid);
                                  const gotMd5 = getTokenMd5(trade.got);

                                  return (
                                    <tr
                                      key={trade._id}
                                      className={cn(
                                        'transition-colors',
                                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                                      )}
                                    >
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          {isTokenToToken ? (
                                            <ArrowLeftRight
                                              size={14}
                                              className={isDark ? 'text-white/40' : 'text-gray-400'}
                                            />
                                          ) : (
                                            <div
                                              className={cn(
                                                'w-5 h-5 rounded-full flex items-center justify-center',
                                                isDark ? 'bg-white/5' : 'bg-gray-100'
                                              )}
                                            >
                                              <Clock
                                                size={12}
                                                className={
                                                  isDark ? 'text-white/40' : 'text-gray-400'
                                                }
                                              />
                                            </div>
                                          )}
                                          <span
                                            className={cn(
                                              'text-[13px] font-medium',
                                              isDark ? 'text-white' : 'text-gray-900'
                                            )}
                                          >
                                            {isTokenToToken ? 'Swap' : 'Transaction'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        {isTokenToToken || trade.paid || trade.got ? (
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {/* Paid amount */}
                                            <div className="flex items-center gap-1">
                                              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                                -
                                              </span>
                                              {paidMd5 && (
                                                <img
                                                  src={`https://s1.xrpl.to/token/${paidMd5}`}
                                                  className="w-4 h-4 rounded-full"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                  }}
                                                  alt=""
                                                />
                                              )}
                                              <span
                                                className={cn(
                                                  'text-[12px] tabular-nums',
                                                  isDark ? 'text-white' : 'text-gray-900'
                                                )}
                                              >
                                                {fmtVal(trade.paid?.value)}
                                              </span>
                                              <span
                                                className={cn(
                                                  'text-[11px]',
                                                  isDark ? 'text-white/50' : 'text-gray-500'
                                                )}
                                              >
                                                {fmtCurrency(trade.paid?.currency)}
                                              </span>
                                            </div>
                                            {/* Plus sign */}
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                              +
                                            </span>
                                            {/* Got amount */}
                                            <div className="flex items-center gap-1">
                                              {gotMd5 && (
                                                <img
                                                  src={`https://s1.xrpl.to/token/${gotMd5}`}
                                                  className="w-4 h-4 rounded-full"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                  }}
                                                  alt=""
                                                />
                                              )}
                                              <span
                                                className={cn(
                                                  'text-[12px] tabular-nums',
                                                  isDark ? 'text-white' : 'text-gray-900'
                                                )}
                                              >
                                                {fmtVal(trade.got?.value)}
                                              </span>
                                              <span
                                                className={cn(
                                                  'text-[11px]',
                                                  isDark ? 'text-white/50' : 'text-gray-500'
                                                )}
                                              >
                                                {fmtCurrency(trade.got?.currency)}
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <span
                                            className={cn(
                                              'text-[12px]',
                                              isDark ? 'text-white/40' : 'text-gray-400'
                                            )}
                                          >
                                            See more details
                                          </span>
                                        )}
                                      </td>
                                      <td
                                        className={cn(
                                          'px-4 py-3 text-[12px]',
                                          isDark ? 'text-white/50' : 'text-gray-500'
                                        )}
                                      >
                                        {trade.time
                                          ? (() => {
                                              const diff = Date.now() - trade.time;
                                              const mins = Math.floor(diff / 60000);
                                              const hrs = Math.floor(diff / 3600000);
                                              const days = Math.floor(diff / 86400000);
                                              if (mins < 1) return 'Just now';
                                              if (mins < 60) return `${mins} min ago`;
                                              if (hrs < 24) return `${hrs} hr ago`;
                                              if (days < 7) return `${days} day ago`;
                                              return new Date(trade.time).toLocaleDateString(
                                                'en-GB',
                                                { day: '2-digit', month: 'short', year: 'numeric' }
                                              );
                                            })()
                                          : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Link
                                            href={`/tx/${trade.hash}`}
                                            target="_blank"
                                            className={cn(
                                              'text-[12px] font-mono hover:underline',
                                              isDark
                                                ? 'text-white/50 hover:text-white/70'
                                                : 'text-gray-500 hover:text-gray-700'
                                            )}
                                          >
                                            {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                          </Link>
                                          <button
                                            onClick={() =>
                                              navigator.clipboard.writeText(trade.hash)
                                            }
                                            className={cn(
                                              'p-1 rounded transition-colors',
                                              isDark
                                                ? 'text-white/30 hover:text-white/50'
                                                : 'text-gray-400 hover:text-gray-600'
                                            )}
                                          >
                                            <Copy size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div
                          className={cn(
                            'px-4 py-3 flex items-center justify-between border-t',
                            isDark ? 'border-white/10' : 'border-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'text-[13px]',
                                isDark ? 'text-white/50' : 'text-gray-500'
                              )}
                            >
                              Transactions per page
                            </span>
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded border',
                                isDark ? 'border-white/10' : 'border-gray-200'
                              )}
                            >
                              <span
                                className={cn(
                                  'text-[13px] tabular-nums min-w-[20px] text-center',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {ITEMS_PER_PAGE}
                              </span>
                              <div className="flex flex-col">
                                <ChevronUp
                                  size={10}
                                  className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                                />
                                <ChevronDown
                                  size={10}
                                  className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTokenHistoryPage(0)}
                              disabled={tokenHistoryPage === 0}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &laquo;
                            </button>
                            <button
                              onClick={() => setTokenHistoryPage((p) => Math.max(0, p - 1))}
                              disabled={tokenHistoryPage === 0}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &lsaquo;
                            </button>
                            <span
                              className={cn(
                                'text-[13px] px-2',
                                isDark ? 'text-white/70' : 'text-gray-600'
                              )}
                            >
                              Page {tokenHistoryPage + 1}
                            </span>
                            <button
                              onClick={() => {
                                setTokenHistoryPage((p) => p + 1);
                                if (
                                  (tokenHistoryPage + 2) * ITEMS_PER_PAGE >=
                                    filteredHistory.length &&
                                  tokenHistoryHasMore
                                )
                                  loadMoreTokenHistory();
                              }}
                              disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &rsaquo;
                            </button>
                            <button
                              onClick={() => {
                                if (tokenHistoryHasMore) loadMoreTokenHistory();
                                setTokenHistoryPage(totalPages - 1);
                              }}
                              disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &raquo;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* NFT Trades Section - Styled like screenshot */}
                {nftTrades.length > 0 &&
                  (() => {
                    const nftTotalPages = Math.ceil(nftTrades.length / ITEMS_PER_PAGE);
                    const paginatedNftTrades = nftTrades.slice(
                      nftTradesPage * ITEMS_PER_PAGE,
                      (nftTradesPage + 1) * ITEMS_PER_PAGE
                    );
                    return (
                      <div
                        className={cn(
                          'rounded-xl border-[1.5px] mt-4 overflow-hidden',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      >
                        <div
                          className={cn(
                            'px-4 py-3 flex items-center justify-between',
                            isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Image
                              size={14}
                              className={isDark ? 'text-white/50' : 'text-gray-500'}
                            />
                            <span
                              className={cn(
                                'text-[13px] font-medium',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              NFT Trades
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr
                                className={cn(
                                  isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
                                )}
                              >
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '15%' }}
                                >
                                  Type
                                </th>
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '40%' }}
                                >
                                  Info
                                </th>
                                <th
                                  className={cn(
                                    'text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '20%' }}
                                >
                                  Time
                                </th>
                                <th
                                  className={cn(
                                    'text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                  style={{ width: '25%' }}
                                >
                                  Signature
                                </th>
                              </tr>
                            </thead>
                            <tbody
                              className={cn(
                                'divide-y',
                                isDark ? 'divide-white/[0.06]' : 'divide-gray-100'
                              )}
                            >
                              {paginatedNftTrades.map((trade) => {
                                const isSeller = trade.seller === account;
                                const label = isSeller ? 'Sold NFT' : 'Bought NFT';
                                const amt = trade.costXRP ?? trade.cost ?? 0;
                                const currency = trade.currency || 'XRP';
                                const amtStr =
                                  amt >= 1
                                    ? amt.toFixed(2)
                                    : amt >= 0.01
                                      ? amt.toFixed(4)
                                      : String(amt);
                                return (
                                  <tr
                                    key={trade._id}
                                    className={cn(
                                      'transition-colors',
                                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                                    )}
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {isSeller ? (
                                          <ArrowUpRight size={14} className="text-emerald-400" />
                                        ) : (
                                          <ArrowDownLeft
                                            size={14}
                                            className={isDark ? 'text-white/40' : 'text-gray-400'}
                                          />
                                        )}
                                        <span
                                          className={cn(
                                            'text-[13px] font-medium',
                                            isDark ? 'text-white' : 'text-gray-900'
                                          )}
                                        >
                                          {label}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {isSeller ? (
                                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                            +
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                            -
                                          </span>
                                        )}
                                        <span
                                          className={cn(
                                            'text-[12px] tabular-nums',
                                            isDark ? 'text-white' : 'text-gray-900'
                                          )}
                                        >
                                          {amtStr} {currency}
                                        </span>
                                      </div>
                                    </td>
                                    <td
                                      className={cn(
                                        'px-4 py-3 text-[12px]',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {trade.time
                                        ? (() => {
                                            const diff = Date.now() - trade.time;
                                            const mins = Math.floor(diff / 60000);
                                            const hrs = Math.floor(diff / 3600000);
                                            const days = Math.floor(diff / 86400000);
                                            if (mins < 1) return 'Just now';
                                            if (mins < 60) return `${mins} min ago`;
                                            if (hrs < 24) return `${hrs} hr ago`;
                                            if (days < 7) return `${days} day ago`;
                                            return new Date(trade.time).toLocaleDateString(
                                              'en-GB',
                                              { day: '2-digit', month: 'short', year: 'numeric' }
                                            );
                                          })()
                                        : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Link
                                          href={`/tx/${trade.hash}`}
                                          target="_blank"
                                          className={cn(
                                            'text-[12px] font-mono hover:underline',
                                            isDark
                                              ? 'text-white/50 hover:text-white/70'
                                              : 'text-gray-500 hover:text-gray-700'
                                          )}
                                        >
                                          {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                        </Link>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(trade.hash)}
                                          className={cn(
                                            'p-1 rounded transition-colors',
                                            isDark
                                              ? 'text-white/30 hover:text-white/50'
                                              : 'text-gray-400 hover:text-gray-600'
                                          )}
                                        >
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
                        <div
                          className={cn(
                            'px-4 py-3 flex items-center justify-between border-t',
                            isDark ? 'border-white/10' : 'border-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'text-[13px]',
                                isDark ? 'text-white/50' : 'text-gray-500'
                              )}
                            >
                              Transactions per page
                            </span>
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded border',
                                isDark ? 'border-white/10' : 'border-gray-200'
                              )}
                            >
                              <span
                                className={cn(
                                  'text-[13px] tabular-nums min-w-[20px] text-center',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {ITEMS_PER_PAGE}
                              </span>
                              <div className="flex flex-col">
                                <ChevronUp
                                  size={10}
                                  className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                                />
                                <ChevronDown
                                  size={10}
                                  className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setNftTradesPage(0)}
                              disabled={nftTradesPage === 0}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &laquo;
                            </button>
                            <button
                              onClick={() => setNftTradesPage((p) => Math.max(0, p - 1))}
                              disabled={nftTradesPage === 0}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &lsaquo;
                            </button>
                            <span
                              className={cn(
                                'text-[13px] px-2',
                                isDark ? 'text-white/70' : 'text-gray-600'
                              )}
                            >
                              Page {nftTradesPage + 1}
                            </span>
                            <button
                              onClick={() =>
                                setNftTradesPage((p) => Math.min(nftTotalPages - 1, p + 1))
                              }
                              disabled={nftTradesPage >= nftTotalPages - 1}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &rsaquo;
                            </button>
                            <button
                              onClick={() => setNftTradesPage(nftTotalPages - 1)}
                              disabled={nftTradesPage >= nftTotalPages - 1}
                              className={cn(
                                'text-[14px] px-1 transition-colors disabled:opacity-30',
                                isDark
                                  ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                                  : 'text-gray-400 hover:text-gray-600'
                              )}
                            >
                              &raquo;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}

            {/* Ancestry Tab */}
            {activeTab === 'ancestry' && (
              <div className={cn('rounded-xl border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                {ancestryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading ancestry...</div>
                  </div>
                ) : !ancestry ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <GitBranch size={24} className={isDark ? 'text-white/20' : 'text-gray-300'} />
                    <p className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>No ancestry data available</p>
                  </div>
                ) : (
                  <>
                    {/* Stats Header */}
                    <div className={cn('px-4 py-3', isDark ? 'border-b border-white/10' : 'border-b border-gray-100')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                          <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Account Ancestry</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {ancestry.stats?.ancestorDepth > 0 && (
                            <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                              <span className="font-medium">{ancestry.stats.ancestorDepth}</span> generations
                            </span>
                          )}
                          {ancestry.stats?.childrenCount > 0 && (
                            <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                              <span className="font-medium">{ancestry.stats.childrenCount}</span> children
                            </span>
                          )}
                          {ancestry.stats?.tokensCreated > 0 && (
                            <span className={cn('text-[11px]', isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
                              <span className="font-medium">{ancestry.stats.tokensCreated}</span> tokens created
                            </span>
                          )}
                        </div>
                      </div>
                      {ancestry.tokens?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ancestry.tokens.map((token) => (
                            <Link
                              key={token.md5}
                              href={`/token/${token.md5}`}
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors',
                                isDark ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                              )}
                            >
                              <span className="font-medium">{token.name || token.currency}</span>
                              {token.marketcap > 0 && (
                                <span className={cn(isDark ? 'text-emerald-400/50' : 'text-emerald-500')}>
                                  ${token.marketcap >= 1000000 ? `${(token.marketcap / 1000000).toFixed(1)}M` : token.marketcap >= 1000 ? `${(token.marketcap / 1000).toFixed(0)}k` : token.marketcap.toFixed(0)}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ancestors Section */}
                    {ancestry.ancestors?.length > 0 && (
                      <>
                      <div className={cn('h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowUpRight size={12} className={isDark ? 'text-white/30' : 'text-gray-400'} />
                          <span className={cn('text-[11px] uppercase tracking-wider font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                            Activation Chain
                          </span>
                        </div>
                        <div className="relative">
                          {/* Vertical connecting line */}
                          <div className={cn('absolute left-[18px] top-4 bottom-4 w-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                          <div className="space-y-1">
                            {ancestry.ancestors.map((ancestor, idx) => (
                              <div key={ancestor.address || idx} className="relative pl-10">
                                {/* Node dot */}
                                <div className={cn('absolute left-[15px] top-3 w-[7px] h-[7px] rounded-full border-2', isDark ? 'bg-black border-white/30' : 'bg-white border-gray-300')} />
                                <div className={cn('rounded-lg', isDark ? 'bg-white/[0.02]' : 'bg-gray-50')}>
                                  <div className="flex items-center justify-between py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <Link href={`/address/${ancestor.address}`} className={cn('text-[13px] font-medium hover:underline', isDark ? 'text-white' : 'text-gray-900')}>
                                        {ancestor.name || `${ancestor.address?.slice(0, 8)}...${ancestor.address?.slice(-6)}`}
                                      </Link>
                                      {ancestor.name && (
                                        <span className={cn('text-[10px] font-mono', isDark ? 'text-white/30' : 'text-gray-400')}>
                                          {ancestor.address?.slice(0, 6)}...
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {ancestor.tokensCreated > 0 && (
                                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                                          {ancestor.tokensCreated} tokens
                                        </span>
                                      )}
                                      {ancestor.inception && (
                                        <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                                          {new Date(ancestor.inception).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {ancestor.tokens?.length > 0 && (
                                    <div className={cn('px-3 pb-2 flex flex-wrap gap-1', isDark ? 'border-t border-white/5' : 'border-t border-gray-100')}>
                                      {ancestor.tokens.map((token) => (
                                        <Link
                                          key={token.md5}
                                          href={`/token/${token.md5}`}
                                          className={cn(
                                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors',
                                            isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                          )}
                                        >
                                          <span className="font-medium">{token.name || token.currency}</span>
                                          {token.marketcap > 0 && (
                                            <span className={cn(isDark ? 'text-white/30' : 'text-gray-400')}>
                                              ${token.marketcap >= 1000000 ? `${(token.marketcap / 1000000).toFixed(1)}M` : token.marketcap >= 1000 ? `${(token.marketcap / 1000).toFixed(0)}k` : token.marketcap.toFixed(0)}
                                            </span>
                                          )}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      </>
                    )}

                    {/* Children Section */}
                    {ancestry.children?.length > 0 && (
                      <>
                      <div className={cn('h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowDownLeft size={12} className={isDark ? 'text-white/30' : 'text-gray-400'} />
                          <span className={cn('text-[11px] uppercase tracking-wider font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                            Activated Accounts
                          </span>
                          {ancestry.stats?.childrenCount > 0 && (
                            <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-400')}>
                              ({ancestry.stats.childrenCount})
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className={cn('absolute left-[18px] top-4 bottom-4 w-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
                          <div className="space-y-1">
                            {ancestry.children.map((child, idx) => (
                              <div key={child.address || idx} className="relative pl-10">
                                <div className={cn('absolute left-[15px] top-3 w-[7px] h-[7px] rounded-full border-2', isDark ? 'bg-black border-white/30' : 'bg-white border-gray-300')} />
                                <div className={cn('rounded-lg', isDark ? 'bg-white/[0.02]' : 'bg-gray-50')}>
                                  <div className="flex items-center justify-between py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <Link href={`/address/${child.address}`} className={cn('text-[13px] font-medium hover:underline', isDark ? 'text-white' : 'text-gray-900')}>
                                        {child.name || `${child.address?.slice(0, 8)}...${child.address?.slice(-6)}`}
                                      </Link>
                                      {child.name && (
                                        <span className={cn('text-[10px] font-mono', isDark ? 'text-white/30' : 'text-gray-400')}>
                                          {child.address?.slice(0, 6)}...
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {child.tokensCreated > 0 && (
                                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                                          {child.tokensCreated} tokens
                                        </span>
                                      )}
                                      {child.inception && (
                                        <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                                          {new Date(child.inception).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {child.tokens?.length > 0 && (
                                    <div className={cn('px-3 pb-2 flex flex-wrap gap-1', isDark ? 'border-t border-white/5' : 'border-t border-gray-100')}>
                                      {child.tokens.map((token) => (
                                        <Link
                                          key={token.md5}
                                          href={`/token/${token.md5}`}
                                          className={cn(
                                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors',
                                            isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                          )}
                                        >
                                          <span className="font-medium">{token.name || token.currency}</span>
                                          {token.marketcap > 0 && (
                                            <span className={cn(isDark ? 'text-white/30' : 'text-gray-400')}>
                                              ${token.marketcap >= 1000000 ? `${(token.marketcap / 1000000).toFixed(1)}M` : token.marketcap >= 1000 ? `${(token.marketcap / 1000).toFixed(0)}k` : token.marketcap.toFixed(0)}
                                            </span>
                                          )}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      </>
                    )}

                    {/* Empty state */}
                    {(!ancestry.ancestors || ancestry.ancestors.length === 0) && (!ancestry.children || ancestry.children.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <GitBranch size={24} className={isDark ? 'text-white/20' : 'text-gray-300'} />
                        <p className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>No ancestry relationships found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
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
