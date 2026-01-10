import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { AppContext } from 'src/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { withdrawalStorage } from 'src/utils/withdrawalStorage';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import {
  Send, ArrowDownLeft, ArrowUpRight, Copy, Check,
  Wallet, Image, RotateCcw, TrendingUp, Building2,
  ChevronRight, ExternalLink, ArrowRightLeft, ChevronDown,
  Search, Eye, EyeOff, Plus, Trash2, X, Star, Coins
} from 'lucide-react';
import Link from 'next/link';

const BASE_URL = 'https://api.xrpl.to';

export default function WalletPage() {
  const router = useRouter();
  const { tab: initialTab } = router.query;
  const { themeName, accountProfile, setOpenWalletModal, activeFiatCurrency } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics?.[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics?.CNY : null) || 1;
  const currencySymbols = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };
  const accountLogin = accountProfile?.account;
  const address = accountLogin;

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (initialTab === 'send') {
      setShowPanel('send');
      setActiveTab('overview');
      // Clear the query param after opening panel
      router.replace('/wallet', undefined, { shallow: true });
    } else if (initialTab === 'receive') {
      setShowPanel('receive');
      setActiveTab('overview');
      // Clear the query param after opening panel
      router.replace('/wallet', undefined, { shallow: true });
    } else if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle tab switching - clears query param if present
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear any send/receive query params when switching tabs
    if (router.query.tab) {
      router.replace('/wallet', undefined, { shallow: true });
    }
  };

  // Form state - declare before restore effect
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendTag, setSendTag] = useState('');
  const [selectedToken, setSelectedToken] = useState('XRP');
  const [showPanel, setShowPanel] = useState(null); // 'send' | 'receive' | null
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tokenSort, setTokenSort] = useState('value');
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [tokenPage, setTokenPage] = useState(1);
  const tokensPerPage = 20;

  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [nftToTransfer, setNftToTransfer] = useState(null);
  const [nftRecipient, setNftRecipient] = useState('');
  const [nftToSell, setNftToSell] = useState(null);
  const [nftSellPrice, setNftSellPrice] = useState('');

  // Tokens state
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [xrpData, setXrpData] = useState(null);

  // NFTs state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [nftPortfolioValue, setNftPortfolioValue] = useState(0);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Offers state
  const [tokenOffers, setTokenOffers] = useState([]);
  const [nftOffers, setNftOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Withdrawal addresses state
  const [withdrawals, setWithdrawals] = useState([]);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({ name: '', address: '', tag: '' });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');

  // Debug info state
  const [debugInfo, setDebugInfo] = useState(null);

  // Account status
  const [isInactive, setIsInactive] = useState(false);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      let walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.provider && accountProfile.provider_id ? `${accountProfile.provider}_${accountProfile.provider_id}` : null);
      let seed = accountProfile.seed || null;

      if (!seed && (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }

      if (!seed && accountProfile.wallet_type === 'device') {
        try {
          const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const deviceKeyId = await deviceFingerprint.getDeviceId();
          walletKeyId = deviceKeyId;
          if (deviceKeyId) {
            const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
            if (storedPassword) {
              const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
              seed = walletData?.seed || 'encrypted';
            }
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }

      setDebugInfo({ wallet_type: accountProfile.wallet_type, account: accountProfile.account, walletKeyId, seed: seed || 'N/A' });
    };
    loadDebugInfo();
  }, [accountProfile]);

  // Token parsing helper
  const parseTokenLine = (line) => {
    const t = line.token || {};
    const change = t.pro24h ?? 0;
    const displayName = t.name || t.user || 'Unknown';
    return {
      symbol: displayName,
      name: t.user || displayName,
      amount: parseFloat(line.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      rawAmount: parseFloat(line.balance || 0),
      value: line.value ? `${line.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP` : '0 XRP',
      rawValue: line.value || 0,
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      positive: change >= 0,
      color: t.color || '#4285f4',
      icon: t.icon || null,
      slug: t.slug || null,
      issuer: line.issuer,
      md5: t.md5 || null
    };
  };

  // Transaction parsing helper
  // Decode hex currency to readable name
  const decodeCurrency = (currency) => {
    if (!currency || currency === 'XRP' || currency.length <= 3) return currency;
    if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
      try {
        const hex = currency.replace(/(00)+$/, '');
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte > 0) ascii += String.fromCharCode(byte);
        }
        return ascii || currency;
      } catch { return currency; }
    }
    return currency;
  };

  const parseTx = (tx) => {
    const type = tx.TransactionType;
    const isOutgoing = tx.Account === address;
    let label = type;
    let amount = '';
    let isDust = false;
    if (type === 'Payment') {
      const delivered = tx.meta?.delivered_amount || tx.DeliverMax || tx.Amount;
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
      const offerNode = tx.meta?.AffectedNodes?.find(n => (n.DeletedNode || n.ModifiedNode)?.LedgerEntryType === 'NFTokenOffer');
      const offer = offerNode?.DeletedNode?.FinalFields || offerNode?.ModifiedNode?.FinalFields;
      const offerAmt = offer?.Amount;
      const isZeroAmount = !offerAmt || offerAmt === '0' || (typeof offerAmt === 'string' && parseInt(offerAmt) === 0);
      if (isZeroAmount) {
        const isSender = offer?.Owner === address;
        label = isSender ? 'Sent NFT' : 'Received NFT';
        amount = 'FREE';
      } else {
        if (typeof offerAmt === 'string') {
          const xrpAmt = parseInt(offerAmt) / 1000000;
          amount = xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        } else if (offerAmt?.value) {
          amount = `${parseFloat(offerAmt.value).toFixed(2)} ${decodeCurrency(offerAmt.currency)}`;
        }
        const isSeller = offer?.Owner === address;
        label = isSeller ? 'Sold NFT' : 'Bought NFT';
      }
    } else if (type === 'TrustSet') {
      label = 'Trustline';
    }
    const counterparty = isOutgoing ? tx.Destination : tx.Account;
    return {
      id: tx.hash || tx.ctid,
      type: isOutgoing ? 'out' : 'in',
      label,
      amount,
      isDust,
      time: tx.date ? new Date((tx.date + 946684800) * 1000).toISOString() : '',
      hash: tx.hash,
      counterparty
    };
  };

  // Load tokens from API
  useEffect(() => {
    const controller = new AbortController();
    const fetchTokens = async () => {
      if (!address) return;
      setTokensLoading(true);
      setIsInactive(false);
      try {
        const res = await fetch(`${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true`, { signal: controller.signal });
        const data = await res.json();
        if (data.result === 'success') {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
          setIsInactive(false);
        } else if (data.error || data.result !== 'success') {
          // Account not found or other error - treat as inactive
          setIsInactive(true);
          setXrpData(null);
          setTokens([]);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load tokens:', e);
      } finally {
        if (!controller.signal.aborted) setTokensLoading(false);
      }
    };
    fetchTokens();
    return () => controller.abort();
  }, [address]);

  // Load withdrawals from IndexedDB
  useEffect(() => {
    const loadWithdrawals = async () => {
      if (!address) return;
      try {
        const saved = await withdrawalStorage.getAll(address);
        setWithdrawals(saved);
      } catch (e) {
        console.error('Failed to load withdrawals:', e);
      }
    };
    loadWithdrawals();
  }, [address]);

  // Load recent transactions
  useEffect(() => {
    const controller = new AbortController();
    const fetchTx = async () => {
      if (!address) return;
      setTxLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/account/tx/${address}?limit=20`, { signal: controller.signal });
        const data = await res.json();
        if (data.result === 'success' && data.txs) {
          setTransactions(data.txs.map(parseTx));
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load transactions:', e);
      } finally {
        if (!controller.signal.aborted) setTxLoading(false);
      }
    };
    fetchTx();
    return () => controller.abort();
  }, [address]);

  // Load NFT collections summary
  useEffect(() => {
    const controller = new AbortController();
    const fetchCollections = async () => {
      if (!address) return;
      setCollectionsLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/nft/account/${address}/nfts`, { signal: controller.signal });
        const data = await res.json();
        if (data.collections) {
          setCollections(data.collections.map(col => ({
            id: col._id,
            name: col.name,
            slug: col.slug,
            count: col.count,
            logo: col.logoImage ? `https://s1.xrpl.to/nft-collection/${col.logoImage}` : '',
            floor: col.floor || 0,
            floor24hAgo: col.floor24hAgo || 0,
            value: col.value || 0
          })));
          setNftPortfolioValue(data.portfolioValue || 0);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load collections:', e);
      } finally {
        if (!controller.signal.aborted) setCollectionsLoading(false);
      }
    };
    fetchCollections();
    return () => controller.abort();
  }, [address]);

  // Load offers (DEX + NFT)
  useEffect(() => {
    const controller = new AbortController();
    const fetchOffers = async () => {
      if (!address) return;
      setOffersLoading(true);
      try {
        const [dexRes, nftRes] = await Promise.all([
          fetch(`${BASE_URL}/api/account/offers/${address}`, { signal: controller.signal }),
          fetch(`${BASE_URL}/api/nft/account/${address}/offers?limit=50`, { signal: controller.signal })
        ]);
        const [dexData, nftData] = await Promise.all([dexRes.json(), nftRes.json()]);
        if (dexData.result === 'success' && dexData.offers) {
          setTokenOffers(dexData.offers.map(offer => {
            const gets = offer.gets || offer.taker_gets || offer.TakerGets;
            const pays = offer.pays || offer.taker_pays || offer.TakerPays;
            const getsAmt = parseFloat(gets?.value || 0);
            const getsCur = gets?.name || gets?.currency || 'XRP';
            const paysAmt = parseFloat(pays?.value || 0);
            const paysCur = pays?.name || pays?.currency || 'XRP';
            const rate = getsAmt > 0 ? paysAmt / getsAmt : 0;
            const rateDisplay = rate > 0 ? (rate >= 1 ? rate.toLocaleString(undefined, { maximumFractionDigits: 4 }) : rate.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')) : '';
            return {
              id: offer.seq || offer.Sequence,
              type: paysCur === 'XRP' ? 'buy' : 'sell',
              from: `${getsAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${getsCur}`,
              to: `${paysAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${paysCur}`,
              rate: rateDisplay ? `${rateDisplay} ${paysCur}/${getsCur}` : '',
              seq: offer.seq || offer.Sequence,
              funded: offer.funded !== false
            };
          }));
        }
        const parseNftOffer = (offer, type) => ({
          id: offer._id,
          nftId: offer.NFTokenID,
          name: offer.meta?.name || 'NFT',
          collection: offer.collecion || offer.collection || offer.cslug || '',
          image: offer.files?.[0]?.thumbnail?.small ? `https://s1.xrpl.to/nft/${offer.files[0].thumbnail.small}` : '',
          price: typeof offer.amount === 'number' ? `${(offer.amount / 1000000).toFixed(2)} XRP` : '',
          floor: offer.floor || 0,
          floorDiffPct: offer.floorDiffPct || 0,
          type
        });
        const sellOffers = (nftData.offers || []).map(o => parseNftOffer(o, 'sell'));
        const buyOffers = (nftData.incomingOffers || []).map(o => parseNftOffer(o, 'buy'));
        setNftOffers([...sellOffers, ...buyOffers]);
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load offers:', e);
      } finally {
        if (!controller.signal.aborted) setOffersLoading(false);
      }
    };
    fetchOffers();
    return () => controller.abort();
  }, [address]);

  // Fetch more tokens when Tokens tab opened
  useEffect(() => {
    if (activeTab !== 'tokens' || !address || tokens.length >= 50) return;
    const controller = new AbortController();
    const fetchMore = async () => {
      setTokensLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&limit=50`, { signal: controller.signal });
        const data = await res.json();
        if (data.result === 'success') {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load more tokens:', e);
      } finally {
        if (!controller.signal.aborted) setTokensLoading(false);
      }
    };
    fetchMore();
    return () => controller.abort();
  }, [activeTab, address]);

  // Fetch more transactions when History tab opened
  useEffect(() => {
    if (activeTab !== 'trades' || !address || transactions.length >= 50) return;
    const controller = new AbortController();
    const fetchMore = async () => {
      setTxLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/account/tx/${address}?limit=50`, { signal: controller.signal });
        const data = await res.json();
        if (data.result === 'success' && data.txs) {
          setTransactions(data.txs.map(parseTx));
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Failed to load more transactions:', e);
      } finally {
        if (!controller.signal.aborted) setTxLoading(false);
      }
    };
    fetchMore();
    return () => controller.abort();
  }, [activeTab, address]);

  // Load NFTs for selected collection (using collection slug endpoint for full data with thumbnails)
  useEffect(() => {
    const fetchCollectionNfts = async () => {
      if (!selectedCollection) {
        setCollectionNfts([]);
        return;
      }
      const col = collections.find(c => c.name === selectedCollection);
      if (!col?.slug) return;
      setCollectionNftsLoading(true);
      try {
        // Use collection endpoint which returns files with thumbnails
        const res = await fetch(`${BASE_URL}/api/nft/collections/${col.slug}/nfts?limit=50&skip=0&owner=${address}`);
        const data = await res.json();
        if (data.nfts) {
          setCollectionNfts(data.nfts.map(nft => ({
            id: nft._id || nft.NFTokenID,
            nftId: nft.NFTokenID || nft._id,
            name: nft.name || nft.meta?.name || 'Unnamed NFT',
            image: getNftCoverUrl(nft, 'large') || '',
            rarity: nft.rarity_rank || 0,
            cost: nft.cost
          })));
        }
      } catch (e) {
        console.error('Failed to load collection NFTs:', e);
      } finally {
        setCollectionNftsLoading(false);
      }
    };
    fetchCollectionNfts();
  }, [address, selectedCollection, collections]);

  // Add withdrawal handler
  const handleAddWithdrawal = async () => {
    if (!newWithdrawal.name.trim() || !newWithdrawal.address.trim()) {
      setWithdrawalError('Name and address are required');
      return;
    }
    // Basic XRPL address validation
    if (!newWithdrawal.address.startsWith('r') || newWithdrawal.address.length < 25) {
      setWithdrawalError('Invalid XRPL address');
      return;
    }
    setWithdrawalLoading(true);
    setWithdrawalError('');
    try {
      const added = await withdrawalStorage.add(address, newWithdrawal);
      setWithdrawals(prev => [added, ...prev]);
      setNewWithdrawal({ name: '', address: '', tag: '' });
      setShowAddWithdrawal(false);
    } catch (e) {
      console.error('Withdrawal save error:', e);
      setWithdrawalError(e.message || 'Failed to save withdrawal address');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Delete withdrawal handler
  const handleDeleteWithdrawal = async (id) => {
    try {
      await withdrawalStorage.remove(id);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete withdrawal:', e);
    }
  };

  // Computed tokens list with XRP at top
  const xrpToken = xrpData ? (() => {
    const x = xrpData.xrp || {};
    const bal = parseFloat(x.balance || xrpData.balance || 0);
    const change = x.pro24h ?? 0;
    return {
      symbol: 'XRP',
      name: 'XRP',
      amount: bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      rawAmount: bal,
      value: x.usd ? `$${parseFloat(x.usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${bal.toFixed(2)} XRP`,
      rawValue: x.value || bal,
      change: change ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '',
      positive: change >= 0,
      color: '#23292F',
      icon: '◎',
      slug: 'xrpl-xrp',
      md5: x.md5 || '84e5efeb89c4eae8f68188982dc290d8'
    };
  })() : null;
  const allTokens = xrpToken ? [xrpToken, ...tokens] : tokens;
  const totalValue = allTokens.reduce((sum, t) => sum + (t.rawValue || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'tokens', label: 'Tokens', icon: () => <span className="text-xs">◎</span> },
    { id: 'nfts', label: 'NFTs', icon: Image },
    { id: 'offers', label: 'Offers', icon: RotateCcw },
    { id: 'trades', label: 'History', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: Building2 },
  ];

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      {!address ? (
        <div className={cn("min-h-[calc(100vh-64px)] flex items-center justify-center", isDark ? "bg-black" : "bg-gray-50")}>
          <div className={cn("text-center p-10 rounded-xl max-w-md", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
            <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
              <Wallet size={36} className="text-blue-500" />
            </div>
            <h2 className={cn("text-xl font-medium mb-3", isDark ? "text-white/90" : "text-gray-900")}>Connect Wallet</h2>
            <p className={cn("text-[13px] mb-8 leading-relaxed", isDark ? "text-white/50" : "text-gray-500")}>
              Manage your tokens, NFTs, offers, and transaction history all in one place
            </p>
            <button onClick={() => setOpenWalletModal(true)} className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
              Connect Wallet
            </button>
            <p className={cn("text-[11px] mt-4", isDark ? "text-white/25" : "text-gray-400")}>
              Secure • Non-custodial • Encrypted locally
            </p>
          </div>
        </div>
      ) : (
      <div className={cn("min-h-screen", isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900")}>
        <div className="max-w-[1920px] mx-auto w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Wallet</h1>
            <div className="flex items-center gap-2">
              {isInactive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400" title="Fund with 1 XRP to activate">Inactive</span>
              )}
              <button
                onClick={() => handleCopy(address)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors duration-150",
                  copied ? "bg-emerald-500/10 text-emerald-500" : isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", isInactive ? "bg-amber-400/60" : "bg-emerald-400")} />
                {address?.slice(0, 8)}...{address?.slice(-6)}
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium tracking-wider rounded-md border transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? cn(isDark ? "border-white/20 text-white" : "border-gray-300 text-gray-900")
                    : cn(isDark ? "border-white/10 text-white/40 hover:text-white/60 hover:border-white/15" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")
                )}
              >
                <tab.icon size={15} strokeWidth={1.5} />
                {tab.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Send/Receive Modal */}
          {showPanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(null)} />

              {/* Modal */}
              <div className={cn("relative w-full max-w-md rounded-2xl overflow-hidden", isDark ? "bg-[#09090b] border-[1.5px] border-white/15" : "bg-white border border-gray-200")}>
                {/* Header with Tabs */}
                <div className={cn("flex items-center justify-between p-4 border-b", isDark ? "border-white/5" : "border-gray-100")}>
                  <div className={cn("flex p-1 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-100")}>
                    <button
                      onClick={() => setShowPanel('send')}
                      className={cn("flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                        showPanel === 'send'
                          ? "bg-blue-500 text-white"
                          : isDark ? "text-white/50 hover:text-white/80" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <ArrowUpRight size={15} /> Send
                    </button>
                    <button
                      onClick={() => setShowPanel('receive')}
                      className={cn("flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                        showPanel === 'receive'
                          ? "bg-emerald-500 text-white"
                          : isDark ? "text-white/50 hover:text-white/80" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <ArrowDownLeft size={15} /> Receive
                    </button>
                  </div>
                  <button onClick={() => setShowPanel(null)} className={cn("p-2 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                {showPanel === 'send' ? (
                  <div className="p-5">
                    {/* Amount Section */}
                    {/* Token Selector - Embedded */}
                    <div className={cn("rounded-xl mb-4 overflow-hidden", isDark ? "bg-white/[0.02] border border-white/5" : "bg-gray-50 border border-gray-100")}>
                      <button type="button" onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)} className={cn("w-full flex items-center justify-between px-4 py-3 transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-100/50")}>
                        <div className="flex items-center gap-3">
                          {(() => { const t = allTokens.find(t => t.symbol === selectedToken); return t?.md5 ? (
                            <img src={`https://s1.xrpl.to/token/${t.md5}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: t?.color || '#333' }}>{t?.icon || selectedToken[0]}</div>
                          ); })()}
                          <div className="text-left">
                            <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{selectedToken}</p>
                            <p className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>Tap to change token</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={cn("text-[10px] uppercase", isDark ? "text-white/40" : "text-gray-500")}>Balance</p>
                            <p className={cn("text-sm font-medium tabular-nums", isDark ? "text-white/80" : "text-gray-700")}>{allTokens.find(t => t.symbol === selectedToken)?.amount || '0'}</p>
                          </div>
                          <ChevronDown size={18} className={cn("transition-transform duration-200", tokenDropdownOpen && "rotate-180", isDark ? "text-white/30" : "text-gray-400")} />
                        </div>
                      </button>
                      {tokenDropdownOpen && (
                        <div className={cn("border-t max-h-[160px] overflow-y-auto", isDark ? "border-white/5" : "border-gray-100")}>
                          {allTokens.map((t) => (
                            <button key={t.symbol} type="button" onClick={() => { setSelectedToken(t.symbol); setTokenDropdownOpen(false); }} className={cn("w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors", selectedToken === t.symbol ? (isDark ? "bg-blue-500/10" : "bg-blue-50") : "", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-100/50")}>
                              {t.md5 ? (
                                <img src={`https://s1.xrpl.to/token/${t.md5}`} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: t.color }}>{t.icon || t.symbol[0]}</div>
                              )}
                              <span className={cn("text-sm font-medium flex-1", isDark ? "text-white/90" : "text-gray-900")}>{t.symbol}</span>
                              <span className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>{t.amount}</span>
                              {selectedToken === t.symbol && <Check size={16} className="text-blue-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className={cn("rounded-xl p-4 mb-4", isDark ? "bg-white/[0.02]" : "bg-gray-50")}>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0"
                        className={cn("w-full text-4xl font-semibold bg-transparent outline-none tabular-nums text-center py-3", isDark ? "text-white placeholder:text-white/15" : "text-gray-900 placeholder:text-gray-300")}
                      />
                      {(() => {
                        const amt = parseFloat(sendAmount) || 0;
                        const token = allTokens.find(t => t.symbol === selectedToken);
                        const pricePerToken = token?.rawAmount > 0 ? (token.rawValue / token.rawAmount) : 0;
                        const valueInXrp = amt * pricePerToken;
                        const displayValue = activeFiatCurrency === 'XRP' ? valueInXrp : valueInXrp / exchRate;
                        const symbol = currencySymbols[activeFiatCurrency] || '$';
                        return (
                          <p className={cn("text-xs text-center mb-3", isDark ? "text-white/30" : "text-gray-400")}>
                            ≈ {symbol}{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeFiatCurrency}
                          </p>
                        );
                      })()}

                      {/* Quick Amount Buttons */}
                      <div className="flex items-center justify-center gap-1.5">
                        {[25, 50, 75, 100].map(pct => {
                          const maxAmt = allTokens.find(t => t.symbol === selectedToken)?.rawAmount || 0;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setSendAmount((maxAmt * pct / 100).toFixed(2))}
                              className={cn("px-3 py-1 rounded-md text-[11px] font-medium transition-colors", isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200")}
                            >
                              {pct === 100 ? 'MAX' : `${pct}%`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recipient */}
                    <div className="mb-3">
                      <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isDark ? "text-white/40" : "text-gray-500")}>Recipient</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={sendTo}
                          onChange={(e) => setSendTo(e.target.value)}
                          placeholder="rAddress..."
                          className={cn("w-full pl-3 pr-9 py-2.5 rounded-xl text-sm font-mono outline-none transition-all duration-150",
                            isDark ? "bg-white/[0.03] text-white border placeholder:text-white/25" : "bg-gray-50 border placeholder:text-gray-400",
                            sendTo && sendTo.startsWith('r') && sendTo.length >= 25
                              ? (isDark ? "border-emerald-500/50" : "border-emerald-400")
                              : sendTo
                                ? (isDark ? "border-amber-500/50" : "border-amber-400")
                                : (isDark ? "border-white/10 focus:border-blue-500/50" : "border-gray-200 focus:border-blue-400")
                          )}
                        />
                        {sendTo && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {sendTo.startsWith('r') && sendTo.length >= 25
                              ? <Check size={14} className="text-emerald-500" />
                              : <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Destination Tag */}
                    <div className="mb-4">
                      <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isDark ? "text-white/40" : "text-gray-500")}>
                        Destination Tag <span className={isDark ? "text-white/20" : "text-gray-400"}>(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={sendTag}
                        onChange={(e) => setSendTag(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 12345678"
                        className={cn("w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.03] text-white border border-white/10 placeholder:text-white/25 focus:border-blue-500/50" : "bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-blue-400")}
                      />
                    </div>

                    {/* Fee Display */}
                    <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg mb-4 text-xs", isDark ? "bg-white/[0.02] text-white/50" : "bg-gray-50 text-gray-500")}>
                      <span>Network Fee</span>
                      <span className="font-medium">~0.00001 XRP</span>
                    </div>

                    {/* Send Button */}
                    <button
                      disabled={!sendTo || !sendAmount || !(sendTo.startsWith('r') && sendTo.length >= 25)}
                      className={cn("w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200",
                        sendTo && sendAmount && sendTo.startsWith('r') && sendTo.length >= 25
                          ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]"
                          : isDark ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Send size={15} /> Send {sendAmount || '0'} {selectedToken}
                    </button>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex flex-col items-center">
                      {/* QR Code */}
                      <div className="p-3 bg-white rounded-xl mb-4">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}&bgcolor=ffffff&color=000000&margin=0`} alt="QR" className="w-40 h-40" />
                      </div>

                      {/* Address Display */}
                      <div className={cn("w-full rounded-xl p-3 mb-4", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                        <p className={cn("font-mono text-[11px] text-center break-all leading-relaxed", isDark ? "text-white/70" : "text-gray-600")}>{address}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleCopy(address)}
                          className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200",
                            copied
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-emerald-500 text-white hover:bg-emerald-600"
                          )}
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied!' : 'Copy Address'}
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: 'My XRP Address', text: address });
                            } else {
                              handleCopy(address);
                            }
                          }}
                          className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-colors", isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                        >
                          <ExternalLink size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Portfolio Header */}
              <div className={cn("rounded-xl p-5", isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200")}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Portfolio Value</p>
                    <p className={cn("text-4xl font-semibold tracking-tight tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                      {tokensLoading ? '...' : `${(totalValue + nftPortfolioValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`}
                    </p>
                    {isInactive ? (
                      <p className="text-[10px] mt-1 text-amber-400">
                        Fund with 1 XRP to activate this wallet
                      </p>
                    ) : (
                      <p className={cn("text-[10px] mt-1 flex items-center gap-2", isDark ? "text-white/30" : "text-gray-400")}>
                        <span>{allTokens.length} tokens · {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP</span>
                        <span>•</span>
                        <span>{collections.length} NFTs · {nftPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPanel('send')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                      <ArrowUpRight size={16} /> Send
                    </button>
                    <button onClick={() => setShowPanel('receive')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors", isDark ? "bg-white/[0.05] text-white/80 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                      <ArrowDownLeft size={16} /> Receive
                    </button>
                    <Link href="/watchlist" className={cn("flex items-center justify-center w-10 h-10 rounded-xl transition-colors", isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-amber-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-amber-500")} title="Watchlist">
                      <Star size={18} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content Grid - Symmetrical 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Assets */}
                <div className="space-y-4">
                  {/* Token Holdings */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200")}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>Top Assets</p>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>{allTokens.length}</span>
                      </div>
                      <button onClick={() => handleTabChange('tokens')} className={cn("text-[10px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</button>
                    </div>
                    <div className="divide-y divide-white/5">
                      {tokensLoading ? (
                        <div className={cn("p-8 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading...</div>
                      ) : allTokens.length === 0 ? (
                        <div className={cn("p-6 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                          <div className="relative w-12 h-12 mx-auto mb-3">
                            <div className={cn("absolute -top-0.5 left-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                            <div className={cn("absolute -top-0.5 right-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                            <div className={cn("absolute top-0.5 left-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                            <div className={cn("absolute top-0.5 right-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                            <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                              <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                              <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                              <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}><div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" /></div>
                              <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                              {[...Array(8)].map((_, i) => (<div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />))}
                            </div>
                          </div>
                          <p className={cn("text-[10px] font-medium tracking-wider mb-1", isDark ? "text-white/60" : "text-gray-500")}>NO TOKENS</p>
                          <a href="/" className="text-[9px] text-blue-400 hover:underline">Browse tokens</a>
                        </div>
                      ) : allTokens.slice(0, 5).map((token) => (
                        <div key={token.symbol} className={cn("flex items-center gap-3 px-4 py-2.5 transition-colors duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                          {token.md5 ? (
                            <img src={`https://s1.xrpl.to/token/${token.md5}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: token.color }}>{token.icon || token.symbol[0]}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                            <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>{token.name}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className={cn("text-xs font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{token.value}</p>
                            <p className={cn("text-[10px] tabular-nums", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {token.slug && (
                              <Link href={`/token/${token.slug}`} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/30 hover:text-blue-400 hover:bg-blue-500/10" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50")}>
                                <ArrowRightLeft size={14} />
                              </Link>
                            )}
                            <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/30 hover:text-blue-400 hover:bg-blue-500/10" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50")}>
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  </div>

                {/* Right Column - NFTs & Watchlist */}
                <div className="space-y-4">
                  {/* NFT Collections */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200")}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>NFT Collections</p>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>{collections.length}</span>
                      </div>
                      <button onClick={() => handleTabChange('nfts')} className={cn("text-[10px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</button>
                    </div>
                    {collectionsLoading ? (
                      <div className={cn("p-8 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading...</div>
                    ) : collections.length === 0 ? (
                      <div className={cn("p-6 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                        <div className="relative w-12 h-12 mx-auto mb-3">
                          <div className={cn("absolute -top-0.5 left-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                          <div className={cn("absolute -top-0.5 right-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                          <div className={cn("absolute top-0.5 left-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                          <div className={cn("absolute top-0.5 right-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                          <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                            <div className="absolute top-3 left-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                            <div className="absolute top-3 right-2 w-1.5 h-1 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                            <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}><div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" /></div>
                            <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                          </div>
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                            {[...Array(8)].map((_, i) => (<div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />))}
                          </div>
                        </div>
                        <p className={cn("text-[10px] font-medium tracking-wider mb-1", isDark ? "text-white/60" : "text-gray-500")}>NO NFTS</p>
                        <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:underline">Browse collections</a>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {collections.slice(0, 5).map((col) => (
                          <button key={col.id} onClick={() => { setSelectedCollection(col.name); handleTabChange('nfts'); }} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            {col.logo ? (
                              <img src={col.logo} alt={col.name} className="w-8 h-8 rounded-lg object-cover shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] shrink-0", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>NFT</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</p>
                              <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>{col.count} item{col.count !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-right mr-1">
                              <p className={cn("text-xs font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{col.floor} XRP</p>
                              {(() => { const pct = col.floor24hAgo ? ((col.floor - col.floor24hAgo) / col.floor24hAgo * 100) : 0; return <p className={cn("text-[10px] tabular-nums", pct >= 0 ? "text-emerald-500" : "text-red-400")}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</p>; })()}
                            </div>
                            <ChevronRight size={14} className={isDark ? "text-white/20" : "text-gray-300"} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Recent Activity - Full Width */}
              <div className={cn("rounded-xl mt-4", isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200")}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>Recent Activity</p>
                  <button onClick={() => handleTabChange('trades')} className={cn("text-[10px] font-medium uppercase tracking-wide transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>View All</button>
                </div>
                {txLoading ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading...</div>
                ) : transactions.length === 0 ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <p className="text-[11px]">No recent activity</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-500")}>
                        <th className="text-left px-4 py-2 font-medium">Type</th>
                        <th className="text-left px-4 py-2 font-medium">From/To</th>
                        <th className="text-left px-4 py-2 font-medium">Date</th>
                        <th className="text-right px-4 py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.slice(0, 20).map((tx) => (
                        <tr key={tx.id} onClick={() => window.open(`/tx/${tx.hash}`, '_blank')} className={cn("transition-colors cursor-pointer", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", tx.type === 'in' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                                {tx.type === 'in' ? <ArrowDownLeft size={12} className="text-emerald-500" /> : <ArrowUpRight size={12} className="text-red-400" />}
                              </div>
                              <span className={cn("text-sm font-medium", isDark ? "text-white/90" : "text-gray-900")}>{tx.label}</span>
                              {tx.isDust && <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Dust</span>}
                            </div>
                          </td>
                          <td className={cn("px-4 py-2.5 text-xs font-mono", isDark ? "text-white/50" : "text-gray-500")}>
                            {tx.counterparty ? `${tx.counterparty.slice(0, 4)}...${tx.counterparty.slice(-4)}` : '-'}
                          </td>
                          <td className={cn("px-4 py-2.5 text-xs", isDark ? "text-white/50" : "text-gray-500")}>{tx.time ? new Date(tx.time).toLocaleString() : ''}</td>
                          <td className={cn("px-4 py-2.5 text-right text-xs font-medium tabular-nums whitespace-nowrap", isDark ? "text-white/70" : "text-gray-700")}>{tx.amount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tokens Tab - Full Token Management */}
          {activeTab === 'tokens' && (() => {
            const filteredTokens = allTokens
              .filter(t => {
                if (tokenSearch && !t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) && !t.name.toLowerCase().includes(tokenSearch.toLowerCase())) return false;
                if (hideZeroBalance && t.rawAmount === 0) return false;
                return true;
              })
              .sort((a, b) => {
                if (tokenSort === 'name') return a.symbol.localeCompare(b.symbol);
                if (tokenSort === 'change') return parseFloat(b.change) - parseFloat(a.change);
                return (b.rawValue || 0) - (a.rawValue || 0);
              });

            return (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className={cn("rounded-xl p-4", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search size={16} className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-blue-400" : "text-blue-500")} />
                      <input
                        type="text"
                        value={tokenSearch}
                        onChange={(e) => setTokenSearch(e.target.value)}
                        placeholder="Search tokens..."
                        className={cn("w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")}
                      />
                    </div>
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <select
                        value={tokenSort}
                        onChange={(e) => setTokenSort(e.target.value)}
                        className={cn("px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-[#1a1a1a] text-white border border-white/10 [&>option]:bg-[#1a1a1a]" : "bg-gray-50 border border-blue-200/50")}
                      >
                        <option value="value">Sort by Value</option>
                        <option value="name">Sort by Name</option>
                        <option value="change">Sort by 24h Change</option>
                      </select>
                      <button
                        onClick={() => setHideZeroBalance(!hideZeroBalance)}
                        className={cn("p-2.5 rounded-lg transition-colors duration-150", hideZeroBalance ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600")}
                        title={hideZeroBalance ? "Show zero balances" : "Hide zero balances"}
                      >
                        {hideZeroBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={cn("text-[11px]", isDark ? "text-white/35" : "text-gray-400")}>
                      {tokensLoading ? 'Loading...' : `${filteredTokens.length} of ${allTokens.length} tokens`}
                    </span>
                    {tokenSearch && (
                      <button onClick={() => setTokenSearch('')} className={cn("text-[11px] transition-colors", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>Clear search</button>
                    )}
                  </div>
                </div>

                {/* Token List */}
                <div className={cn("rounded-xl overflow-hidden", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  {/* Table Header */}
                  <div className={cn("grid grid-cols-12 gap-4 px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold border-b", isDark ? "text-blue-400 border-blue-500/10 bg-white/[0.02]" : "text-blue-500 border-blue-100 bg-gray-50")}>
                    <div className="col-span-4">Asset</div>
                    <div className="col-span-2 text-right">Balance</div>
                    <div className="col-span-2 text-right">Value</div>
                    <div className="col-span-2 text-right">24h</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* Token Rows */}
                  {filteredTokens.length === 0 ? (
                    <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                      <p className="text-[13px]">No tokens found</p>
                    </div>
                  ) : (
                    filteredTokens.slice((tokenPage - 1) * tokensPerPage, tokenPage * tokensPerPage).map((token) => (
                      <div key={token.symbol} className={cn("grid grid-cols-12 gap-4 px-4 py-3 items-center border-b last:border-0 transition-all duration-150", isDark ? "border-blue-500/5 hover:bg-white/[0.02]" : "border-blue-50 hover:bg-gray-50")}>
                        <div className="col-span-4 flex items-center gap-3">
                          {token.md5 ? (
                            <img src={`https://s1.xrpl.to/token/${token.md5}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: token.color }}>{token.icon || token.symbol[0]}</div>
                          )}
                          <div className="min-w-0">
                            <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                            <p className={cn("text-[10px] truncate", isDark ? "text-white/35" : "text-gray-500")}>{token.name}</p>
                          </div>
                        </div>
                        <div className={cn("col-span-2 text-right text-[12px] tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{token.amount}</div>
                        <div className={cn("col-span-2 text-right text-[12px] font-medium tabular-nums", isDark ? "text-white/90" : "text-gray-900")}>{token.value}</div>
                        <div className={cn("col-span-2 text-right text-[12px] tabular-nums", token.positive ? "text-emerald-500" : "text-red-400")}>{token.change}</div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {token.slug && (
                            <Link href={`/token/${token.slug}`} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                              <ArrowRightLeft size={14} />
                            </Link>
                          )}
                          <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); setActiveTab('overview'); }} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {filteredTokens.length > tokensPerPage && (
                  <div className={cn("rounded-xl p-3 flex items-center justify-between", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <span className={cn("text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                      Showing {(tokenPage - 1) * tokensPerPage + 1}-{Math.min(tokenPage * tokensPerPage, filteredTokens.length)} of {filteredTokens.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setTokenPage(p => Math.max(1, p - 1))} disabled={tokenPage === 1} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30", isDark ? "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        Prev
                      </button>
                      {Array.from({ length: Math.ceil(filteredTokens.length / tokensPerPage) }, (_, i) => i + 1).slice(Math.max(0, tokenPage - 3), tokenPage + 2).map(p => (
                        <button key={p} onClick={() => setTokenPage(p)} className={cn("w-8 h-8 rounded-lg text-[11px] font-medium transition-colors", p === tokenPage ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                          {p}
                        </button>
                      ))}
                      <button onClick={() => setTokenPage(p => Math.min(Math.ceil(filteredTokens.length / tokensPerPage), p + 1))} disabled={tokenPage >= Math.ceil(filteredTokens.length / tokensPerPage)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30", isDark ? "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              {offersLoading ? (
                <div className={cn("p-8 text-center rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15 text-white/40" : "bg-white border border-blue-200/50 text-gray-400")}>Loading...</div>
              ) : (
                <>
                  {/* DEX Offers */}
                  <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                    <div className="p-4 border-b border-blue-500/10 flex items-center gap-2">
                      <RotateCcw size={14} className={isDark ? "text-blue-400" : "text-blue-500"} />
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>DEX Offers</p>
                      <span className={cn("ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{tokenOffers.length}</span>
                    </div>
                    {tokenOffers.length === 0 ? (
                      <div className={cn("p-6 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                        <p className="text-[13px]">No open DEX offers</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-blue-500/5">
                        {tokenOffers.map((offer) => (
                          <div key={offer.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", offer.type === 'buy' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                              {offer.type === 'buy' ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{offer.from} → {offer.to}</p>
                                {!offer.funded && <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Unfunded</span>}
                              </div>
                              <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>Rate: {offer.rate} • Seq: {offer.seq}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* NFT Offers */}
                  <div className={cn("rounded-xl", isDark ? "bg-black/40 backdrop-blur-sm border border-gray-500/20" : "bg-white border border-gray-200")}>
                    <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                      <Image size={14} className={isDark ? "text-white/50" : "text-gray-500"} />
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-white/50" : "text-gray-500")}>NFT Offers</p>
                      <span className={cn("ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{nftOffers.length}</span>
                    </div>
                    {nftOffers.length === 0 ? (
                      <div className={cn("p-6 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                        <p className="text-[13px]">No NFT offers</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-500/20">
                        {nftOffers.map((offer) => (
                          <Link key={offer.id} href={`/nft/${offer.nftId}`} className={cn("flex items-center gap-4 px-4 py-3 transition-all duration-150", isDark ? "bg-black/40 backdrop-blur-sm hover:bg-white/[0.03]" : "bg-white hover:bg-gray-50")}>
                            {offer.image ? (
                              <img src={offer.image} alt={offer.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-white/5" : "bg-gray-100")}>
                                <Image size={16} className={isDark ? "text-white/30" : "text-gray-400"} />
                              </div>
                            )}
                            <div className="w-[180px] min-w-0 shrink-0">
                              <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{offer.name}</p>
                              <p className={cn("text-[10px] truncate", isDark ? "text-white/40" : "text-gray-400")}>{offer.collection}</p>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <div className="text-center px-3">
                                <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>Price</p>
                                <p className={cn("text-[13px] font-medium tabular-nums", isDark ? "text-white/90" : "text-gray-900")}>{offer.price}</p>
                              </div>
                              <div className="text-center px-3">
                                <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>Floor</p>
                                <p className={cn("text-[13px] font-medium tabular-nums", isDark ? "text-white/90" : "text-gray-900")}>{offer.floor > 0 ? `${offer.floor.toFixed(2)} XRP` : '-'}</p>
                              </div>
                              <div className="text-center px-3">
                                <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>vs Floor</p>
                                <p className={cn("text-[13px] font-medium tabular-nums", offer.floorDiffPct >= 0 ? "text-emerald-500" : "text-red-400")}>
                                  {offer.floor > 0 ? `${offer.floorDiffPct >= 0 ? '+' : ''}${offer.floorDiffPct.toFixed(0)}%` : '-'}
                                </p>
                              </div>
                              <div className="text-center px-3">
                                <p className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>Type</p>
                                <span className={cn("text-[11px] px-2 py-0.5 rounded font-medium", offer.type === 'sell' ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-500")}>
                                  {offer.type === 'sell' ? 'Sell' : 'Buy'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
              <div className="p-4 border-b border-blue-500/10">
                <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Transaction History</p>
              </div>
              {txLoading ? (
                <div className={cn("p-8 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading...</div>
              ) : transactions.length === 0 ? (
                <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                  <p className="text-[13px]">No transactions found</p>
                </div>
              ) : (
                <div className="divide-y divide-blue-500/5">
                  {transactions.map((tx) => (
                    <a key={tx.id} href={`/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 px-3 py-2.5 transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", tx.type === 'in' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                        {tx.type === 'in' ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{tx.label}</p>
                          {tx.isDust && <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Dust</span>}
                        </div>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{tx.time ? new Date(tx.time).toLocaleString() : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.amount && <p className={cn("text-[12px] font-medium tabular-nums whitespace-nowrap", isDark ? "text-white/70" : "text-gray-700")}>{tx.amount}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {/* Delete Confirmation Modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirmId(null)}>
                  <div className={cn("w-full max-w-sm rounded-xl p-5", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-red-500/20" : "bg-white/98 backdrop-blur-xl border border-gray-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-red-500/10" : "bg-red-50")}>
                        <Trash2 size={18} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className={cn("text-[14px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Delete Address?</h3>
                        <p className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>This cannot be undone</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirmId(null)} className={cn("flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteWithdrawal(deleteConfirmId)} className="flex-1 py-2.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Withdrawal Modal */}
              {showAddWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddWithdrawal(false)}>
                  <div className={cn("w-full max-w-md rounded-2xl p-6", isDark ? "bg-[#09090b] border-[1.5px] border-white/15" : "bg-white border border-gray-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Add Withdrawal Address</h3>
                      <button onClick={() => setShowAddWithdrawal(false)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Name</label>
                        <input type="text" value={newWithdrawal.name} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Binance, Coinbase" className={cn("w-full px-4 py-3 rounded-lg text-[13px] outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>XRPL Address</label>
                        <input type="text" value={newWithdrawal.address} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, address: e.target.value }))} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Destination Tag (optional)</label>
                        <input type="text" value={newWithdrawal.tag} onChange={(e) => setNewWithdrawal(prev => ({ ...prev, tag: e.target.value.replace(/\D/g, '') }))} placeholder="e.g. 12345678" className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      {withdrawalError && <p className="text-[11px] text-red-400">{withdrawalError}</p>}
                      <button onClick={handleAddWithdrawal} disabled={withdrawalLoading} className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200">
                        {withdrawalLoading ? 'Saving...' : <><Plus size={16} /> Save Address</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={cn("rounded-xl", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                <div className="p-4 border-b border-blue-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-500")}>Saved Withdrawal Addresses</p>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide", isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-gray-100 text-gray-500")}>{withdrawals.length}</span>
                  </div>
                  <button onClick={() => setShowAddWithdrawal(true)} className={cn("text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 transition-colors", isDark ? "text-blue-400/80 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}><Plus size={12} /> Add New</button>
                </div>
                {withdrawals.length === 0 ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <Building2 size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-[13px]">No saved addresses yet</p>
                    <p className="text-[11px] mt-1">Add exchange or wallet addresses for quick withdrawals</p>
                  </div>
                ) : (
                  <div className="divide-y divide-blue-500/5">
                    {withdrawals.map((wallet) => (
                      <div key={wallet.id} className={cn("flex items-center gap-3 px-3 py-2.5 group transition-all duration-150", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
                          <Building2 size={16} className={isDark ? "text-blue-400" : "text-blue-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{wallet.name}</p>
                          <p className={cn("text-[10px] font-mono truncate", isDark ? "text-white/35" : "text-gray-400")}>{wallet.address}</p>
                          {wallet.tag && <p className={cn("text-[10px]", isDark ? "text-white/25" : "text-gray-400")}>Tag: {wallet.tag}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopy(wallet.address)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Copy size={14} />
                          </button>
                          <button onClick={() => { setSelectedToken('XRP'); setSendTo(wallet.address); setSendTag(wallet.tag || ''); setShowPanel('send'); setActiveTab('overview'); }} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>
                            <Send size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(wallet.id)} className={cn("p-2 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100", isDark ? "hover:bg-red-500/10 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div>
              {/* NFT Transfer Modal */}
              {nftToTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNftToTransfer(null)}>
                  <div className={cn("w-full max-w-md rounded-xl p-6", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20" : "bg-white/98 backdrop-blur-xl border border-blue-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>Transfer NFT</h3>
                      <button onClick={() => setNftToTransfer(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                    </div>
                    <div className={cn("flex items-center gap-4 p-3 rounded-lg mb-4", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                      <img src={nftToTransfer.image} alt={nftToTransfer.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div>
                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftToTransfer.name}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{nftToTransfer.collection}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Recipient Address</label>
                        <input type="text" value={nftRecipient} onChange={(e) => setNftRecipient(e.target.value)} placeholder="rAddress..." className={cn("w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150", isDark ? "bg-white/[0.04] text-white border border-blue-500/15 placeholder:text-white/30 focus:border-blue-500/40" : "bg-gray-50 border border-blue-200/50 placeholder:text-gray-400 focus:border-blue-400")} />
                      </div>
                      <div className={cn("p-3 rounded-lg text-[11px]", isDark ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border border-yellow-200")}>
                        This will transfer ownership. This action cannot be undone.
                      </div>
                      <button className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors duration-200">
                        <Send size={16} /> Transfer NFT
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* NFT Sell Modal */}
              {nftToSell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNftToSell(null)}>
                  <div className={cn("w-full max-w-md rounded-xl p-6", isDark ? "bg-[#070b12]/98 backdrop-blur-xl border border-blue-500/20" : "bg-white/98 backdrop-blur-xl border border-blue-200")} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>List NFT for Sale</h3>
                      <button onClick={() => setNftToSell(null)} className={cn("p-2 rounded-lg transition-colors duration-150", isDark ? "hover:bg-blue-500/5 text-white/40 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-600")}>✕</button>
                    </div>
                    <div className={cn("flex items-center gap-4 p-3 rounded-lg mb-4", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                      <img src={nftToSell.image} alt={nftToSell.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftToSell.name}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{nftToSell.collection}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-[9px] uppercase font-semibold tracking-wide", isDark ? "text-white/25" : "text-gray-400")}>Floor</p>
                        <p className={cn("text-[12px] font-medium", isDark ? "text-white/50" : "text-gray-500")}>{nftToSell.floor}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block", isDark ? "text-blue-400" : "text-blue-500")}>Sale Price</label>
                        <div className={cn("flex items-center rounded-lg overflow-hidden", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-gray-50 border border-blue-200/50")}>
                          <input type="text" inputMode="decimal" value={nftSellPrice} onChange={(e) => setNftSellPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className={cn("flex-1 px-4 py-3 text-lg font-light bg-transparent outline-none", isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300")} />
                          <span className={cn("px-4 py-3 text-[13px] font-medium", isDark ? "text-white/50 bg-white/[0.04]" : "text-gray-500 bg-gray-100")}>XRP</span>
                        </div>
                      </div>
                      <div className={cn("flex items-center justify-between p-3 rounded-lg text-[11px]", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                        <span className={isDark ? "text-white/35" : "text-gray-400"}>Marketplace fee (2.5%)</span>
                        <span className={isDark ? "text-white/50" : "text-gray-500"}>{nftSellPrice ? (parseFloat(nftSellPrice) * 0.025).toFixed(2) : '0.00'} XRP</span>
                      </div>
                      <div className={cn("flex items-center justify-between p-3 rounded-lg", isDark ? "bg-white/[0.04] border border-blue-500/10" : "bg-gray-50 border border-blue-100")}>
                        <span className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>You receive</span>
                        <span className={cn("text-lg font-medium", isDark ? "text-white/90" : "text-gray-900")}>{nftSellPrice ? (parseFloat(nftSellPrice) * 0.975).toFixed(2) : '0.00'} XRP</span>
                      </div>
                      <button className="w-full py-4 rounded-lg text-[13px] font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors duration-200">
                        <ArrowUpRight size={16} /> List for Sale
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedCollection ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setSelectedCollection(null)} className={cn("text-[11px] transition-colors", isDark ? "text-white/35 hover:text-blue-400" : "text-gray-400 hover:text-blue-600")}>All Collections</button>
                    <span className={isDark ? "text-white/20" : "text-gray-300"}>/</span>
                    <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{selectedCollection}</span>
                    <button onClick={() => setSelectedCollection(null)} className={cn("ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors duration-150", isDark ? "bg-white/[0.04] text-white/50 hover:bg-blue-500/5 hover:text-blue-400" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600")}>Clear</button>
                  </div>
                  {collectionNftsLoading ? (
                    <div className={cn("p-12 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading NFTs...</div>
                  ) : collectionNfts.length === 0 ? (
                    <div className={cn("rounded-xl py-12 px-8 text-center", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className={cn("absolute -top-1 left-1 w-5 h-5 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                        <div className={cn("absolute -top-1 right-1 w-5 h-5 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                        <div className={cn("absolute top-0.5 left-2 w-2.5 h-2.5 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                        <div className={cn("absolute top-0.5 right-2 w-2.5 h-2.5 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                        <div className={cn("absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                          <div className="absolute top-4 left-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                          <div className="absolute top-4 right-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                          <div className={cn("absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}><div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" /></div>
                          <div className={cn("absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-1 rounded-t-full border-t-[1.5px] border-l-[1.5px] border-r-[1.5px]", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                        </div>
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-12 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                          {[...Array(10)].map((_, i) => (<div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />))}
                        </div>
                      </div>
                      <p className={cn("text-xs font-medium tracking-widest mb-1", isDark ? "text-white/60" : "text-gray-500")}>NO NFTS FOUND</p>
                      <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline">Browse collections</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {collectionNfts.map((nft) => (
                        <div key={nft.id} className={cn("rounded-xl overflow-hidden group", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                          <div className="relative">
                            {nft.image ? (
                              <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className={cn("w-full aspect-square flex items-center justify-center text-[11px]", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>No image</div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Link href={`/nft/${nft.nftId}`} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors">
                                <ExternalLink size={12} /> View
                              </Link>
                              <button onClick={() => setNftToTransfer(nft)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[11px] font-medium flex items-center gap-1 transition-colors">
                                <Send size={12} /> Send
                              </button>
                              <button onClick={() => setNftToSell(nft)} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-[11px] font-medium flex items-center gap-1 transition-colors">
                                <ArrowUpRight size={12} /> Sell
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{nft.name}</p>
                            {nft.rarity > 0 && <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>Rank #{nft.rarity}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : collectionsLoading ? (
                <div className={cn("p-12 text-center", isDark ? "text-white/40" : "text-gray-400")}>Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className={cn("rounded-xl p-12 text-center", isDark ? "bg-white/[0.04] border border-blue-500/15" : "bg-white border border-blue-200/50")}>
                  <Image size={40} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                  <p className={cn("text-[13px] font-medium mb-1", isDark ? "text-white/50" : "text-gray-500")}>No NFTs found</p>
                  <p className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>NFTs you own will appear here</p>
                  <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline mt-2 inline-block">Browse collections</a>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {collections.map((col) => (
                    <button key={col.id} onClick={() => setSelectedCollection(col.name)} className={cn("rounded-xl overflow-hidden text-left group", isDark ? "bg-white/[0.04] border border-blue-500/15 hover:border-blue-500/30" : "bg-white border border-blue-200/50 hover:border-blue-300")}>
                      <div className="relative">
                        {col.logo ? (
                          <img src={col.logo} alt={col.name} className="w-full aspect-square object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className={cn("w-full aspect-square flex items-center justify-center text-[11px]", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>No image</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</p>
                        <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>{col.count} item{col.count !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div className={cn("max-w-5xl mx-auto px-4 py-4 mb-4 rounded-xl text-[11px] font-mono", isDark ? "bg-white/[0.02] border border-white/10" : "bg-gray-50 border border-gray-200")}>
          <div className={isDark ? "text-white/50" : "text-gray-500"}>wallet_type: <span className="text-blue-400">{debugInfo.wallet_type || 'undefined'}</span></div>
          <div className={isDark ? "text-white/50" : "text-gray-500"}>account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span></div>
          <div className={isDark ? "text-white/50" : "text-gray-500"}>walletKeyId: <span className={debugInfo.walletKeyId ? "text-emerald-400" : "text-red-400"}>{debugInfo.walletKeyId || 'undefined'}</span></div>
          <div className={isDark ? "text-white/50" : "text-gray-500"}>seed: <span className="text-emerald-400 break-all">{debugInfo.seed}</span></div>
        </div>
      )}

      <Footer />
    </>
  );
}
