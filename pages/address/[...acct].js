import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { getNftCoverUrl, BLACKHOLE_ACCOUNTS } from 'src/utils/parseUtils';
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
  GitBranch,
  Sparkles,
  Tag,
  Trash2,
  Shield,
  Star,
  Gem,
  User,
  Activity,
  TrendingUp,
  Zap,
  BarChart2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import AccountHistory from 'src/components/AccountHistory';
import CryptoJS from 'crypto-js';

// Same wrapper as index.js for consistent width
const PageWrapper = styled.div`
  overflow-x: hidden;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
`;

const AccountInfoDetails = ({ accountInfo, isDark }) => {
  if (!accountInfo) return null;
  const details = [
    accountInfo.inception && { label: 'Created', value: new Date(accountInfo.inception).toLocaleDateString() },
    accountInfo.reserve > 0 && { label: 'Reserve', value: `${accountInfo.reserve} XRP` },
    accountInfo.ownerCount > 0 && { label: 'Objects', value: accountInfo.ownerCount },
    accountInfo.domain && { label: 'Domain', value: <a href={`https://${accountInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{accountInfo.domain}</a> },
    accountInfo.parent && { label: 'Activated by', value: <a href={`/address/${accountInfo.parent}`} className="text-primary hover:underline">{`${accountInfo.parent.slice(0, 6)}...`}</a> }
  ].filter(Boolean);

  if (details.length === 0) return null;

  return (
    <div className={cn(
      'grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t',
      isDark ? 'border-white/[0.06] text-white/40' : 'border-gray-200 text-gray-500'
    )}>
      {details.map((d, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">{d.label}</span>
          <span className={cn('text-[11px] font-medium truncate max-w-[150px]', isDark ? 'text-white/80' : 'text-gray-700')}>{d.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, subValue, valueClass, isDark, icon: Icon }) => (
  <div className={cn(
    'relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 group hover:translate-y-[-2px]',
    isDark
      ? 'bg-[#0a0a0a]/40 border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08] shadow-2xl shadow-black/20 backdrop-blur-xl'
      : 'bg-white/60 border-gray-200 hover:border-gray-300 hover:shadow-xl shadow-sm backdrop-blur-xl'
  )}>
    {/* Optional background glow for premium feel */}
    <div className={cn(
      'absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none',
      isDark ? 'bg-primary/5' : 'bg-primary/5'
    )} />

    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className={cn('text-[10px] uppercase font-bold tracking-widest opacity-60', isDark ? 'text-white' : 'text-gray-500')}>
          {title}
        </p>
        {Icon && (
          <div className={cn(
            'p-2 rounded-xl transition-colors',
            isDark ? 'bg-white/5 text-white/40 group-hover:text-white/80' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'
          )}>
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="mt-auto">
        <p className={cn('text-[24px] font-black tabular-nums tracking-tighter leading-none mb-1.5', valueClass, isDark ? 'text-white' : 'text-gray-900')}>
          {value}
        </p>
        {subValue && (
          <p className={cn('text-[10px] font-medium tracking-wide flex items-center gap-1', isDark ? 'text-white/40' : 'text-gray-400')}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  </div>
);

const TradingStat = ({ label, value, color, isDark }) => (
  <div className={cn(
    'flex flex-col items-center justify-center flex-1 px-2 border-r last:border-0 border-dashed',
    isDark ? 'border-white/10' : 'border-gray-200'
  )}>
    <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-1.5 opacity-40', isDark ? 'text-white' : 'text-black')}>
      {label}
    </p>
    <p className={cn('text-[15px] font-black tabular-nums tracking-tight', color)}>
      {value}
    </p>
  </div>
);


// Avatar with NFT tooltip on hover
const AvatarWithTooltip = ({ avatarUrl, nftId, className }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [nftData, setNftData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);

  const handleMouseEnter = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    setShowTooltip(true);

    if (!nftId || nftData) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://api.xrpl.to/v1/nft/${nftId}`);
      setNftData(res.data);
    } catch (e) { }
    setLoading(false);
  };

  const largeImageUrl = nftData ? (getNftCoverUrl(nftData, 'medium', 'image') || avatarUrl) : avatarUrl;

  return (
    <>
      <Link href={nftId ? `/nft/${nftId}` : '#'}>
        <img
          src={avatarUrl}
          alt="Avatar"
          className={className}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowTooltip(false)}
        />
      </Link>
      {showTooltip && nftId && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translateX(-50%)',
            zIndex: 99999
          }}
          className={cn(
            'rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-2xl',
            isDark ? 'bg-black/95 border-white/10 shadow-black' : 'bg-white/95 border-gray-200 shadow-xl'
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className={cn('w-5 h-5 border-2 rounded-full animate-spin', isDark ? 'border-white/20 border-t-white/60' : 'border-gray-200 border-t-gray-600')} />
            </div>
          ) : nftData ? (
            <div className="flex flex-col">
              <img src={largeImageUrl} alt="" className="w-[180px] h-[180px] object-cover" />
              <div className="p-3">
                <p className={cn('text-[13px] font-bold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {nftData.name || nftData.meta?.name || 'Unnamed'}
                </p>
                {nftData.collection && (
                  <p className={cn('text-[11px] truncate mt-0.5', isDark ? 'text-white/50' : 'text-gray-500')}>
                    {nftData.collection}
                  </p>
                )}
                {nftData.rarity_rank > 0 && (
                  <p className="text-[10px] text-purple-400 font-medium mt-1">
                    Rank #{nftData.rarity_rank}{nftData.total ? ` of ${nftData.total.toLocaleString()}` : ''}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className={cn('text-[11px] p-4', isDark ? 'text-white/40' : 'text-gray-400')}>NFT Avatar</p>
          )}
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
  const [holdings, setHoldings] = useState(null);
  const [holdingsPage, setHoldingsPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tokenSearch, setTokenSearch] = useState('');
  // Trading performance pagination (server-side)
  const [tradingPerfOffset, setTradingPerfOffset] = useState(0);
  const [tradingPerfSort, setTradingPerfSort] = useState('volume');
  const [tradingPerfLoading, setTradingPerfLoading] = useState(false);
  const TRADING_PERF_LIMIT = 20;
  const [hideZeroHoldings, setHideZeroHoldings] = useState(true);
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
  const [nftCollectionStats, setNftCollectionStats] = useState([]);
  const [nftCollectionStatsLoading, setNftCollectionStatsLoading] = useState(false);
  const [nftHistory, setNftHistory] = useState([]);

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

  // User profile (for avatar)
  const [userProfile, setUserProfile] = useState(null);

  // Set XRP price from holdings data
  useEffect(() => {
    if (holdings?.xrp?.usd) {
      setXrpPrice(parseFloat(holdings.xrp.usd));
    }
  }, [holdings]);

  useEffect(() => {
    // Reset data and loading state when account changes
    setData(null);
    setHoldings(null);
    setHoldingsPage(0);
    setLoading(true);
    setTradingPerfOffset(0);
    setTradingPerfSort('volume');
    setAccountAI(null);
    setAccountAILoading(false);
    setNftStats(null);
    setNftCollections([]);
    setSelectedNftCollection(null);
    setCollectionNfts([]);
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
      } catch (e) { }
    };
    fetchLabel();
  }, [account, accountProfile?.account, isOwnAccount]);

  // Fetch user perks and profile
  useEffect(() => {
    if (!account) return;
    const fetchPerks = async () => {
      try {
        const res = await axios.get(`https://api.xrpl.to/api/user/${account}/perks`);
        if (res.data) setUserPerks(res.data);
      } catch (e) { }
    };
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`https://api.xrpl.to/api/user/${account}`);
        if (res.data?.success && res.data.user) setUserProfile(res.data.user);
      } catch (e) { }
    };
    fetchPerks();
    fetchProfile();
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
    } catch (e) { }
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
    } catch (e) { }
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

      <div className="mx-auto max-w-[1920px] w-full px-4 mt-6 flex-1">
        <div className="flex flex-col">
          <div className="w-full">
            {/* Account Header */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {userProfile?.avatar ? (
                    <AvatarWithTooltip
                      avatarUrl={userProfile.avatar}
                      nftId={userProfile.avatarNftId}
                      className="w-24 h-24 rounded-2xl object-cover border border-white/10 cursor-pointer hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className={cn(
                      'p-3 rounded-2xl border',
                      isDark ? 'bg-white/[0.03] border-white/10 text-white/70' : 'bg-gray-50 border-gray-200 text-gray-400'
                    )}>
                      <User size={24} />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2
                        className={cn(
                          'text-xl md:text-2xl font-bold tracking-tight font-mono',
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
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-primary/5 border border-primary/20">
                            <input
                              type="text"
                              value={labelInput}
                              onChange={(e) => setLabelInput(e.target.value.slice(0, 30))}
                              placeholder="Label"
                              autoFocus
                              className={cn('w-28 px-2 py-1 rounded-md text-[12px] outline-none', isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-gray-900 border border-gray-300')}
                            />
                            <button onClick={handleSaveLabel} disabled={labelSaving || !labelInput.trim()} className="px-3 py-1 rounded-md text-[11px] bg-primary text-white disabled:opacity-50 font-bold hover:bg-primary/90 transition-colors">Save</button>
                            {walletLabel && <button onClick={handleDeleteLabel} disabled={labelSaving} className={cn('p-1.5 rounded-md transition-colors', isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50')}><Trash2 size={14} /></button>}
                            <button onClick={() => setEditingLabel(false)} className={cn('px-2 py-1 text-[11px] font-medium', isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')}>Cancel</button>
                          </div>
                        ) : walletLabel ? (
                          <button onClick={() => { setLabelInput(walletLabel); setEditingLabel(true); }} className={cn('text-[12px] px-3 py-1 rounded-full font-bold flex items-center gap-1.5 hover:shadow-md transition-all', isDark ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20')}>
                            <Tag size={12} />
                            {walletLabel}
                          </button>
                        ) : (
                          <button onClick={() => { setLabelInput(''); setEditingLabel(true); }} className={cn('p-2 rounded-xl transition-all hover:scale-105', isDark ? 'bg-white/5 text-white/30 hover:text-white/60' : 'bg-gray-100 text-gray-400 hover:text-gray-600')} title="Add label">
                            <Tag size={14} />
                          </button>
                        )
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(account);
                            // Optional: add toast notification here
                          }}
                          className={cn(
                            'p-2 rounded-xl transition-all hover:scale-105',
                            isDark
                              ? 'bg-white/5 text-white/30 hover:text-white/60'
                              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                          )}
                          title="Copy address"
                        >
                          <Copy size={15} />
                        </button>
                        {!isOwnAccount && (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: account } }))}
                            className={cn(
                              'p-2 rounded-xl transition-all hover:scale-105',
                              isDark
                                ? 'bg-white/5 text-white/30 hover:text-white/60'
                                : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                            )}
                            title="Message"
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}
                        <ApiButton />
                      </div>
                      {isOwnAccount && (
                        <button
                          onClick={() => setOpenWalletModal(true)}
                          className="flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-xl bg-primary text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                        >
                          <Wallet size={15} />
                          Manage
                        </button>
                      )}
                    </div>
                    <AccountInfoDetails accountInfo={accountInfo} isDark={isDark} />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {typeof data?.washTradingScore === 'number' && (
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border backdrop-blur-md',
                        data.washTradingScore > 50
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-500/10'
                          : isDark
                            ? 'bg-white/[0.03] text-white/50 border-white/10'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                      )}
                      title="Wash Trading Score"
                    >
                      {data.washTradingScore > 50 && <AlertTriangle size={14} className="animate-pulse" />}
                      <span>Wash {data.washTradingScore}</span>
                    </div>
                  )}
                  {data?.isAMM && (
                    <span className="text-[11px] h-6 px-3 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold flex items-center shadow-lg shadow-blue-500/5">
                      AMM
                    </span>
                  )}
                  {userPerks?.groups?.map(group => {
                    const groupConfig = {
                      member: { icon: User, bg: isDark ? 'bg-white/[0.03]' : 'bg-gray-100', text: isDark ? 'text-white/60' : 'text-gray-600', border: isDark ? 'border-white/10' : 'border-gray-200' },
                      admin: { icon: Shield, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
                      verified: { icon: Check, bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent', border: 'border-[#FFD700]/30', gradient: true },
                      diamond: { icon: Gem, bg: 'bg-[#650CD4]/10', text: 'text-[#a855f7]', border: 'border-[#650CD4]/20' },
                      nova: { icon: Star, bg: 'bg-[#F6AF01]/10', text: 'text-[#F6AF01]', border: 'border-[#F6AF01]/20' },
                      vip: { icon: Sparkles, bg: 'bg-[#08AA09]/10', text: 'text-[#08AA09]', border: 'border-[#08AA09]/20' }
                    };
                    const config = groupConfig[group] || { icon: null, bg: isDark ? 'bg-white/[0.03]' : 'bg-gray-100', text: isDark ? 'text-white/60' : 'text-gray-600', border: isDark ? 'border-white/10' : 'border-gray-200' };
                    const Icon = config.icon;
                    return (
                      <div key={group} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border', config.bg, config.border)}>
                        {Icon && <Icon size={14} className={config.gradient ? 'text-[#FFD700]' : ''} style={!config.gradient ? { color: 'inherit' } : {}} />}
                        <span className={config.text}>{group.charAt(0).toUpperCase() + group.slice(1)}</span>
                      </div>
                    );
                  })}
                  {isBlackholed && (
                    <div className="relative group/blackhole">
                      <span className="text-[11px] h-6 px-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center cursor-help">
                        Blackholed
                      </span>
                      <div className={cn(
                        'pointer-events-none absolute right-0 top-full mt-2 p-3.5 rounded-2xl text-[11px] w-64 opacity-0 invisible group-hover/blackhole:opacity-100 group-hover/blackhole:visible transition-all duration-200 z-50 shadow-2xl backdrop-blur-xl',
                        isDark ? 'bg-black/95 border border-white/10' : 'bg-white border border-gray-200 shadow-xl'
                      )}>
                        <div className="font-bold text-red-500 text-[13px] mb-1.5 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          Blackholed Account
                        </div>
                        <div className={cn('leading-relaxed', isDark ? 'text-white/50' : 'text-gray-500')}>
                          This account is permanently locked. Master key is disabled and no valid regular key exists.
                        </div>
                        {accountInfo && (
                          <div className={cn('mt-3 pt-3 border-t space-y-2', isDark ? 'border-white/10' : 'border-gray-100')}>
                            <div className="flex justify-between items-center">
                              <span className={cn('text-[10px] uppercase font-bold', isDark ? 'text-white/30' : 'text-gray-400')}>Current Balance</span>
                              <span className={cn('font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{accountInfo.total?.toLocaleString()} XRP</span>
                            </div>
                            {accountInfo.rank && (
                              <div className="flex justify-between items-center">
                                <span className={cn('text-[10px] uppercase font-bold', isDark ? 'text-white/30' : 'text-gray-400')}>Global Rank</span>
                                <span className={cn('font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>#{accountInfo.rank.toLocaleString()}</span>
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
                        'flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all duration-300 shadow-lg shadow-purple-500/10 active:scale-95',
                        isDark
                          ? 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                          : 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600'
                      )}
                    >
                      <Sparkles size={15} className="animate-pulse" />
                      Activity AI
                    </button>
                  )}
                  {accountAILoading && (
                    <span
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2 rounded-xl border text-[12px] font-bold',
                        isDark
                          ? 'border-purple-500/25 bg-purple-500/10 text-purple-300'
                          : 'border-purple-500/30 bg-purple-500/5 text-purple-600'
                      )}
                    >
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  )}
                </div>
              </div>
              {data?.firstTradeDate && (
                <div
                  className={cn(
                    'text-[11px] font-medium mt-3 flex items-center gap-2',
                    isDark ? 'text-white/30' : 'text-gray-400'
                  )}
                >
                  <Clock size={12} />
                  <span>
                    Trading since <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{fDateTime(data.firstTradeDate)}</span>
                    <span className="mx-2 opacity-30">|</span>
                    Last trade <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{fDateTime(data.lastTradeDate)}</span>
                  </span>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  isDark={isDark}
                  title="XRP Balance"
                  icon={Wallet}
                  value={
                    fCurrency5(holdings?.accountData?.total || holdings?.xrp?.value || 0) + ' XRP'
                  }
                  subValue={
                    holdings?.accountData?.reserve > 0
                      ? `${fCurrency5(holdings.xrp?.value || 0)} Avail | ${holdings.accountData.reserve} Reserve`
                      : accountInfo?.rank ? `#${accountInfo.rank.toLocaleString()} World Rank` : 'Account active'
                  }
                />
                <StatCard
                  isDark={isDark}
                  title="Total P&L"
                  icon={Gem}
                  value={`${totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? '+' : ''}${fCurrency5(
                    totalPnL + (nftStats?.combinedProfit || 0)
                  )} XRP`}
                  valueClass={
                    totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }
                  subValue={
                    data?.roi ? `${data.roi >= 0 ? '+' : ''}${data.roi.toFixed(1)}% Return on investment` : 'No trading ROI'
                  }
                />
                <StatCard
                  isDark={isDark}
                  title="Total Trades"
                  icon={ArrowLeftRight}
                  value={fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}
                  subValue={
                    data?.totalTrades > 0 ? `${winRate.toFixed(1)}% Overall Win Rate` : 'No trading wins'
                  }
                />
                <StatCard
                  isDark={isDark}
                  title="Total Volume"
                  icon={Coins}
                  value={`${fCurrency5(
                    (data?.dexVolume || 0) + (data?.ammVolume || 0) + (nftStats?.totalVolume || 0)
                  )} XRP`}
                  subValue={
                    (data?.dexVolume || 0) > 0 ? `${fCurrency5(data.dexVolume)} from DEX activity` : 'Total accumulated volume'
                  }
                />
              </div>
            )}

            {/* Two-column trading breakdown */}
            {(data || nftStats) && (
              <div className={cn('grid md:grid-cols-2 gap-4 mb-6')}>
                {/* Token Trading */}
                <div
                  className={cn(
                    'p-5 rounded-2xl border transition-all duration-300 h-full flex flex-col',
                    isDark ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  {data && !data.error ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shadow-inner',
                              isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                            )}
                          >
                            <Coins size={16} className="text-emerald-500" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                'text-[12px] font-bold tracking-tight',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              Token Performance
                            </span>
                            <p className={cn('text-[9px] font-medium opacity-50 block', isDark ? 'text-white' : 'text-gray-500')}>DEX & AMM Activity</p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold tabular-nums border',
                            isDark ? 'bg-white/[0.04] border-white/10' : 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <span className="text-emerald-500">
                            {fCurrency5(data.buyCount || 0)}B
                          </span>
                          <span className="opacity-20">/</span>
                          <span className="text-red-500">
                            {fCurrency5(data.sellCount || 0)}S
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-around mb-5 py-2">
                        <TradingStat label="Realized P&L" value={fCurrency5(totalPnL)} color={totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-8', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="ROI" value={`${(data.roi || 0).toFixed(1)}%`} color={(data.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-8', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="Win Rate" value={`${winRate.toFixed(1)}%`} color={isDark ? 'text-white/80' : 'text-gray-900'} isDark={isDark} />
                      </div>
                      <div
                        className={cn(
                          'flex items-center justify-between pt-4 text-[10px] mt-auto font-bold',
                          isDark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex items-baseline gap-1.5">
                            <span className="opacity-40">DEX:</span>
                            <span className={cn('tabular-nums', (data.dexProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                              {(data.dexProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.dexProfit || 0)}
                            </span>
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="opacity-40">AMM:</span>
                            <span className={cn('tabular-nums', (data.ammProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                              {(data.ammProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.ammProfit || 0)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {[
                            { label: '24H', value: data.profit24h || 0 },
                            { label: '7D', value: data.profit7d || 0 },
                          ].map((p) => (
                            <span key={p.label} className="flex items-baseline gap-1">
                              <span className="opacity-30">{p.label}:</span>
                              <span className={cn('tabular-nums', p.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                {p.value >= 0 ? '+' : ''}{fCurrency5(p.value)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[160px]">
                      <div
                        className={cn(
                          'w-12 h-12 mb-3 rounded-2xl flex items-center justify-center shadow-inner',
                          isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                        )}
                      >
                        <Coins size={20} className={isDark ? 'text-emerald-500/40' : 'text-emerald-400'} />
                      </div>
                      <p className={cn('text-[12px] font-bold tracking-tight mb-0.5', isDark ? 'text-white/70' : 'text-gray-700')}>No Token activity</p>
                      <p className={cn('text-[10px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Trading data will appear here</p>
                    </div>
                  )}
                </div>

                {/* NFT Trading */}
                <div
                  className={cn(
                    'p-5 rounded-2xl border transition-all duration-300 h-full flex flex-col',
                    isDark ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  {nftStats && (nftStats.totalVolume > 0 || nftStats.holdingsCount > 0) ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shadow-inner',
                              isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                            )}
                          >
                            <Image size={16} className="text-indigo-500" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                'text-[12px] font-bold tracking-tight',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              NFT Performance
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className={cn('text-[9px] font-medium opacity-50 block', isDark ? 'text-white' : 'text-gray-500')}>Collection Activity</p>
                              {nftStats.holdingsCount > 0 && (
                                <span className={cn('px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider', isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700')}>
                                  {nftStats.holdingsCount} Held
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold tabular-nums border',
                            isDark ? 'bg-white/[0.04] border-white/10' : 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <span className="text-emerald-500">
                            {fCurrency5(nftStats.buyCount || 0)}B
                          </span>
                          <span className="opacity-20">/</span>
                          <span className="text-red-500">
                            {fCurrency5(nftStats.sellCount || 0)}S
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-around mb-5 py-2">
                        <TradingStat label="Realized P&L" value={fCurrency5(nftStats.profit || 0)} color={(nftStats.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-8', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="Unrealized" value={fCurrency5(nftStats.unrealizedProfit || 0)} color={(nftStats.unrealizedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-amber-500'} isDark={isDark} />
                        <div className={cn('w-px h-8', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="ROI" value={`${(nftStats.roi || 0).toFixed(1)}%`} color={(nftStats.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                      </div>
                      <div
                        className={cn(
                          'flex items-center justify-between pt-4 text-[10px] mt-auto font-bold',
                          isDark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex items-baseline gap-1.5">
                            <span className="opacity-40">FLIPS:</span>
                            <span className={cn('tabular-nums', isDark ? 'text-white/80' : 'text-gray-900')}>
                              {nftStats.flips || 0}
                            </span>
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="opacity-40">AVG HOLD:</span>
                            <span className={cn('tabular-nums', isDark ? 'text-white/80' : 'text-gray-900')}>
                              {(nftStats.avgHoldingDays || 0).toFixed(0)}d
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {[
                            { label: '24H', value: nftStats.profit24h || 0 },
                            { label: '7D', value: nftStats.profit7d || 0 },
                          ].map((p) => (
                            <span key={p.label} className="flex items-baseline gap-1">
                              <span className="opacity-30">{p.label}:</span>
                              <span className={cn('tabular-nums', p.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                {p.value >= 0 ? '+' : ''}{fCurrency5(p.value)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[160px]">
                      <div
                        className={cn(
                          'w-12 h-12 mb-3 rounded-2xl flex items-center justify-center shadow-inner',
                          isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                        )}
                      >
                        <Image size={20} className={isDark ? 'text-indigo-500/40' : 'text-indigo-400'} />
                      </div>
                      <p className={cn('text-[12px] font-bold tracking-tight mb-0.5', isDark ? 'text-white/70' : 'text-gray-700')}>No NFT activity</p>
                      <p className={cn('text-[10px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Marketplace data will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex justify-start mb-6">
            <div className={cn(
              'flex items-center gap-0.5 p-1 rounded-xl border backdrop-blur-md',
              isDark
                ? 'bg-white/[0.03] border-white/[0.06]'
                : 'bg-gray-100/80 border-gray-200'
            )}>
              {[
                { id: 'tokens', label: 'Holdings', icon: Coins, count: (holdings?.total || holdings?.lines?.length || 0) + ((holdings?.accountData?.total > 0 || holdings?.xrp?.value > 0) ? 1 : 0) },
                { id: 'nfts', label: 'Collections', icon: Image, count: nftStats?.holdingsCount || 0 },
                { id: 'activity', label: 'History', icon: Clock },
                { id: 'ancestry', label: 'Ancestry', icon: GitBranch, count: ancestry?.stats?.ancestorDepth || '' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200',
                    activeTab === tab.id
                      ? cn(isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                      : cn(isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')
                  )}
                >
                  <tab.icon size={13} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count !== '' && (
                    <span className={cn(
                      'text-[9px] px-1 py-0.5 rounded font-bold min-w-[16px] text-center',
                      activeTab === tab.id
                        ? isDark ? 'bg-white/10 text-white/70' : 'bg-gray-200 text-gray-600'
                        : isDark ? 'bg-white/5 text-white/30' : 'bg-gray-200/50 text-gray-400'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              {holdings && holdings.accountActive !== false && (() => {
                const filteredLines = hideZeroHoldings
                  ? holdings.lines?.filter((l) => parseFloat(l.balance) !== 0) || []
                  : holdings.lines || [];
                const zeroCount = (holdings.lines?.length || 0) - filteredLines.length;
                const totalValue = filteredLines.reduce((sum, l) => sum + (l.value || 0), 0);

                return (
                  <div className="space-y-6">
                    {/* Main Holdings Container */}
                    <div
                      className={cn(
                        'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl',
                        isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
                      )}
                    >
                      <div
                        className={cn(
                          'px-5 py-4 flex items-center justify-between border-b',
                          isDark ? 'border-white/[0.06]' : 'border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-xl', isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary')}>
                            <Wallet size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Token Portfolio</h3>
                              {zeroCount > 0 && (
                                <button
                                  onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                                  className={cn(
                                    'text-[9px] px-2 py-0.5 rounded-full transition-all duration-200 font-bold uppercase tracking-wider',
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
                            <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                              {(holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)} Managed Assets
                            </p>
                          </div>
                        </div>
                        {(totalValue > 0 || (holdings.accountData?.total > 0 || holdings.xrp?.value > 0)) && (
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className={cn('text-[16px] font-black tabular-nums tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>
                                {fCurrency5(totalValue + (holdings.accountData?.total || holdings.xrp?.value || 0))}
                              </span>
                              <span className={cn('text-[10px] font-bold opacity-40', isDark ? 'text-white' : 'text-gray-500')}>XRP</span>
                            </div>
                            <p className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Estimated Total Portfolio Value</p>
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        {(filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? (
                          <table className="w-full">
                            <thead>
                              <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                <th className="px-5 py-4 text-left">Asset</th>
                                <th className="px-5 py-4 text-right">Balance</th>
                                <th className="px-5 py-4 text-right">Value (XRP)</th>
                                <th className="px-5 py-4 text-right font-medium">Price</th>
                                <th className="px-5 py-4 text-right">24H</th>
                              </tr>
                            </thead>
                            <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                              {/* XRP Row */}
                              {(holdings.accountData?.total > 0 || holdings.xrp?.value > 0) && (
                                <tr
                                  className={cn(
                                    'group transition-all duration-300 relative overflow-hidden',
                                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                                  )}
                                >
                                  <td className="px-5 py-4">
                                    <Link href="/token/xrpl-xrp" className="flex items-center gap-3">
                                      <div className={cn(
                                        'w-9 h-9 rounded-2xl p-0.5 border shadow-sm transition-transform group-hover:scale-105',
                                        isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                      )}>
                                        <img
                                          src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                                          className="w-full h-full object-contain rounded-xl"
                                          alt="XRP"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className={cn('text-[14px] font-bold group-hover:text-primary transition-colors', isDark ? 'text-white' : 'text-gray-900')}>XRP</span>
                                        <span className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Native Asset</span>
                                      </div>
                                    </Link>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                      {fCurrency5(holdings.accountData?.total || holdings.xrp.value)}
                                    </div>
                                    {holdings.accountData?.reserve > 0 && (
                                      <div className={cn('text-[9px] font-medium opacity-40 tabular-nums')}>
                                        {fCurrency5(holdings.xrp.value)} Available
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className={cn('text-[13px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                      {xrpPrice
                                        ? `$${fCurrency5((holdings.accountData?.total || holdings.xrp.value) * xrpPrice)}`
                                        : `${fCurrency5(holdings.accountData?.total || holdings.xrp.value)} XRP`}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span className={cn('text-[12px] font-medium tabular-nums opacity-50')}>
                                      {xrpPrice ? `$${parseFloat(xrpPrice).toFixed(4)}` : '—'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span className={cn('text-[12px] font-bold tabular-nums', (holdings?.xrp?.pro24h || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                      {holdings?.xrp?.pro24h
                                        ? `${holdings.xrp.pro24h >= 0 ? '+' : ''}${holdings.xrp.pro24h.toFixed(1)}%`
                                        : '—'}
                                    </span>
                                  </td>
                                </tr>
                              )}
                              {/* Token Rows */}
                              {filteredLines.map((line, idx) => {
                                const priceInXrp = line.token?.exch || 0;
                                const change24h = line.token?.pro24h || 0;
                                const pctOwned = line.percentOwned || 0;
                                return (
                                  <tr
                                    key={idx}
                                    className={cn(
                                      'group transition-all duration-300 relative overflow-hidden',
                                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                                    )}
                                  >
                                    <td className="px-5 py-4">
                                      <Link href={`/token/${line.token?.md5}`} className="flex items-center gap-3">
                                        <div className={cn(
                                          'w-9 h-9 rounded-2xl p-0.5 border shadow-sm transition-transform group-hover:scale-105 flex-shrink-0',
                                          isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                        )}>
                                          <img
                                            src={`https://s1.xrpl.to/token/${line.token?.md5}`}
                                            className="w-full h-full object-contain rounded-xl"
                                            onError={(e) => { e.target.src = 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8'; }}
                                            alt=""
                                          />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className={cn('text-[14px] font-bold group-hover:text-primary transition-colors truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                              {line.token?.name || line.currency}
                                            </span>
                                            {line.token?.verified >= 1 && (
                                              <CheckCircle2 size={12} className="text-primary" />
                                            )}
                                          </div>
                                          {pctOwned > 0.01 && (
                                            <span className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                              {pctOwned.toFixed(2)}% Supply Owned
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <div className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                        {fCurrency5(Math.abs(parseFloat(line.balance)))}
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <div className={cn('text-[13px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                        {fCurrency5(line.value)} XRP
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <span className={cn('text-[12px] font-medium tabular-nums opacity-50')}>
                                        {priceInXrp ? `${fCurrency5(priceInXrp)}` : '—'}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <span className={cn('text-[12px] font-bold tabular-nums', change24h >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                        {change24h
                                          ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%`
                                          : '—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
                            <div className={
                              cn(
                                'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl backdrop-blur-md transition-transform hover:scale-105 duration-500',
                                isDark ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100'
                              )}>
                              <Search size={36} className={cn('opacity-30', isDark ? 'text-white' : 'text-gray-400')} />
                            </div>
                            <h4 className={cn('text-[18px] font-black tracking-tight mb-3', isDark ? 'text-white' : 'text-gray-900')}>No Tokens Found</h4>
                            <p className={cn('text-[13px] font-medium opacity-50 max-w-[320px] leading-relaxed mx-auto', isDark ? 'text-white' : 'text-gray-600')}>
                              We couldn't find any tokens that match your filters. Try adjusting your search or "Hide empty" settings.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {
                        (filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) && (
                          <div
                            className={cn(
                              'flex items-center justify-between px-5 py-4 border-t',
                              isDark ? 'border-white/[0.06]' : 'border-gray-50'
                            )}
                          >
                            <p className={cn('text-[10px] font-bold opacity-30 uppercase tracking-widest', isDark ? 'text-white' : 'text-gray-500')}>
                              Page {holdingsPage + 1} of {Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 20)}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                                disabled={holdingsPage === 0}
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                                  holdingsPage === 0
                                    ? 'opacity-20 cursor-not-allowed'
                                    : isDark
                                      ? 'bg-white/5 text-white hover:bg-white/10'
                                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                )}
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={() => setHoldingsPage(holdingsPage + 1)}
                                disabled={holdingsPage >= Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 20) - 1}
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                                  holdingsPage >= Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 20) - 1
                                    ? 'opacity-20 cursor-not-allowed'
                                    : isDark
                                      ? 'bg-white/5 text-white hover:bg-white/10'
                                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                )}
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      }

                    </div>
                  </div>
                );
              })()}

              {/* Issued Tokens */}
              {holdings?.issued?.length > 0 && (
                <div
                  className={cn(
                    'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl mb-6',
                    isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'px-5 py-4 flex items-center justify-between border-b',
                      isDark ? 'border-white/[0.06]' : 'border-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-xl', isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-500/5 text-amber-500')}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Issued Tokens</h3>
                        <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                          {holdings.issued.length} Assets Created
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                          <th className="px-5 py-4 text-left">Token</th>
                          <th className="px-5 py-4 text-right">Supply</th>
                          <th className="px-5 py-4 text-right">Holders</th>
                          <th className="px-5 py-4 text-right">Market Cap</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                        {holdings.issued.map((token, idx) => (
                          <tr
                            key={idx}
                            className={cn(
                              'group transition-all duration-300 relative overflow-hidden',
                              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                            )}
                          >
                            <td className="px-5 py-4">
                              <Link href={`/token/${token.md5}`} className="flex items-center gap-3">
                                <div className={cn(
                                  'w-9 h-9 rounded-2xl p-0.5 border shadow-sm transition-transform group-hover:scale-105 flex-shrink-0',
                                  isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                )}>
                                  <img
                                    src={`https://s1.xrpl.to/token/${token.md5}`}
                                    className="w-full h-full object-contain rounded-xl"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    alt=""
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className={cn('text-[14px] font-bold group-hover:text-primary transition-colors truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                    {token.name || token.currency}
                                  </span>
                                  <span className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                    {token.user || 'Unknown User'}
                                  </span>
                                </div>
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                {fCurrency5(parseFloat(token.supply))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                {token.holders?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[13px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                ${fCurrency5(parseFloat(token.supply) * parseFloat(token.usd || 0))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl mb-6',
                        isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
                      )}
                    >
                      <div
                        className={cn(
                          'px-5 py-4 flex items-center justify-between border-b gap-2 flex-wrap',
                          isDark ? 'border-white/[0.06]' : 'border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-xl', isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-500/5 text-emerald-500')}>
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Trading Performance</h3>
                            <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                              {totalCount} Tokens Traded
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={tradingPerfSort}
                            onChange={(e) => {
                              setTradingPerfSort(e.target.value);
                              setTradingPerfOffset(0);
                            }}
                            className={cn(
                              'text-[11px] px-3 py-2 rounded-xl border-none outline-none cursor-pointer font-bold',
                              isDark
                                ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <option value="volume">Volume</option>
                            <option value="profit">PNL</option>
                            <option value="roi">ROI</option>
                            <option value="trades">Trades</option>
                            <option value="lastTradeDate">Recent</option>
                          </select>
                          <div
                            className={cn(
                              'flex items-center rounded-xl overflow-hidden px-3',
                              isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                            )}
                          >
                            <Search size={14} className="opacity-30" />
                            <input
                              type="text"
                              placeholder="Search token..."
                              value={tokenSearch}
                              onChange={(e) => setTokenSearch(e.target.value)}
                              className={cn(
                                'text-[11px] px-2 py-2 bg-transparent border-none outline-none w-28 font-medium',
                                isDark
                                  ? 'text-white/70 placeholder:text-white/30'
                                  : 'text-gray-600 placeholder:text-gray-400'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                              <th className="px-5 py-4 text-left">Token</th>
                              <th className="px-3 py-4 text-right">Volume</th>
                              <th className="px-3 py-4 text-right">Trades</th>
                              <th className="px-3 py-4 text-right text-emerald-500/80">Bought</th>
                              <th className="px-3 py-4 text-right text-red-500/80">Sold</th>
                              <th className="px-3 py-4 text-right text-blue-500/80">Held</th>
                              <th className="px-3 py-4 text-right">ROI</th>
                              <th className="px-3 py-4 text-right">PNL</th>
                              <th className="px-3 py-4 text-right pr-5">Period</th>
                            </tr>
                          </thead>
                          <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
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
                                    'group transition-all duration-300 relative overflow-hidden',
                                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                                  )}
                                >
                                  <td className="px-5 py-4">
                                    <Link
                                      href={`/token/${token.tokenId}`}
                                      className="flex items-center gap-3"
                                    >
                                      <div
                                        className={cn(
                                          'w-9 h-9 rounded-2xl p-0.5 border shadow-sm transition-transform group-hover:scale-105 flex-shrink-0',
                                          isDark
                                            ? 'bg-black border-white/10'
                                            : 'bg-white border-gray-100'
                                        )}
                                      >
                                        <img
                                          src={`https://s1.xrpl.to/token/${token.tokenId}`}
                                          className="w-full h-full object-contain rounded-xl"
                                          onError={(e) => {
                                            e.target.parentElement.style.display = 'none';
                                          }}
                                          alt=""
                                        />
                                      </div>
                                      <span
                                        className={cn(
                                          'text-[13px] font-bold group-hover:text-primary transition-colors',
                                          isDark ? 'text-white' : 'text-gray-900'
                                        )}
                                      >
                                        {token.name}
                                      </span>
                                    </Link>
                                  </td>
                                  <td
                                    className={cn(
                                      'px-3 py-4 text-right text-[12px] font-medium tabular-nums',
                                      isDark ? 'text-white/60' : 'text-gray-600'
                                    )}
                                  >
                                    {fCurrency5(token.volume || 0)}
                                  </td>
                                  <td
                                    className={cn(
                                      'px-3 py-4 text-right text-[12px] font-medium tabular-nums',
                                      isDark ? 'text-white/60' : 'text-gray-600'
                                    )}
                                  >
                                    {fCurrency5(token.trades || 0)}
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    <span className="text-[12px] tabular-nums font-medium text-emerald-500">
                                      {fCurrency5(bought)}
                                    </span>
                                    {token.avgBuyPrice > 0 && (
                                      <div
                                        className={cn(
                                          'text-[9px] mt-0.5',
                                          isDark ? 'text-white/20' : 'text-gray-400'
                                        )}
                                      >
                                        @{token.avgBuyPrice < 0.001
                                          ? token.avgBuyPrice.toExponential(1)
                                          : fCurrency5(token.avgBuyPrice)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    <span className="text-[12px] tabular-nums font-medium text-red-500">
                                      {fCurrency5(sold)}
                                    </span>
                                    {token.avgSellPrice > 0 && (
                                      <div
                                        className={cn(
                                          'text-[9px] mt-0.5',
                                          isDark ? 'text-white/20' : 'text-gray-400'
                                        )}
                                      >
                                        @{token.avgSellPrice < 0.001
                                          ? token.avgSellPrice.toExponential(1)
                                          : fCurrency5(token.avgSellPrice)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    {holdingValue > 0 ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[12px] tabular-nums font-medium text-blue-500">
                                          {fCurrency5(holdingValue)}
                                        </span>
                                        {unrealizedPnl !== 0 && (
                                          <span
                                            className={cn(
                                              'text-[9px] tabular-nums font-bold mt-0.5',
                                              unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                                            )}
                                          >
                                            {unrealizedPnl >= 0 ? '+' : ''}{fCurrency5(unrealizedPnl)}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={cn('text-[12px] opacity-20', isDark ? 'text-white' : 'text-black')}>—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    <span
                                      className={cn(
                                        'text-[11px] tabular-nums font-bold px-2 py-0.5 rounded-md',
                                        roi >= 0
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : 'bg-red-500/10 text-red-500'
                                      )}
                                    >
                                      {roi >= 0 ? '+' : ''}
                                      {roi.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 text-right">
                                    <span
                                      className={cn(
                                        'text-[12px] font-bold tabular-nums',
                                        profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                                      )}
                                    >
                                      {profit >= 0 ? '+' : ''}
                                      {fCurrency5(profit)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 pr-5 text-right">
                                    <div className="flex flex-col items-end gap-0.5">
                                      <span
                                        className={cn(
                                          'text-[10px] tabular-nums font-medium opacity-60',
                                          isDark ? 'text-white' : 'text-gray-900'
                                        )}
                                      >
                                        {token.firstTradeDate
                                          ? new Date(token.firstTradeDate).toLocaleDateString(
                                            'en-GB',
                                            { day: '2-digit', month: 'short', year: '2-digit' }
                                          )
                                          : '—'}
                                      </span>
                                      {token.lastTradeDate &&
                                        token.firstTradeDate !== token.lastTradeDate && (
                                          <span className={cn('text-[9px] opacity-30', isDark ? 'text-white' : 'text-black')}>
                                            to {new Date(token.lastTradeDate).toLocaleDateString(
                                              'en-GB',
                                              { day: '2-digit', month: 'short', year: '2-digit' }
                                            )}
                                          </span>
                                        )}
                                    </div>
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
            </div>
          )
          }

          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div
              className={cn(
                'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl',
                isDark
                  ? 'bg-white/[0.02] border-white/10 shadow-black/20'
                  : 'bg-white border-gray-200 shadow-sm'
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
                    'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl mt-6',
                    isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'px-5 py-4 flex items-center justify-between border-b',
                      isDark ? 'border-white/[0.06]' : 'border-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-xl', isDark ? 'bg-indigo-500/10 text-indigo-500' : 'bg-indigo-500/5 text-indigo-500')}>
                        <BarChart2 size={18} />
                      </div>
                      <div>
                        <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Trading Stats by Collection</h3>
                        <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                          Top 15 Collections
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                          <th className="px-5 py-4 text-left">Collection</th>
                          <th className="px-5 py-4 text-right">Volume</th>
                          <th className="px-5 py-4 text-right">P/L</th>
                          <th className="px-5 py-4 text-right">ROI</th>
                          <th className="px-5 py-4 text-right">Trades</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                        {nftCollectionStats.slice(0, 15).map((c) => (
                          <tr
                            key={c.cid}
                            className={cn(
                              'group transition-all duration-300 relative overflow-hidden',
                              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                            )}
                          >
                            <td className="px-5 py-4">
                              <Link
                                href={`/collection/${c.slug}`}
                                className="flex items-center gap-3 group/link"
                              >
                                {c.logo && (
                                  <div className={cn(
                                    'w-8 h-8 rounded-lg p-0.5 border shadow-sm transition-transform group-hover/link:scale-105 flex-shrink-0',
                                    isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                  )}>
                                    <img
                                      src={`https://s1.xrpl.to/nft-collection/${c.logo}`}
                                      alt=""
                                      className="w-full h-full rounded-[4px] object-cover"
                                    />
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    'text-[13px] font-bold group-hover/link:text-primary transition-colors truncate max-w-[150px]',
                                    isDark ? 'text-white' : 'text-gray-900'
                                  )}
                                >
                                  {c.name}
                                </span>
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[12px] font-medium tabular-nums', isDark ? 'text-white/80' : 'text-gray-700')}>
                                {c.volume?.toFixed(1) || 0} XRP
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[12px] font-bold tabular-nums', c.profit >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                {c.profit >= 0 ? '+' : ''}{c.profit?.toFixed(1) || 0}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-md',
                                c.roi >= 0
                                  ? isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'
                                  : isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'
                              )}>
                                {c.roi?.toFixed(1) || 0}%
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className={cn('text-[12px] font-medium tabular-nums', isDark ? 'text-white/60' : 'text-gray-600')}>
                                {c.trades || 0}
                              </div>
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

          {activeTab === 'activity' && (
            <AccountHistory account={account} />
          )}


          {/* Ancestry Tab */}
          {activeTab === 'ancestry' && (
            <div className={cn(
              'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl',
              isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
            )}>
              {ancestryLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className={cn('text-[13px] font-medium animate-pulse', isDark ? 'text-white/40' : 'text-gray-400')}>Loading ancestry tree...</div>
                </div>
              ) : !ancestry ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className={cn('p-4 rounded-full', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                    <GitBranch size={32} className={isDark ? 'text-white/20' : 'text-gray-300'} />
                  </div>
                  <p className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-gray-400')}>No ancestry data available</p>
                </div>
              ) : (
                <>
                  {/* Stats Header */}
                  <div className={cn('px-5 py-4', isDark ? 'border-b border-white/[0.06]' : 'border-b border-gray-100')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-xl', isDark ? 'bg-purple-500/10 text-purple-500' : 'bg-purple-500/5 text-purple-500')}>
                          <GitBranch size={18} />
                        </div>
                        <div>
                          <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Account Ancestry</h3>
                          <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                            Activation Chain & Offspring
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {ancestry.stats?.ancestorDepth > 0 && (
                          <span className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                            <span className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{ancestry.stats.ancestorDepth}</span> generations
                          </span>
                        )}
                        {ancestry.stats?.childrenCount > 0 && (
                          <span className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                            <span className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{ancestry.stats.childrenCount}</span> children
                          </span>
                        )}
                        {ancestry.stats?.tokensCreated > 0 && (
                          <span className={cn('text-[11px] font-medium', isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
                            <span className="font-bold">{ancestry.stats.tokensCreated}</span> tokens created
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
          )
          }

        </div >
      </div >
      <ScrollToTop />
      <Footer />
    </PageWrapper >
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
