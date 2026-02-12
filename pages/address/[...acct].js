import { apiFetch, getWalletAuthHeaders } from 'src/utils/api';
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from 'src/utils/api';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
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
  CheckCircle2,
  Users,
  Swords,
  Medal,
  Gift,
  Crown,
  Award,
  Trophy
} from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import AccountHistory from 'src/components/AccountHistory';
import CryptoJS from 'crypto-js';

// Same wrapper as index.js for consistent width
const PageWrapper = ({ className, ...props }) => (
  <div className={cn('overflow-x-hidden min-h-screen m-0 p-0 flex flex-col bg-[var(--bg-main)]', className)} {...props} />
);

const AccountInfoDetails = ({ accountInfo, isDark, data }) => {
  if (!accountInfo) return null;
  const details = [
    accountInfo.inception && { label: 'Created', value: new Date(accountInfo.inception).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    accountInfo.reserve > 0 && { label: 'Reserve', value: `${accountInfo.reserve} XRP` },
    accountInfo.ownerCount > 0 && { label: 'Obj', value: accountInfo.ownerCount.toLocaleString() },
    accountInfo.domain && { label: 'Domain', value: <a href={`https://${accountInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{accountInfo.domain}</a> },
    accountInfo.parent && { label: 'By', value: <a href={`/address/${accountInfo.parent}`} className="text-primary hover:underline">{`${accountInfo.parent.slice(0, 6)}...`}</a> },
    data?.firstTradeDate && { label: 'First', value: new Date(data.firstTradeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    data?.lastTradeDate && { label: 'Last', value: new Date(data.lastTradeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  ].filter(Boolean);

  if (details.length === 0) return null;

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t text-[10px]',
      isDark ? 'border-white/[0.06]' : 'border-gray-200'
    )}>
      {details.map((d, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className={cn(isDark ? 'text-white/25' : 'text-gray-400')}>{d.label}</span>
          <span className={cn('font-semibold', isDark ? 'text-white/50' : 'text-gray-500')}>{d.value}</span>
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
    <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-0.5 opacity-40', isDark ? 'text-white' : 'text-black')}>
      {label}
    </p>
    <p className={cn('text-[14px] font-black tabular-nums tracking-tight', color)}>
      {value}
    </p>
  </div>
);


// Avatar with NFT tooltip on hover
const AvatarWithTooltip = ({ avatarUrl, nftId, className }) => {
  const { themeName } = useContext(ThemeContext);
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
      const res = await api.get(`https://api.xrpl.to/v1/nft/${nftId}`);
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
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
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
  const TRADING_PERF_LIMIT = 10;
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
  const [displayBadges, setDisplayBadges] = useState({ current: null, available: [] });

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
          return result;
        };
        const [profileRes, holdingsRes, nftRes, balanceRes, liveRes] = await Promise.all([
          timedFetch('traders', () => api.get(`https://api.xrpl.to/v1/traders/${account}?limit=${TRADING_PERF_LIMIT}&offset=0&sortTokensBy=volume`).catch(() => ({ data: null }))),
          timedFetch('trustlines', () => api
            .get(`https://api.xrpl.to/api/trustlines/${account}?format=full&sortByValue=true&includeZero=true&limit=10&offset=0`)
            .catch(() => api.get(`https://api.xrpl.to/api/trustlines/${account}?sortByValue=true&includeZero=true&limit=10&offset=0`))
            .catch(() => ({ data: null }))),
          timedFetch('nft-analytics', () => api
            .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}`)
            .catch(() => ({ data: null }))),
          timedFetch('balance', () => api
            .get(`https://api.xrpl.to/v1/account/balance/${account}`)
            .catch(() => ({ data: null }))),
          timedFetch('account-info', () => api
            .get(`https://api.xrpl.to/v1/account/info/${account}`)
            .catch(() => ({ data: null })))
        ]);

        const profile = profileRes.data || {};
        setData(profile.error ? { ...profile } : profile);
        setHoldings(holdingsRes.data);
        setNftStats(nftRes.data);
        setAccountInfo(balanceRes.data);

        // Fetch rank separately (non-blocking) — only if traders endpoint didn't provide it
        if (!profile.rank) {
          api.get(`https://api.xrpl.to/v1/account/balance/${account}?rank=true`)
            .then(res => {
              if (res.data?.rank) {
                setData(prev => prev ? { ...prev, rank: res.data.rank } : prev);
                setAccountInfo(prev => prev ? { ...prev, rank: res.data.rank } : prev);
              }
            })
            .catch(() => {});
        }

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
        const res = await api.get(`https://api.xrpl.to/api/user/${accountProfile.account}/labels`);
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
        const res = await api.get(`https://api.xrpl.to/api/user/${account}/perks`);
        if (res.data) setUserPerks(res.data);
      } catch (e) { }
    };
    const fetchProfile = async () => {
      try {
        const res = await api.get(`https://api.xrpl.to/api/user/${account}`);
        if (res.data?.success && res.data.user) setUserProfile(res.data.user);
      } catch (e) { }
    };
    const fetchBadges = async () => {
      try {
        const res = await apiFetch(`https://api.xrpl.to/v1/user/${account}/badges`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDisplayBadges({ current: data.current || null, available: Array.isArray(data.available) ? data.available : [] });
        }
      } catch (e) { }
    };
    fetchPerks();
    fetchProfile();
    fetchBadges();
  }, [account]);

  const handleSaveLabel = async () => {
    if (!accountProfile?.account || !labelInput.trim()) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      if (walletLabel) {
        await api.delete(`https://api.xrpl.to/api/user/${accountProfile.account}/labels/${account}`, { headers: authHeaders });
      }
      const res = await api.post(`https://api.xrpl.to/api/user/${accountProfile.account}/labels`, {
        wallet: account,
        label: labelInput.trim()
      }, { headers: authHeaders });
      setWalletLabel(res.data?.label || labelInput.trim());
      setEditingLabel(false);
    } catch (e) { }
    setLabelSaving(false);
  };

  const handleDeleteLabel = async () => {
    if (!accountProfile?.account || !walletLabel) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      await api.delete(`https://api.xrpl.to/api/user/${accountProfile.account}/labels/${account}`, { headers: authHeaders });
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

    api
      .get(`https://api.xrpl.to/api/trustlines/${account}?format=full&sortByValue=true&includeZero=true&limit=10&offset=${holdingsPage * 10}`)
      .then((res) => setHoldings(res.data))
      .catch((err) => console.error('Failed to fetch holdings page:', err));
  }, [holdingsPage]);

  // Fetch trading performance when offset or sort changes
  useEffect(() => {
    if (!account || loading) return;
    const isInitialLoad = tradingPerfOffset === 0 && tradingPerfSort === 'volume';
    if (isInitialLoad) return;

    setTradingPerfLoading(true);
    api
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
    api
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
    api
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
    api
      .get(`https://api.xrpl.to/v1/nft/analytics/trader/${account}/history?limit=365`)
      .then((res) => setNftHistory(res.data?.history || []))
      .catch(() => setNftHistory([]));
  }, [activeTab, account]);

  // Fetch NFTs when a collection is selected
  useEffect(() => {
    if (!selectedNftCollection || !account) return;
    setCollectionNftsLoading(true);
    api
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
    api
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
      const res = await api.get(`https://api.xrpl.to/v1/account-tx-explain/${account}?limit=200`);
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

  // Use position-based win rate from API (profitable tokens / total tokens)
  const winRate = data?.winRate || 0;
  // Use totalPnl (realized + unrealized) when available, fallback to realized
  const totalPnL = data?.totalPnl ?? data?.totalProfit ?? data?.profit ?? 0;
  const realizedPnL = data?.profit ?? 0;
  const unrealizedPnL = data?.unrealizedPnl ?? 0;
  const holdingValue = data?.holdingValue ?? 0;
  const winningTokens = data?.winningTokens ?? data?.winningTrades ?? 0;
  const losingTokens = data?.losingTokens ?? data?.losingTrades ?? 0;
  const totalTokensTraded = data?.totalTokensTraded ?? 0;
  const hasNoTradingData = !data || data.error;

  return (
    <PageWrapper>
      <div className="h-0" id="back-to-top-anchor" />
      <Header />
      {!isMobile && <TokenTabs currentMd5={account} />}
      <h1 className="sr-only">
        {account} Profile on XRPL
      </h1>

      <div className="mx-auto max-w-[1920px] w-full px-4 mt-6 flex-1">
        <div className="flex flex-col">
          <div className="w-full">
            {/* Account Header */}
            <div className={cn('mb-6 p-6 rounded-2xl border-[1.5px]', isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-200 bg-gray-50/50')}>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    {userProfile?.avatar ? (
                      <AvatarWithTooltip
                        avatarUrl={userProfile.avatar}
                        nftId={userProfile.avatarNftId}
                        className="w-24 h-24 rounded-2xl object-cover border border-white/10 cursor-pointer hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-24 h-24 rounded-2xl border flex items-center justify-center',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                        style={{
                          background: isDark
                            ? `linear-gradient(135deg, ${`#${account.slice(2, 8)}`}22, ${`#${account.slice(8, 14)}`}18)`
                            : `linear-gradient(135deg, ${`#${account.slice(2, 8)}`}15, ${`#${account.slice(8, 14)}`}10)`
                        }}
                      >
                        <User size={36} className={isDark ? 'text-white/30' : 'text-gray-300'} strokeWidth={1.5} />
                      </div>
                    )}
                    {userProfile?.tier && (
                      <div className={cn('absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4', isDark ? 'border-[#0a0a0a]' : 'border-white', userProfile.tier === 'verified' ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF]' : userProfile.tier === 'diamond' ? 'bg-violet-500' : userProfile.tier === 'nova' ? 'bg-amber-500' : userProfile.tier === 'vip' ? 'bg-emerald-500' : 'bg-gray-400')} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
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
                        {!accountAI && !accountAILoading && (
                          <button
                            onClick={handleAccountAI}
                            className={cn(
                              'p-2 rounded-xl transition-all hover:scale-105',
                              isDark
                                ? 'bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20'
                                : 'bg-purple-50 text-purple-500 hover:text-purple-600 hover:bg-purple-100'
                            )}
                            title="AI Analysis"
                          >
                            <Sparkles size={15} />
                          </button>
                        )}
                        {accountAILoading && (
                          <div className={cn('p-2 rounded-xl', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}>
                            <div className="w-[15px] h-[15px] border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {isOwnAccount && (
                        <button
                          onClick={() => setOpenWalletModal(true)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-primary text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                        >
                          <Wallet size={12} />
                          Manage
                        </button>
                      )}
                    </div>
                    <AccountInfoDetails accountInfo={accountInfo} isDark={isDark} data={data} />
                    {/* Tier, Rank & Badges */}
                    <div className="flex items-center gap-2.5 flex-wrap mt-2">
                      {(userPerks?.groups?.length > 0 || userProfile?.armyRank || typeof data?.washTradingScore === 'number' || data?.isAMM || isBlackholed) && (
                        <span className={cn('text-[10px] uppercase font-bold tracking-widest', isDark ? 'text-white/20' : 'text-gray-300')}>Tier</span>
                      )}
                      {typeof data?.washTradingScore === 'number' && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border',
                            data.washTradingScore > 50
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : isDark
                                ? 'bg-white/[0.03] text-white/50 border-white/10'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                          )}
                          title="Wash Trading Score"
                        >
                          {data.washTradingScore > 50 && <AlertTriangle size={11} className="animate-pulse" />}
                          <span>Wash {data.washTradingScore}</span>
                        </div>
                      )}
                      {data?.isAMM && (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold flex items-center">
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
                          <div key={group} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border', config.bg, config.border)}>
                            {Icon && <Icon size={11} className={config.gradient ? 'text-[#FFD700]' : ''} style={!config.gradient ? { color: 'inherit' } : {}} />}
                            <span className={config.text}>{group.charAt(0).toUpperCase() + group.slice(1)}</span>
                          </div>
                        );
                      })}
                      {userProfile?.armyRank && (() => {
                        const rankConfig = {
                          recruit: { icon: Swords, color: 'text-amber-700', bg: 'bg-amber-800/10', border: 'border-amber-700/20' },
                          private: { icon: Shield, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                          corporal: { icon: Shield, color: 'text-[#137DFE]', bg: 'bg-[#137DFE]/10', border: 'border-[#137DFE]/20' },
                          sergeant: { icon: Star, color: 'text-[#08AA09]', bg: 'bg-[#08AA09]/10', border: 'border-[#08AA09]/20' },
                          lieutenant: { icon: Star, color: 'text-[#F6AF01]', bg: 'bg-[#F6AF01]/10', border: 'border-[#F6AF01]/20' },
                          captain: { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                          major: { icon: Award, color: 'text-[#a855f7]', bg: 'bg-[#650CD4]/10', border: 'border-[#650CD4]/20' },
                          colonel: { icon: Crown, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                          general: { icon: Crown, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/20' }
                        };
                        const key = userProfile.armyRank.toLowerCase();
                        const rc = rankConfig[key] || rankConfig.recruit;
                        const RankIcon = rc.icon;
                        return (
                          <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border', rc.bg, rc.border)}>
                            <RankIcon size={11} className={rc.color} />
                            <span className={rc.color}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                          </div>
                        );
                      })()}
                      {isBlackholed && (
                        <div className="relative group/blackhole">
                          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center cursor-help">
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
                      {/* Divider */}
                      {(userPerks?.groups?.length > 0 || userProfile?.armyRank || typeof data?.washTradingScore === 'number' || data?.isAMM || isBlackholed) && displayBadges.available.filter(b => b.startsWith('badge:')).length > 0 && (
                        <span className={cn('text-[14px] font-thin select-none', isDark ? 'text-white/10' : 'text-gray-200')}>|</span>
                      )}
                      {/* Badges */}
                      {displayBadges.available.filter(b => b.startsWith('badge:')).length > 0 && (
                        <span className={cn('text-[10px] uppercase font-bold tracking-widest', isDark ? 'text-white/20' : 'text-gray-300')}>Badges</span>
                      )}
                      {displayBadges.available.filter(b => b.startsWith('badge:')).map(badgeId => {
                        const name = badgeId.split(':')[1];
                        const badgeConfig = { first_recruit: { icon: Users, color: '#137DFE', label: 'First Recruit' }, squad_leader: { icon: Swords, color: '#F6AF01', label: 'Squad Leader' }, early_adopter: { icon: Zap, color: '#08AA09', label: 'Early Adopter' }, top_trader: { icon: TrendingUp, color: '#137DFE', label: 'Top Trader' }, whale: { icon: Gem, color: '#a855f7', label: 'Whale' }, og: { icon: Medal, color: '#F6AF01', label: 'OG' }, contributor: { icon: Gift, color: '#08AA09', label: 'Contributor' }, army_general: { icon: Crown, color: '#a855f7', label: 'Army General' } };
                        const defaultCfg = { icon: Award, color: isDark ? '#666' : '#999' };
                        const config = badgeConfig[name] || defaultCfg;
                        const Icon = config.icon;
                        return (
                          <span key={badgeId} className={cn('flex items-center gap-1 text-[10px] font-medium', isDark ? 'text-white/50' : 'text-gray-500')}>
                            {Icon && <Icon size={11} style={{ color: config.color }} />}
                            <span>{config.label || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Key Stats - fill remaining space on desktop */}
                  {(data || nftStats || holdings) && (
                    <div className="hidden lg:grid grid-cols-4 gap-3 flex-1">
                      <div className={cn('p-4 rounded-xl border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                        <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-1.5', isDark ? 'text-white/30' : 'text-gray-400')}>Balance</p>
                        <p className={cn('text-[20px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5(holdings?.accountData?.total || holdings?.xrp?.value || 0)}</p>
                        <p className={cn('text-[10px] mt-1.5 font-medium', isDark ? 'text-white/25' : 'text-gray-400')}>{accountInfo?.rank ? `#${accountInfo.rank.toLocaleString()} Rank` : 'XRP'}</p>
                      </div>
                      <div className={cn('p-4 rounded-xl border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                        <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-1.5', isDark ? 'text-white/30' : 'text-gray-400')}>Total P&L</p>
                        <p className={cn('text-[20px] font-black tabular-nums tracking-tight leading-none', totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? '+' : ''}{fCurrency5(totalPnL + (nftStats?.combinedProfit || 0))}</p>
                        <p className={cn('text-[10px] mt-1.5 font-medium', isDark ? 'text-white/25' : 'text-gray-400')}>{data?.totalRoi != null ? `${data.totalRoi >= 0 ? '+' : ''}${data.totalRoi.toFixed(1)}% ROI` : 'XRP'}</p>
                      </div>
                      <div className={cn('p-4 rounded-xl border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                        <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-1.5', isDark ? 'text-white/30' : 'text-gray-400')}>Trades</p>
                        <p className={cn('text-[20px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}</p>
                        <p className={cn('text-[10px] mt-1.5 font-medium', isDark ? 'text-white/25' : 'text-gray-400')}>{totalTokensTraded > 0 ? `${winningTokens}W / ${losingTokens}L` : 'Total'}</p>
                      </div>
                      <div className={cn('p-4 rounded-xl border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                        <p className={cn('text-[9px] uppercase font-bold tracking-widest mb-1.5', isDark ? 'text-white/30' : 'text-gray-400')}>Volume</p>
                        <p className={cn('text-[20px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5((data?.dexVolume || 0) + (data?.ammVolume || 0) + (nftStats?.totalVolume || 0))}</p>
                        <p className={cn('text-[10px] mt-1.5 font-medium', isDark ? 'text-white/25' : 'text-gray-400')}>XRP</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Mobile Stats */}
                {(data || nftStats || holdings) && (
                  <div className={cn('grid grid-cols-4 gap-2 lg:hidden')}>
                    <div className={cn('p-2.5 rounded-lg border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                      <p className={cn('text-[8px] uppercase font-bold tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>Balance</p>
                      <p className={cn('text-[14px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5(holdings?.accountData?.total || holdings?.xrp?.value || 0)}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-lg border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                      <p className={cn('text-[8px] uppercase font-bold tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>P&L</p>
                      <p className={cn('text-[14px] font-black tabular-nums tracking-tight leading-none', totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{totalPnL + (nftStats?.combinedProfit || 0) >= 0 ? '+' : ''}{fCurrency5(totalPnL + (nftStats?.combinedProfit || 0))}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-lg border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                      <p className={cn('text-[8px] uppercase font-bold tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>Trades</p>
                      <p className={cn('text-[14px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-lg border text-center', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50/50 border-gray-100')}>
                      <p className={cn('text-[8px] uppercase font-bold tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>Volume</p>
                      <p className={cn('text-[14px] font-black tabular-nums tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>{fCurrency5((data?.dexVolume || 0) + (data?.ammVolume || 0) + (nftStats?.totalVolume || 0))}</p>
                    </div>
                  </div>
                )}
              </div>
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

            {/* Two-column trading breakdown */}
            {(data || nftStats) && (
              <div className={cn('grid md:grid-cols-2 gap-4 mb-6')}>
                {/* Token Trading */}
                <div
                  className={cn(
                    'p-4 rounded-2xl border transition-all duration-300 h-full flex flex-col relative overflow-hidden',
                    isDark ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  {/* Background Accent */}
                  <div className={cn('absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20', isDark ? 'bg-[#137DFE]' : 'bg-blue-400')} />
                  {data && !data.error ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center',
                              isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                            )}
                          >
                            <Coins size={14} className="text-emerald-500" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                'text-[11px] font-bold tracking-tight',
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
                      <div className="flex items-center justify-around mb-2.5 py-1.5">
                        <TradingStat label="Realized" value={`${realizedPnL >= 0 ? '+' : ''}${fCurrency5(realizedPnL)}`} color={realizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="Unrealized" value={`${unrealizedPnL >= 0 ? '+' : ''}${fCurrency5(unrealizedPnL)}`} color={unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="ROI" value={`${((data.totalRoi ?? data.roi) || 0).toFixed(1)}%`} color={((data.totalRoi ?? data.roi) || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                      </div>
                      {/* Token Win Rate bar */}
                      {totalTokensTraded > 0 && (
                        <div className={cn('mb-3 px-1')}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={cn('text-[9px] font-bold uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-black')}>Token Win Rate</span>
                            <span className={cn('text-[10px] font-bold tabular-nums', isDark ? 'text-white/70' : 'text-gray-600')}>
                              {winningTokens}W / {losingTokens}L{totalTokensTraded - winningTokens - losingTokens > 0 ? ` / ${totalTokensTraded - winningTokens - losingTokens}BE` : ''}
                            </span>
                          </div>
                          <div className={cn('h-1.5 rounded-full overflow-hidden flex', isDark ? 'bg-white/[0.06]' : 'bg-gray-100')}>
                            {winningTokens > 0 && (
                              <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${(winningTokens / totalTokensTraded) * 100}%` }} />
                            )}
                            {losingTokens > 0 && (
                              <div className="bg-red-500 h-full rounded-r-full" style={{ width: `${(losingTokens / totalTokensTraded) * 100}%` }} />
                            )}
                          </div>
                        </div>
                      )}
                      {/* Holding value row */}
                      {holdingValue > 0 && (
                        <div className={cn(
                          'flex items-center justify-between py-2 px-1 text-[10px] font-bold',
                          isDark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'
                        )}>
                          <span className="opacity-40">Holding Value</span>
                          <span className={cn('tabular-nums', isDark ? 'text-[#137DFE]' : 'text-blue-600')}>
                            {fCurrency5(holdingValue)} XRP
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          'flex items-center justify-between pt-2.5 text-[10px] mt-auto font-bold',
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
                            { label: '30D', value: data.profit30d || 0 },
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
                    <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
                      <div
                        className={cn(
                          'w-10 h-10 mb-2 rounded-xl flex items-center justify-center',
                          isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                        )}
                      >
                        <Coins size={18} className={isDark ? 'text-emerald-500/40' : 'text-emerald-400'} />
                      </div>
                      <p className={cn('text-[11px] font-bold tracking-tight mb-0.5', isDark ? 'text-white/70' : 'text-gray-700')}>No Token activity</p>
                      <p className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Trading data will appear here</p>
                    </div>
                  )}
                </div>

                {/* NFT Trading */}
                <div
                  className={cn(
                    'p-4 rounded-2xl border transition-all duration-300 h-full flex flex-col relative overflow-hidden',
                    isDark ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
                  )}
                >
                  {/* Background Accent */}
                  <div className={cn('absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20', isDark ? 'bg-[#137DFE]' : 'bg-blue-400')} />
                  {nftStats && (nftStats.totalVolume > 0 || nftStats.holdingsCount > 0) ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center',
                              isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                            )}
                          >
                            <Image size={14} className="text-indigo-500" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                'text-[11px] font-bold tracking-tight',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              NFT Performance
                            </span>
                            <div className="flex items-center gap-1.5">
                              <p className={cn('text-[9px] font-medium opacity-50 block', isDark ? 'text-white' : 'text-gray-500')}>
                                {fCurrency5(nftStats.totalVolume || 0)} XRP vol
                              </p>
                              {nftStats.holdingsCount > 0 && (
                                <span className={cn('px-1 py-px rounded text-[8px] font-bold uppercase tracking-wider', isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700')}>
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
                            {nftStats.buyCount || 0}B
                          </span>
                          <span className="opacity-20">/</span>
                          <span className="text-red-500">
                            {nftStats.sellCount || 0}S
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-around mb-2.5 py-1.5">
                        <TradingStat label="Realized P&L" value={`${(nftStats.profit || 0) >= 0 ? '+' : ''}${fCurrency5(nftStats.profit || 0)}`} color={(nftStats.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="Unrealized" value={`${(nftStats.unrealizedProfit || 0) >= 0 ? '+' : ''}${fCurrency5(nftStats.unrealizedProfit || 0)}`} color={(nftStats.unrealizedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-amber-500'} isDark={isDark} />
                        <div className={cn('w-px h-7', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                        <TradingStat label="ROI" value={`${(nftStats.roi || 0) >= 0 ? '+' : ''}${(nftStats.roi || 0).toFixed(1)}%`} color={(nftStats.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} isDark={isDark} />
                      </div>
                      <div
                        className={cn(
                          'flex items-center justify-between pt-2.5 text-[10px] mt-auto font-bold',
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
                              {(() => {
                                if (nftStats.avgHoldingDays > 0) return `${nftStats.avgHoldingDays.toFixed(0)}d`;
                                if (nftStats.holdingsCount > 0 && nftStats.firstTrade) {
                                  const days = Math.max(1, Math.floor((Date.now() - nftStats.firstTrade) / 86400000));
                                  return `~${days}d`;
                                }
                                return '0d';
                              })()}
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
                    <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
                      <div
                        className={cn(
                          'w-10 h-10 mb-2 rounded-xl flex items-center justify-center',
                          isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                        )}
                      >
                        <Image size={18} className={isDark ? 'text-indigo-500/40' : 'text-indigo-400'} />
                      </div>
                      <p className={cn('text-[11px] font-bold tracking-tight mb-0.5', isDark ? 'text-white/70' : 'text-gray-700')}>No NFT activity</p>
                      <p className={cn('text-[9px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Marketplace data will appear here</p>
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
                        'rounded-xl overflow-hidden transition-all duration-300',
                        isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
                      )}
                    >
                      <div
                        className={cn(
                          'px-4 py-2.5 flex items-center justify-between border-b',
                          isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet size={13} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                          <div className="flex items-center gap-1.5">
                            <p className={cn('text-[10px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Token Portfolio</p>
                              {zeroCount > 0 && (
                                <button
                                  onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                                  className={cn(
                                    'text-[9px] px-1.5 py-px rounded-full transition-all duration-200 font-bold uppercase tracking-wider',
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
                            <span className={cn('text-[9px] px-1.5 py-px rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>
                              {(holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)}
                            </span>
                          </div>
                        </div>
                        {(totalValue > 0 || (holdings.accountData?.total > 0 || holdings.xrp?.value > 0)) && (
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className={cn('text-[14px] font-black tabular-nums tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>
                                {fCurrency5(totalValue + (holdings.accountData?.total || holdings.xrp?.value || 0))}
                              </span>
                              <span className={cn('text-[9px] font-bold opacity-40', isDark ? 'text-white' : 'text-gray-500')}>XRP</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        {(filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? (
                          <table className="w-full">
                            <thead>
                              <tr className={cn('text-[9px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                <th className="px-4 py-2 text-left">Asset</th>
                                <th className="px-4 py-2 text-right">Balance</th>
                                <th className="px-4 py-2 text-right">Value (XRP)</th>
                                <th className="px-4 py-2 text-right font-medium">Price</th>
                                <th className="px-4 py-2 text-right">24H</th>
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
                                  <td className="px-4 py-2.5">
                                    <Link href="/token/xrpl-xrp" className="flex items-center gap-2.5">
                                      <div className={cn(
                                        'w-7 h-7 rounded-xl p-0.5 border transition-transform group-hover:scale-105 flex-shrink-0',
                                        isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                      )}>
                                        <img
                                          src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                                          className="w-full h-full object-contain rounded-lg"
                                          alt="XRP"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className={cn('text-[12px] font-bold group-hover:text-primary transition-colors', isDark ? 'text-white' : 'text-gray-900')}>XRP</span>
                                        <span className={cn('text-[8px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Native Asset</span>
                                      </div>
                                    </Link>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                      {fCurrency5(holdings.accountData?.total || holdings.xrp.value)}
                                    </div>
                                    {holdings.accountData?.reserve > 0 && (
                                      <div className={cn('text-[8px] font-medium opacity-40 tabular-nums')}>
                                        {fCurrency5(holdings.xrp.value)} Available
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className={cn('text-[12px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                      {xrpPrice
                                        ? `$${fCurrency5((holdings.accountData?.total || holdings.xrp.value) * xrpPrice)}`
                                        : `${fCurrency5(holdings.accountData?.total || holdings.xrp.value)} XRP`}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className={cn('text-[11px] font-medium tabular-nums opacity-50')}>
                                      {xrpPrice ? `$${parseFloat(xrpPrice).toFixed(4)}` : '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className={cn('text-[11px] font-bold tabular-nums', (holdings?.xrp?.pro24h || 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
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
                                    <td className="px-4 py-2.5">
                                      <Link href={`/token/${line.token?.md5}`} className="flex items-center gap-2.5">
                                        <div className={cn(
                                          'w-7 h-7 rounded-xl p-0.5 border transition-transform group-hover:scale-105 flex-shrink-0',
                                          isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                        )}>
                                          <img
                                            src={`https://s1.xrpl.to/token/${line.token?.md5}`}
                                            className="w-full h-full object-contain rounded-lg"
                                            onError={(e) => { e.target.src = 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8'; }}
                                            alt=""
                                          />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1">
                                            <span className={cn('text-[12px] font-bold group-hover:text-primary transition-colors truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                              {line.token?.name || line.currency}
                                            </span>
                                            {line.token?.verified >= 1 && (
                                              <CheckCircle2 size={11} className="text-primary" />
                                            )}
                                          </div>
                                          {pctOwned > 0.01 && (
                                            <span className={cn('text-[8px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                              {pctOwned.toFixed(2)}% Supply
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <div className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                        {fCurrency5(Math.abs(parseFloat(line.balance)))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <div className={cn('text-[12px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                        {fCurrency5(line.value)} XRP
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className={cn('text-[11px] font-medium tabular-nums opacity-50')}>
                                        {priceInXrp ? `${fCurrency5(priceInXrp)}` : '—'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className={cn('text-[11px] font-bold tabular-nums', change24h >= 0 ? 'text-emerald-500' : 'text-red-500')}>
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
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className={
                              cn(
                                'w-14 h-14 rounded-2xl flex items-center justify-center mb-3',
                                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
                              )}>
                              <Search size={24} className={cn('opacity-30', isDark ? 'text-white' : 'text-gray-400')} />
                            </div>
                            <h4 className={cn('text-[14px] font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-gray-900')}>No Tokens Found</h4>
                            <p className={cn('text-[11px] font-medium opacity-50 max-w-[280px] leading-relaxed mx-auto', isDark ? 'text-white' : 'text-gray-600')}>
                              Try adjusting your search or "Hide empty" settings.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {
                        (filteredLines.length > 0 || holdings.accountData?.total > 0 || holdings.xrp?.value > 0) && (
                          <div
                            className={cn(
                              'flex items-center justify-between px-4 py-2 border-t',
                              isDark ? 'border-white/[0.06]' : 'border-gray-50'
                            )}
                          >
                            <p className={cn('text-[9px] font-bold opacity-30 uppercase tracking-widest', isDark ? 'text-white' : 'text-gray-500')}>
                              Page {holdingsPage + 1} of {Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 10)}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))}
                                disabled={holdingsPage === 0}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                                  holdingsPage === 0
                                    ? 'opacity-20 cursor-not-allowed'
                                    : isDark
                                      ? 'bg-white/5 text-white hover:bg-white/10'
                                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                )}
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <button
                                onClick={() => setHoldingsPage(holdingsPage + 1)}
                                disabled={holdingsPage >= Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 10) - 1}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                                  holdingsPage >= Math.ceil(((holdings.total || holdings.lines?.length || 0) + ((holdings.accountData?.total > 0 || holdings.xrp?.value > 0) ? 1 : 0)) / 10) - 1
                                    ? 'opacity-20 cursor-not-allowed'
                                    : isDark
                                      ? 'bg-white/5 text-white hover:bg-white/10'
                                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                )}
                              >
                                <ChevronRight size={14} />
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
                    'rounded-xl overflow-hidden transition-all duration-300 mb-6',
                    isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-2.5 flex items-center justify-between border-b',
                      isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={13} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                      <p className={cn('text-[10px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Issued Tokens</p>
                      <span className={cn('text-[9px] px-1.5 py-px rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>{holdings.issued.length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn('text-[9px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                          <th className="px-4 py-2 text-left">Token</th>
                          <th className="px-4 py-2 text-right">Supply</th>
                          <th className="px-4 py-2 text-right">Holders</th>
                          <th className="px-4 py-2 text-right">Market Cap</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                        {holdings.issued.map((token, idx) => (
                          <tr
                            key={idx}
                            className={cn(
                              'group transition-all duration-200 relative overflow-hidden',
                              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                            )}
                          >
                            <td className="px-4 py-2.5">
                              <Link href={`/token/${token.md5}`} className="flex items-center gap-2.5">
                                <div className={cn(
                                  'w-7 h-7 rounded-xl p-0.5 border transition-transform group-hover:scale-105 flex-shrink-0',
                                  isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'
                                )}>
                                  <img
                                    src={`https://s1.xrpl.to/token/${token.md5}`}
                                    className="w-full h-full object-contain rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    alt=""
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className={cn('text-[12px] font-bold group-hover:text-primary transition-colors truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                    {token.name || token.currency}
                                  </span>
                                  <span className={cn('text-[8px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                    {token.user || 'Unknown User'}
                                  </span>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                {fCurrency5(parseFloat(token.supply))}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
                                {token.holders?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className={cn('text-[12px] font-black tabular-nums tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
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
                        'rounded-xl overflow-hidden transition-all duration-300 mb-6',
                        isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
                      )}
                    >
                      <div
                        className={cn(
                          'px-4 py-2 flex items-center justify-between border-b gap-2 flex-wrap',
                          isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp size={13} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                          <p className={cn('text-[10px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Trading Performance</p>
                          <span className={cn('text-[9px] px-1.5 py-px rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>{totalCount}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={tradingPerfSort}
                            onChange={(e) => {
                              setTradingPerfSort(e.target.value);
                              setTradingPerfOffset(0);
                            }}
                            className={cn(
                              'text-[10px] px-2 py-1.5 rounded-lg border-none outline-none cursor-pointer font-bold',
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
                              'flex items-center rounded-lg overflow-hidden px-2',
                              isDark ? 'bg-white/[0.04]' : 'bg-gray-100'
                            )}
                          >
                            <Search size={12} className="opacity-30" />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={tokenSearch}
                              onChange={(e) => setTokenSearch(e.target.value)}
                              className={cn(
                                'text-[10px] px-1.5 py-1.5 bg-transparent border-none outline-none w-24 font-medium',
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
                            <tr className={cn('text-[9px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                              <th className="px-4 py-2 text-left">Token</th>
                              <th className="px-2 py-2 text-right">Volume</th>
                              <th className="px-2 py-2 text-right">Trades</th>
                              <th className="px-2 py-2 text-right text-emerald-500/80">Bought</th>
                              <th className="px-2 py-2 text-right text-red-500/80">Sold</th>
                              <th className="px-2 py-2 text-right text-blue-500/80">Held</th>
                              <th className="px-2 py-2 text-right">ROI</th>
                              <th className="px-2 py-2 text-right">PNL</th>
                              <th className="px-2 py-2 text-right pr-4">Period</th>
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
                                  <td className="px-4 py-2">
                                    <Link
                                      href={`/token/${token.tokenId}`}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={cn(
                                          'w-7 h-7 rounded-xl p-0.5 border transition-transform group-hover:scale-105 flex-shrink-0',
                                          isDark
                                            ? 'bg-black border-white/10'
                                            : 'bg-white border-gray-100'
                                        )}
                                      >
                                        <img
                                          src={`https://s1.xrpl.to/token/${token.tokenId}`}
                                          className="w-full h-full object-contain rounded-lg"
                                          onError={(e) => {
                                            e.target.parentElement.style.display = 'none';
                                          }}
                                          alt=""
                                        />
                                      </div>
                                      <span
                                        className={cn(
                                          'text-[12px] font-bold group-hover:text-primary transition-colors',
                                          isDark ? 'text-white' : 'text-gray-900'
                                        )}
                                      >
                                        {token.name}
                                      </span>
                                    </Link>
                                  </td>
                                  <td
                                    className={cn(
                                      'px-2 py-2 text-right text-[11px] font-medium tabular-nums',
                                      isDark ? 'text-white/60' : 'text-gray-600'
                                    )}
                                  >
                                    {fCurrency5(token.volume || 0)}
                                  </td>
                                  <td
                                    className={cn(
                                      'px-2 py-2 text-right text-[11px] font-medium tabular-nums',
                                      isDark ? 'text-white/60' : 'text-gray-600'
                                    )}
                                  >
                                    {fCurrency5(token.trades || 0)}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <span className="text-[11px] tabular-nums font-medium text-emerald-500">
                                      {fCurrency5(bought)}
                                    </span>
                                    {token.avgBuyPrice > 0 && (
                                      <div
                                        className={cn(
                                          'text-[8px]',
                                          isDark ? 'text-white/20' : 'text-gray-400'
                                        )}
                                      >
                                        @{token.avgBuyPrice < 0.001
                                          ? token.avgBuyPrice.toExponential(1)
                                          : fCurrency5(token.avgBuyPrice)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <span className="text-[11px] tabular-nums font-medium text-red-500">
                                      {fCurrency5(sold)}
                                    </span>
                                    {token.avgSellPrice > 0 && (
                                      <div
                                        className={cn(
                                          'text-[8px]',
                                          isDark ? 'text-white/20' : 'text-gray-400'
                                        )}
                                      >
                                        @{token.avgSellPrice < 0.001
                                          ? token.avgSellPrice.toExponential(1)
                                          : fCurrency5(token.avgSellPrice)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    {holdingValue > 0 ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[11px] tabular-nums font-medium text-blue-500">
                                          {fCurrency5(holdingValue)}
                                        </span>
                                        {unrealizedPnl !== 0 && (
                                          <span
                                            className={cn(
                                              'text-[8px] tabular-nums font-bold',
                                              unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                                            )}
                                          >
                                            {unrealizedPnl >= 0 ? '+' : ''}{fCurrency5(unrealizedPnl)}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={cn('text-[11px] opacity-20', isDark ? 'text-white' : 'text-black')}>—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <span
                                      className={cn(
                                        'text-[10px] tabular-nums font-bold px-1.5 py-px rounded',
                                        roi >= 0
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : 'bg-red-500/10 text-red-500'
                                      )}
                                    >
                                      {roi >= 0 ? '+' : ''}
                                      {roi.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <span
                                      className={cn(
                                        'text-[11px] font-bold tabular-nums',
                                        profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                                      )}
                                    >
                                      {profit >= 0 ? '+' : ''}
                                      {fCurrency5(profit)}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 pr-4 text-right">
                                    <div className="flex flex-col items-end">
                                      <span
                                        className={cn(
                                          'text-[9px] tabular-nums font-medium opacity-60',
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
                                          <span className={cn('text-[8px] opacity-30', isDark ? 'text-white' : 'text-black')}>
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
                'rounded-xl overflow-hidden transition-all duration-300',
                isDark
                  ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                  : 'bg-white border border-gray-200'
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
                    <Link
                      href={`/nfts/${selectedNftCollection.slug}`}
                      className={cn(
                        'text-[13px] font-medium hover:underline',
                        isDark ? 'text-white/90' : 'text-gray-900'
                      )}
                    >
                      {selectedNftCollection.name}
                    </Link>
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
                          <Link
                            href={`/nfts/${col.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'text-[12px] font-medium truncate block hover:underline',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {col.name}
                          </Link>
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

              {/* NFT Trading Activity */}
              {nftHistory.length > 0 && !selectedNftCollection && (
                <div
                  className={cn(
                    'rounded-xl border mt-4 overflow-hidden',
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-gray-200'
                  )}
                >
                  {(() => {
                    const totalBuyVol = nftHistory.reduce((s, d) => s + (d.buyVolume || 0), 0);
                    const totalSellVol = nftHistory.reduce((s, d) => s + (d.sellVolume || 0), 0);
                    const totalTrades = nftHistory.reduce((s, d) => s + (d.trades || 0), 0);
                    const totalProfit = nftHistory.reduce((s, d) => s + (d.profit || 0), 0);
                    const maxVol = Math.max(...nftHistory.map(d => d.volume || 0), 1);
                    const sorted = [...nftHistory].sort((a, b) => b.date.localeCompare(a.date));
                    return (
                      <>
                        {/* Header */}
                        <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/[0.06]' : 'border-gray-100')}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BarChart2 size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                              <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>
                                Trading Activity
                              </p>
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold', isDark ? 'bg-white/5 text-white/30 border border-white/[0.08]' : 'bg-gray-100 text-gray-400')}>
                                30d
                              </span>
                            </div>
                          </div>
                          {/* Summary stats */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 flex items-center gap-3">
                              <div className={cn('flex flex-col items-center px-3 py-2 rounded-lg flex-1', isDark ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50')}>
                                <span className={cn('text-[9px] font-medium uppercase tracking-wider mb-1', isDark ? 'text-emerald-500/50' : 'text-emerald-600/50')}>Bought</span>
                                <span className="text-[14px] font-black tabular-nums text-emerald-500">{fCurrency5(totalBuyVol)}</span>
                                <span className={cn('text-[9px] tabular-nums', isDark ? 'text-emerald-500/40' : 'text-emerald-600/40')}>XRP</span>
                              </div>
                              <div className={cn('flex flex-col items-center px-3 py-2 rounded-lg flex-1', isDark ? 'bg-red-500/[0.06]' : 'bg-red-50')}>
                                <span className={cn('text-[9px] font-medium uppercase tracking-wider mb-1', isDark ? 'text-red-500/50' : 'text-red-600/50')}>Sold</span>
                                <span className="text-[14px] font-black tabular-nums text-red-500">{fCurrency5(totalSellVol)}</span>
                                <span className={cn('text-[9px] tabular-nums', isDark ? 'text-red-500/40' : 'text-red-600/40')}>XRP</span>
                              </div>
                              <div className={cn('flex flex-col items-center px-3 py-2 rounded-lg flex-1', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
                                <span className={cn('text-[9px] font-medium uppercase tracking-wider mb-1 opacity-40', isDark ? 'text-white' : 'text-gray-500')}>Trades</span>
                                <span className={cn('text-[14px] font-black tabular-nums', isDark ? 'text-white/80' : 'text-gray-900')}>{totalTrades}</span>
                                <span className={cn('text-[9px] tabular-nums opacity-30', isDark ? 'text-white' : 'text-gray-500')}>{sorted.length} day{sorted.length !== 1 ? 's' : ''}</span>
                              </div>
                              {totalProfit !== 0 && (
                                <div className={cn('flex flex-col items-center px-3 py-2 rounded-lg flex-1', totalProfit >= 0 ? (isDark ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50') : (isDark ? 'bg-red-500/[0.06]' : 'bg-red-50'))}>
                                  <span className={cn('text-[9px] font-medium uppercase tracking-wider mb-1 opacity-50', totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500')}>P&L</span>
                                  <span className={cn('text-[14px] font-black tabular-nums', totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500')}>{totalProfit >= 0 ? '+' : ''}{fCurrency5(totalProfit)}</span>
                                  <span className={cn('text-[9px] tabular-nums opacity-40', totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500')}>XRP</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Activity feed */}
                        <div className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                          {sorted.map((d) => {
                            const pct = (d.volume / maxVol) * 100;
                            const buyPct = d.volume > 0 ? (d.buyVolume / d.volume) * 100 : 0;
                            const daysAgo = Math.floor((Date.now() - new Date(d.date).getTime()) / 86400000);
                            const dayLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
                            return (
                              <div key={d.date} className={cn('px-4 py-3 flex items-center gap-4', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/50')}>
                                {/* Date */}
                                <div className="w-[72px] flex-shrink-0">
                                  <p className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/80' : 'text-gray-800')}>
                                    {d.date.slice(5)}
                                  </p>
                                  <p className={cn('text-[9px] font-medium', isDark ? 'text-white/25' : 'text-gray-300')}>
                                    {dayLabel}
                                  </p>
                                </div>
                                {/* Volume bar */}
                                <div className="flex-1 min-w-0">
                                  <div className={cn('w-full h-[20px] rounded-md overflow-hidden flex', isDark ? 'bg-white/[0.03]' : 'bg-gray-100/50')}>
                                    <div className="h-full flex rounded-md overflow-hidden" style={{ width: `${Math.max(pct, 8)}%` }}>
                                      {d.buyVolume > 0 && (
                                        <div className="h-full bg-emerald-500/70" style={{ width: `${buyPct}%` }} />
                                      )}
                                      {d.sellVolume > 0 && (
                                        <div className="h-full bg-red-500/70" style={{ width: `${100 - buyPct}%` }} />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Details */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {d.buyVolume > 0 && (
                                    <span className="text-[11px] font-bold tabular-nums text-emerald-500">
                                      +{fCurrency5(d.buyVolume)}
                                    </span>
                                  )}
                                  {d.sellVolume > 0 && (
                                    <span className="text-[11px] font-bold tabular-nums text-red-500">
                                      -{fCurrency5(d.sellVolume)}
                                    </span>
                                  )}
                                  <span className={cn('text-[10px] tabular-nums font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>
                                    {d.trades} trade{d.trades !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Collection Trading Stats */}
              {nftCollectionStats.length > 0 && !selectedNftCollection && (
                <div
                  className={cn(
                    'rounded-xl overflow-hidden transition-all duration-300 mt-6',
                    isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-3 flex items-center justify-between border-b',
                      isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                      <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Trading Stats by Collection</p>
                      <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>{nftCollectionStats.length}</span>
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
              'rounded-xl overflow-hidden transition-all duration-300',
              isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
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
                  <div className={cn('px-4 py-3', isDark ? 'border-b border-white/[0.08]' : 'border-b border-gray-100')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Account Ancestry</p>
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
