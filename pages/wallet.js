import { useState, useContext, useEffect, useRef, useMemo, useCallback, startTransition, Fragment } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSelector } from 'react-redux';

// Dynamic imports — xrpl (~200KB) and crypto-js only needed during signing/hashing
let _MD5 = null;
const getMD5 = async () => { if (!_MD5) { const m = await import('crypto-js/md5'); _MD5 = m.default; } return _MD5; };
// Sync MD5 fallback for render path — uses cached module if already loaded
const md5Sync = (str) => _MD5 ? _MD5(str).toString() : str;
import { toast } from 'sonner';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import { apiFetch, submitTransaction, previewTransaction, getWalletAuthHeaders } from 'src/utils/api';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { withdrawalStorage } from 'src/utils/withdrawalStorage';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import {
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Wallet,
  Image,
  RotateCcw,
  TrendingUp,
  Building2,
  ChevronRight,
  ExternalLink,
  ArrowRightLeft,
  ArrowRight,
  ChevronDown,
  Search,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  X,
  Star,
  Coins,
  AlertTriangle,
  Clock,
  PieChart,
  Layers,
  Gem,
  Download,
  Share2,
  Trophy,
  Info,
  User,
  Shield,
  Award,
  Zap,
  Target,
  Users,
  Gift,
  Medal,
  Swords,
  Crown,
  Pencil,
  Tag,
  Loader2,
  DollarSign,
  CreditCard,
  ImageOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import BadgeShield from 'src/components/BadgeShield';
import { achievementBadges, tierConfig, rankStyles, knownRoles, knownTiers, defaultBadge } from 'src/components/badgeConfig';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });
import AccountHistory from 'src/components/AccountHistory';

const BASE_URL = 'https://api.xrpl.to';
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

// Bear icon — hoisted outside component to avoid re-creation on every render
const BearIcon = () => (
  <div className="relative w-14 h-14 mx-auto mb-3">
    <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', 'bg-gray-300 dark:bg-white/15')}>
      <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', 'bg-gray-200 dark:bg-white/10')} />
    </div>
    <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', 'bg-gray-300 dark:bg-white/15')}>
      <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', 'bg-gray-200 dark:bg-white/10')} />
    </div>
    <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', 'bg-gray-300 dark:bg-white/15')}>
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn('h-[2px] w-full', 'bg-gray-200 dark:bg-white/15')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
        ))}
      </div>
      <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
        <div className={cn('absolute w-2.5 h-[2px] rotate-45', 'bg-gray-500 dark:bg-white/40')} />
        <div className={cn('absolute w-2.5 h-[2px] -rotate-45', 'bg-gray-500 dark:bg-white/40')} />
      </div>
      <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
        <div className={cn('absolute w-2.5 h-[2px] rotate-45', 'bg-gray-500 dark:bg-white/40')} />
        <div className={cn('absolute w-2.5 h-[2px] -rotate-45', 'bg-gray-500 dark:bg-white/40')} />
      </div>
      <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', 'bg-gray-200 dark:bg-white/10')}>
        <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', 'bg-gray-400 dark:bg-white/25')} />
      </div>
    </div>
  </div>
);

// NFT image with error fallback
const NftImg = ({ src, alt, className = 'w-full aspect-square object-cover' }) => {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={cn('w-full aspect-square flex flex-col items-center justify-center gap-1', 'bg-[#F1F5F9] text-[#94A3B8] dark:bg-[#111] dark:text-[#4B5563]')}>
      <ImageOff size={16} strokeWidth={1.2} />
      <span className="text-[9px]">Unavailable</span>
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
};

// Smart balance formatting - adapts decimals based on value size
const formatBalance = (value) => {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1) return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num >= 0.01) return num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  if (num < 1e-12) return num.toExponential(2);
  // For very small numbers, show up to 8 significant decimals
  return num.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
};

export default function WalletPage() {
  const router = useRouter();
  const { tab: initialTab } = router.query;
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const metrics = useSelector(selectMetrics);
  const metricsRate =
    metrics?.[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics?.CNY : null) || 1;
  const accountLogin = accountProfile?.account;
  const address = accountLogin;

  // Prevent flash of "Connect Wallet" during SSR hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); getMD5(); }, []);

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [activitySubTab, setActivitySubTab] = useState('orders'); // 'orders' | 'history'
  const [profileSection, setProfileSection] = useState(null); // null | 'referral' | 'addresses'
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
      // Map legacy tab names to new consolidated tabs
      const tabMap = { offers: 'activity', trades: 'activity', withdrawals: 'profile', referral: 'profile' };
      setActiveTab(tabMap[initialTab] || initialTab);
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
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedToken, setSelectedToken] = useState('XRP');
  const [showPanel, setShowPanel] = useState(null); // 'send' | 'receive' | null
  const [sending, setSending] = useState(false);
  const [sendPreview, setSendPreview] = useState(null); // { tx, wallet, engine_result, engine_result_message, delivered_amount, fee }

  const [destWarnings, setDestWarnings] = useState([]); // ['disallowXrp', 'blackholed', 'notActivated']

  // Clear preview when inputs change
  useEffect(() => { setSendPreview(null); }, [sendTo, sendAmount, sendTag, selectedToken]);

  // Check destination account flags when address looks valid
  useEffect(() => {
    setDestWarnings([]);
    if (!sendTo || !sendTo.startsWith('r') || sendTo.length < 25) return;
    let cancelled = false;
    const checkDest = async () => {
      try {
        const res = await fetch(`/api/proxy/v1/submit/account/${sendTo}/sequence`).then(r => r.json());
        if (cancelled) return;
        if (!res.success) {
          setDestWarnings(['notActivated']);
          return;
        }
        const flags = res.flags || 0;
        const warnings = [];
        // lsfRequireDestTag = 0x20000 (131072)
        if ((flags & 0x20000)) warnings.push('requireDestTag');
        // lsfDisallowXRP = 0x80000 (524288)
        if ((flags & 0x80000) && selectedToken === 'XRP') warnings.push('disallowXrp');
        // lsfDepositAuth = 0x1000000 (16777216)
        if ((flags & 0x1000000)) warnings.push('depositAuth');
        // Blackholed: lsfDisableMaster (0x100000) + regularKey is a blackhole address
        const BLACKHOLES = ['rrrrrrrrrrrrrrrrrrrrBZbvji', 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'];
        if ((flags & 0x100000) && (!res.regularKey || BLACKHOLES.includes(res.regularKey))) warnings.push('blackholed');
        setDestWarnings(warnings);
      } catch {}
    };
    const timeout = setTimeout(checkDest, 400); // debounce
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [sendTo, selectedToken]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tokenSort, setTokenSort] = useState('value');
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [tokenPage, setTokenPage] = useState(1);
  const tokensPerPage = 20;

  // Referral state
  const [referralUser, setReferralUser] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralEarnings, setReferralEarnings] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralFetched, setReferralFetched] = useState(false);
  const [referralForm, setReferralForm] = useState({ referralCode: '', referredBy: '' });
  const [referralError, setReferralError] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState('');

  // Profile state
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Avatar NFT state
  const [avatarNfts, setAvatarNfts] = useState([]);
  const [avatarNftsLoading, setAvatarNftsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [settingAvatar, setSettingAvatar] = useState(false);

  // Wallet labels state
  const [walletLabels, setWalletLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [newLabelWallet, setNewLabelWallet] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [deletingLabel, setDeletingLabel] = useState(null);

  // Tier state
  const [tiers, setTiers] = useState({});
  const [tierXrpUsd, setTierXrpUsd] = useState(null);
  const [userPerks, setUserPerks] = useState(null);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [xrpInvoice, setXrpInvoice] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [walletPayStatus, setWalletPayStatus] = useState(null); // 'signing' | 'submitting' | 'verifying'
  const [displayBadges, setDisplayBadges] = useState({ current: null, available: [] });
  const [settingBadge, setSettingBadge] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

  // Centralized seed retrieval — single source of truth for all signing operations
  const getSigningWallet = async () => {
    const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
    const storage = new EncryptedWalletStorage();
    let password = null;

    if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
      const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
      password = await storage.getSecureItem(`wallet_pwd_${walletId}`);
    } else if (accountProfile.wallet_type === 'device') {
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      if (deviceKeyId) password = await storage.getWalletCredential(deviceKeyId);
    }

    if (!password) return null;
    const walletData = await storage.getWallet(accountProfile.account, password);
    if (!walletData?.seed) return null;

    const { Wallet: XRPLWallet } = await import('xrpl');
    return XRPLWallet.fromSeed(walletData.seed, { algorithm: getAlgorithmFromSeed(walletData.seed) });
  };

  const handleRemoveTrustline = async (token) => {
    if (!token.currency || !token.issuer) return;
    setRemovingTrustline(token.currency + token.issuer);
    const toastId = toast.loading(`Removing ${token.symbol}...`, { description: 'Connecting to XRPL' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      toast.loading(`Removing ${token.symbol}...`, { id: toastId, description: 'Checking account flags' });

      // Check account's defaultRipple flag via API
      const infoRes = await apiFetch(`https://api.xrpl.to/v1/account/info/${address}`).then(r => r.json());
      const accountFlags = infoRes.flags || 0;
      const hasDefaultRipple = (accountFlags & 0x00800000) !== 0; // lsfDefaultRipple

      // tfSetNoRipple = 131072, tfClearNoRipple = 262144
      const trustSetFlag = hasDefaultRipple ? 262144 : 131072;

      const tx = {
        TransactionType: 'TrustSet',
        Account: address,
        SourceTag: 161803,
        LimitAmount: {
          currency: token.currency,
          issuer: token.issuer,
          value: '0'
        },
        Flags: trustSetFlag
      };

      toast.loading(`Removing ${token.symbol}...`, { id: toastId, description: 'Submitting to XRPL' });
      const result = await submitTransaction(wallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      setTokens(prev => prev.filter(t => !(t.currency === token.currency && t.issuer === token.issuer)));
      toast.success(`${token.symbol} trustline removed`, {
        id: toastId,
        duration: 6000,
        description: <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline flex items-center gap-1">View transaction <ExternalLink size={10} /></a>
      });
    } catch (err) {
      console.error('Remove trustline error:', err);
      toast.error('Failed to remove trustline', { id: toastId, description: err.message });
    } finally {
      setRemovingTrustline(null);
    }
  };

  const handleCancelOffer = async (offer) => {
    if (!offer.seq) return;
    setCancellingOffer(offer.seq);
    const toastId = toast.loading('Cancelling offer...', { description: 'Connecting to XRPL' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      toast.loading('Cancelling offer...', { id: toastId, description: 'Signing transaction' });

      const tx = {
        TransactionType: 'OfferCancel',
        Account: address,
        SourceTag: 161803,
        OfferSequence: offer.seq
      };

      toast.loading('Cancelling offer...', { id: toastId, description: 'Submitting to XRPL' });
      const result = await submitTransaction(wallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      setTokenOffers(prev => prev.filter(o => o.seq !== offer.seq));
      toast.success('Offer cancelled', {
        id: toastId,
        duration: 6000,
        description: <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline flex items-center gap-1">View transaction <ExternalLink size={10} /></a>
      });
    } catch (err) {
      console.error('Cancel offer error:', err);
      toast.error('Failed to cancel offer', { id: toastId, description: err.message });
    } finally {
      setCancellingOffer(null);
    }
  };

  const [sendingDust, setSendingDust] = useState(null);
  const [dustConfirm, setDustConfirm] = useState(null); // { token, step: 'dex' | 'issuer' }
  const [burnModal, setBurnModal] = useState(null); // token to burn
  const [tradeModal, setTradeModal] = useState(null); // token to trade
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeDirection, setTradeDirection] = useState('sell'); // 'sell' = token->XRP, 'buy' = XRP->token
  const [trading, setTrading] = useState(false);
  const [tradeQuote, setTradeQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [tradeSlippage, setTradeSlippage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradeSlippage');
      return saved ? parseFloat(saved) : 0.5;
    }
    return 0.5;
  });
  const [burnAmount, setBurnAmount] = useState('');
  const [burning, setBurning] = useState(null);

  // Persist slippage to localStorage
  useEffect(() => {
    localStorage.setItem('tradeSlippage', String(tradeSlippage));
  }, [tradeSlippage]);

  // Fetch quote when trade amount changes
  useEffect(() => {
    if (!tradeModal || !tradeAmount || parseFloat(tradeAmount) <= 0 || !tradeModal.currency || !tradeModal.issuer) {
      setTradeQuote(null);
      return;
    }
    const price = tradeModal.price || tradeModal.exch || 0;
    if (price <= 0) {
      setTradeQuote({ error: 'No price data' });
      return;
    }
    const timeout = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const amt = parseFloat(tradeAmount);
        const body = tradeDirection === 'sell'
          ? {
            source_account: address || 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
            destination_amount: { currency: tradeModal.currency, issuer: tradeModal.issuer, value: String(amt) },
            source_currencies: [{ currency: 'XRP' }],
            slippage: tradeSlippage / 100
          }
          : {
            source_account: address || 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
            destination_amount: { currency: tradeModal.currency, issuer: tradeModal.issuer, value: String(amt / price) },
            source_currencies: [{ currency: 'XRP' }],
            slippage: tradeSlippage / 100
          };
        const res = await api.post('https://api.xrpl.to/api/dex/quote', body);
        if (res.data?.status === 'success' && res.data.quote) {
          setTradeQuote(res.data.quote);
        } else {
          // Fallback: use price estimate
          const estXrp = amt * price; // XRP value of tokens
          const estToken = amt / price; // Tokens for XRP amount
          setTradeQuote({
            source_amount: tradeDirection === 'sell'
              ? { currency: 'XRP', value: String(estXrp * 0.995) }
              : { currency: 'XRP', value: String(amt) },
            destination_amount: tradeDirection === 'sell'
              ? { currency: tradeModal.currency, value: String(amt) }
              : { currency: tradeModal.currency, value: String(estToken * 0.995) },
            minimum_received: String((tradeDirection === 'sell' ? estXrp : estToken) * 0.995),
            fallback: true
          });
        }
      } catch (err) {
        // Fallback on error
        const amt = parseFloat(tradeAmount);
        const estXrp = amt * price;
        const estToken = amt / price;
        setTradeQuote({
          source_amount: tradeDirection === 'sell'
            ? { currency: 'XRP', value: String(estXrp * 0.995) }
            : { currency: 'XRP', value: String(amt) },
          destination_amount: tradeDirection === 'sell'
            ? { currency: tradeModal.currency, value: String(amt) }
            : { currency: tradeModal.currency, value: String(estToken * 0.995) },
          minimum_received: String((tradeDirection === 'sell' ? estXrp : estToken) * 0.995),
          fallback: true
        });
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [tradeModal, tradeAmount, tradeDirection, address]);

  const handleBurnTokens = async (token, amount) => {
    if (!token.currency || !token.issuer || !amount || parseFloat(amount) <= 0) return;
    setBurning(token.currency + token.issuer);
    setBurnModal(null);
    const toastId = toast.loading(`Burning ${token.symbol}...`, { description: 'Connecting to XRPL' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setBurning(null);
        return;
      }

      toast.loading(`Burning ${token.symbol}...`, { id: toastId, description: 'Checking issuer...' });

      // Check issuer flags via API (lsfRequireDestTag = 0x00020000)
      const issuerInfo = await apiFetch(`https://api.xrpl.to/v1/account/info/${token.issuer}`).then(r => r.json());
      const requiresTag = (issuerInfo.flags & 0x00020000) !== 0;

      const tx = {
        TransactionType: 'Payment',
        Account: address,
        SourceTag: 161803,
        Destination: token.issuer,
        Amount: {
          currency: token.currency,
          issuer: token.issuer,
          value: amount
        }
      };
      if (requiresTag) tx.DestinationTag = 0;

      toast.loading(`Burning ${token.symbol}...`, { id: toastId, description: 'Submitting to XRPL' });
      const result = await submitTransaction(wallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      const newBalance = token.rawAmount - parseFloat(amount);
      setTokens(prev => prev.map(t =>
        t.currency === token.currency && t.issuer === token.issuer
          ? { ...t, rawAmount: newBalance, amount: formatBalance(newBalance) }
          : t
      ));
      const tweetText = encodeURIComponent(`I just burned ${amount} $${token.symbol} 🔥\n\nhttps://xrpl.to/tx/${txHash}\n\n@xrplto`);
      toast.success(`${amount} ${token.symbol} burned`, {
        id: toastId,
        duration: 15000,
        closeButton: true,
        description: <span className="flex items-center gap-2">
          <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a>
          <span className="text-white/30">•</span>
          <a href={`https://twitter.com/intent/tweet?text=${tweetText}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">Tweet</a>
        </span>
      });
    } catch (err) {
      console.error('Burn error:', err);
      toast.error('Burn failed', { id: toastId, description: err.message });
    } finally {
      setBurning(null);
      setBurnAmount('');
    }
  };

  const handleCreateSellOffer = async () => {
    if (!nftToSell || !nftSellPrice || parseFloat(nftSellPrice) <= 0) return;
    setCreatingSellOffer(true);
    const toastId = toast.loading('Creating sell offer...', { description: 'Connecting...' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setCreatingSellOffer(false);
        return;
      }

      toast.loading('Creating sell offer...', { id: toastId, description: 'Signing transaction...' });
      const priceInDrops = String(Math.floor(parseFloat(nftSellPrice) * 1000000));
      const tx = {
        TransactionType: 'NFTokenCreateOffer',
        Account: address,
        NFTokenID: nftToSell.nftId,
        Amount: priceInDrops,
        Flags: 1,
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Sell offer created!', {
          id: toastId,
          duration: 10000,
          description: <a href={`/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View transaction</a>
        });
        setNftToSell(null);
        setNftSellPrice('');
        setNftOffers([]);
        setTokenOffers([]);
      } else {
        toast.error('Failed to create offer', { id: toastId, description: result.engine_result });
      }
    } catch (err) {
      console.error('NFT sell offer error:', err);
      toast.error('Failed to create offer', { id: toastId, description: err.message });
    } finally {
      setCreatingSellOffer(false);
    }
  };

  const handleCancelNftOffer = async (offer) => {
    if (!offer?.id) return;
    setCancellingNftOffer(offer.id);
    const toastId = toast.loading('Cancelling offer...', { description: 'Connecting...' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setCancellingNftOffer(null);
        return;
      }

      toast.loading('Cancelling offer...', { id: toastId, description: 'Signing transaction...' });
      const tx = {
        TransactionType: 'NFTokenCancelOffer',
        Account: address,
        NFTokenOffers: [offer.id],
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Offer cancelled', { id: toastId });
        setNftOffers(prev => prev.filter(o => o.id !== offer.id));
      } else {
        toast.error('Failed to cancel', { id: toastId, description: result.engine_result });
      }
    } catch (err) {
      console.error('Cancel NFT offer error:', err);
      toast.error('Failed to cancel', { id: toastId, description: err.message });
    } finally {
      setCancellingNftOffer(null);
    }
  };

  const handleTrade = async () => {
    if (!tradeModal || !tradeAmount || parseFloat(tradeAmount) <= 0 || !tradeQuote || tradeQuote.error) return;
    setTrading(true);
    const toastId = toast.loading(`Trading ${tradeModal.symbol}...`, { description: 'Connecting to XRPL' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setTrading(false);
        return;
      }

      toast.loading(`Trading ${tradeModal.symbol}...`, { id: toastId, description: 'Executing swap...' });
      const slippage = tradeSlippage / 100;
      let tx;

      const formatTokenValue = (val) => {
        const n = parseFloat(val);
        if (n >= 1) return n.toPrecision(15).replace(/\.?0+$/, '');
        return n.toFixed(Math.min(15, Math.max(6, -Math.floor(Math.log10(n)) + 6)));
      };

      if (tradeDirection === 'sell') {
        const tokenAmount = parseFloat(tradeAmount);
        const expectedXrp = parseFloat(tradeQuote.source_amount?.value || (tokenAmount * (tradeModal.price || 0)));
        const minXrpDrops = Math.max(Math.floor(expectedXrp * (1 - slippage) * 1000000), 1);
        const targetXrpDrops = Math.floor(expectedXrp * 1000000);

        tx = {
          TransactionType: 'Payment',
          Account: address,
          SourceTag: 161803,
          Destination: address,
          Amount: String(targetXrpDrops),
          DeliverMin: String(minXrpDrops),
          SendMax: { currency: tradeModal.currency, issuer: tradeModal.issuer, value: formatTokenValue(tokenAmount * 1.005) },
          Flags: 131072
        };
      } else {
        const xrpAmount = parseFloat(tradeAmount);
        const expectedTokens = parseFloat(tradeQuote.destination_amount?.value || (xrpAmount / (tradeModal.price || 1)));

        tx = {
          TransactionType: 'Payment',
          Account: address,
          SourceTag: 161803,
          Destination: address,
          Amount: { currency: tradeModal.currency, issuer: tradeModal.issuer, value: formatTokenValue(expectedTokens) },
          DeliverMin: { currency: tradeModal.currency, issuer: tradeModal.issuer, value: formatTokenValue(expectedTokens * (1 - slippage)) },
          SendMax: String(Math.floor(xrpAmount * 1.005 * 1000000)),
          Flags: 131072
        };
      }

      const result = await submitTransaction(wallet, tx);
      const txLink = <a href={`/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a>;

      if (result.success) {
        toast.success('Trade executed', { id: toastId, description: txLink });
        setTradeModal(null);
        setTradeAmount('');
        setTradeQuote(null);
      } else if (result.engine_result === 'tecKILLED') {
        toast.error('No liquidity at this price', { id: toastId, description: <span>Offer couldn't be filled. {txLink}</span> });
      } else {
        toast.error('Trade failed', { id: toastId, description: <span>{result.engine_result} {txLink}</span> });
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error('Trade failed', { id: toastId, description: err.message });
    } finally {
      setTrading(false);
    }
  };

  // Build the payment tx_json from current form state
  const buildSendTx = () => {
    const amount = parseFloat(sendAmount);
    const token = activeToken;
    let tx;

    if (selectedToken === 'XRP') {
      tx = {
        TransactionType: 'Payment',
        Account: address,
        SourceTag: 161803,
        Destination: sendTo,
        Amount: String(Math.floor(amount * 1000000))
      };
    } else if (token?.currency && token?.issuer) {
      tx = {
        TransactionType: 'Payment',
        Account: address,
        SourceTag: 161803,
        Destination: sendTo,
        Amount: { currency: token.currency, issuer: token.issuer, value: String(amount) }
      };
    } else {
      return null;
    }

    if (sendTag && !isNaN(parseInt(sendTag))) {
      tx.DestinationTag = parseInt(sendTag);
    }
    return tx;
  };

  // Step 1: Preview (simulate) the transaction
  const handleSendPreview = async () => {
    if (!sendTo || !sendAmount) { toast.error('Missing destination or amount'); return; }
    if (!sendTo.startsWith('r') || sendTo.length < 25) { toast.error('Invalid destination address'); return; }
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Invalid amount'); return; }

    setSending(true);
    try {
      const wallet = await getSigningWallet();
      if (!wallet) { toast.error('Authentication failed', { description: 'Could not retrieve wallet credentials' }); setSending(false); return; }

      const tx = buildSendTx();
      if (!tx) { toast.error('Token not found'); setSending(false); return; }

      const preview = await previewTransaction(tx);
      setSendPreview({
        tx,
        wallet,
        engine_result: preview.engine_result,
        engine_result_message: preview.engine_result_message,
        delivered_amount: preview.delivered_amount,
        fee: preview.meta?.Fee || tx.Fee || '12',
        success: preview.success
      });
    } catch (err) {
      console.error('[handleSendPreview] Error:', err);
      toast.error('Preview failed', { description: err.message });
    } finally {
      setSending(false);
    }
  };

  // Step 2: Confirm and submit the transaction
  const handleSendConfirm = async () => {
    if (!sendPreview?.tx || !sendPreview?.wallet) return;
    setSending(true);
    const toastId = toast.loading(`Sending ${sendAmount} ${selectedToken}...`, { description: 'Submitting to XRPL' });

    try {
      const result = await submitTransaction(sendPreview.wallet, sendPreview.tx);
      const txLink = <a href={`/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a>;

      if (result.success) {
        toast.success(`Sent ${sendAmount} ${selectedToken}`, { id: toastId, description: txLink, duration: 8000 });
        setSendAmount('');
        setSendTo('');
        setSendTag('');
        setSendPreview(null);
        setShowPanel(null);
      } else {
        toast.error('Send failed', { id: toastId, description: <span>{result.engine_result} {txLink}</span> });
      }
    } catch (err) {
      console.error('[handleSend] Error:', err);
      toast.error('Send failed', { id: toastId, description: err.message });
    } finally {
      setSending(false);
    }
  };

  // Legacy alias
  const handleSend = handleSendPreview;

  const executeDustClear = async (token, method) => {
    if (!token?.currency || !token?.issuer || token.rawAmount === 0) return;
    setSendingDust(token.currency + token.issuer);
    setDustConfirm(null);
    const toastId = toast.loading(`Clearing ${token.symbol} dust...`, { description: method === 'dex' ? 'Selling on DEX' : 'Sending to issuer' });

    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      if (method === 'dex') {
        const offerTx = {
          TransactionType: 'OfferCreate',
          Account: address,
          SourceTag: 161803,
          TakerGets: '1',
          TakerPays: { currency: token.currency, issuer: token.issuer, value: String(token.rawAmount) },
          Flags: 655360
        };
        const offerResult = await submitTransaction(wallet, offerTx);
        const txHash = offerResult.hash || offerResult.tx_json?.hash;
        setTokens(prev => prev.map(t =>
          t.currency === token.currency && t.issuer === token.issuer ? { ...t, rawAmount: 0, amount: '0' } : t
        ));
        toast.success(`${token.symbol} dust sold on DEX`, {
          id: toastId,
          duration: 6000,
          description: <span>Balance cleared. <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a></span>
        });
      } else {
        // Check issuer flags via API (lsfRequireDestTag = 0x00020000)
        const issuerInfo = await apiFetch(`https://api.xrpl.to/v1/account/info/${token.issuer}`).then(r => r.json());
        const needsTag = (issuerInfo.flags & 0x00020000) !== 0;
        const tx = {
          TransactionType: 'Payment',
          Account: address,
          SourceTag: 161803,
          Destination: token.issuer,
          Amount: { currency: token.currency, issuer: token.issuer, value: String(token.rawAmount) }
        };
        if (needsTag) tx.DestinationTag = 0;

        const result = await submitTransaction(wallet, tx);
        const txHash = result.hash || result.tx_json?.hash;
        setTokens(prev => prev.map(t =>
          t.currency === token.currency && t.issuer === token.issuer ? { ...t, rawAmount: 0, amount: '0' } : t
        ));
        toast.success(`${token.symbol} dust burned`, {
          id: toastId,
          duration: 6000,
          description: <span>Balance cleared. <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a></span>
        });
      }
    } catch (err) {
      console.error('Dust clear error:', err);
      toast.error('Failed to clear dust', { id: toastId, description: err.message });
    } finally {
      setSendingDust(null);
    }
  };

  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [sendTokenSearch, setSendTokenSearch] = useState('');
  const sendSearchRef = useRef(null);
  const [allTokensLoaded, setAllTokensLoaded] = useState(false);
  const [loadingAllTokens, setLoadingAllTokens] = useState(false);
  const [nftToTransfer, setNftToTransfer] = useState(null);
  const [nftRecipient, setNftRecipient] = useState('');
  const [nftToSell, setNftToSell] = useState(null);
  const [nftSellPrice, setNftSellPrice] = useState('');
  const [creatingSellOffer, setCreatingSellOffer] = useState(false);
  const [cancellingNftOffer, setCancellingNftOffer] = useState(null);

  // Tokens state
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [xrpData, setXrpData] = useState(null);

  // NFTs state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsForAccount, setCollectionsForAccount] = useState(null);
  const [nftPortfolioValue, setNftPortfolioValue] = useState(0);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);

  // Offers state
  const [tokenOffers, setTokenOffers] = useState([]);
  const [nftOffers, setNftOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersForAccount, setOffersForAccount] = useState(null);

  // Withdrawal addresses state
  const [withdrawals, setWithdrawals] = useState([]);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({ name: '', address: '', tag: '' });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [removingTrustline, setRemovingTrustline] = useState(null);
  const [cancellingOffer, setCancellingOffer] = useState(null);
  const [withdrawalError, setWithdrawalError] = useState('');

  // Account status
  const [isInactive, setIsInactive] = useState(false);

  // Account info & trading stats
  const [accountInfo, setAccountInfo] = useState(null);
  const [nftStats, setNftStats] = useState(null);
  const [showPLCard, setShowPLCard] = useState(false);
  const [plType, setPlType] = useState('combined'); // 'token' | 'nft' | 'combined'
  const plCardRef = useRef(null);
  const [tokenPnlMap, setTokenPnlMap] = useState(new Map());
  const [nftCollectionPnlMap, setNftCollectionPnlMap] = useState(new Map());

  // Reset account-specific state when switching wallets so stale data doesn't persist
  const prevAddressRef = useRef(address);
  useEffect(() => {
    if (prevAddressRef.current && prevAddressRef.current !== address) {
      setCollections([]);
      setCollectionsForAccount(null);
      setCollectionNfts([]);
      setNftPortfolioValue(0);
      setTokenOffers([]);
      setNftOffers([]);
      setOffersForAccount(null);
      setAccountInfo(null);
      setNftStats(null);
      setTokenPnlMap(new Map());
      setNftCollectionPnlMap(new Map());
      setReferralUser(null);
      setReferralStats(null);
      setReferralEarnings(null);
      setReferralFetched(false);
    }
    prevAddressRef.current = address;
  }, [address]);

  // Token parsing helper
  const parseTokenLine = (line) => {
    const t = line.token || {};
    const change = t.pro24h ?? 0;
    const displayName = t.name || t.user || 'Unknown';
    const price = t.exch || 0;
    const balance = Math.abs(parseFloat(line.balance || 0));
    return {
      symbol: displayName,
      name: t.user || displayName,
      amount: formatBalance(balance),
      rawAmount: balance,
      value: line.value
        ? `${line.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
        : '0 XRP',
      rawValue: line.value || 0,
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      positive: change >= 0,
      color: t.color || '#4285f4',
      icon: t.icon || null,
      slug: t.slug || null,
      issuer: line.issuer,
      currency: line.currency,
      md5: t.md5 || null,
      // Additional fields
      price: price,
      priceDisplay: (() => {
        if (price >= 1) return price.toFixed(4);
        if (price < 0.01 && price > 0) {
          const str = price.toFixed(15);
          const zeros = (str.match(/0\.0*/)?.[0]?.length || 2) - 2;
          if (zeros >= 4) {
            const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '').slice(0, 4);
            return { compact: true, zeros, significant };
          }
        }
        return price > 0 ? price.toFixed(8).replace(/0+$/, '').replace(/\.$/, '') : '0';
      })(),
      vol24h: t.vol24hxrp || t.vol24h || 0,
      marketcap: t.marketcap || 0,
      holders: t.holders || 0,
      trustlines: t.trustlines || 0,
      percentOwned: line.percentOwned || 0,
      verified: t.verified || false,
      kyc: t.kyc || false,
      tags: t.tags || [],
      domain: t.domain || null,
      tvl: t.tvl || 0
    };
  };


  // Token pagination state
  const [tokenTotal, setTokenTotal] = useState(0);
  const [tokenOffset, setTokenOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const TOKEN_LIMIT = 50;

  // Load tokens from API
  useEffect(() => {
    const controller = new AbortController();
    const fetchTokens = async () => {
      if (!address) return;
      setTokensLoading(true);
      setIsInactive(false);
      setTokens([]);
      setTokenOffset(0);
      setAllTokensLoaded(false);
      setSendTokens([]);
      sendTokensRef.current = [];
      try {
        const res = await apiFetch(
          `${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&includeZero=true&limit=${TOKEN_LIMIT}&offset=0`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.success) {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
          setTokenTotal(data.total || 0);
          setTokenOffset(data.lines?.length || 0);
          setIsInactive(false);
        } else {
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

  // Load more tokens when paginating
  useEffect(() => {
    const neededTokens = tokenPage * tokensPerPage;
    if (neededTokens > tokens.length && tokenOffset < tokenTotal && !loadingMore) {
      const fetchMore = async () => {
        setLoadingMore(true);
        try {
          const res = await fetch(
            `${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&includeZero=true&limit=${TOKEN_LIMIT}&offset=${tokenOffset}`
          );
          const data = await res.json();
          if (data.success && data.lines) {
            setTokens(prev => [...prev, ...data.lines.map(parseTokenLine)]);
            setTokenOffset(prev => prev + data.lines.length);
          }
        } catch (e) {
          console.error('Failed to load more tokens:', e);
        } finally {
          setLoadingMore(false);
        }
      };
      fetchMore();
    }
  }, [tokenPage, tokens.length, tokenOffset, tokenTotal, loadingMore, address]);

  // Load all tokens for send dropdown (triggered when dropdown opens with many tokens)
  const sendTokensRef = useRef([]);
  const [sendTokens, setSendTokens] = useState([]);
  const loadAllTokensForSend = async () => {
    if (allTokensLoaded || loadingAllTokens || !address || tokens.length >= tokenTotal) {
      setAllTokensLoaded(true);
      return;
    }
    setLoadingAllTokens(true);
    try {
      let offset = tokens.length;
      while (offset < tokenTotal) {
        const res = await apiFetch(`${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&includeZero=true&limit=200&offset=${offset}`);
        const data = await res.json();
        if (!data.success || !data.lines?.length) break;
        const chunk = data.lines.map(parseTokenLine);
        offset += data.lines.length;
        sendTokensRef.current = [...sendTokensRef.current, ...chunk];
        // Low-priority update — won't block typing/interactions
        startTransition(() => {
          setSendTokens([...sendTokensRef.current]);
        });
      }
      setAllTokensLoaded(true);
    } catch (e) {
      console.error('Failed to load all tokens:', e);
    } finally {
      setLoadingAllTokens(false);
    }
  };

  // Load withdrawals from IndexedDB
  useEffect(() => {
    const loadWithdrawals = async () => {
      if (!address) return;
      console.time('[Wallet] loadWithdrawals');
      try {
        const saved = await withdrawalStorage.getAll(address);
        console.timeEnd('[Wallet] loadWithdrawals');
        setWithdrawals(saved);
      } catch (e) {
        console.timeEnd('[Wallet] loadWithdrawals');
        console.error('Failed to load withdrawals:', e);
      }
    };
    loadWithdrawals();
  }, [address]);

  // Load account info (creation date, reserve, objects, trading stats)
  useEffect(() => {
    if (!address) return;
    console.time('[Wallet] fetchAccountInfo');
    Promise.all([
      apiFetch(`${BASE_URL}/v1/account/balance/${address}?rank=true`).then(res => res.json()).catch(() => null),
      apiFetch(`${BASE_URL}/v1/traders/${address}`).then(res => res.json()).catch(() => null),
      apiFetch(`${BASE_URL}/v1/nft/analytics/trader/${address}`).then(res => res.json()).catch(() => null),
      apiFetch(`${BASE_URL}/v1/nft/analytics/trader/${address}/collections?sort=profit`).then(res => res.json()).catch(() => null)
    ]).then(([balanceData, traderData, nftData, nftColData]) => {
      console.timeEnd('[Wallet] fetchAccountInfo');
      const merged = { ...balanceData };
      if (traderData && !traderData.error) {
        merged.tradingRank = traderData.rank;
        merged.pnl = traderData.profit;
        merged.roi = traderData.roi;
        merged.totalTrades = traderData.totalTrades;
        merged.totalTokensTraded = traderData.totalTokensTraded;
        merged.winRate = traderData.winRate;
        merged.winningTrades = traderData.winningTrades;
        merged.losingTrades = traderData.losingTrades;
        merged.maxProfitTrade = traderData.maxProfitTrade;
        merged.maxLossTrade = traderData.maxLossTrade;
        merged.buyVolume = traderData.buyVolume;
        merged.sellVolume = traderData.sellVolume;
        merged.unrealizedPnl = traderData.unrealizedPnl;
        merged.totalPnl = traderData.totalPnl;
        merged.totalRoi = traderData.totalRoi;
        merged.volume24h = traderData.volume24h;
        merged.profit24h = traderData.profit24h;
        merged.trades24h = traderData.trades24h;
        merged.firstTradeDate = traderData.firstTradeDate;
        merged.lastTradeDate = traderData.lastTradeDate;

        // Build per-token P&L map from tokenPerformance
        if (Array.isArray(traderData.tokenPerformance)) {
          const pnlMap = new Map();
          traderData.tokenPerformance.forEach(tp => {
            if (tp.tokenId) {
              pnlMap.set(tp.tokenId, {
                profit: tp.totalPnl ?? tp.profit ?? 0,
                roi: tp.totalRoi ?? tp.roi ?? 0,
                volume: tp.volume || 0,
                trades: tp.trades || 0
              });
            }
          });
          setTokenPnlMap(pnlMap);
        }
      }
      setAccountInfo(merged);
      if (nftData && !nftData.error) {
        setNftStats(nftData);
      }
      if (nftColData && Array.isArray(nftColData.collections)) {
        const pnlMap = new Map();
        nftColData.collections.forEach(c => {
          if (c.name) {
            pnlMap.set(c.name, {
              profit: c.profit || 0,
              roi: c.roi || 0,
              trades: c.trades || 0
            });
          }
        });
        setNftCollectionPnlMap(pnlMap);
      }
    }).catch(() => console.timeEnd('[Wallet] fetchAccountInfo'));
  }, [address]);




  // Load NFT collections summary - only when NFTs tab is active
  useEffect(() => {
    if ((activeTab !== 'nfts' && activeTab !== 'overview') || !address || collectionsForAccount === address) return;
    const controller = new AbortController();
    const fetchCollections = async () => {
      setCollectionsLoading(true);
      console.time('[Wallet] fetchNftCollections');
      try {
        const res = await apiFetch(`${BASE_URL}/api/nft/account/${address}/nfts`, {
          signal: controller.signal
        });
        const data = await res.json();
        console.timeEnd('[Wallet] fetchNftCollections');
        if (data.collections) {
          setCollections(
            data.collections.map((col) => ({
              id: col._id,
              name: col.name,
              slug: col.slug,
              count: col.count,
              logo: col.logoImage ? `https://s1.xrpl.to/nft-collection/${col.logoImage}` : '',
              floor: col.floor || 0,
              floor24hAgo: col.floor24hAgo || 0,
              value: col.value || 0
            }))
          );
          setNftPortfolioValue(data.portfolioValue || 0);
        }
        setCollectionsForAccount(address);
      } catch (e) {
        console.timeEnd('[Wallet] fetchNftCollections');
        if (e.name !== 'AbortError') console.error('Failed to load collections:', e);
      } finally {
        if (!controller.signal.aborted) setCollectionsLoading(false);
      }
    };
    fetchCollections();
    return () => controller.abort();
  }, [activeTab, address]);

  // Load offers (DEX + NFT) - only when Activity tab is active
  useEffect(() => {
    if ((activeTab !== 'activity' && activeTab !== 'overview') || !address || offersForAccount === address) return;
    const controller = new AbortController();
    const fetchOffers = async () => {
      setOffersLoading(true);
      console.time('[Wallet] fetchOffers (DEX+NFT)');
      try {
        const [dexRes, nftRes] = await Promise.all([
          apiFetch(`${BASE_URL}/api/account/offers/${address}`, { signal: controller.signal }),
          apiFetch(`${BASE_URL}/api/nft/account/${address}/offers?limit=50`, {
            signal: controller.signal
          })
        ]);
        const [dexData, nftData] = await Promise.all([dexRes.json(), nftRes.json()]);
        console.timeEnd('[Wallet] fetchOffers (DEX+NFT)');
        if (dexData.success && dexData.offers) {
          setTokenOffers(
            dexData.offers.map((offer) => {
              const gets = offer.gets || offer.taker_gets || offer.TakerGets;
              const pays = offer.pays || offer.taker_pays || offer.TakerPays;
              const getsAmt = parseFloat(gets?.value || 0);
              const getsCur = gets?.name || gets?.currency || 'XRP';
              const paysAmt = parseFloat(pays?.value || 0);
              const paysCur = pays?.name || pays?.currency || 'XRP';
              // Always show rate as XRP/token so it matches API distPct direction
              let rate, ratePair;
              if (getsCur === 'XRP' && paysAmt > 0) {
                rate = getsAmt / paysAmt; // XRP per token (selling token for XRP)
                ratePair = `XRP/${paysCur}`;
              } else if (paysCur === 'XRP' && getsAmt > 0) {
                rate = paysAmt / getsAmt; // XRP per token (buying token with XRP)
                ratePair = `XRP/${getsCur}`;
              } else {
                rate = getsAmt > 0 ? paysAmt / getsAmt : 0;
                ratePair = `${paysCur}/${getsCur}`;
              }
              const rateDisplay =
                rate > 0
                  ? rate >= 1
                    ? rate.toLocaleString(undefined, { maximumFractionDigits: 4 })
                    : rate.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
                  : '';
              return {
                id: offer.seq || offer.Sequence,
                type: paysCur === 'XRP' ? 'buy' : 'sell',
                from: `${getsAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${getsCur}`,
                to: `${paysAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${paysCur}`,
                rate: rateDisplay ? `${rateDisplay} ${ratePair}` : '',
                seq: offer.seq || offer.Sequence,
                funded: offer.funded !== false,
                distPct: offer.distPct,
                expire: offer.expire || null
              };
            })
          );
        }
        const parseNftOffer = (offer, type) => ({
          id: offer._id,
          nftId: offer.NFTokenID,
          name: offer.meta?.name || 'NFT',
          collection: offer.collecion || offer.collection || offer.cslug || '',
          image: offer.files?.[0]?.thumbnail?.small
            ? `https://s1.xrpl.to/nft/${offer.files[0].thumbnail.small}`
            : '',
          price:
            typeof offer.amount === 'number' ? (offer.amount / 1000000) : 0,
          floor: offer.floor || 0,
          floorDiffPct: offer.floorDiffPct || 0,
          type,
          fraud: offer.fraud || false,
          fraudType: offer.fraudType || null
        });
        const sellOffers = (nftData.offers || []).map((o) => parseNftOffer(o, 'sell'));
        const buyOffers = (nftData.incomingOffers || []).map((o) => parseNftOffer(o, 'buy'));
        setNftOffers([...sellOffers, ...buyOffers]);
        setOffersForAccount(address);
      } catch (e) {
        console.timeEnd('[Wallet] fetchOffers (DEX+NFT)');
        if (e.name !== 'AbortError') console.error('Failed to load offers:', e);
      } finally {
        if (!controller.signal.aborted) setOffersLoading(false);
      }
    };
    fetchOffers();
    return () => controller.abort();
  }, [activeTab, address]);

  // Fetch more tokens when Tokens tab opened
  useEffect(() => {
    if (activeTab !== 'tokens' || !address || tokens.length >= 50) return;
    const controller = new AbortController();
    const fetchMore = async () => {
      setTokensLoading(true);
      console.time('[Wallet] fetchMoreTokens (tab)');
      try {
        const res = await fetch(
          `${BASE_URL}/api/trustlines/${address}?format=full&sortByValue=true&limit=50&includeZero=true`,
          { signal: controller.signal }
        );
        const data = await res.json();
        console.timeEnd('[Wallet] fetchMoreTokens (tab)');
        if (data.success) {
          setXrpData({ ...data.accountData, xrp: data.xrp });
          setTokens(data.lines?.map(parseTokenLine) || []);
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchMoreTokens (tab)');
        if (e.name !== 'AbortError') console.error('Failed to load more tokens:', e);
      } finally {
        if (!controller.signal.aborted) setTokensLoading(false);
      }
    };
    fetchMore();
    return () => controller.abort();
  }, [activeTab, address]);


  // Fetch referral data
  useEffect(() => {
    if (!address || (activeTab !== 'profile' && activeTab !== 'overview')) return;
    const refParam = router.query.ref;
    if (refParam && !referralUser) setReferralForm(f => ({ ...f, referredBy: refParam }));
    const fetchReferral = async () => {
      setReferralLoading(true);
      try {
        const [profileRes, statsRes, earningsRes] = await Promise.all([
          apiFetch(`${BASE_URL}/api/referral/${address}`),
          apiFetch(`${BASE_URL}/api/referral/${address}/stats`),
          apiFetch(`${BASE_URL}/api/referral/${address}/earnings`)
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.success && data.profile) setReferralUser(data.profile);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.success && data.stats) setReferralStats(data.stats);
        }
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          if (data.success && data.earnings) setReferralEarnings(data.earnings);
        }
      } catch (e) { }
      setReferralLoading(false);
      setReferralFetched(true);
    };
    fetchReferral();
  }, [activeTab, address, router.query.ref]);

  const handleReferralRegister = async () => {
    if (!address) return;
    setReferralError('');
    if (referralForm.referralCode && referralForm.referralCode.length < 3) {
      setReferralError('Referral code must be 3-20 characters');
      return;
    }
    setReferralLoading(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/referral/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          ...(referralForm.referralCode && { referralCode: referralForm.referralCode }),
          ...(referralForm.referredBy && { referredBy: referralForm.referredBy })
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // Fetch full profile after registration
      const profileRes = await apiFetch(`${BASE_URL}/api/referral/${address}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.profile) {
          setReferralUser(profileData.profile);
        } else {
          setReferralUser({
            address,
            referralCode: data.referralCode,
            referrer: data.referrer,
            tier: 'Recruit',
            tiers: ['Recruit'],
            share: data.benefits?.feeRebate || 0.2,
            recruits: 0
          });
        }
      } else {
        setReferralUser({
          address,
          referralCode: data.referralCode,
          referrer: data.referrer,
          tier: 'Recruit',
          tiers: ['Recruit'],
          share: data.benefits?.feeRebate || 0.2,
          recruits: 0
        });
      }
      setReferralForm({ referralCode: '', referredBy: '' });
    } catch (e) {
      setReferralError(e.message);
    }
    setReferralLoading(false);
  };

  const handleUpdateReferralCode = async () => {
    if (!address || !newReferralCode || newReferralCode.length < 3) return;
    setReferralError('');
    setReferralLoading(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/referral/${address}/code`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: newReferralCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setReferralUser(u => ({ ...u, referralCode: newReferralCode }));
      setEditingCode(false);
      setNewReferralCode('');
    } catch (e) {
      setReferralError(e.message);
    }
    setReferralLoading(false);
  };


  // Fetch profile data
  useEffect(() => {
    if (!address || (activeTab !== 'profile' && activeTab !== 'overview')) return;
    if (activeTab === 'overview' && profileUser) return; // already fetched
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const res = await apiFetch(`${BASE_URL}/api/user/${address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && typeof data.user === 'object' && data.user._id === address) {
            setProfileUser(data.user);
          } else {
            setProfileUser(null);
          }
        } else if (res.status === 404) {
          setProfileUser(null);
        } else {
          throw new Error(`Server error (${res.status})`);
        }
      } catch (e) {
        setProfileError(e.message || 'Failed to load profile');
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [activeTab, address]);

  const handleCreateProfile = async (username) => {
    if (!address) return;
    setProfileError('');
    setProfileLoading(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/user/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(username ? { username } : {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
      if (!data.user || typeof data.user !== 'object') throw new Error('Invalid profile response');
      if (data.user._id !== address) throw new Error('Profile address mismatch');
      setProfileUser(data.user);
      setNewUsername('');
    } catch (e) {
      setProfileError(e.message);
    }
    setProfileLoading(false);
  };

  const handleUpdateUsername = async () => {
    if (!address || !newUsername || newUsername.length < 2) return;
    setProfileError('');
    setProfileLoading(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/user/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      if (typeof data.username !== 'string') throw new Error('Invalid username response');
      setProfileUser(u => ({ ...u, username: data.username, updatedAt: data.updatedAt }));
      setEditingUsername(false);
      setNewUsername('');
    } catch (e) {
      setProfileError(e.message);
    }
    setProfileLoading(false);
  };

  // Fetch user NFTs for avatar picker
  useEffect(() => {
    if (!address || activeTab !== 'profile' || !showAvatarPicker) return;
    const fetchAvatarNfts = async () => {
      setAvatarNftsLoading(true);
      try {
        const res = await apiFetch(`${BASE_URL}/api/user/${address}/nfts?limit=50&offset=0`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.nfts)) setAvatarNfts(data.nfts);
        }
      } catch (e) {
        console.error('Failed to fetch NFTs for avatar:', e);
      }
      setAvatarNftsLoading(false);
    };
    fetchAvatarNfts();
  }, [activeTab, address, showAvatarPicker]);

  const handleSetAvatar = async (nftId) => {
    if (!address || !nftId) return;
    setSettingAvatar(true);
    setProfileError('');
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      const res = await apiFetch(`${BASE_URL}/api/user/${address}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ nftId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set avatar');
      if (!data.avatar || !data.avatarNftId) throw new Error('Invalid avatar response');
      setProfileUser(u => ({ ...u, avatar: data.avatar, avatarNftId: data.avatarNftId }));
      setShowAvatarPicker(false);
      toast.success('Avatar updated');
    } catch (e) {
      setProfileError(e.message);
    }
    setSettingAvatar(false);
  };

  // Cache avatar in localStorage so it persists after logout
  useEffect(() => {
    if (!address || !profileUser?.avatar) return;
    try {
      const masked = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const cached = JSON.parse(localStorage.getItem('__user_avatars__') || '{}');
      cached[masked] = profileUser.avatar;
      localStorage.setItem('__user_avatars__', JSON.stringify(cached));
    } catch (e) { /* ignore */ }
  }, [address, profileUser?.avatar]);

  // Fetch wallet labels
  useEffect(() => {
    if (!address || activeTab !== 'profile') return;
    const fetchLabels = async () => {
      setLabelsLoading(true);
      try {
        const res = await apiFetch(`${BASE_URL}/api/user/${address}/labels`);
        if (res.ok) {
          const data = await res.json();
          if (data.labels) setWalletLabels(data.labels);
        }
      } catch (e) { }
      setLabelsLoading(false);
    };
    fetchLabels();
  }, [activeTab, address]);

  const handleAddLabel = async () => {
    if (!address || !newLabelWallet || !newLabelName) return;
    setProfileError('');
    setLabelsLoading(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      const res = await apiFetch(`${BASE_URL}/api/user/${address}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ wallet: newLabelWallet, label: newLabelName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add label');
      setWalletLabels(prev => [...prev, { wallet: data.wallet, label: data.label }]);
      setNewLabelWallet('');
      setNewLabelName('');
    } catch (e) {
      setProfileError(e.message);
    }
    setLabelsLoading(false);
  };

  const handleDeleteLabel = async (wallet) => {
    if (!address || !wallet) return;
    setDeletingLabel(wallet);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      const res = await apiFetch(`${BASE_URL}/api/user/${address}/labels/${wallet}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        setWalletLabels(prev => prev.filter(l => l.wallet !== wallet));
      }
    } catch (e) { }
    setDeletingLabel(null);
  };

  // Fetch tiers and user perks
  useEffect(() => {
    if (activeTab !== 'profile') return;
    const fetchTiers = async () => {
      setTiersLoading(true);
      try {
        const [tiersRes, perksRes, badgesRes] = await Promise.all([
          apiFetch(`${BASE_URL}/api/user/tiers`),
          address ? apiFetch(`${BASE_URL}/api/user/${address}/perks`) : Promise.resolve(null),
          address ? apiFetch(`${BASE_URL}/v1/user/${address}/badges`) : Promise.resolve(null)
        ]);
        if (tiersRes.ok) {
          const data = await tiersRes.json();
          if (data.success && data.config && typeof data.config === 'object') {
            setTiers(data.config);
            if (data.xrpUsd > 0) setTierXrpUsd(data.xrpUsd);
          }
        }
        if (perksRes?.ok) {
          const data = await perksRes.json();
          if (data.success && data.tier) {
            setUserPerks({ tier: data.tier, perks: data.perks || {}, expiry: data.expiry ?? null, roles: data.roles || [], groups: data.groups || [], contentAccess: data.contentAccess ?? 0 });
          }
        }
        if (badgesRes?.ok) {
          const data = await badgesRes.json();
          if (data.success) setDisplayBadges({ current: data.current || null, available: Array.isArray(data.available) ? data.available : [] });
        }
      } catch (e) { }
      setTiersLoading(false);
    };
    fetchTiers();
  }, [activeTab, address]);

  const handlePurchaseTierXRP = async (tierName) => {
    if (!address) return;
    setPurchaseLoading(tierName);
    setProfileError('');
    try {
      const res = await apiFetch(`${BASE_URL}/api/user/tier/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tier: tierName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      if (!data.invoiceId || !data.payment?.destination || !data.payment?.xrpAmount) throw new Error('Invalid invoice response');
      setXrpInvoice({
        invoiceId: data.invoiceId,
        amount: data.payment.xrpAmount,
        destination: data.payment.destination,
        destinationTag: data.payment.destinationTag || null,
        tier: data.tier,
        usdPrice: data.payment.usdPrice,
        billing: data.payment.billing,
        expiresIn: data.expiresIn
      });
    } catch (e) {
      setProfileError(e.message);
    }
    setPurchaseLoading(null);
  };

  const handleVerifyXrpPayment = async () => {
    if (!xrpInvoice?.invoiceId) return;
    setVerifyingPayment(true);
    setProfileError('');
    try {
      const res = await apiFetch(`${BASE_URL}/api/user/tier/verify/${xrpInvoice.invoiceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment not verified');
      if (data.status === 'pending') throw new Error('Payment not yet received. Please send the XRP and try again.');
      if (data.status !== 'paid' && !data.tier) throw new Error('Payment not yet confirmed');
      if (data.perks && typeof data.perks === 'object') setUserPerks(data.perks);
      if (data.tier) setProfileUser(u => u ? { ...u, tier: data.tier } : u);
      setXrpInvoice(null);
      toast.success(`Upgraded to ${data.tier || 'new tier'}!`);
    } catch (e) {
      setProfileError(e.message);
    }
    setVerifyingPayment(false);
  };

  const verifyTierWithRetry = async (invoiceId) => {
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await apiFetch(`${BASE_URL}/api/user/tier/verify/${invoiceId}`);
      const data = await res.json();
      if (data.tier || data.status === 'paid') {
        if (data.perks && typeof data.perks === 'object') setUserPerks(data.perks);
        if (data.tier) setProfileUser(u => u ? { ...u, tier: data.tier } : u);
        setXrpInvoice(null);
        toast.success(`Upgraded to ${data.tier || 'new tier'}!`);
        return;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    throw new Error('Payment not yet confirmed. Click "I have paid" to try again.');
  };

  const handleWalletPayTier = async () => {
    if (!xrpInvoice || !address) return;
    setWalletPayStatus('signing');
    setProfileError('');
    try {
      const wallet = await getSigningWallet();
      if (!wallet) {
        setProfileError('Wallet locked. Please unlock your wallet first.');
        setWalletPayStatus(null);
        return;
      }

      setWalletPayStatus('submitting');
      const payment = {
        TransactionType: 'Payment',
        Account: address,
        Destination: xrpInvoice.destination,
        Amount: String(Math.floor(xrpInvoice.amount * 1000000)),
        SourceTag: 161803
      };
      if (xrpInvoice.destinationTag) {
        payment.DestinationTag = xrpInvoice.destinationTag;
      }

      const result = await submitTransaction(wallet, payment);
      if (!result?.engine_result || result.engine_result !== 'tesSUCCESS') {
        const txResult = result?.engine_result || 'Unknown error';
        if (txResult === 'tecUNFUNDED_PAYMENT') {
          setProfileError('Insufficient XRP balance.');
        } else {
          setProfileError(`Transaction failed: ${txResult}`);
        }
        setWalletPayStatus(null);
        return;
      }

      // Auto-verify with retry (on-chain indexing may take a few seconds)
      setWalletPayStatus('verifying');
      await verifyTierWithRetry(xrpInvoice.invoiceId);
    } catch (e) {
      console.error('Wallet pay error:', e);
      setProfileError(e.message || 'Payment failed');
    }
    setWalletPayStatus(null);
  };

  const handleSetDisplayBadge = async (badge) => {
    if (!address || settingBadge) return;
    setSettingBadge(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      const res = await apiFetch(`${BASE_URL}/v1/user/${address}/display-badge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ badge })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set badge');
      if (data.success) {
        setDisplayBadges(prev => ({ ...prev, current: badge }));
        window.dispatchEvent(new CustomEvent('badgeChanged', { detail: { badge } }));
      }
    } catch (e) {
      setProfileError(e.message);
    }
    setSettingBadge(false);
  };

  const handlePurchaseTierStripe = async (tierName, method) => {
    if (!address) return;
    setPurchaseLoading(tierName);
    setProfileError('');
    try {
      const payload = { address, tier: tierName };
      if (method) payload.method = method;
      const res = await apiFetch(`${BASE_URL}/api/user/tier/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
      if (!data.checkoutUrl || typeof data.checkoutUrl !== 'string') throw new Error('Invalid checkout response');
      const { safeCheckoutRedirect } = await import('src/utils/api');
      if (!safeCheckoutRedirect(data.checkoutUrl)) throw new Error('Invalid checkout URL');
    } catch (e) {
      setProfileError(e.message);
    }
    setPurchaseLoading(null);
  };

  // Load NFTs for selected collection (using collection slug endpoint for full data with thumbnails)
  useEffect(() => {
    const fetchCollectionNfts = async () => {
      if (!selectedCollection) {
        setCollectionNfts([]);
        return;
      }
      const col = collections.find((c) => c.name === selectedCollection);
      if (!col?.slug) return;
      setCollectionNftsLoading(true);
      console.time('[Wallet] fetchCollectionNfts');
      try {
        // Use collection endpoint which returns files with thumbnails
        const res = await fetch(
          `${BASE_URL}/api/nft/collections/${col.slug}/nfts?limit=50&skip=0&owner=${address}`
        );
        const data = await res.json();
        console.timeEnd('[Wallet] fetchCollectionNfts');
        if (data.nfts) {
          setCollectionNfts(
            data.nfts.map((nft) => ({
              id: nft._id || nft.NFTokenID,
              nftId: nft.NFTokenID || nft._id,
              name: nft.name || nft.meta?.name || 'Unnamed NFT',
              image: getNftCoverUrl(nft, 'large') || '',
              rarity: nft.rarity_rank || 0,
              cost: nft.cost,
              collection: nft.collection || col.name,
              floor: nft.cfloor?.amount ? `${parseFloat(nft.cfloor.amount).toFixed(2)} XRP` : col.floor || '---'
            }))
          );
        }
      } catch (e) {
        console.timeEnd('[Wallet] fetchCollectionNfts');
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
      setWithdrawals((prev) => [added, ...prev]);
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
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete withdrawal:', e);
    }
  };

  // Computed tokens list with XRP at top
  const xrpToken = useMemo(() => {
    if (!xrpData) return null;
    const x = xrpData.xrp || {};
    const bal = parseFloat(x.balance || xrpData.balance || 0);
    const change = x.pro24h ?? 0;
    return {
      symbol: 'XRP',
      name: 'XRP',
      amount: formatBalance(bal),
      rawAmount: bal,
      value: `${formatBalance(bal)} XRP`,
      rawValue: x.value || bal,
      change: change ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '',
      positive: change >= 0,
      color: '#23292F',
      icon: '◎',
      slug: 'xrpl-xrp',
      md5: x.md5 || '84e5efeb89c4eae8f68188982dc290d8',
      vol24h: x.vol24hxrp || 0,
      holders: x.holders || 0
    };
  }, [xrpData]);
  const allTokens = useMemo(() => xrpToken ? [xrpToken, ...tokens] : tokens, [xrpToken, tokens]);
  const tokenBySymbol = useMemo(() => {
    const map = new Map();
    for (const t of allTokens) map.set(t.symbol, t);
    for (const t of sendTokens) if (!map.has(t.symbol)) map.set(t.symbol, t);
    return map;
  }, [allTokens, sendTokens]);
  const activeToken = tokenBySymbol.get(selectedToken) || null;
  const totalValue = useMemo(() => allTokens.reduce((sum, t) => sum + (t.rawValue || 0), 0), [allTokens]);

  // XRP price in fiat for conversions (from API)
  const xrpUsdPrice = xrpData?.xrp?.usd ? parseFloat(xrpData.xrp.usd) : 1;
  // For converting XRP values to fiat: multiply by xrpUsdPrice
  // exchRate kept for backwards compatibility with metricsRate pattern
  const exchRate = metricsRate;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'tokens', label: 'Tokens', icon: () => <span className="text-xs">◎</span> },
    { id: 'nfts', label: 'NFTs', icon: Image },
    { id: 'activity', label: 'Activity', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      <main role="main">
      {(!hydrated || !address) ? (
        <div
          className={cn(
            'min-h-[calc(100dvh-64px)] flex items-center justify-center',
            'bg-gray-50 dark:bg-black',
            !hydrated && 'opacity-0'
          )}
        >
          <div
            className={cn(
              'text-center p-10 rounded-xl max-w-md',
              'bg-white border border-gray-200 dark:bg-white/[0.06] dark:border dark:border-white/[0.15]'
            )}
          >
            <div
              className={cn(
                'w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6',
                'bg-blue-50 dark:bg-[#137DFE]/10'
              )}
            >
              <Wallet size={36} className="text-[#137DFE]" />
            </div>
            <h2
              className={cn('text-xl font-medium mb-3', 'text-gray-900 dark:text-white')}
            >
              Connect Wallet
            </h2>
            <p
              className={cn(
                'text-[13px] mb-8 leading-relaxed',
                'text-gray-500 dark:text-white/60'
              )}
            >
              Manage your tokens, NFTs, offers, and transaction history all in one place
            </p>
            <button
              onClick={() => setOpenWalletModal(true)}
              className="w-full py-4 rounded-lg text-[13px] font-medium bg-[#1070E0] text-white hover:bg-[#0D62C8] transition-colors"
            >
              Connect Wallet
            </button>
            <p className={cn('text-[11px] mt-4', 'text-gray-500 dark:text-white/50')}>
              Secure • Non-custodial • Encrypted locally
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'min-h-dvh',
            'bg-gray-50 text-gray-900 dark:bg-black dark:text-white'
          )}
        >
          <div className="max-w-[1920px] mx-auto w-full px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1
                className={cn(
                  'text-[13px] font-medium',
                  'text-gray-900 dark:text-white/90'
                )}
              >
                Wallet
              </h1>
              <div className="flex items-center gap-2">
                {isInactive && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-[#F6AF01]"
                    title="Fund with 1 XRP to activate"
                  >
                    Inactive
                  </span>
                )}
                <button
                  onClick={() => handleCopy(address)}
                  aria-label={copied ? 'Address copied' : 'Copy wallet address'}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none',
                    copied
                      ? 'bg-emerald-500/10 text-[#08AA09]'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-[#137DFE]/5 dark:hover:text-[#137DFE]'
                  )}
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isInactive ? 'bg-[#F6AF01]/60' : 'bg-[#08AA09]'
                    )}
                  />
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <nav role="tablist" aria-label="Wallet sections" className="flex gap-2 mb-6 overflow-x-auto no-scrollbar max-sm:w-full max-sm:gap-[6px]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 text-xs font-medium tracking-[0.05em] py-[10px] px-4 bg-transparent border rounded-[6px] cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150 whitespace-nowrap shrink-0 uppercase',
                    'max-sm:flex-1 max-sm:py-2 max-sm:px-1 max-sm:text-[10px] max-sm:gap-[3px] max-sm:[&_svg]:w-[14px] max-sm:[&_svg]:h-[14px]',
                    activeTab === tab.id
                      ? 'border-black/20 text-[#1a1a1a] dark:border-white/20 dark:text-white'
                      : 'border-black/10 text-black/60 dark:border-white/10 dark:text-white/60',
                    activeTab !== tab.id && ('hover:enabled:border-black/[0.15] hover:enabled:text-black/60 dark:hover:enabled:border-white/[0.15] dark:hover:enabled:text-white/70'),
                    activeTab !== tab.id && 'max-sm:[&>span]:hidden'
                  )}
                >
                  <tab.icon size={14} strokeWidth={2} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Send/Receive Modal */}
            {showPanel && (
              <div role="dialog" aria-modal="true" aria-label={showPanel === 'send' ? 'Send tokens' : 'Receive tokens'} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => { setSendPreview(null); setShowPanel(null); }}
                />

                {/* Modal */}
                <div
                  className={cn(
                    'relative w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200',
                    'bg-[rgba(255,255,255,0.98)] border border-black/[0.06] dark:bg-[rgba(12,12,14,0.98)] dark:border-[1.5px] dark:border-white/[0.08]'
                  )}
                >
                  {/* Drag handle - mobile only */}
                  <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className={cn('w-10 h-1 rounded-full', 'bg-gray-300 dark:bg-white/15')} />
                  </div>

                  {/* Header - Swap-style toggle */}
                  <div className="flex items-center justify-between px-3 pt-2 sm:pt-3 pb-2 max-sm:px-2">
                    <div className={cn('flex p-[3px] rounded-[10px] w-full mr-2', 'bg-black/[0.02] border border-black/[0.06] dark:bg-white/[0.025] dark:border dark:border-white/[0.06]')}>
                      <button
                        onClick={() => setShowPanel('send')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-[10px] rounded-[8px] text-sm font-bold uppercase tracking-[0.05em] transition-all duration-200',
                          'max-sm:py-2 max-sm:text-xs',
                          showPanel === 'send'
                            ? 'bg-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.25)]'
                            : 'text-black/30 hover:text-black/50 dark:text-white/30 dark:hover:text-white/50'
                        )}
                      >
                        <ArrowUpRight size={15} strokeWidth={2.5} /> Send
                      </button>
                      <button
                        onClick={() => setShowPanel('receive')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-[10px] rounded-[8px] text-sm font-bold uppercase tracking-[0.05em] transition-all duration-200',
                          'max-sm:py-2 max-sm:text-xs',
                          showPanel === 'receive'
                            ? 'bg-[#08AA09] text-white shadow-[0_4px_12px_rgba(8,170,9,0.25)]'
                            : 'text-black/30 hover:text-black/50 dark:text-white/30 dark:hover:text-white/50'
                        )}
                      >
                        <ArrowDownLeft size={15} strokeWidth={2.5} /> Receive
                      </button>
                    </div>
                    <button
                      onClick={() => { setSendPreview(null); setShowPanel(null); }}
                      aria-label="Close panel"
                      className={cn(
                        'px-3 py-[10px] rounded-[10px] transition-all shrink-0 border-[1.5px]',
                        'max-sm:px-2.5 max-sm:py-2',
                        'hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                        'bg-white border-black/[0.08] text-black/30 hover:text-black/60 hover:border-black/15 dark:bg-[rgba(20,20,25,0.95)] dark:border-white/10 dark:text-white/30 dark:hover:text-white/60 dark:hover:border-white/20'
                      )}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Content */}
                  {showPanel === 'send' ? (
                    <div className="px-3 pb-3 max-sm:px-2 max-sm:pb-2">
                      {/* Amount row - Swap CurrencyContent style */}
                      <div className={cn(
                        'my-[3px] flex flex-col py-[10px] px-3 rounded-[10px] border transition-all duration-150',
                        'max-sm:py-2 max-sm:px-[10px] max-sm:my-[2px]',
                        'focus-within:border-blue-500/40',
                        'bg-black/[0.02] border-black/[0.06] focus-within:bg-blue-500/[0.03] dark:bg-white/[0.025] dark:border-white/[0.06] dark:focus-within:bg-blue-500/[0.05]'
                      )}>
                        {/* Token selector row */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            onClick={() => { const opening = !tokenDropdownOpen; setTokenDropdownOpen(opening); setSendTokenSearch(''); if (opening && tokenTotal > tokens.length) loadAllTokensForSend(); }}
                            className={cn(
                              'flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border-[1.5px] transition-all',
                              'hover:scale-[1.02] active:scale-[0.98]',
                              'bg-white border-black/[0.08] hover:border-blue-500/50 dark:bg-[rgba(20,20,25,0.95)] dark:border-white/10 dark:hover:border-blue-500/50'
                            )}
                          >
                            {activeToken?.md5 ? (
                              <img src={`https://s1.xrpl.to/token/${activeToken.md5}`} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">{selectedToken[0]}</div>
                            )}
                            <span className={cn('text-sm font-bold', 'text-gray-900 dark:text-white')}>{selectedToken}</span>
                            <ChevronDown size={14} className={cn('transition-transform duration-200', 'text-black/30 dark:text-white/30', tokenDropdownOpen && 'rotate-180')} />
                          </button>
                          <button
                            onClick={() => {
                              const maxAmt = activeToken?.rawAmount || 0;
                              setSendAmount(maxAmt.toFixed(6).replace(/\.?0+$/, ''));
                            }}
                            className="text-right group cursor-pointer"
                          >
                            <p className={cn('text-[10px] font-medium uppercase tracking-wider', 'text-black/30 dark:text-white/25')}>Balance</p>
                            <p className={cn('text-sm font-bold tabular-nums group-hover:text-blue-500 transition-colors', 'text-gray-700 dark:text-white/60')}>{activeToken?.amount || '0'}</p>
                          </button>
                        </div>

                        {/* Token dropdown */}
                        {tokenDropdownOpen && (() => {
                          const dropdownTokens = sendTokens.length > 0 ? [...allTokens, ...sendTokens] : allTokens;
                          const q = sendTokenSearch.toLowerCase();
                          const filtered = q
                            ? dropdownTokens.filter(t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || (t.currency && t.currency.toLowerCase().includes(q)))
                            : dropdownTokens;
                          const visible = filtered.slice(0, 50);
                          return (
                            <div className={cn(
                              'mb-2 rounded-[8px] border overflow-hidden',
                              'bg-white border-black/[0.06] dark:bg-black/60 dark:border-white/[0.06]'
                            )}>
                              <div className={cn('px-2.5 py-2 border-b', 'border-black/[0.04] dark:border-white/[0.06]')}>
                                <div className="relative">
                                  <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', 'text-gray-300 dark:text-white/20')} />
                                  <input
                                    ref={sendSearchRef}
                                    autoFocus
                                    type="text"
                                    value={sendTokenSearch}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      startTransition(() => setSendTokenSearch(v));
                                    }}
                                    placeholder={`Search ${dropdownTokens.length} tokens...`}
                                    className={cn(
                                      'w-full pl-8 pr-3 py-2 rounded-md text-[13px] max-sm:text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                                      'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20'
                                    )}
                                  />
                                  {sendTokenSearch && (
                                    <button onClick={() => setSendTokenSearch('')} className={cn('absolute right-2 top-1/2 -translate-y-1/2', 'text-gray-300 hover:text-gray-500 dark:text-white/20 dark:hover:text-white/40')}>
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                {visible.length === 0 ? (
                                  <p className={cn('text-center py-4 text-xs', 'text-gray-400 dark:text-white/20')}>No tokens found</p>
                                ) : visible.map((t) => (
                                  <button
                                    key={`${t.currency}_${t.issuer || 'xrp'}`}
                                    onClick={() => { setSelectedToken(t.symbol); setTokenDropdownOpen(false); setSendTokenSearch(''); }}
                                    className={cn(
                                      'w-full px-3 py-2 flex items-center justify-between text-left transition-colors border-b last:border-b-0',
                                      'border-gray-50 dark:border-white/[0.04]',
                                      selectedToken === t.symbol
                                        ? ('bg-blue-50 dark:bg-blue-500/10')
                                        : 'hover:bg-blue-500/5'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {t.md5 ? <img src={`https://s1.xrpl.to/token/${t.md5}`} alt="" className="w-6 h-6 rounded-full shrink-0" loading="lazy" /> : <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">{t.symbol[0]}</div>}
                                      <span className={cn('text-[13px] font-semibold truncate', 'text-gray-900 dark:text-white')}>{t.symbol}</span>
                                    </div>
                                    <span className={cn('text-xs tabular-nums shrink-0 ml-2', 'text-gray-400 dark:text-white/30')}>{t.amount}</span>
                                  </button>
                                ))}
                                {filtered.length > 50 && (
                                  <p className={cn('text-center py-2 text-[11px]', 'text-gray-300 dark:text-white/15')}>Search to find {filtered.length - 50} more</p>
                                )}
                                {loadingAllTokens && (
                                  <div className={cn('flex items-center justify-center gap-2 py-2', 'text-gray-400 dark:text-white/20')}>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span className="text-[11px]">Loading tokens...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Amount input - large centered like Swap */}
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0.00"
                          className={cn(
                            'w-full text-[32px] font-bold bg-transparent outline-none tabular-nums text-right py-1 tracking-tight',
                            'max-sm:text-2xl',
                            'text-gray-900 placeholder:text-gray-200 dark:text-white dark:placeholder:text-white/10'
                          )}
                        />

                        {/* Fiat equivalent */}
                        {(() => {
                          const amt = parseFloat(sendAmount) || 0;
                          const pricePerToken = activeToken?.rawAmount > 0 ? activeToken.rawValue / activeToken.rawAmount : 0;
                          const valueInXrp = amt * pricePerToken;
                          const displayValue = activeFiatCurrency === 'XRP' ? valueInXrp : valueInXrp * xrpUsdPrice;
                          return displayValue > 0 ? (
                            <p className={cn('text-xs text-right tabular-nums', 'text-black/30 dark:text-white/25')}>
                              ~{CURRENCY_SYMBOLS[activeFiatCurrency] || '$'}{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeFiatCurrency}
                            </p>
                          ) : null;
                        })()}

                        {/* Quick amount buttons */}
                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => {
                                const maxAmt = activeToken?.rawAmount || 0;
                                setSendAmount(((maxAmt * pct) / 100).toFixed(6).replace(/\.?0+$/, ''));
                              }}
                              className={cn(
                                'px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all',
                                'bg-black/[0.03] text-black/25 hover:text-blue-500 hover:bg-blue-50 dark:bg-white/[0.04] dark:text-white/25 dark:hover:text-blue-400 dark:hover:bg-blue-500/10'
                              )}
                            >
                              {pct === 100 ? 'Max' : `${pct}%`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recipient - CurrencyContent style row */}
                      <div className={cn(
                        'my-[3px] flex flex-col py-[10px] px-3 rounded-[10px] border transition-all duration-150',
                        'max-sm:py-2 max-sm:px-[10px] max-sm:my-[2px]',
                        'focus-within:border-blue-500/40',
                        'bg-black/[0.02] border-black/[0.06] focus-within:bg-blue-500/[0.03] dark:bg-white/[0.025] dark:border-white/[0.06] dark:focus-within:bg-blue-500/[0.05]'
                      )}>
                        <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-1.5', 'text-black/30 dark:text-white/25')}>Recipient</p>
                        <div className="relative">
                          <input
                            type="text"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            onFocus={() => setShowAddressSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                            placeholder="r..."
                            className={cn(
                              'w-full text-sm max-sm:text-base font-mono bg-transparent outline-none',
                              'text-gray-900 placeholder:text-gray-300 dark:text-white dark:placeholder:text-white/15'
                            )}
                          />
                          {showAddressSuggestions && withdrawals.length > 0 && (
                            <div className={cn(
                              'absolute bottom-full left-0 right-0 mb-2 rounded-[10px] border-[1.5px] overflow-hidden z-10',
                              'bg-white border-black/[0.08] shadow-lg dark:bg-[rgba(20,20,25,0.98)] dark:border-white/10'
                            )}>
                              {withdrawals.slice(0, 4).map((w) => (
                                <button
                                  key={w.id}
                                  onClick={() => { setSendTo(w.address); if (w.tag) setSendTag(w.tag); setShowAddressSuggestions(false); }}
                                  className={cn('w-full px-3.5 py-2.5 text-left flex items-center justify-between transition-colors', 'hover:bg-blue-50 border-b border-gray-50 dark:hover:bg-blue-500/5 dark:border-b dark:border-white/[0.04]')}
                                >
                                  <div>
                                    <p className={cn('text-[13px] font-semibold', 'text-gray-900 dark:text-white/80')}>{w.name}</p>
                                    <p className={cn('text-[11px] font-mono', 'text-gray-400 dark:text-white/25')}>{w.address.slice(0, 16)}...</p>
                                  </div>
                                  <ArrowRight size={12} className="opacity-20" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Destination warnings */}
                      {destWarnings.length > 0 && !(destWarnings.length === 1 && destWarnings[0] === 'requireDestTag' && sendTag) && (
                        <div className={cn(
                          'my-[3px] flex items-start gap-2.5 py-2.5 px-3 rounded-[10px] border text-[11px] leading-relaxed',
                          destWarnings.some(w => ['disallowXrp', 'blackholed'].includes(w))
                            ? 'border-red-500/30 bg-red-500/[0.06]'
                            : 'border-[#F6AF01]/30 bg-[#F6AF01]/[0.06]'
                        )}>
                          <AlertTriangle size={14} className={cn('shrink-0 mt-0.5', destWarnings.some(w => ['disallowXrp', 'blackholed'].includes(w)) ? 'text-red-400' : 'text-[#F6AF01]')} />
                          <div className="space-y-1">
                            {destWarnings.includes('notActivated') && (
                              <p className="text-[#F6AF01]">Account not activated. Sending requires at least 1 XRP to activate.</p>
                            )}
                            {destWarnings.includes('requireDestTag') && !sendTag && (
                              <p className="text-[#F6AF01]">This account requires a Destination Tag.</p>
                            )}
                            {destWarnings.includes('depositAuth') && (
                              <p className="text-[#F6AF01]">This account has Deposit Authorization enabled. Payment will fail unless you are preauthorized.</p>
                            )}
                            {destWarnings.includes('disallowXrp') && (
                              <p className="text-red-400">This account has XRP payments disabled. Transaction will fail.</p>
                            )}
                            {destWarnings.includes('blackholed') && (
                              <p className="text-red-400">This account is blackholed. Funds sent here are unrecoverable.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tag row - same style */}
                      <div className={cn(
                        'my-[3px] flex flex-row items-center justify-between py-[10px] px-3 rounded-[10px] border transition-all duration-150',
                        'max-sm:py-2 max-sm:px-[10px] max-sm:my-[2px]',
                        'focus-within:border-blue-500/40',
                        'bg-black/[0.02] border-black/[0.06] focus-within:bg-blue-500/[0.03] dark:bg-white/[0.025] dark:border-white/[0.06] dark:focus-within:bg-blue-500/[0.05]'
                      )}>
                        <div className="flex-1">
                          <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-1', 'text-black/30 dark:text-white/25')}>Destination Tag <span className="opacity-50">(optional)</span></p>
                          <input
                            type="text"
                            value={sendTag}
                            onChange={(e) => setSendTag(e.target.value.replace(/\D/g, ''))}
                            placeholder="—"
                            className={cn(
                              'w-full text-sm max-sm:text-base font-mono bg-transparent outline-none',
                              'text-gray-900 placeholder:text-gray-300 dark:text-white dark:placeholder:text-white/15'
                            )}
                          />
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={cn('text-[10px] font-medium uppercase tracking-wider', 'text-black/25 dark:text-white/20')}>Fee</p>
                          <p className={cn('text-xs font-mono tabular-nums', 'text-gray-500 dark:text-white/35')}>0.000012 XRP</p>
                        </div>
                      </div>

                      {/* Preview confirmation box */}
                      {sendPreview && (
                        <div className={cn(
                          'my-[3px] rounded-[10px] border p-3 max-sm:p-2 space-y-2',
                          'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.025] dark:border-white/[0.06]',
                          sendPreview.success ? '' : 'border-red-500/30'
                        )}>
                          <div className="flex items-center justify-between">
                            <p className={cn('text-[10px] font-medium uppercase tracking-wider', 'text-black/30 dark:text-white/25')}>Preview</p>
                            <span className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full',
                              sendPreview.success
                                ? 'bg-[#08AA09]/15 text-[#08AA09]'
                                : 'bg-red-500/15 text-red-400'
                            )}>{sendPreview.engine_result}</span>
                          </div>
                          {!sendPreview.success && (
                            <p className="text-[11px] text-red-400">{sendPreview.engine_result_message}</p>
                          )}
                          {sendPreview.delivered_amount != null && (
                            <div className="flex items-center justify-between">
                              <p className={cn('text-[11px]', 'text-black/40 dark:text-white/40')}>Delivered</p>
                              <p className={cn('text-[11px] font-mono tabular-nums', 'text-gray-700 dark:text-white/70')}>{sendPreview.delivered_amount} {selectedToken}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <p className={cn('text-[11px]', 'text-black/40 dark:text-white/40')}>Fee</p>
                            <p className={cn('text-[11px] font-mono tabular-nums', 'text-gray-700 dark:text-white/70')}>{(parseInt(sendPreview.fee) / 1000000).toFixed(6)} XRP</p>
                          </div>
                        </div>
                      )}

                      {/* Send / Confirm button - ExchangeButton style */}
                      {sendPreview ? (
                        <div className="flex gap-2 mt-2 max-sm:mt-1.5">
                          <button
                            onClick={() => setSendPreview(null)}
                            className={cn(
                              'flex-1 rounded-xl py-[14px] px-4 text-sm font-bold uppercase tracking-[0.05em] border transition-all duration-200',
                              'max-sm:py-[10px] max-sm:text-xs',
                              'border-black/10 text-black/50 hover:bg-black/[0.04] dark:border-white/10 dark:text-white/50 dark:hover:bg-white/[0.04]'
                            )}
                          >Back</button>
                          <button
                            onClick={handleSendConfirm}
                            disabled={sending || !sendPreview.success}
                            className={cn(
                              'flex-[2] relative overflow-hidden rounded-xl text-white font-bold border-none py-[14px] px-4 text-sm uppercase tracking-[0.05em] transition-all duration-200',
                              'max-sm:py-[10px] max-sm:text-xs',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                              !sending && sendPreview.success
                                ? 'bg-[#08AA09] shadow-[0_4px_12px_rgba(8,170,9,0.25)] hover:bg-[#07990a] hover:-translate-y-px active:translate-y-0'
                                : 'bg-black/[0.04] text-black/20 shadow-none cursor-not-allowed dark:bg-white/[0.04] dark:text-white/20 dark:shadow-none dark:cursor-not-allowed'
                            )}
                          >
                            <span className="flex items-center justify-center gap-2">
                              {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} />Confirm Send</>}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSendPreview}
                          disabled={sending || !sendTo || !sendAmount || !sendTo.startsWith('r') || destWarnings.includes('disallowXrp') || destWarnings.includes('blackholed')}
                          className={cn(
                            'w-full relative overflow-hidden rounded-xl bg-blue-500 text-white font-bold border-none py-[14px] px-4 text-sm uppercase tracking-[0.05em] mt-2 transition-all duration-200',
                            'max-sm:py-[10px] max-sm:text-xs max-sm:mt-1.5',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                            !sending && sendTo && sendAmount && sendTo.startsWith('r') && !destWarnings.includes('disallowXrp') && !destWarnings.includes('blackholed')
                              ? 'shadow-[0_4px_12px_rgba(59,130,246,0.25)] hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(59,130,246,0.35)] active:translate-y-0'
                              : 'bg-black/[0.04] text-black/20 shadow-none cursor-not-allowed dark:bg-white/[0.04] dark:text-white/20 dark:shadow-none dark:cursor-not-allowed'
                          )}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} />Preview Send</>}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Receive panel */
                    <div className="px-3 pb-3 max-sm:px-2 max-sm:pb-2">
                      {/* QR Code row - CurrencyContent style */}
                      <div className={cn(
                        'my-[3px] flex flex-col items-center py-5 px-3 rounded-[10px] border transition-all duration-150',
                        'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.025] dark:border-white/[0.06]'
                      )}>
                        <div className="p-3 rounded-xl bg-white mb-3">
                          <QRCode value={address} size={160} />
                        </div>
                        <p className={cn('text-[10px] font-medium uppercase tracking-wider', 'text-black/30 dark:text-white/25')}>Scan to send XRP</p>
                      </div>

                      {/* Address row */}
                      <div className={cn(
                        'my-[3px] flex flex-row items-center py-[10px] px-3 rounded-[10px] border transition-all duration-150',
                        'max-sm:py-2 max-sm:px-[10px] max-sm:my-[2px]',
                        'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.025] dark:border-white/[0.06]'
                      )}>
                        <p className={cn(
                          'flex-1 font-mono text-[13px] break-all leading-relaxed select-all',
                          'text-gray-500 dark:text-white/50'
                        )}>
                          {address}
                        </p>
                      </div>

                      {/* Action Buttons - ExchangeButton style */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleCopy(address)}
                          className={cn(
                            'flex-1 relative overflow-hidden rounded-xl font-bold border-none py-[14px] px-4 text-sm uppercase tracking-[0.05em] transition-all duration-200 flex items-center justify-center gap-2',
                            'max-sm:py-[10px] max-sm:text-xs',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            copied
                              ? 'bg-[#08AA09]/10 text-[#08AA09] shadow-none focus-visible:ring-[#08AA09]'
                              : 'bg-[#08AA09] text-white shadow-[0_4px_12px_rgba(8,170,9,0.25)] hover:bg-[#079A08] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(8,170,9,0.35)] active:translate-y-0 focus-visible:ring-[#08AA09]'
                          )}
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          {copied ? 'Copied' : 'Copy Address'}
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: 'My XRP Address', text: address });
                            } else {
                              handleCopy(address);
                            }
                          }}
                          aria-label="Share address"
                          className={cn(
                            'px-4 py-[14px] rounded-xl border-[1.5px] transition-all duration-200',
                            'max-sm:py-[10px]',
                            'hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                            'bg-white border-black/[0.08] text-black/30 hover:text-black/60 hover:border-black/15 dark:bg-[rgba(20,20,25,0.95)] dark:border-white/10 dark:text-white/30 dark:hover:text-white/60 dark:hover:border-white/20'
                          )}
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <section role="tabpanel" id="tabpanel-overview" aria-label="Overview" className="space-y-4">
                {/* Portfolio Header */}
                {(() => {
                  const totalPortfolio = totalValue + nftPortfolioValue;
                  const xrpValue = xrpToken ? parseFloat(xrpToken.amount) : 0;
                  const tokensOnlyValue = totalValue - xrpValue;
                  const nftCount = collections.reduce((sum, c) => sum + c.count, 0);

                  return (
                    <div className={cn(
                      'rounded-2xl border transition-all duration-300',
                      'bg-white border-gray-200 shadow-sm dark:bg-white/[0.02] dark:border-white/10'
                    )}>
                      {/* Portfolio Row */}
                      <div className="flex flex-col lg:flex-row lg:items-center p-3 sm:p-5 gap-4 sm:gap-6">
                        {/* User Identity */}
                        {profileUser && (
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'w-10 h-10 rounded-xl shrink-0 overflow-hidden',
                              'bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border dark:border-white/10'
                            )}>
                              {profileUser.avatar ? (
                                <img src={profileUser.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className={cn(
                                  'w-full h-full flex items-center justify-center text-sm font-bold',
                                  'text-blue-600 dark:text-[#137DFE]'
                                )}>
                                  {profileUser.username?.[0]?.toUpperCase() || address?.[1]?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <span className={cn('text-sm font-bold truncate max-w-[120px]', 'text-gray-800 dark:text-white/80')}>
                              {profileUser.username || 'Anonymous'}
                            </span>
                            <div className={cn('hidden lg:block w-px h-10', 'bg-gray-100 dark:bg-white/10')} />
                          </div>
                        )}

                        {/* Total Portfolio */}
                        <div className="flex flex-col gap-1 lg:min-w-[200px]">
                          <span className={cn('text-[10px] font-bold uppercase tracking-widest', 'text-gray-400 dark:text-white/30')}>Total Portfolio</span>
                          <div className="flex items-baseline gap-1.5">
                            <span role="status" aria-live="polite" className={cn('text-3xl font-black tabular-nums tracking-tight', 'text-gray-900 dark:text-white')}>
                              {tokensLoading ? '...' : (
                                <>
                                  {activeFiatCurrency !== 'XRP' && CURRENCY_SYMBOLS[activeFiatCurrency]}
                                  {(activeFiatCurrency === 'XRP' ? totalPortfolio : totalPortfolio * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </>
                              )}
                            </span>
                            <span className={cn('text-xs font-bold', 'text-[#137DFE] dark:text-[#137DFE]')}>{activeFiatCurrency}</span>
                          </div>
                        </div>

                        <div className={cn('hidden lg:block w-px h-10', 'bg-gray-100 dark:bg-white/10')} />

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap lg:items-center lg:gap-x-8 lg:gap-y-4 lg:flex-1">
                          {/* XRP */}
                          <div className="flex flex-col gap-0.5">
                            <span className={cn('text-[10px] font-bold uppercase tracking-widest', 'text-gray-400 dark:text-white/30')}>XRP Balance</span>
                            <span className={cn('text-base font-bold tabular-nums', 'text-gray-800 dark:text-white/90')}>
                              {xrpToken ? parseFloat(xrpToken.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </span>
                          </div>

                          {/* Tokens */}
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-[10px] font-bold uppercase tracking-widest', 'text-gray-400 dark:text-white/30')}>Tokens</span>
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold leading-none', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50')}>{tokenTotal || tokens.length}</span>
                            </div>
                            <span className={cn('text-base font-bold tabular-nums', 'text-gray-800 dark:text-white/90')}>
                              {activeFiatCurrency !== 'XRP' && CURRENCY_SYMBOLS[activeFiatCurrency]}{(activeFiatCurrency === 'XRP' ? tokensOnlyValue : tokensOnlyValue * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* NFTs */}
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-[10px] font-bold uppercase tracking-widest', 'text-gray-400 dark:text-white/30')}>NFTs</span>
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold leading-none', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50')}>{nftCount}</span>
                            </div>
                            <span className={cn('text-base font-bold tabular-nums', 'text-gray-800 dark:text-white/90')}>
                              {activeFiatCurrency !== 'XRP' && CURRENCY_SYMBOLS[activeFiatCurrency]}{(activeFiatCurrency === 'XRP' ? nftPortfolioValue : nftPortfolioValue * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2 lg:mt-0">
                          {isInactive && <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-[#F6AF01] font-bold uppercase tracking-wider">Inactive</span>}
                          <button onClick={() => setShowPanel('send')} aria-label="Send tokens" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#137DFE] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none">
                            <ArrowUpRight size={16} strokeWidth={2.5} /> Send
                          </button>
                          <button onClick={() => setShowPanel('receive')} aria-label="Receive tokens" className={cn('flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none', 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10')}>
                            <ArrowDownLeft size={16} strokeWidth={2.5} /> Receive
                          </button>
                        </div>
                      </div>

                      {/* Account Stats Strip */}
                      {accountInfo && (() => {
                        const bornDate = (() => { const d = new Date(accountInfo.inception); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
                        const pnlVal = accountInfo.totalPnl ?? accountInfo.pnl ?? accountInfo.dex_profit ?? 0;
                        const pnlPositive = pnlVal >= 0;
                        const hasPnl = accountInfo.totalPnl !== undefined || accountInfo.pnl !== undefined || accountInfo.dex_profit !== undefined;
                        return (
                          <div suppressHydrationWarning className={cn(
                            'px-4 py-2.5 rounded-b-2xl border-t transition-colors',
                            'bg-gray-50/50 border-gray-100 text-gray-500 dark:bg-white/[0.01] dark:border-white/5 dark:text-white/40'
                          )}>
                            {/* Row 1: Born | Reserve | Objects | XRP Rank | DEX Rank | NFT Rank */}
                            <div className="flex items-center justify-between lg:justify-start lg:gap-x-4">
                              <span className="text-[10px] lg:text-[11px]"><span className="flex flex-col items-center leading-tight lg:flex-row lg:gap-1"><span className="hidden lg:inline">Account Born</span><span className="lg:hidden">Born</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>{bornDate}</span></span></span>
                              <span className={cn('text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                              <span className="text-[10px] lg:text-[11px]"><span className="hidden lg:inline">XRP Reserve</span><span className="lg:hidden">Reserve</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>{accountInfo.reserve}</span></span>
                              <span className={cn('text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                              <span className="text-[10px] lg:text-[11px]"><span className="hidden lg:inline">Objects</span><span className="lg:hidden">Obj</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>{accountInfo.ownerCount}</span></span>
                              {accountInfo.rank && (
                                <>
                                  <span className={cn('text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                                  <span className="text-[10px] lg:text-[11px]"><span className="hidden lg:inline">XRP Rank</span><span className="lg:hidden">XRP</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>#{accountInfo.rank.toLocaleString()}</span></span>
                                </>
                              )}
                              {accountInfo.tradingRank && (
                                <>
                                  <span className={cn('text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                                  <span className="text-[10px] lg:text-[11px]"><span className="hidden lg:inline">DEX Rank</span><span className="lg:hidden">DEX</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>#{accountInfo.tradingRank.toLocaleString()}</span></span>
                                </>
                              )}
                              {nftStats?.rank && (
                                <>
                                  <span className={cn('text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                                  <span className="text-[10px] lg:text-[11px]"><span className="hidden lg:inline">NFT Rank</span><span className="lg:hidden">NFT</span> <span className={cn('font-bold', 'text-gray-700 dark:text-white/70')}>#{nftStats.rank.toLocaleString()}</span></span>
                                </>
                              )}
                              {/* Desktop-only: P&L + Share inline */}
                              {hasPnl && (
                                <>
                                  <span className={cn('hidden lg:inline text-[10px]', 'opacity-30 dark:opacity-20')}>|</span>
                                  <span className={cn('hidden lg:inline text-[11px] font-bold', pnlPositive ? 'text-emerald-500' : 'text-red-500')}>
                                    P&L {pnlPositive ? '+' : ''}{pnlVal.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP
                                  </span>
                                </>
                              )}
                              <button
                                onClick={() => setShowPLCard(true)}
                                aria-label="Share P&L card"
                                className={cn(
                                  'hidden lg:flex ml-auto items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold transition-all uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none',
                                  'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-[#137DFE]/10 dark:text-[#137DFE] dark:hover:bg-[#137DFE]/20'
                                )}
                              >
                                <Share2 size={10} /> Share
                              </button>
                            </div>
                            {/* Row 2 (mobile only): P&L + Share */}
                            <div className="lg:hidden flex items-center justify-center gap-3 mt-1.5">
                              {hasPnl && (
                                <div className="flex items-center gap-1">
                                  <Zap size={11} className={cn('shrink-0', pnlPositive ? 'text-emerald-500' : 'text-red-500')} />
                                  <span className={cn('text-[10px] font-bold', pnlPositive ? 'text-emerald-500' : 'text-red-500')}>
                                    P&L {pnlPositive ? '+' : ''}{pnlVal.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => setShowPLCard(true)}
                                className={cn(
                                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold transition-all uppercase tracking-wider',
                                  'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-[#137DFE]/10 dark:text-[#137DFE] dark:hover:bg-[#137DFE]/20'
                                )}
                              >
                                <Share2 size={10} /> Share
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                                              </div>
                                            );
                                          })()}
                {/* Main Content Grid - Symmetrical 2 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Assets */}
                  <div className="space-y-4">
                    {/* Token Holdings */}
                    <div
                      className={cn(
                        'rounded-xl h-full flex flex-col',
                        'bg-white border border-gray-200 dark:bg-black/40 dark:border dark:border-white/[0.12]'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-2.5 border-b", 'border-b-gray-100 dark:border-b-white/[0.08]')}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", 'bg-blue-500 dark:bg-[#137DFE]')} />
                          <p className={cn('text-xs font-bold uppercase tracking-wider', 'text-gray-600 dark:text-white/70')}>
                            Top Assets
                          </p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold leading-none', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50')}>
                            {tokenTotal || tokens.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('tokens')}
                          className={cn('text-xs font-semibold uppercase tracking-wide', 'text-[#137DFE] hover:text-blue-600 dark:text-[#137DFE] dark:hover:text-blue-400')}
                        >
                          View All
                        </button>
                      </div>
                      {tokensLoading ? (
                        <div className={cn('flex-1 flex items-center justify-center py-8', 'text-gray-400 dark:text-white/40')}>
                          <div className="animate-pulse flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#137DFE]" />
                            <span className="text-xs uppercase tracking-widest font-medium">Loading Assets</span>
                          </div>
                        </div>
                      ) : allTokens.length === 0 ? (
                        <div className={cn('p-6 text-center', 'text-gray-400 dark:text-white/35')}>
                          <Coins size={22} className={cn("mx-auto mb-2", 'text-gray-300 dark:text-white/20')} />
                          <p className={cn('text-xs font-semibold mb-1', 'text-gray-500 dark:text-white/50')}>No Tokens Yet</p>
                          <a href="/" className="text-xs font-bold text-[#137DFE] hover:text-blue-400">Browse Market</a>
                        </div>
                      ) : (
                        <>
                          <div className={cn("grid grid-cols-[1.4fr_0.8fr_0.6fr_0.8fr_0.6fr_0.5fr] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider", 'text-gray-400 border-b border-gray-50 dark:text-white/35 dark:border-b dark:border-white/[0.05]')}>
                            <span>Asset</span>
                            <span className="text-right">Balance</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Value</span>
                            <span className="text-right">P&L</span>
                            <span className="text-right">24h</span>
                          </div>
                          <div className={cn("divide-y", 'divide-gray-50 dark:divide-white/[0.04]')}>
                            {allTokens.slice(0, 5).map((token, idx) => (
                              <div key={token.symbol} className={cn("grid grid-cols-[1.4fr_0.8fr_0.6fr_0.8fr_0.6fr_0.5fr] gap-3 items-center px-4 py-2.5 transition-colors", 'hover:bg-gray-50/50 dark:hover:bg-white/[0.03]')}>
                                <Link href={`/token/${token.slug || token.md5 || md5Sync(`${token.issuer}_${token.currency}`)}`} className="flex items-center gap-2.5 min-w-0 group">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={`https://s1.xrpl.to/token/${token.md5 || md5Sync(`${token.issuer}_${token.currency}`)}`}
                                      alt=""
                                      className="w-8 h-8 rounded-full object-cover bg-white/10 ring-1 ring-white/10"
                                      onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                    />
                                    <span className={cn("absolute -bottom-0.5 -right-0.5 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center", 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50')}>{idx + 1}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className={cn("text-[13px] font-bold truncate group-hover:text-[#137DFE] transition-colors", 'text-gray-900 dark:text-white/95')}>{token.symbol}</p>
                                    <p className={cn("text-[11px] truncate", 'text-gray-400 dark:text-white/35')}>{token.name}</p>
                                  </div>
                                </Link>
                                <p className={cn("text-xs tabular-nums text-right truncate", 'text-gray-600 dark:text-white/60')}>{token.amount}</p>
                                <p className={cn("text-[11px] tabular-nums text-right", 'text-gray-500 dark:text-white/45')}>
                                  {token.symbol === 'XRP' ? (activeFiatCurrency === 'XRP' ? '--' : <>{CURRENCY_SYMBOLS[activeFiatCurrency]}{xrpUsdPrice.toFixed(2)}</>) : (typeof token.priceDisplay === 'object' && token.priceDisplay.compact ? <>0.0<sub>{token.priceDisplay.zeros}</sub>{token.priceDisplay.significant}</> : token.priceDisplay || '--')}
                                </p>
                                <p className={cn("text-xs font-bold tabular-nums text-right", 'text-gray-900 dark:text-white/90')}>
                                  {activeFiatCurrency === 'XRP' ? token.value : <>{CURRENCY_SYMBOLS[activeFiatCurrency]}{((token.rawValue || 0) * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                                </p>
                                {/* P&L */}
                                <p className={cn("text-xs tabular-nums text-right font-bold", (() => { const pnl = tokenPnlMap.get(token.md5 || md5Sync(`${token.issuer}_${token.currency}`)); return pnl && pnl.profit !== 0 ? (pnl.profit > 0 ? "text-[#08AA09]" : "text-red-400") : ('text-gray-400 dark:text-white/25'); })())}>
                                  {(() => { const pnl = tokenPnlMap.get(token.md5 || md5Sync(`${token.issuer}_${token.currency}`)); if (!pnl) return '--'; const p = pnl.profit; if (p === 0) return '--'; const a = Math.abs(p); const formatted = a >= 1000000 ? `${(a/1000000).toFixed(1)}M` : a >= 1000 ? `${(a/1000).toFixed(1)}K` : a.toFixed(1); return p > 0 ? `+${formatted}` : `-${formatted}`; })()}
                                </p>
                                <p className={cn("text-xs tabular-nums text-right font-bold", token.positive ? "text-[#08AA09]" : "text-red-400")}>
                                  {token.change}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column - NFTs & Watchlist */}
                  <div className="space-y-4">
                    {/* NFT Collections */}
                    <div
                      className={cn(
                        'rounded-xl h-full flex flex-col',
                        'bg-white border border-gray-200 dark:bg-black/40 dark:border dark:border-white/[0.12]'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-2.5 border-b", 'border-b-gray-100 dark:border-b-white/[0.08]')}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", 'bg-purple-600 dark:bg-purple-500')} />
                          <p className={cn('text-xs font-bold uppercase tracking-wider', 'text-gray-600 dark:text-white/70')}>
                            NFT Portfolio
                          </p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold leading-none', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50')}>
                            {collections.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('nfts')}
                          className={cn('text-xs font-semibold uppercase tracking-wide', 'text-[#137DFE] hover:text-blue-600 dark:text-[#137DFE] dark:hover:text-blue-400')}
                        >
                          View All
                        </button>
                      </div>
                      {collectionsLoading ? (
                        <div className={cn('flex-1 flex items-center justify-center py-8', 'text-gray-400 dark:text-white/40')}>
                          <div className="animate-pulse flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-xs uppercase tracking-widest font-medium">Loading NFTs</span>
                          </div>
                        </div>
                      ) : collections.length === 0 ? (
                        <div className={cn('p-6 text-center', 'text-gray-400 dark:text-white/35')}>
                          <Image size={22} className={cn("mx-auto mb-2", 'text-gray-300 dark:text-white/20')} />
                          <p className={cn('text-xs font-semibold mb-1', 'text-gray-500 dark:text-white/50')}>No NFTs Yet</p>
                          <a href="/nfts" className="text-xs font-bold text-[#137DFE] hover:text-blue-400">Browse Marketplace</a>
                        </div>
                      ) : (
                        <>
                          <div className={cn("grid grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_0.6fr_0.5fr] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider", 'text-gray-400 border-b border-gray-50 dark:text-white/35 dark:border-b dark:border-white/[0.05]')}>
                            <span>Collection</span>
                            <span className="text-right">Items</span>
                            <span className="text-right">Floor</span>
                            <span className="text-right">Value</span>
                            <span className="text-right">P&L</span>
                            <span className="text-right">24h</span>
                          </div>
                          <div className={cn("divide-y", 'divide-gray-50 dark:divide-white/[0.04]')}>
                            {collections.slice(0, 5).map((col, idx) => {
                              const floorChange = col.floor24hAgo && col.floor24hAgo > 0 ? ((col.floor - col.floor24hAgo) / col.floor24hAgo * 100) : 0;
                              const floorPositive = floorChange >= 0;
                              const colPnl = nftCollectionPnlMap.get(col.name);
                              return (
                              <button
                                key={col.id}
                                onClick={() => { setSelectedCollection(col.name); handleTabChange('nfts'); }}
                                className={cn("w-full grid grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_0.6fr_0.5fr] gap-3 items-center px-4 py-2.5 text-left transition-colors", 'hover:bg-gray-50/50 dark:hover:bg-white/[0.03]')}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 group">
                                  <div className="relative flex-shrink-0">
                                    {col.logo ? (
                                      <img src={col.logo} alt="" className="w-8 h-8 rounded-full object-cover bg-white/10 ring-1 ring-white/10" onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }} />
                                    ) : (
                                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold", 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-white/30')}>NFT</div>
                                    )}
                                    <span className={cn("absolute -bottom-0.5 -right-0.5 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center", 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50')}>{idx + 1}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className={cn("text-[13px] font-bold truncate group-hover:text-[#137DFE] transition-colors", 'text-gray-900 dark:text-white/95')}>{col.name}</p>
                                    <p className={cn("text-[11px] truncate", 'text-gray-400 dark:text-white/35')}>{col.slug || 'Collection'}</p>
                                  </div>
                                </div>
                                <p className={cn("text-xs tabular-nums text-right", 'text-gray-600 dark:text-white/60')}>{col.count}</p>
                                <p className={cn("text-[11px] tabular-nums text-right", 'text-gray-500 dark:text-white/45')}>{col.floor}</p>
                                <p className={cn("text-xs font-bold tabular-nums text-right", 'text-gray-900 dark:text-white/90')}>{col.value.toLocaleString()}</p>
                                {/* P&L */}
                                <p className={cn("text-xs tabular-nums text-right font-bold", (() => { return colPnl && colPnl.profit !== 0 ? (colPnl.profit > 0 ? "text-[#08AA09]" : "text-red-400") : ('text-gray-400 dark:text-white/25'); })())}>
                                  {(() => { if (!colPnl) return '--'; const p = colPnl.profit; if (p === 0) return '--'; const a = Math.abs(p); const formatted = a >= 1000000 ? `${(a/1000000).toFixed(1)}M` : a >= 1000 ? `${(a/1000).toFixed(1)}K` : a.toFixed(1); return p > 0 ? `+${formatted}` : `-${formatted}`; })()}
                                </p>
                                <p className={cn("text-xs tabular-nums text-right font-bold", floorChange === 0 ? ('text-gray-400 dark:text-white/25') : (floorPositive ? "text-[#08AA09]" : "text-red-400"))}>
                                  {floorChange !== 0 ? `${floorPositive ? '+' : ''}${floorChange.toFixed(1)}%` : '--'}
                                </p>
                              </button>
                            )})}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Open Orders */}
                  <button
                    onClick={() => { handleTabChange('activity'); setActivitySubTab('orders'); }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl text-left transition-all group',
                      'bg-white border border-gray-200 hover:border-gray-300 dark:bg-black/40 dark:border dark:border-white/[0.08] dark:hover:border-white/20'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', 'bg-amber-50 dark:bg-amber-500/10')}>
                      <RotateCcw size={16} className="text-[#F6AF01]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-semibold group-hover:text-[#137DFE] transition-colors', 'text-gray-900 dark:text-white/90')}>Open Orders</p>
                      <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                        {tokenOffers.length + nftOffers.length > 0
                          ? `${tokenOffers.length + nftOffers.length} active`
                          : 'No open orders'}
                      </p>
                    </div>
                    <ChevronRight size={14} className={cn('shrink-0 transition-transform group-hover:translate-x-0.5', 'text-gray-300 dark:text-white/20')} />
                  </button>

                  {/* Referral */}
                  <button
                    onClick={() => { handleTabChange('profile'); setProfileSection('referral'); }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl text-left transition-all group',
                      'bg-white border border-gray-200 hover:border-gray-300 dark:bg-black/40 dark:border dark:border-white/[0.08] dark:hover:border-white/20'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                      <Swords size={16} className="text-[#137DFE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-semibold group-hover:text-[#137DFE] transition-colors', 'text-gray-900 dark:text-white/90')}>Referral</p>
                      <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                        {referralUser
                          ? `${referralUser.tier || 'Recruit'} · ${referralUser.recruits || 0} recruits`
                          : 'Earn by referring'}
                      </p>
                    </div>
                    <ChevronRight size={14} className={cn('shrink-0 transition-transform group-hover:translate-x-0.5', 'text-gray-300 dark:text-white/20')} />
                  </button>

                  {/* Saved Addresses */}
                  <button
                    onClick={() => { handleTabChange('profile'); setProfileSection('addresses'); }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl text-left transition-all group',
                      'bg-white border border-gray-200 hover:border-gray-300 dark:bg-black/40 dark:border dark:border-white/[0.08] dark:hover:border-white/20'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', 'bg-green-50 dark:bg-[#08AA09]/10')}>
                      <Building2 size={16} className="text-[#08AA09]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-semibold group-hover:text-[#137DFE] transition-colors', 'text-gray-900 dark:text-white/90')}>Saved Addresses</p>
                      <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                        {withdrawals.length > 0
                          ? `${withdrawals.length} address${withdrawals.length !== 1 ? 'es' : ''}`
                          : 'Add withdrawal addresses'}
                      </p>
                    </div>
                    <ChevronRight size={14} className={cn('shrink-0 transition-transform group-hover:translate-x-0.5', 'text-gray-300 dark:text-white/20')} />
                  </button>
                </div>

                {/* Recent Activity */}
                <div className="mt-4">
                  <AccountHistory account={address} compact onShowMore={() => { handleTabChange('activity'); setActivitySubTab('history'); }} />
                </div>
              </section>
            )}

            {/* Tokens Tab - Full Token Management */}
            {activeTab === 'tokens' &&
              (() => {
                const filteredTokens = allTokens
                  .filter((t) => {
                    if (
                      tokenSearch &&
                      !t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) &&
                      !t.name.toLowerCase().includes(tokenSearch.toLowerCase())
                    )
                      return false;
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
                    <div
                      className={cn(
                        'rounded-xl p-4',
                        'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                          <Search
                            size={16}
                            className={cn(
                              'absolute left-3 top-1/2 -translate-y-1/2',
                              'text-[#137DFE] dark:text-[#137DFE]'
                            )}
                          />
                          <input
                            type="text"
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search tokens..."
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px] max-sm:text-base outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150',
                              'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE] dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/30 dark:focus:border-[#137DFE]/40'
                            )}
                          />
                        </div>
                        {/* Sort */}
                        <div className="flex items-center gap-2">
                          <select
                            value={tokenSort}
                            onChange={(e) => setTokenSort(e.target.value)}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150',
                              'bg-gray-50 border border-gray-200 dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-white/[0.15] dark:[&>option]:bg-[#1a1a1a]'
                            )}
                          >
                            <option value="value">Sort by Value</option>
                            <option value="name">Sort by Name</option>
                            <option value="change">Sort by 24h Change</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={cn('text-[11px]', 'text-gray-400 dark:text-white/35')}
                        >
                          {tokensLoading
                            ? 'Loading...'
                            : `${filteredTokens.length} of ${allTokens.length} tokens`}
                        </span>
                        {tokenSearch && (
                          <button
                            onClick={() => setTokenSearch('')}
                            className={cn(
                              'text-[11px] transition-colors',
                              'text-[#137DFE] hover:text-blue-600 dark:text-[#137DFE] dark:hover:text-blue-300'
                            )}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Token List */}
                    <div
                      className={cn(
                        'rounded-2xl overflow-hidden border transition-all duration-300',
                        'bg-white border-gray-200 shadow-sm dark:bg-black/40 dark:backdrop-blur-md dark:border-white/10'
                      )}
                    >
                      {/* Table Header */}
                      <div className={cn("grid grid-cols-[2.5fr_1.2fr_1.2fr_1.2fr_1fr_1fr_120px] gap-4 px-6 py-3 text-[10px] uppercase tracking-widest font-black border-b", 'text-gray-400 border-gray-100 bg-gray-50/50 dark:text-white/30 dark:border-white/5 dark:bg-white/[0.01]')}>
                        <div>Asset</div>
                        <div className="text-right">Balance</div>
                        <div className="text-right">Price</div>
                        <div className="text-right">Value</div>
                        <div className="text-right">P&L</div>
                        <div className="text-right">24h</div>
                        <div className="text-right">Actions</div>
                      </div>

                      {/* Token Rows */}
                      {filteredTokens.length === 0 ? (
                        <div className={cn('p-12 text-center', 'text-gray-300 dark:text-white/20')}>
                          <BearIcon />
                          <p className={cn('text-xs font-bold tracking-widest uppercase mt-4 mb-2', 'text-gray-400 dark:text-white/40')}>
                            No Tokens Found
                          </p>
                          <a href="/" className="text-sm font-bold text-[#137DFE] hover:underline">Explore the Market</a>
                        </div>
                      ) : (
                        <div className={cn("divide-y", 'divide-gray-50 dark:divide-white/5')}>
                          {filteredTokens.slice((tokenPage - 1) * tokensPerPage, tokenPage * tokensPerPage).map((token) => (
                            <div key={token.symbol} onClick={() => token.slug && router.push(`/token/${token.slug}`)} className={cn("grid grid-cols-[2.5fr_1.2fr_1.2fr_1.2fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-all duration-200 group", token.slug && "cursor-pointer", 'hover:bg-blue-50/30 dark:hover:bg-white/[0.03]')}>
                              {/* Asset */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                  <img
                                    src={`https://s1.xrpl.to/token/${token.md5 || md5Sync(`${token.issuer}_${token.currency}`)}`}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover shrink-0 bg-white/10 ring-2 ring-white/5 group-hover:ring-[#137DFE]/30 transition-all"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                  />
                                  {token.verified && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center" title="Verified">
                                      <Check size={8} className="text-white" strokeWidth={4} />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className={cn("text-sm font-black truncate group-hover:text-[#137DFE] transition-colors", 'text-gray-900 dark:text-white')}>{token.symbol}</p>
                                  <p className={cn("text-[11px] font-medium truncate", 'text-gray-400 dark:text-white/30')}>{token.name}</p>
                                </div>
                              </div>

                              {/* Balance */}
                              <div className="text-right">
                                <p className={cn("text-[13px] font-bold tabular-nums", 'text-gray-700 dark:text-white/80')}>{token.amount}</p>
                                {token.percentOwned > 0 && <p className={cn("text-[10px] font-medium tabular-nums", 'text-gray-400 dark:text-white/20')}>{token.percentOwned.toFixed(2)}% supply</p>}
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className={cn("text-[12px] font-bold tabular-nums", 'text-gray-600 dark:text-white/60')}>
                                  {token.symbol === 'XRP' ? (
                                    activeFiatCurrency === 'XRP' ? '--' : <>{CURRENCY_SYMBOLS[activeFiatCurrency]}{xrpUsdPrice.toFixed(2)}</>
                                  ) : (
                                    activeFiatCurrency === 'XRP' ? (
                                      typeof token.priceDisplay === 'object' && token.priceDisplay.compact ? <>0.0<sub className="text-[0.8em]">{token.priceDisplay.zeros}</sub>{token.priceDisplay.significant}</> : token.priceDisplay
                                    ) : (
                                      <>{CURRENCY_SYMBOLS[activeFiatCurrency]}{((token.price || 0) * xrpUsdPrice).toFixed((token.price || 0) * xrpUsdPrice >= 1 ? 2 : 6)}</>
                                    )
                                  )}
                                </p>
                                <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-30")}>{token.symbol === 'XRP' ? activeFiatCurrency : (activeFiatCurrency === 'XRP' ? 'XRP' : activeFiatCurrency)}</span>
                              </div>

                              {/* Value */}
                              <div className="text-right">
                                <p className={cn("text-[13px] font-black tabular-nums tracking-tight", 'text-gray-900 dark:text-white')}>
                                  {activeFiatCurrency === 'XRP' ? token.value : <>{CURRENCY_SYMBOLS[activeFiatCurrency]}{((token.rawValue || 0) * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                                </p>
                                <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-30")}>{activeFiatCurrency}</span>
                              </div>

                              {/* P&L */}
                              <div className="text-right">
                                {(() => {
                                  const pnl = tokenPnlMap.get(token.md5 || md5Sync(`${token.issuer}_${token.currency}`));
                                  if (!pnl || pnl.profit === 0) return <p className={cn("text-[13px] font-bold", 'text-gray-200 dark:text-white/10')}>--</p>;
                                  const p = pnl.profit;
                                  const a = Math.abs(p);
                                  const formatted = a >= 1000000 ? `${(a/1000000).toFixed(1)}M` : a >= 1000 ? `${(a/1000).toFixed(1)}K` : a.toFixed(1);
                                  return (
                                    <>
                                      <p className={cn("text-[13px] font-black tabular-nums", p > 0 ? "text-emerald-500" : "text-red-500")}>{p > 0 ? '+' : '-'}{formatted}</p>
                                      <p className={cn("text-[10px] font-bold tabular-nums opacity-60", p > 0 ? "text-emerald-500" : "text-red-500")}>{(pnl.roi || 0).toFixed(1)}%</p>
                                    </>
                                  );
                                })()}
                              </div>

                              {/* 24h */}
                              <div className="text-right">
                                <p className={cn("text-[13px] font-black tabular-nums", token.positive ? "text-emerald-500" : "text-red-500")}>{token.change}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {token.rawAmount >= 0.000001 && token.currency && token.issuer && (
                                  <button onClick={() => { setBurnModal(token); setBurnAmount(''); }} disabled={burning === token.currency + token.issuer} aria-label={`Burn ${token.symbol}`} className={cn("p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none", 'text-gray-300 hover:text-orange-600 hover:bg-orange-50 dark:text-white/20 dark:hover:text-orange-500 dark:hover:bg-orange-500/10')} title="Burn">
                                    <Flame size={16} strokeWidth={2.5} />
                                  </button>
                                )}
                                {token.currency && token.issuer && (
                                  <button onClick={() => { setTradeModal(token); setTradeAmount(''); setTradeDirection('sell'); }} aria-label={`Trade ${token.symbol}`} className={cn("p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none", 'text-gray-300 hover:text-[#137DFE] hover:bg-blue-50 dark:text-white/20 dark:hover:text-[#137DFE] dark:hover:bg-[#137DFE]/10')} title="Trade">
                                    <ArrowRightLeft size={16} strokeWidth={2.5} />
                                  </button>
                                )}
                                <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} aria-label={`Send ${token.symbol}`} className={cn("p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:outline-none", 'text-[#137DFE] bg-blue-50 hover:bg-blue-100 dark:text-[#137DFE] dark:bg-[#137DFE]/10 dark:hover:bg-[#137DFE]/20')} title="Send">
                                  <Send size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {filteredTokens.length > tokensPerPage && (
                      <div
                        className={cn(
                          'rounded-xl p-3 flex items-center justify-between',
                          'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]'
                        )}
                      >
                        <span
                          className={cn('text-[11px]', 'text-gray-500 dark:text-white/40')}
                        >
                          Showing {(tokenPage - 1) * tokensPerPage + 1}-
                          {Math.min(tokenPage * tokensPerPage, filteredTokens.length)} of {tokenTotal || filteredTokens.length}
                          {loadingMore && <span className="ml-1 animate-pulse">loading...</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setTokenPage((p) => Math.max(1, p - 1))}
                            disabled={tokenPage === 1}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30',
                              'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]'
                            )}
                          >
                            Prev
                          </button>
                          {Array.from(
                            { length: Math.ceil(filteredTokens.length / tokensPerPage) },
                            (_, i) => i + 1
                          )
                            .slice(Math.max(0, tokenPage - 3), tokenPage + 2)
                            .map((p) => (
                              <button
                                key={p}
                                onClick={() => setTokenPage(p)}
                                className={cn(
                                  'w-8 h-8 rounded-lg text-[11px] font-medium transition-colors',
                                  p === tokenPage
                                    ? 'bg-[#137DFE] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]'
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          <button
                            onClick={() =>
                              setTokenPage((p) =>
                                Math.min(Math.ceil(filteredTokens.length / tokensPerPage), p + 1)
                              )
                            }
                            disabled={tokenPage >= Math.ceil(filteredTokens.length / tokensPerPage)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30',
                              'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]'
                            )}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <section role="tabpanel" id="tabpanel-activity" aria-label="Activity" className="space-y-4">
                {/* Sub-tab toggle */}
                <div className={cn('flex gap-1 p-1 rounded-xl w-fit', 'bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border dark:border-white/[0.08]')}>
                  {[
                    { id: 'orders', label: 'Open Orders', count: tokenOffers.length + nftOffers.length },
                    { id: 'history', label: 'Trade History' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActivitySubTab(sub.id)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
                        activitySubTab === sub.id
                          ? ('bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-sm')
                          : ('text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/60')
                      )}
                    >
                      {sub.label}
                      {sub.count > 0 && (
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold leading-none', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50')}>{sub.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Open Orders sub-tab */}
                {activitySubTab === 'orders' && (
                  <div className="space-y-4">
                {offersLoading ? (
                  <div
                    className={cn(
                      'p-8 text-center rounded-xl',
                      'bg-white border border-gray-200 text-gray-400 dark:bg-white/[0.04] dark:border dark:border-white/[0.15] dark:text-white/40'
                    )}
                  >
                    Loading...
                  </div>
                ) : (
                  <>
                    {/* DEX Offers */}
                    <div
                      className={cn(
                        'rounded-xl',
                        'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]'
                      )}
                    >
                      <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                        <RotateCcw
                          size={15}
                          className={'text-gray-500 dark:text-white/50'}
                        />
                        <p
                          className={cn(
                            'text-xs font-semibold uppercase tracking-[0.15em]',
                            'text-gray-500 dark:text-white/50'
                          )}
                        >
                          Dex Offers
                        </p>
                        <span
                          className={cn(
                            'ml-auto text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                            'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50 dark:border dark:border-white/[0.15]'
                          )}
                        >
                          {tokenOffers.length}
                        </span>
                      </div>
                      {tokenOffers.length === 0 ? (
                        <div className={cn('p-6 text-center', 'text-gray-400 dark:text-white/35')}>
                          <BearIcon />
                          <p className={cn('text-[11px] font-medium tracking-wider', 'text-gray-500 dark:text-white/60')}>
                            NO OPEN DEX OFFERS
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-blue-500/5">
                          {/* Header row */}
                          <div
                            className={cn(
                              'grid grid-cols-[1fr_24px_1fr_1fr_80px_70px_32px] gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wider',
                              'text-gray-400 dark:text-white/30'
                            )}
                          >
                            <span>Sell</span>
                            <span></span>
                            <span>Buy</span>
                            <span>Rate</span>
                            <span className="text-right">Expires</span>
                            <span className="text-right">Status</span>
                            <span></span>
                          </div>
                          {tokenOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className={cn(
                                'grid grid-cols-[1fr_24px_1fr_1fr_80px_70px_32px] gap-3 px-4 py-3 items-center transition-all duration-150',
                                'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[11px] font-semibold shrink-0',
                                    offer.type === 'buy' ? 'bg-emerald-500/10 text-[#08AA09]' : 'bg-red-500/10 text-red-400'
                                  )}
                                >
                                  {offer.type === 'buy' ? 'Buy' : 'Sell'}
                                </span>
                                <span
                                  className={cn(
                                    'text-[13px] font-medium truncate',
                                    'text-gray-900 dark:text-white/90'
                                  )}
                                >
                                  {offer.from}
                                </span>
                              </div>
                              <span
                                className={cn('text-[11px] shrink-0', 'text-gray-300 dark:text-white/20')}
                              >to</span>
                              <span
                                className={cn(
                                  'text-[13px] font-medium truncate',
                                  'text-gray-900 dark:text-white/90'
                                )}
                              >
                                {offer.to}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={cn(
                                    'text-xs truncate',
                                    'text-gray-500 dark:text-white/50'
                                  )}
                                >
                                  {offer.rate}
                                </span>
                                {offer.distPct != null && (
                                  <span
                                    className={cn(
                                      'text-[10px] font-medium',
                                      Math.abs(offer.distPct) < 1
                                        ? 'text-[#08AA09]'
                                        : Math.abs(offer.distPct) < 5
                                          ? 'text-gray-400 dark:text-white/40'
                                          : 'text-[#F6AF01]'
                                    )}
                                  >
                                    {offer.distPct > 0 ? '+' : ''}{offer.distPct}% {Math.abs(offer.distPct) < 1 ? 'at market' : 'from market'}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                {offer.expire ? (
                                  (() => {
                                    const diff = offer.expire - Date.now();
                                    if (diff <= 0) return <span className={cn("text-[10px] font-medium", "text-red-400")}>Expired</span>;
                                    const days = Math.floor(diff / 86400000);
                                    const hours = Math.floor((diff % 86400000) / 3600000);
                                    const mins = Math.floor((diff % 3600000) / 60000);
                                    const label = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                    return (
                                      <span className={cn("text-[10px] font-medium", diff < 86400000 ? "text-[#F6AF01]" : 'text-gray-500 dark:text-white/40')} title={new Date(offer.expire).toLocaleString()}>
                                        {label}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className={cn("text-[10px]", 'text-gray-300 dark:text-white/20')}>--</span>
                                )}
                              </div>
                              <div className="flex justify-end">
                                {!offer.funded ? (
                                  <span
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                      'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-[#F6AF01]'
                                    )}
                                  >
                                    Unfunded
                                  </span>
                                ) : (
                                  <span
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-[#08AA09]'
                                    )}
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleCancelOffer(offer)}
                                disabled={cancellingOffer === offer.seq}
                                className={cn(
                                  'w-7 h-7 rounded flex items-center justify-center transition-colors',
                                  cancellingOffer === offer.seq
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/10'
                                )}
                                title="Cancel offer"
                              >
                                {cancellingOffer === offer.seq ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X size={14} />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NFT Offers */}
                    <div className={cn('rounded-xl', 'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]')}>
                      <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                        <Image size={15} className={'text-gray-500 dark:text-white/50'} />
                        <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', 'text-gray-500 dark:text-white/50')}>NFT Offers</p>
                        <span className={cn('ml-auto text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50 dark:border dark:border-white/[0.15]')}>{nftOffers.length}</span>
                      </div>
                      {nftOffers.length === 0 ? (
                        <div className={cn('p-6 text-center', 'text-gray-400 dark:text-white/35')}>
                          <BearIcon />
                          <p className={cn('text-[11px] font-medium tracking-wider', 'text-gray-500 dark:text-white/60')}>NO NFT OFFERS</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-blue-500/5">
                          <div className={cn('grid grid-cols-[1fr_1fr_1fr_70px_32px] gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wider', 'text-gray-400 dark:text-white/30')}>
                            <span>NFT</span>
                            <span>Price</span>
                            <span>vs Floor</span>
                            <span className="text-right">Type</span>
                            <span></span>
                          </div>
                          {nftOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className={cn('grid grid-cols-[1fr_1fr_1fr_70px_32px] gap-3 px-4 py-3 items-center transition-all duration-150', offer.fraud ? 'bg-red-500/10 border-l-2 border-red-500' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]')}
                            >
                              <Link href={`/nft/${offer.nftId}`} className="flex items-center gap-2 min-w-0">
                                {offer.image ? (
                                  <img src={offer.image} alt={offer.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                                ) : (
                                  <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', 'bg-gray-100 dark:bg-white/5')}>
                                    <Image size={12} className={'text-gray-400 dark:text-white/30'} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={cn('text-[13px] font-medium truncate', 'text-gray-900 dark:text-white/90')}>{offer.name}</p>
                                  <p className={cn('text-[10px] truncate', 'text-gray-400 dark:text-white/40')}>{offer.collection}</p>
                                </div>
                              </Link>
                              <span className={cn('text-[13px] font-medium tabular-nums', 'text-gray-900 dark:text-white/90')}>{offer.price > 0 ? <>{offer.price.toLocaleString(undefined, { maximumFractionDigits: offer.price >= 100 ? 0 : 2 })} <span className={cn('text-[10px] font-normal', 'text-gray-400 dark:text-white/30')}>XRP</span></> : '--'}</span>
                              <div className="flex flex-col">
                                {offer.floor > 0 ? (
                                  <>
                                    <span className={cn('text-xs font-medium tabular-nums', offer.floorDiffPct >= 0 ? 'text-[#08AA09]' : 'text-red-400')}>{offer.floorDiffPct >= 0 ? '+' : ''}{offer.floorDiffPct.toFixed(0)}%</span>
                                    <span className={cn('text-[10px] tabular-nums', 'text-gray-400 dark:text-white/30')}>{offer.floor.toLocaleString(undefined, { maximumFractionDigits: offer.floor >= 100 ? 0 : 1 })} XRP</span>
                                  </>
                                ) : (
                                  <span className={cn('text-xs', 'text-gray-400 dark:text-white/30')}>--</span>
                                )}
                              </div>
                              <div className="flex justify-end">
                                <span className={cn('text-[11px] px-2 py-0.5 rounded font-medium', offer.type === 'sell' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-[#08AA09]')}>
                                  {offer.type === 'sell' ? 'Sell' : 'Buy'}
                                </span>
                              </div>
                              {offer.type === 'sell' ? (
                                <button
                                  onClick={() => handleCancelNftOffer(offer)}
                                  disabled={cancellingNftOffer === offer.id}
                                  className={cn('w-7 h-7 rounded flex items-center justify-center transition-colors', cancellingNftOffer === offer.id ? 'opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/10')}
                                  title="Cancel offer"
                                >
                                  {cancellingNftOffer === offer.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <X size={14} />}
                                </button>
                              ) : (
                                <div />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                  </div>
                )}

                {/* Trade History sub-tab */}
                {activitySubTab === 'history' && (
                  <AccountHistory account={address} />
                )}
              </section>
            )}

            {/* Profile Tab (includes Referral & Saved Addresses) */}
            {activeTab === 'profile' && (
              <section role="tabpanel" id="tabpanel-profile" aria-label="Profile" className="space-y-4">
                {profileLoading ? (
                  <div className={cn('rounded-xl p-12 text-center', 'bg-white border border-gray-200 dark:bg-black/50 dark:border dark:border-white/[0.15]')}>
                    <p className={cn('text-sm', 'text-gray-400 dark:text-white/40')}>Loading...</p>
                  </div>
                ) : profileUser ? (
                  <div className={cn('rounded-xl p-6 relative', 'bg-white border-[1.5px] border-gray-200 dark:bg-black/50 dark:border-[1.5px] dark:border-white/10')}>

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Avatar Wrapper */}
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="relative group shrink-0"
                        title="Change avatar"
                      >
                        <div className={cn(
                          'w-24 h-24 rounded-xl p-1',
                          'bg-gray-50 border-[1.5px] border-gray-200 dark:bg-white/5 dark:border-[1.5px] dark:border-white/10'
                        )}>
                          {profileUser.avatar ? (
                            <img
                              src={profileUser.avatar}
                              alt="Avatar"
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className={cn(
                              'w-full h-full rounded-xl flex items-center justify-center text-3xl font-bold',
                              'bg-blue-50 text-blue-600 dark:bg-[#137DFE]/10 dark:text-[#137DFE]'
                            )}>
                              {profileUser.username?.[0]?.toUpperCase() || address?.[1]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-2 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
                          <Image size={24} className="text-white" />
                        </div>
                        {/* Tier Indicator */}
                        <div className={cn('absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4', 'border-white dark:border-[#0a0a0a]', profileUser.tier === 'verified' ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF]' : profileUser.tier === 'diamond' ? 'bg-violet-500' : profileUser.tier === 'nova' ? 'bg-amber-500' : profileUser.tier === 'vip' ? 'bg-emerald-500' : 'bg-gray-400')} />
                      </button>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0 text-center md:text-left pt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                          {editingUsername ? (
                            <div className="flex items-center gap-2 max-w-sm mx-auto md:mx-0">
                              <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 14))}
                                placeholder="2-14 characters"
                                autoFocus
                                className={cn(
                                  'flex-1 px-3 py-1.5 rounded-xl text-[14px] font-medium outline-none border transition-all',
                                  'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[#137DFE]/50'
                                )}
                              />
                              <button
                                onClick={handleUpdateUsername}
                                disabled={profileLoading || newUsername.length < 2}
                                className="p-2 rounded-xl bg-[#137DFE] text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => { setEditingUsername(false); setProfileError(''); }}
                                className={cn('p-2 rounded-xl transition-colors', 'bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/50')}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              <h2 className={cn('text-2xl font-black tracking-tight', 'text-gray-900 dark:text-white')}>
                                {profileUser.username || 'Anonymous User'}
                              </h2>
                              {(!profileUser.username || userPerks?.perks?.canChangeUsername) && (
                                <button
                                  onClick={() => { setEditingUsername(true); setNewUsername(profileUser.username || ''); }}
                                  className={cn('p-1.5 rounded-lg transition-colors', 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-white/30 dark:hover:text-white/60 dark:hover:bg-white/5')}
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <button
                            onClick={() => handleCopy(address)}
                            className={cn(
                              'flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono transition-all',
                              'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/60'
                            )}
                          >
                            <Wallet size={14} />
                            {address?.slice(0, 12)}...{address?.slice(-8)}
                            <Copy size={12} className="ml-1 opacity-40" />
                          </button>

                          <div className={cn('px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-2', 'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-white/40')}>
                            <Clock size={14} />
                            Joined {profileUser.createdAt ? formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true }) : 'Recently'}
                          </div>
                        </div>
                      </div>

                      {/* Role / Tier / Rank / Badges — separated into labeled groups */}
                      <div className="md:absolute md:top-0 md:right-0 flex flex-col items-center md:items-end gap-2">
                        {(() => {
                          const allItems = [...new Set([...(userPerks?.roles || []).filter(r => r !== 'member'), ...(userPerks?.groups || [])])];
                          const roles = allItems.filter(r => knownRoles.includes(r));
                          const tiers = allItems.filter(r => knownTiers.includes(r));
                          const rankItem = allItems.find(r => r.startsWith('rank:'));
                          const rankName = rankItem ? rankItem.split(':')[1] : null;
                          if (roles.length === 0 && tiers.length === 0 && !rankName) return null;

                          const defaultPill = { icon: Trophy, bg: 'bg-gray-100 dark:bg-white/5', text: 'text-gray-500 dark:text-white/50', border: 'border-gray-200 dark:border-white/10' };
                          const defaultRankStyle = { bg: 'bg-gray-100 dark:bg-white/5', text: 'text-gray-500 dark:text-white/50', border: 'border-gray-200 dark:border-white/10' };

                          const renderPill = (name, config) => {
                            const Icon = config.icon;
                            return (
                              <span key={name} className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight flex items-center gap-1.5 border backdrop-blur-md whitespace-nowrap', config.bg, config.border)}>
                                {Icon && <Icon size={12} className={config.gradient ? 'text-[#FFD700]' : config.text} />}
                                <span className={cn(config.gradient ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' : config.text)}>{name.toUpperCase()}</span>
                              </span>
                            );
                          };

                          return (
                            <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5">
                              {roles.length > 0 && (
                                <>
                                  <span className={cn('text-[9px] font-bold uppercase tracking-widest mr-1', 'text-gray-300 dark:text-white/20')}>Role</span>
                                  {roles.map(r => renderPill(r, tierConfig[r] || defaultPill))}
                                </>
                              )}
                              {tiers.length > 0 && (
                                <>
                                  <span className={cn('text-[9px] font-bold uppercase tracking-widest', roles.length > 0 ? 'ml-2 mr-1' : 'mr-1', 'text-gray-300 dark:text-white/20')}>Tier</span>
                                  {tiers.map(t => renderPill(t, tierConfig[t] || defaultPill))}
                                </>
                              )}
                              {rankName && (
                                <>
                                  <span className={cn('text-[9px] font-bold uppercase tracking-widest', (roles.length > 0 || tiers.length > 0) ? 'ml-2 mr-1' : 'mr-1', 'text-gray-300 dark:text-white/20')}>Rank</span>
                                  {(() => {
                                    const rs = rankStyles[rankName] || defaultRankStyle;
                                    return (
                                      <span className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight flex items-center gap-1.5 border backdrop-blur-md whitespace-nowrap', rs.bg, rs.border)}>
                                        <Swords size={12} className={rs.gradient ? 'text-[#FFD700]' : rs.text} />
                                        <span className={cn(rs.gradient ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' : rs.text)}>{rankName.toUpperCase()}</span>
                                      </span>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          );
                        })()}
                        {/* Achievement Badges — shield SVGs */}
                        {displayBadges.available.filter(b => b.startsWith('badge:')).length > 0 && (
                          <div className="flex flex-wrap items-center justify-center md:justify-end gap-1">
                            <span className={cn('text-[9px] font-bold uppercase tracking-widest mr-1', 'text-gray-300 dark:text-white/20')}>Badges</span>
                            {displayBadges.available.filter(b => b.startsWith('badge:')).map(badgeId => (
                              <BadgeShield key={badgeId} badgeKey={badgeId.split(':')[1]} earned={true} size="md" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t', 'border-gray-100 dark:border-white/5')}>
                      <div className="text-center md:text-left">
                        <p className={cn('text-[11px] uppercase tracking-[0.1em] font-bold mb-1.5', 'text-gray-400 dark:text-white/25')}>Membership</p>
                        <p className={cn('text-sm font-semibold capitalize', 'text-gray-700 dark:text-white/80')}>{profileUser.tier || userPerks?.tier || 'Member'}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className={cn('text-[11px] uppercase tracking-[0.1em] font-bold mb-1.5', 'text-gray-400 dark:text-white/25')}>Army Rank</p>
                        <p className={cn('text-sm font-semibold', 'text-gray-700 dark:text-white/80')}>{profileUser.armyRank || 'Unranked'}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className={cn('text-[11px] uppercase tracking-[0.1em] font-bold mb-1.5', 'text-gray-400 dark:text-white/25')}>Recruits</p>
                        <p className={cn('text-sm font-semibold', 'text-gray-700 dark:text-white/80')}>{profileUser.armyRecruits ?? 0}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className={cn('text-[11px] uppercase tracking-[0.1em] font-bold mb-1.5', 'text-gray-400 dark:text-white/25')}>Last Update</p>
                        <p className={cn('text-sm font-semibold', 'text-gray-600 dark:text-white/60')}>{profileUser.updatedAt ? formatDistanceToNow(new Date(profileUser.updatedAt), { addSuffix: true }) : 'Never'}</p>
                      </div>
                    </div>

                    {/* Avatar Picker Modal - Moved inside for better scoping or logic flow */}
                    {showAvatarPicker && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md max-sm:h-dvh" onClick={() => setShowAvatarPicker(false)}>
                        <div
                          className={cn('w-full max-w-md rounded-xl p-5', 'bg-white border-[1.5px] border-gray-200 dark:bg-[#0a0a0a] dark:border-[1.5px] dark:border-white/10')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div>
                              <h3 className={cn('text-lg font-bold', 'text-gray-900 dark:text-white')}>Select NFT Avatar</h3>
                              <p className={cn('text-sm', 'text-gray-500 dark:text-white/40')}>Choose an NFT from your wallet</p>
                            </div>
                            <button onClick={() => setShowAvatarPicker(false)} className={cn('p-2 rounded-xl transition-colors', 'hover:bg-gray-100 text-gray-500 dark:hover:bg-white/10 dark:text-white/50')}>
                              <X size={20} />
                            </button>
                          </div>

                          {avatarNftsLoading ? (
                            <div className="py-12 text-center animate-pulse">
                              <div className={cn('w-12 h-12 rounded-full mx-auto mb-4 bg-white/5')} />
                              <p className={cn('text-sm font-medium', 'text-gray-400 dark:text-white/40')}>Loading your NFTs...</p>
                            </div>
                          ) : avatarNfts.length === 0 ? (
                            <div className="py-12 text-center">
                              <Image size={32} className={cn('mx-auto mb-3 opacity-20', 'text-gray-300 dark:text-white')} />
                              <p className={cn('text-sm font-medium mb-1', 'text-gray-500 dark:text-white/60')}>No NFTs Available</p>
                              <p className={cn('text-xs', 'text-gray-400 dark:text-white/30')}>Own an NFT to set it as your profile image</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                              {avatarNfts.map((nft) => (
                                <button
                                  key={nft.NFTokenID}
                                  onClick={() => handleSetAvatar(nft.NFTokenID)}
                                  disabled={settingAvatar || !nft.files?.[0]?.thumbnail?.large}
                                  className={cn(
                                    'relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group/item',
                                    profileUser.avatarNftId === nft.NFTokenID
                                      ? 'border-[#137DFE] scale-95'
                                      : 'border-transparent hover:border-gray-200 dark:border-white/5 dark:hover:border-white/20',
                                    (settingAvatar || !nft.files?.[0]?.thumbnail?.large) && 'opacity-50 grayscale'
                                  )}
                                >
                                  <NftImg
                                    src={nft.files?.[0]?.thumbnail?.large ? `https://s1.xrpl.to/nft/${nft.files[0].thumbnail.large}` : getNftCoverUrl(nft.meta, nft.url)}
                                    alt={nft.meta?.name || 'NFT'}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                                  />
                                  {profileUser.avatarNftId === nft.NFTokenID && (
                                    <div className="absolute inset-0 bg-[#137DFE]/30 backdrop-blur-[2px] flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                        <Check size={16} className="text-[#137DFE]" />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {profileError && (
                      <div className={cn('flex items-center gap-2 p-3 rounded-xl text-xs mt-4 animate-in fade-in slide-in-from-top-2', 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20')}>
                        <AlertTriangle size={14} className="shrink-0" />
                        {profileError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn('rounded-xl p-6', 'bg-white border border-gray-200 dark:bg-black/50 dark:border dark:border-white/[0.15]')}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                        <User size={18} className="text-[#137DFE]" />
                      </div>
                      <div>
                        <h3 className={cn('text-base font-semibold', 'text-gray-900 dark:text-white')}>Create Profile</h3>
                        <p className={cn('text-sm', 'text-gray-500 dark:text-white/40')}>Claim a unique username</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className={cn('text-[11px] uppercase tracking-wider mb-1.5 block', 'text-gray-500 dark:text-white/40')}>Username <span className={'text-gray-300 dark:text-white/20'}>(optional)</span></label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 14))}
                          placeholder="2-14 characters"
                          className={cn('w-full px-4 py-3 rounded-xl text-sm max-sm:text-base outline-none transition-colors', 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE] dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/25 dark:focus:border-[#137DFE]/40')}
                        />
                      </div>

                      {profileError && (
                        <div className={cn('flex items-center gap-2 p-3 rounded-lg text-xs', 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20')}>
                          <AlertTriangle size={14} />
                          {profileError}
                        </div>
                      )}

                      <button
                        onClick={() => handleCreateProfile(newUsername.length >= 2 ? newUsername : null)}
                        disabled={profileLoading}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profileLoading ? 'Creating...' : 'Create Profile'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Wallet Labels Section - Available to all users */}
                <div className={cn('rounded-xl p-4', 'bg-white border border-gray-200 dark:bg-black/50 dark:border dark:border-white/[0.15]')}>
                  <p className={cn('text-[11px] uppercase tracking-wider font-bold mb-3', 'text-gray-400 dark:text-white/30')}>Wallet Labels</p>

                  {/* Add new label */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={newLabelWallet}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || /^r[a-zA-Z0-9]*$/.test(val)) setNewLabelWallet(val.slice(0, 35));
                      }}
                      placeholder="rAddress..."
                      className={cn('flex-1 px-3 py-2.5 rounded-xl text-[13px] max-sm:text-base font-mono outline-none', 'bg-white text-gray-900 border border-gray-200 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/25')}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value.slice(0, 30))}
                        placeholder="Label"
                        className={cn('flex-1 sm:w-36 px-3 py-2.5 rounded-xl text-[13px] max-sm:text-base outline-none', 'bg-white text-gray-900 border border-gray-200 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/25')}
                      />
                      <button
                        onClick={handleAddLabel}
                        disabled={labelsLoading || !newLabelWallet || newLabelWallet.length < 25 || !newLabelName}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#137DFE] text-white disabled:opacity-50 transition-colors hover:bg-[#137DFE]/90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Labels list */}
                  {labelsLoading && walletLabels.length === 0 ? (
                    <p className={cn('text-xs text-center py-3', 'text-gray-400 dark:text-white/30')}>Loading...</p>
                  ) : walletLabels.length === 0 ? (
                    <p className={cn('text-xs text-center py-3', 'text-gray-400 dark:text-white/30')}>No labels yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {walletLabels.map((item) => (
                        <div key={item.wallet} className={cn('flex items-center justify-between gap-2 px-3 py-2 rounded-lg', 'bg-white dark:bg-white/[0.02]')}>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[13px] font-medium truncate', 'text-gray-700 dark:text-white/80')}>{item.label}</p>
                            <p className={cn('text-[11px] font-mono truncate', 'text-gray-400 dark:text-white/30')}>{item.wallet}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteLabel(item.wallet)}
                            disabled={deletingLabel === item.wallet}
                            className={cn('p-1.5 rounded transition-colors', 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/10')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membership Tiers Section */}
                <div className={cn('rounded-xl overflow-hidden', 'bg-white border border-gray-200 dark:bg-black/50 dark:border dark:border-white/[0.15]')}>
                  {/* Display Tier Selector - only tier badges are selectable */}
                  {displayBadges.available.filter(b => b.startsWith('tier:')).length > 1 && (
                    <div className={cn('px-4 py-3 border-b', 'border-gray-100 dark:border-white/[0.08]')}>
                      <div className="flex items-center justify-between">
                        <p className={cn('text-[11px] font-semibold uppercase tracking-wider', 'text-gray-400 dark:text-white/30')}>Active Tier</p>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {displayBadges.available.filter(b => b.startsWith('tier:')).map(badgeId => {
                            const name = badgeId.split(':')[1];
                            const tierConfig = {
                              verified: { icon: Check, bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'text-white', border: 'border-[#FFD700]/30', gradient: true },
                              diamond: { icon: Gem, bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
                              nova: { icon: Star, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                              vip: { icon: Sparkles, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
                            };
                            const config = tierConfig[name] || { icon: Star, bg: 'bg-gray-100 dark:bg-white/5', text: 'text-gray-500 dark:text-white/50', border: 'border-gray-200 dark:border-white/10' };
                            const Icon = config.icon;
                            const isSelected = displayBadges.current === badgeId;

                            return (
                              <button
                                key={badgeId}
                                onClick={() => handleSetDisplayBadge(badgeId)}
                                disabled={settingBadge}
                                className={cn(
                                  'px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight flex items-center gap-1.5 border transition-all duration-300',
                                  isSelected
                                    ? cn(config.bg, config.border, 'ring-1 ring-white/20 scale-105')
                                    : 'bg-transparent border-transparent opacity-40 hover:opacity-100 grayscale hover:grayscale-0',
                                  settingBadge && 'cursor-wait'
                                )}
                              >
                                {Icon && <Icon size={12} className={config.gradient ? 'text-[#FFD700]' : config.text} />}
                                <span className={cn(config.gradient ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' : config.text)}>
                                  {name.toUpperCase()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* XRP Invoice Modal */}
                  {xrpInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm max-sm:h-dvh" onClick={() => { if (!walletPayStatus) setXrpInvoice(null); }}>
                      <div className={cn('w-full max-w-sm rounded-xl p-6', 'bg-white border-[1.5px] border-gray-200 dark:bg-[#0a0a0a] dark:border-[1.5px] dark:border-white/10')} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                              <Coins size={16} className="text-[#137DFE]" />
                            </div>
                            <p className={cn('text-[15px] font-semibold', 'text-gray-900 dark:text-white')}>Pay with XRP</p>
                          </div>
                          <button onClick={() => { if (!walletPayStatus) setXrpInvoice(null); }} className={cn('p-1.5 rounded-lg transition-colors', 'hover:bg-gray-100 dark:hover:bg-white/10')}>
                            <X size={18} className={'text-gray-500 dark:text-white/50'} />
                          </button>
                        </div>
                        <div className={cn('rounded-xl p-4 mb-4 text-center', 'bg-blue-50 border border-blue-100 dark:bg-[#137DFE]/5 dark:border dark:border-[#137DFE]/20')}>
                          <p className={cn('text-[11px] uppercase tracking-wider mb-1', 'text-gray-400 dark:text-white/40')}>Amount Due</p>
                          <p className={cn('text-3xl font-bold', 'text-gray-900 dark:text-white')}>{xrpInvoice.amount} <span className="text-[#137DFE]">XRP</span></p>
                        </div>
                        <div className={cn('rounded-xl p-4 mb-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.02] dark:border dark:border-white/[0.08]')}>
                          <p className={cn('text-[11px] uppercase tracking-wider mb-2', 'text-gray-400 dark:text-white/40')}>Send to address</p>
                          <p className={cn('text-[13px] font-mono break-all', 'text-gray-700 dark:text-white/80')}>{xrpInvoice.destination}</p>
                          {xrpInvoice.destinationTag && (
                            <div className={cn('mt-3 pt-3 border-t', 'border-gray-200 dark:border-white/[0.08]')}>
                              <p className={cn('text-[11px] uppercase tracking-wider mb-1', 'text-gray-400 dark:text-white/40')}>Destination Tag</p>
                              <p className={cn('text-[15px] font-mono font-semibold', 'text-gray-900 dark:text-white')}>{xrpInvoice.destinationTag}</p>
                            </div>
                          )}
                        </div>
                        {/* Destination Tag Warning */}
                        {xrpInvoice.destinationTag && (
                          <div className={cn('text-xs p-3 rounded-xl mb-4 flex items-start gap-2', 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20')}>
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>Important: Include the Destination Tag or payment may be lost</span>
                          </div>
                        )}
                        {/* Pay with Wallet button */}
                        {(accountProfile?.wallet_type === 'device' || accountProfile?.wallet_type === 'oauth') && (
                          <button
                            onClick={handleWalletPayTier}
                            disabled={walletPayStatus || verifyingPayment}
                            className={cn('w-full py-3 rounded-xl text-sm font-semibold text-white mb-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50', 'bg-[#137DFE] hover:bg-[#137DFE]/90')}
                          >
                            {walletPayStatus === 'signing' ? (
                              <><Loader2 size={16} className="animate-spin" /> Signing...</>
                            ) : walletPayStatus === 'submitting' ? (
                              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                            ) : walletPayStatus === 'verifying' ? (
                              <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                            ) : (
                              <><Wallet size={16} /> Pay with Wallet</>
                            )}
                          </button>
                        )}
                        {/* Divider when both options available */}
                        {(accountProfile?.wallet_type === 'device' || accountProfile?.wallet_type === 'oauth') && (
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn('flex-1 h-px', 'bg-gray-200 dark:bg-white/[0.08]')} />
                            <span className={cn('text-[11px] font-medium', 'text-gray-400 dark:text-white/30')}>or pay manually</span>
                            <div className={cn('flex-1 h-px', 'bg-gray-200 dark:bg-white/[0.08]')} />
                          </div>
                        )}
                        <button
                          onClick={() => handleCopy(`${xrpInvoice.destination}${xrpInvoice.destinationTag ? `:${xrpInvoice.destinationTag}` : ''}`)}
                          disabled={walletPayStatus}
                          className={cn('w-full py-2.5 rounded-xl text-[13px] font-medium mb-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50', 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 dark:bg-white/[0.05] dark:text-white/70 dark:hover:bg-white/10 dark:border dark:border-white/[0.08]')}
                        >
                          <Copy size={14} />
                          Copy Address
                        </button>
                        <button
                          onClick={handleVerifyXrpPayment}
                          disabled={verifyingPayment || walletPayStatus}
                          className={cn('w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50', 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 dark:bg-white/[0.05] dark:text-white/70 dark:hover:bg-white/10 dark:border dark:border-white/[0.08]')}
                        >
                          {verifyingPayment ? 'Verifying...' : 'I have paid manually'}
                        </button>
                        {profileError && (
                          <p className={cn('text-xs mt-3 text-center', 'text-red-400')}>{profileError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {tiersLoading ? (
                      <p className={cn('text-sm text-center py-6', 'text-gray-400 dark:text-white/30')}>Loading tiers...</p>
                    ) : Object.keys(tiers).length === 0 ? (
                      <p className={cn('text-sm text-center py-6', 'text-gray-400 dark:text-white/30')}>No tiers available</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(tiers).filter(([name]) => name !== 'member').map(([name, tier]) => {
                          const isCurrentTier = userPerks?.tier === name;
                          const tierConfig = {
                            vip: { icon: Sparkles, gradient: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
                            nova: { icon: Star, gradient: 'from-amber-500 to-amber-700', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/10' },
                            diamond: { icon: Gem, gradient: 'from-violet-500 to-violet-700', bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/10' },
                            verified: { icon: Check, gradient: 'from-[#FFD700] via-[#FF6B9D] to-[#00FFFF]', bg: 'bg-white/5', border: 'border-white/10', text: 'text-white', glow: 'shadow-white/5' }
                          };
                          const config = tierConfig[name] || { icon: Star, gradient: 'from-gray-500 to-gray-600', bg: 'bg-white/5', border: 'border-white/10', text: 'text-white', glow: '' };
                          const TierIcon = config.icon;

                          return (
                            <div
                              key={name}
                              className={cn(
                                'rounded-xl p-4 border-[1.5px] relative overflow-hidden group transition-colors',
                                isCurrentTier
                                  ? `bg-white ${config.bg ? 'dark:' + config.bg : ''} ${config.border}`
                                  : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-300 dark:bg-white/[0.01] dark:border-white/[0.06] dark:hover:bg-white/[0.03] dark:hover:border-white/20'
                              )}
                            >
                              {isCurrentTier && (
                                <div className={cn('absolute top-0 right-0 px-3 py-1.5 text-[10px] font-bold rounded-bl-xl bg-gradient-to-r text-white z-10', config.gradient)}>
                                  CURRENT
                                </div>
                              )}

                              <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isCurrentTier ? `bg-gradient-to-br ${config.gradient}` : 'bg-white border border-gray-100 dark:bg-white/[0.05]')}>
                                    <TierIcon size={20} className={isCurrentTier ? 'text-white' : config.text} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={cn('text-base font-bold capitalize', 'text-gray-900 dark:text-white')}>
                                      {name}
                                    </h4>
                                    <div className="flex items-baseline gap-1">
                                      <span className={cn('text-xl font-black', 'text-gray-900 dark:text-white/90')}>
                                        ${tier.price}
                                      </span>
                                      {tier.billing && (
                                        <span className={cn('text-[11px] font-medium opacity-40', 'text-gray-500 dark:text-white')}>
                                          {tier.billing === 'lifetime' ? 'once' : '/' + tier.billing}
                                        </span>
                                      )}
                                    </div>
                                    {tier.price > 0 && tierXrpUsd > 0 && (
                                      <div className={cn('text-[10px] mt-0.5', 'text-gray-400 dark:text-white/30')}>
                                        ≈ {Math.ceil(tier.price / tierXrpUsd)} XRP
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {tier.perks && (
                                  <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className={cn('w-1 h-1 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                      <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>{tier.perks.privateMessageLimit?.toLocaleString()} messages</span>
                                    </div>
                                    {tier.perks.canChangeUsername && (
                                      <div className="flex items-center gap-2">
                                        <div className={cn('w-1.5 h-1.5 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                        <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>Custom username</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <div className={cn('w-1.5 h-1.5 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                      <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>Unique chat color</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={cn('w-1.5 h-1.5 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                      <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>
                                        <span className={cn('capitalize font-semibold', config.text)}>{name}</span> tier badge
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={cn('w-1.5 h-1.5 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                      <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>Platform support</span>
                                    </div>
                                    {tier.perks.verifiedBadge && name !== 'verified' && (
                                      <div className="flex items-center gap-2">
                                        <div className={cn('w-1.5 h-1.5 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                        <span className={cn('text-xs font-medium', 'text-gray-500 dark:text-white/50')}>Verified badge</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Chat Name Preview */}
                                <div className={cn('flex items-center gap-2 mb-4 p-2.5 rounded-lg', 'bg-gray-100/50 dark:bg-black/20')}>
                                  <span className={cn('text-[11px] font-bold uppercase truncate max-w-[80px]',
                                    name === 'verified' ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' :
                                      name === 'vip' ? 'text-emerald-400' :
                                        name === 'nova' ? 'text-amber-400' :
                                          name === 'diamond' ? 'text-violet-400' : 'text-emerald-400'
                                  )}>
                                    {profileUser?.username || 'User'}
                                  </span>
                                  <span className={cn('text-[11px] opacity-40 italic', 'text-gray-500 dark:text-white')}>Chat preview</span>
                                </div>

                                {!isCurrentTier && tier.price > 0 && (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handlePurchaseTierXRP(name)}
                                      disabled={purchaseLoading === name}
                                      className={cn(
                                        'flex-1 py-2.5 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-xs font-bold transition-all',
                                        'border-gray-100 text-gray-400 hover:bg-gray-50 dark:border-white/[0.06] dark:text-white/40 dark:hover:bg-white/[0.04]'
                                      )}
                                    >
                                      {purchaseLoading === name ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                                      XRP
                                    </button>
                                    <button
                                      onClick={() => handlePurchaseTierStripe(name)}
                                      disabled={purchaseLoading === name}
                                      className={cn(
                                        'flex-1 py-2.5 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-xs font-bold transition-all',
                                        'border-gray-100 text-gray-400 hover:bg-gray-50 dark:border-white/[0.06] dark:text-white/40 dark:hover:bg-white/[0.04]'
                                      )}
                                    >
                                      {purchaseLoading === name ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                                      Card / Crypto
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Section (collapsible) */}
                <div className={cn('rounded-xl overflow-hidden', 'bg-white border-[1.5px] border-gray-200 dark:bg-black/40 dark:border-[1.5px] dark:border-white/10')}>
                  <button
                    onClick={() => setProfileSection(profileSection === 'referral' ? null : 'referral')}
                    className={cn('w-full flex items-center justify-between p-4 transition-colors', 'hover:bg-gray-50 dark:hover:bg-white/[0.02]')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                        <Swords size={16} className="text-[#137DFE]" />
                      </div>
                      <div className="text-left">
                        <p className={cn('text-[13px] font-semibold', 'text-gray-900 dark:text-white/90')}>XRP Army Referral</p>
                        <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                          {referralUser ? `${referralUser.tier || 'Recruit'} · ${referralUser.recruits || 0} recruits` : 'Earn by referring friends'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={cn('transition-transform duration-200', 'text-gray-400 dark:text-white/30', profileSection === 'referral' && 'rotate-180')} />
                  </button>
                  {profileSection === 'referral' && (
                    <div className={cn('px-4 pb-4 space-y-4', 'border-t border-gray-100 dark:border-t dark:border-white/5')}>
                      {referralLoading || !referralFetched ? (
                        <div className={cn('p-8 text-center')}>
                          <p className={cn('text-sm', 'text-gray-400 dark:text-white/40')}>Loading...</p>
                        </div>
                      ) : referralUser ? (
                        <>
                          {/* Tier & Stats */}
                          <div className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                              <div>
                                <p className={cn('text-[11px] uppercase tracking-[0.15em] font-semibold mb-1', 'text-gray-400 dark:text-white/30')}>Current Rank</p>
                                <div className="flex items-baseline gap-3">
                                  <h3 className={cn('text-xl font-black leading-none', 'text-gray-900 dark:text-white')}>{referralUser.tier || 'Recruit'}</h3>
                                  <span className={cn('text-sm font-bold', 'text-green-600 dark:text-[#08AA09]')}>{((referralUser.share || 0.25) * 100).toFixed(0)}% share</span>
                                </div>
                                {referralUser.shareBreakdown && (referralUser.shareBreakdown.badgeBonus > 0 || referralUser.shareBreakdown.volumeBonus > 0 || referralUser.shareBreakdown.streakBonus > 0 || referralUser.shareBreakdown.holdingBonus > 0) && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/40')}>Base: {(referralUser.shareBreakdown.tierShare * 100).toFixed(0)}%</span>
                                    {referralUser.shareBreakdown.badgeBonus > 0 && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-purple-50 text-[#650CD4] dark:bg-[#650CD4]/10 dark:text-[#650CD4]')}>Badges: +{(referralUser.shareBreakdown.badgeBonus * 100).toFixed(1)}%</span>}
                                    {referralUser.shareBreakdown.volumeBonus > 0 && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-green-50 text-green-600 dark:bg-[#08AA09]/10 dark:text-[#08AA09]')}>Volume: +{(referralUser.shareBreakdown.volumeBonus * 100).toFixed(0)}%</span>}
                                    {referralUser.shareBreakdown.streakBonus > 0 && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-amber-50 text-[#F6AF01] dark:bg-[#F6AF01]/10 dark:text-[#F6AF01]')}>Streak: +{(referralUser.shareBreakdown.streakBonus * 100).toFixed(1)}%</span>}
                                    {referralUser.shareBreakdown.holdingBonus > 0 && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-blue-50 text-[#137DFE] dark:bg-[#137DFE]/10 dark:text-[#137DFE]')}>FUZZY: +{(referralUser.shareBreakdown.holdingBonus * 100).toFixed(0)}%</span>}
                                    {referralUser.shareBreakdown.capped && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400')}>Max 50%</span>}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-6">
                                <div className="text-left sm:text-right">
                                  <p className={cn('text-xl font-black leading-none', 'text-gray-900 dark:text-white')}>{referralUser.recruits || 0}</p>
                                  <p className={cn('text-[11px] uppercase tracking-wider font-semibold mt-1', 'text-[#137DFE] dark:text-[#137DFE]')}>Recruits</p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className={cn('text-xl font-black leading-none', 'text-green-600 dark:text-[#08AA09]')}>{((referralEarnings?.lifetimeXrp || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</p>
                                  <p className={cn('text-[11px] uppercase tracking-wider font-semibold mt-1', 'text-green-500 dark:text-[#08AA09]/70')}>Earned</p>
                                </div>
                              </div>
                            </div>
                            {/* Next Tier Progress */}
                            {referralUser.nextTier && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={cn('text-xs font-semibold', 'text-gray-500 dark:text-white/50')}>
                                    Next: <span className={'text-gray-700 dark:text-white/80'}>{referralUser.nextTier.name}</span>
                                    <span className={cn('ml-1.5', 'text-gray-400 dark:text-white/30')}>({(referralUser.nextTier.share * 100).toFixed(0)}%)</span>
                                  </span>
                                  <span className={cn('text-xs font-bold tabular-nums', 'text-gray-600 dark:text-white/70')}>{referralUser.recruits || 0} / {referralUser.nextTier.min}</span>
                                </div>
                                <div className={cn('h-2 rounded-full overflow-hidden', 'bg-gray-100 dark:bg-white/5')}>
                                  <div className="h-full bg-[#137DFE] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, ((referralUser.recruits || 0) / (referralUser.nextTier.min || 1)) * 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Secondary Stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { val: referralStats?.streaks?.current || referralUser.streak || 0, label: 'Day Streak', sub: `Best: ${referralStats?.streaks?.max || referralUser.maxStreak || 0}` },
                              { val: referralStats?.recruits?.whales || referralUser.whales || 0, label: 'Whale Recruits', sub: 'High-value' },
                              { val: referralStats?.recruits?.tier2 || referralUser.tier2 || 0, label: 'Tier 2', sub: 'Indirect' },
                              { val: referralStats?.season?.recruits || referralUser.seasonRecruits || 0, label: 'This Season', sub: 'Current period' }
                            ].map(s => (
                              <div key={s.label} className={cn('rounded-xl p-3', 'bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border dark:border-white/[0.06]')}>
                                <p className={cn('text-lg font-bold leading-none mb-1', 'text-gray-900 dark:text-white')}>{s.val}</p>
                                <p className={cn('text-[10px] uppercase tracking-wider font-semibold', 'text-gray-400 dark:text-white/30')}>{s.label}</p>
                                <p className={cn('text-[10px] mt-1.5 pt-1.5', 'border-t border-gray-100 text-gray-300 dark:border-t dark:border-white/5 dark:text-white/20')}>{s.sub}</p>
                              </div>
                            ))}
                          </div>

                          {/* Earnings Details */}
                          {referralEarnings && (referralEarnings.lifetimeDrops > 0 || referralEarnings.pendingReferrer?.drops > 0 || referralEarnings.pendingRecruit?.drops > 0) && (
                            <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                              <h4 className={cn('text-[11px] font-bold uppercase tracking-widest mb-3', 'text-gray-500 dark:text-white/40')}>Earnings</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <p className={cn('text-sm font-bold', 'text-green-600 dark:text-[#08AA09]')}>{(referralEarnings.pendingReferrer?.xrp || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</p>
                                  <p className={cn('text-[10px] uppercase tracking-wider font-semibold', 'text-gray-400 dark:text-white/30')}>Pending Referral</p>
                                  {(referralEarnings.pendingReferrer?.feeCount || 0) > 0 && <p className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>{referralEarnings.pendingReferrer.feeCount} fees</p>}
                                </div>
                                <div>
                                  <p className={cn('text-sm font-bold', 'text-[#137DFE]')}>{(referralEarnings.pendingRecruit?.xrp || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</p>
                                  <p className={cn('text-[10px] uppercase tracking-wider font-semibold', 'text-gray-400 dark:text-white/30')}>Pending Rebate</p>
                                  {(referralEarnings.pendingRecruit?.feeCount || 0) > 0 && <p className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>{referralEarnings.pendingRecruit.feeCount} fees</p>}
                                </div>
                                <div>
                                  <p className={cn('text-sm font-bold', 'text-gray-700 dark:text-white/70')}>{(referralEarnings.totalPaid?.xrp || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</p>
                                  <p className={cn('text-[10px] uppercase tracking-wider font-semibold', 'text-gray-400 dark:text-white/30')}>Total Paid</p>
                                  {(referralEarnings.totalPaid?.count || 0) > 0 && <p className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>{referralEarnings.totalPaid.count} payouts</p>}
                                </div>
                              </div>
                              {(referralEarnings.pendingReferrer?.drops || 0) >= 1000000 && (
                                <p className={cn('text-[10px] px-2 py-1 rounded-md inline-block', 'bg-green-50 text-green-600 dark:bg-[#08AA09]/10 dark:text-[#08AA09]/70')}>
                                  Payout threshold reached — auto-payout within 5 min
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payout History */}
                          {referralEarnings?.payouts?.length > 0 && (
                            <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                              <h4 className={cn('text-[11px] font-bold uppercase tracking-widest mb-3', 'text-gray-500 dark:text-white/40')}>Recent Payouts</h4>
                              <div className="space-y-2">
                                {referralEarnings.payouts.map((p) => (
                                  <div key={p.txHash || p.claimedAt} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-xs font-bold', p.type === 'referrer' ? 'text-green-600 dark:text-[#08AA09]' : 'text-[#137DFE]')}>
                                        +{(p.totalXrp || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                                      </span>
                                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/30')}>
                                        {p.type === 'referrer' ? 'referral' : 'rebate'}
                                      </span>
                                      <span className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>{p.feeCount} fees</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>{p.claimedAt ? formatDistanceToNow(new Date(p.claimedAt), { addSuffix: true }) : ''}</span>
                                      {p.txHash && /^[A-Fa-f0-9]{64}$/.test(p.txHash) && (
                                        <a href={`/tx/${p.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">
                                          <ExternalLink size={10} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recruit Savings (shown if user was referred) */}
                          {referralUser.referrer && referralEarnings && (referralEarnings.pendingRecruit?.drops > 0 || referralEarnings.totalPaid?.drops > 0) && (
                            <div className={cn('rounded-xl p-4', 'bg-blue-50/50 border border-blue-100 dark:bg-[#137DFE]/5 dark:border dark:border-[#137DFE]/10')}>
                              <h4 className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', 'text-[#137DFE]/70 dark:text-[#137DFE]/50')}>Your Savings</h4>
                              <p className={cn('text-lg font-black', 'text-[#137DFE]')}>
                                {((referralEarnings.pendingRecruit?.xrp || 0) + (referralEarnings.totalPaid?.xrp || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP saved
                              </p>
                              <p className={cn('text-[10px] mt-1', 'text-gray-400 dark:text-white/30')}>
                                50% fee rebate for 90 days after signup via referral
                              </p>
                              {referralUser.benefits?.welcome?.expires && referralUser.benefits.welcome.expires > Date.now() && (
                                <p className={cn('text-[10px] mt-1 font-semibold', 'text-[#137DFE]')}>
                                  Rebate active — {Math.ceil((referralUser.benefits.welcome.expires - Date.now()) / 86400000)} days remaining
                                </p>
                              )}
                            </div>
                          )}

                          {/* Bonus Multipliers Guide */}
                          <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                            <h5 className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', 'text-gray-400 dark:text-white/25')}>Bonus Multipliers</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1.5', 'text-green-600 dark:text-[#08AA09]')}>Volume</p>
                                <div className="space-y-0.5">
                                  {[
                                    { min: '100 XRP', bonus: '+1%' },
                                    { min: '500 XRP', bonus: '+2%' },
                                    { min: '2K XRP', bonus: '+3%' },
                                    { min: '10K XRP', bonus: '+4%' },
                                    { min: '50K XRP', bonus: '+5%' },
                                  ].map(v => {
                                    const volXrp = (referralEarnings?.lifetimeVolume || referralUser.volume || 0) / 1000000;
                                    const thresholdXrp = parseFloat(v.min.replace('K', '000').replace(' XRP', ''));
                                    const isReached = volXrp >= thresholdXrp;
                                    return (
                                      <div key={v.min} className="flex justify-between text-[10px]">
                                        <span className={cn(isReached ? 'text-green-600 dark:text-[#08AA09]' : 'text-gray-300 dark:text-white/15')}>{v.min}</span>
                                        <span className={cn('font-bold', isReached ? 'text-green-600 dark:text-[#08AA09]' : 'text-gray-300 dark:text-white/15')}>{v.bonus}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1.5', 'text-[#F6AF01]')}>Streak</p>
                                <div className="space-y-0.5">
                                  {[
                                    { min: '7 days', bonus: '+0.5%', days: 7 },
                                    { min: '14 days', bonus: '+1%', days: 14 },
                                    { min: '30 days', bonus: '+2%', days: 30 },
                                    { min: '60 days', bonus: '+3%', days: 60 },
                                  ].map(s => {
                                    const streak = referralUser.streak || 0;
                                    const isReached = streak >= s.days;
                                    return (
                                      <div key={s.min} className="flex justify-between text-[10px]">
                                        <span className={cn(isReached ? 'text-[#F6AF01]' : 'text-gray-300 dark:text-white/15')}>{s.min}</span>
                                        <span className={cn('font-bold', isReached ? 'text-[#F6AF01]' : 'text-gray-300 dark:text-white/15')}>{s.bonus}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1.5', 'text-[#137DFE]')}>Token Bonus</p>
                                <div className="space-y-1.5">
                                  <p className={cn('text-[10px] leading-snug', 'text-gray-400 dark:text-white/30')}>
                                    Projects can partner with us to offer their holders reduced trading fees and bonus referral commission.
                                  </p>
                                  <a href="https://x.com/xrplto" target="_blank" rel="noopener noreferrer" className={cn('text-[10px] leading-snug font-medium inline-flex items-center gap-1 hover:underline', 'text-[#137DFE]')}>
                                    Interested? Contact us on X @xrplto
                                  </a>
                                </div>
                              </div>
                            </div>
                            <p className={cn('text-[9px] mt-2 pt-2', 'border-t border-gray-100 text-gray-300 dark:border-white/5 dark:text-white/15')}>
                              All bonuses stack with rank + badges. Hard cap: 50% total share.
                            </p>
                          </div>

                          {/* Badges */}
                          {(() => {
                            const progress = referralStats?.badges?.progress || {};
                            const earned = referralStats?.badges?.list || referralUser.badges || [];
                            const badgeKeys = Object.keys(progress).length > 0 ? Object.keys(progress) : earned;
                            if (badgeKeys.length === 0) return null;
                            return (
                              <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={cn('text-[11px] font-bold uppercase tracking-widest', 'text-gray-500 dark:text-white/40')}>Badges</h4>
                                  {referralStats?.badges && <span className={cn('text-[11px] font-bold tabular-nums', 'text-blue-600 dark:text-[#137DFE]')}>{referralStats.badges.done}/{referralStats.badges.total}</span>}
                                </div>
                                <div className="space-y-2">
                                  {badgeKeys.map((key) => {
                                    const cfg = achievementBadges[key] || { ...defaultBadge, label: key.replace(/_/g, ' ') };
                                    const done = progress[key]?.done ?? earned.includes(key);
                                    const pct = progress[key]?.pct || (done ? 100 : 0);
                                    return (
                                      <div key={key} className="flex items-center gap-3">
                                        <BadgeShield badgeKey={key} earned={done} size="sm" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className={cn('text-[11px] font-semibold capitalize truncate', done ? ('text-gray-900 dark:text-white') : 'text-gray-400 dark:text-white/30')}>{cfg.label}</span>
                                            {!done && progress[key]?.req && <span className={cn('text-[10px] font-mono shrink-0 ml-2', 'text-gray-300 dark:text-white/20')}>{progress[key].cur}/{progress[key].req}</span>}
                                            {done && <Check size={12} style={{ color: cfg.color }} />}
                                          </div>
                                          {!done && (
                                            <div className={cn('h-1.5 rounded-full overflow-hidden', 'bg-gray-100 dark:bg-white/5')}>
                                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Referral Link */}
                          <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                            <p className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', 'text-gray-400 dark:text-white/25')}>Your Referral Link</p>
                            <div className="flex items-center gap-2">
                              <div className={cn('flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate', 'bg-white text-gray-400 dark:bg-white/5 dark:text-white/40')}>
                                {typeof window !== 'undefined' && `${window.location.origin}/signup?ref=${referralUser.referralCode}`}
                              </div>
                              <button
                                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralUser.referralCode}`); setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000); }}
                                className={cn('shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all', referralCopied ? 'bg-[#08AA09] text-white' : 'bg-[#137DFE] text-white hover:bg-blue-600')}
                              >
                                {referralCopied ? 'Copied' : 'Copy'}
                              </button>
                              <button onClick={() => { setEditingCode(true); setNewReferralCode(referralUser.referralCode); }} className={cn('px-3 py-2 rounded-lg text-xs font-semibold transition-colors', 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10')}>
                                <Pencil size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Code Edit Overlay */}
                          {/* Referred by */}
                          {referralUser.referrer && (
                            <div className={cn('px-3.5 py-2.5 rounded-lg text-[11px] flex items-center justify-between', 'bg-gray-50 text-gray-500 dark:bg-white/[0.03] dark:text-white/40')}>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#08AA09] shrink-0" />
                                Referred by {referralUser.referrer.slice(0, 6)}...{referralUser.referrer.slice(-4)}
                              </div>
                              {referralUser.benefits?.welcome?.expires > Date.now() ? (
                                <span className={cn('text-[10px] font-semibold', 'text-[#137DFE]')}>50% rebate — {Math.ceil((referralUser.benefits.welcome.expires - Date.now()) / 86400000)}d left</span>
                              ) : referralUser.benefits?.welcome?.expires ? (
                                <span className={cn('text-[10px]', 'text-gray-300 dark:text-white/20')}>Rebate expired</span>
                              ) : null}
                            </div>
                          )}

                          {/* Rank Progression */}
                          <div className={cn('rounded-xl p-4', 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                            <h5 className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', 'text-gray-400 dark:text-white/25')}>Rank Progression</h5>
                            <div className="space-y-1">
                              {[
                                { name: 'Recruit', min: 0, share: 25 },
                                { name: 'Private', min: 5, share: 27 },
                                { name: 'Corporal', min: 15, share: 29 },
                                { name: 'Sergeant', min: 30, share: 31 },
                                { name: 'Staff Sgt', min: 60, share: 33 },
                                { name: 'Master Sgt', min: 100, share: 35 },
                                { name: 'Lieutenant', min: 200, share: 37 },
                                { name: 'Captain', min: 400, share: 39 },
                                { name: 'Major', min: 750, share: 41 },
                                { name: 'Colonel', min: 1500, share: 43 },
                                { name: 'Brigadier', min: 3000, share: 45 },
                                { name: 'General', min: 5000, share: 48 },
                                { name: 'Supreme', min: 10000, share: 50 },
                              ].map((t) => {
                                const isCurrent = referralUser.tierData?.name === t.name || referralUser.tier === t.name;
                                const isReached = (referralUser.recruits || 0) >= t.min;
                                return (
                                  <div key={t.name} className={cn('flex items-center justify-between py-1.5 px-3 rounded-lg text-[11px]',
                                    isCurrent ? ('bg-blue-50 border border-blue-200 dark:bg-[#137DFE]/10 dark:border dark:border-[#137DFE]/30') : ''
                                  )}>
                                    <span className={cn('font-semibold', isCurrent ? 'text-[#137DFE]' : isReached ? ('text-gray-600 dark:text-white/60') : 'text-gray-300 dark:text-white/20')}>{t.name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className={cn('tabular-nums', isCurrent ? 'text-[#137DFE]' : 'text-gray-300 dark:text-white/15')}>{t.min}+</span>
                                      <span className={cn('font-bold tabular-nums w-[38px] text-right', isCurrent ? 'text-[#08AA09]' : 'text-gray-300 dark:text-white/15')}>{t.share}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Code Edit Overlay */}
                          {editingCode && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm max-sm:h-dvh" onClick={() => setEditingCode(false)}>
                              <div className={cn('w-full max-w-sm rounded-xl p-6', 'bg-white border-[1.5px] border-gray-200 dark:bg-[#0a0a0a] dark:border-[1.5px] dark:border-white/10')} onClick={e => e.stopPropagation()}>
                                <h3 className={cn('text-lg font-bold mb-1', 'text-gray-900 dark:text-white')}>Edit Referral Code</h3>
                                <p className={cn('text-sm mb-5', 'text-gray-400 dark:text-white/30')}>3-20 characters, letters, numbers, and underscores only.</p>
                                <div className="space-y-4">
                                  <input
                                    type="text"
                                    value={newReferralCode}
                                    onChange={(e) => setNewReferralCode(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                                    className={cn('w-full px-4 py-3 rounded-xl text-sm max-sm:text-base font-mono outline-none border-[1.5px] transition-all', 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[#137DFE]/50')}
                                  />
                                  {referralError && <p className="text-xs text-red-400">{referralError}</p>}
                                  <div className="flex gap-3">
                                    <button onClick={() => setEditingCode(false)} className={cn('flex-1 py-3 rounded-xl text-sm font-medium transition-colors', 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10')}>Cancel</button>
                                    <button onClick={handleUpdateReferralCode} disabled={referralLoading || newReferralCode.length < 3} className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#137DFE] text-white hover:bg-blue-600 transition-colors disabled:opacity-50">Save</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Not enrolled yet */
                        <div className="pt-4 max-w-md mx-auto text-center">
                          <h3 className={cn('text-lg font-black mb-2', 'text-gray-900 dark:text-white')}>Join the XRP Army</h3>
                          <p className={cn('text-sm mb-4', 'text-gray-500 dark:text-white/40')}>
                            Share your referral link, earn a percentage of every trade. Start at 20%, rank up to 50%.
                          </p>
                          <div className="space-y-3 max-w-sm mx-auto">
                            <input
                              type="text"
                              value={referralForm.referralCode}
                              onChange={(e) => setReferralForm(f => ({ ...f, referralCode: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) }))}
                              placeholder="Choose a code (optional)"
                              className={cn('w-full px-4 py-3 rounded-xl text-sm max-sm:text-base font-mono outline-none border-[1.5px] transition-all', 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-blue-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#137DFE]/50')}
                            />
                            {referralError && <p className="text-xs text-red-400 text-left">{referralError}</p>}
                            <button onClick={handleReferralRegister} disabled={referralLoading} className="w-full py-3 rounded-xl text-sm font-bold bg-[#137DFE] text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                              {referralLoading ? 'Enlisting...' : 'Get Started'}
                            </button>
                          </div>

                          {/* Rank Table */}
                          <div className={cn('mt-4 rounded-xl overflow-hidden border', 'border-gray-200 dark:border-white/[0.06]')}>
                            <div className={cn('grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider px-3 py-2', 'bg-gray-50 text-gray-400 dark:bg-white/[0.03] dark:text-white/30')}>
                              <span>Rank</span><span className="text-center">Recruits</span><span className="text-right">Share</span>
                            </div>
                            {[
                              { name: 'Recruit', min: '0', share: '20%' },
                              { name: 'Private', min: '15', share: '22%' },
                              { name: 'Corporal', min: '50', share: '26%' },
                              { name: 'Sergeant', min: '100', share: '30%' },
                              { name: 'Captain', min: '500', share: '36%' },
                              { name: 'Colonel', min: '2,500', share: '42%' },
                              { name: 'General', min: '10,000', share: '46%' },
                              { name: 'Supreme', min: '25,000', share: '50%' },
                            ].map((t, i) => (
                              <div key={t.name} className={cn('grid grid-cols-3 text-[11px] px-3 py-2', i % 2 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : '')}>
                                <span className={cn('font-semibold', 'text-gray-700 dark:text-white/60')}>{t.name}</span>
                                <span className={cn('text-center tabular-nums', 'text-gray-400 dark:text-white/30')}>{t.min}</span>
                                <span className={cn('text-right font-bold tabular-nums', 'text-green-600 dark:text-[#08AA09]')}>{t.share}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Saved Addresses Section (collapsible) */}
                <div className={cn('rounded-xl overflow-hidden', 'bg-white border-[1.5px] border-gray-200 dark:bg-black/40 dark:border-[1.5px] dark:border-white/10')}>
                  <button
                    onClick={() => setProfileSection(profileSection === 'addresses' ? null : 'addresses')}
                    className={cn('w-full flex items-center justify-between p-4 transition-colors', 'hover:bg-gray-50 dark:hover:bg-white/[0.02]')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                        <Building2 size={16} className="text-[#137DFE]" />
                      </div>
                      <div className="text-left">
                        <p className={cn('text-[13px] font-semibold', 'text-gray-900 dark:text-white/90')}>Saved Addresses</p>
                        <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/30')}>
                          {withdrawals.length} withdrawal address{withdrawals.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={cn('transition-transform duration-200', 'text-gray-400 dark:text-white/30', profileSection === 'addresses' && 'rotate-180')} />
                  </button>
                  {profileSection === 'addresses' && (
                    <div className={'border-t border-gray-100 dark:border-t dark:border-white/5'}>
                      {/* Delete Confirmation Modal */}
                      {deleteConfirmId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 max-sm:h-dvh" onClick={() => setDeleteConfirmId(null)}>
                          <div className={cn('w-full max-w-sm rounded-xl p-5', 'bg-white/98 backdrop-blur-xl border border-gray-200 dark:bg-[#070b12]/98 dark:backdrop-blur-xl dark:border dark:border-red-500/20')} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', 'bg-red-50 dark:bg-red-500/10')}>
                                <Trash2 size={18} className="text-red-500" />
                              </div>
                              <div>
                                <h3 className={cn('text-[14px] font-medium', 'text-gray-900 dark:text-white/90')}>Delete Address?</h3>
                                <p className={cn('text-[11px]', 'text-gray-500 dark:text-white/50')}>This cannot be undone</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setDeleteConfirmId(null)} className={cn('flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-colors', 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10')}>Cancel</button>
                              <button onClick={() => handleDeleteWithdrawal(deleteConfirmId)} className="flex-1 py-2.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Add Withdrawal Modal */}
                      {showAddWithdrawal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm max-sm:h-dvh" onClick={() => setShowAddWithdrawal(false)}>
                          <div className={cn('w-full max-w-md rounded-2xl p-6', 'bg-white border border-gray-200 dark:bg-[#09090b] dark:border-[1.5px] dark:border-white/15')} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                              <h3 className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>Add Withdrawal Address</h3>
                              <button onClick={() => setShowAddWithdrawal(false)} className={cn('p-2 rounded-lg transition-colors duration-150', 'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-[#137DFE]/5 dark:text-white/40 dark:hover:text-[#137DFE]')}>
                                <X size={18} />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className={cn('text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block text-[#137DFE]')}>Name</label>
                                <input type="text" value={newWithdrawal.name} onChange={(e) => setNewWithdrawal((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Binance, Coinbase" className={cn('w-full px-4 py-3 rounded-lg text-[13px] max-sm:text-base outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150', 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/30')} />
                              </div>
                              <div>
                                <label className={cn('text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block text-[#137DFE]')}>XRPL Address</label>
                                <input type="text" value={newWithdrawal.address} onChange={(e) => setNewWithdrawal((prev) => ({ ...prev, address: e.target.value }))} placeholder="rAddress..." className={cn('w-full px-4 py-3 rounded-lg text-[13px] max-sm:text-base font-mono outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150', 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/30')} />
                              </div>
                              <div>
                                <label className={cn('text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block text-[#137DFE]')}>Destination Tag (optional)</label>
                                <input type="text" value={newWithdrawal.tag} onChange={(e) => setNewWithdrawal((prev) => ({ ...prev, tag: e.target.value.replace(/\D/g, '') }))} placeholder="e.g. 12345678" className={cn('w-full px-4 py-3 rounded-lg text-[13px] max-sm:text-base font-mono outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150', 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/30')} />
                              </div>
                              {withdrawalError && <p className="text-[11px] text-red-400">{withdrawalError}</p>}
                              <button onClick={handleAddWithdrawal} disabled={withdrawalLoading} className="w-full py-4 rounded-lg text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-2 bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors">
                                {withdrawalLoading ? 'Saving...' : <><Plus size={16} /> Save Address</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Address List Header */}
                      <div className="p-4 flex items-center justify-between">
                        <span className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', 'text-gray-500 dark:text-white/50')}>
                          {withdrawals.length} saved
                        </span>
                        <button onClick={() => setShowAddWithdrawal(true)} className={cn('text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 transition-colors', 'text-[#137DFE] hover:text-blue-600 dark:text-[#137DFE]/80 dark:hover:text-blue-300')}>
                          <Plus size={12} /> Add New
                        </button>
                      </div>

                      {withdrawals.length === 0 ? (
                        <div className={cn('px-4 pb-4 text-center', 'text-gray-400 dark:text-white/35')}>
                          <p className={cn('text-[11px]', 'text-gray-400 dark:text-white/40')}>No saved addresses yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-blue-500/5">
                          {withdrawals.map((wallet) => (
                            <div key={wallet.id} className={cn('flex items-center gap-3 px-3 py-2.5 group transition-all duration-150', 'hover:bg-gray-50 dark:hover:bg-white/[0.04]')}>
                              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', 'bg-blue-50 dark:bg-[#137DFE]/10')}>
                                <Building2 size={16} className="text-[#137DFE]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>{wallet.name}</p>
                                <p className={cn('text-[10px] font-mono truncate', 'text-gray-400 dark:text-white/35')}>{wallet.address}</p>
                                {wallet.tag && <p className={cn('text-[10px]', 'text-gray-400 dark:text-white/25')}>Tag: {wallet.tag}</p>}
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCopy(wallet.address)} aria-label={`Copy ${wallet.name} address`} className={cn('p-2 rounded-lg transition-colors duration-150', 'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-[#137DFE]/5 dark:text-white/40 dark:hover:text-[#137DFE]')}>
                                  <Copy size={14} />
                                </button>
                                <button aria-label={`Send to ${wallet.name}`} onClick={() => { setSelectedToken('XRP'); setSendTo(wallet.address); setSendTag(wallet.tag || ''); setShowPanel('send'); setActiveTab('overview'); }} className={cn('p-2 rounded-lg transition-colors duration-150', 'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-[#137DFE]/5 dark:text-white/40 dark:hover:text-[#137DFE]')}>
                                  <Send size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirmId(wallet.id)} aria-label={`Delete ${wallet.name}`} className={cn('p-2 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100', 'hover:bg-red-50 text-gray-400 hover:text-red-500 dark:hover:bg-red-500/10 dark:text-white/40 dark:hover:text-red-400')}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <section role="tabpanel" id="tabpanel-nfts" aria-label="NFTs">
                {/* NFT Transfer Modal */}
                {nftToTransfer && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 max-sm:h-dvh"
                    onClick={() => setNftToTransfer(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        'bg-white/98 backdrop-blur-xl border border-gray-200 dark:bg-black/98 dark:backdrop-blur-xl dark:border dark:border-white/[0.15]'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            'text-gray-900 dark:text-white/90'
                          )}
                        >
                          Transfer NFT
                        </h3>
                        <button
                          onClick={() => setNftToTransfer(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-[#137DFE]/5 dark:text-white/40 dark:hover:text-[#137DFE]'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          'bg-gray-50 border border-gray-200 dark:bg-white/[0.04] dark:border dark:border-white/[0.15]'
                        )}
                      >
                        <img
                          src={nftToTransfer.image}
                          alt={nftToTransfer.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div>
                          <p
                            className={cn(
                              'text-[13px] font-medium',
                              'text-gray-900 dark:text-white/90'
                            )}
                          >
                            {nftToTransfer.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              'text-gray-400 dark:text-white/35'
                            )}
                          >
                            {nftToTransfer.collection}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              'text-[#137DFE] dark:text-[#137DFE]'
                            )}
                          >
                            Recipient Address
                          </label>
                          <input
                            type="text"
                            value={nftRecipient}
                            onChange={(e) => setNftRecipient(e.target.value)}
                            placeholder="rAddress..."
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] max-sm:text-base font-mono outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-colors duration-150',
                              'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE] dark:bg-white/[0.04] dark:text-white dark:border dark:border-white/[0.15] dark:placeholder:text-white/30 dark:focus:border-[#137DFE]/40'
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            'p-3 rounded-lg text-[11px]',
                            'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border dark:border-yellow-500/20'
                          )}
                        >
                          This will transfer ownership. This action cannot be undone once user accepts.
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors">
                          <Send size={16} /> Transfer NFT
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NFT Sell Modal */}
                {nftToSell && (() => {
                  const existingSellOffers = nftOffers.filter(o => o.nftId === nftToSell.nftId && o.type === 'sell');
                  return (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 max-sm:h-dvh"
                    onClick={() => setNftToSell(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        'bg-white/98 backdrop-blur-xl border border-gray-200 dark:bg-black/98 dark:backdrop-blur-xl dark:border dark:border-white/[0.15]'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            'text-gray-900 dark:text-white/90'
                          )}
                        >
                          {existingSellOffers.length > 0 ? 'Edit Listing' : 'List NFT for Sale'}
                        </h3>
                        <button
                          onClick={() => setNftToSell(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-[#137DFE]/5 dark:text-white/40 dark:hover:text-[#137DFE]'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          'bg-gray-50 border border-gray-200 dark:bg-white/[0.04] dark:border dark:border-white/[0.15]'
                        )}
                      >
                        <img
                          src={nftToSell.image}
                          alt={nftToSell.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-[13px] font-medium',
                              'text-gray-900 dark:text-white/90'
                            )}
                          >
                            {nftToSell.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              'text-gray-400 dark:text-white/35'
                            )}
                          >
                            {nftToSell.collection}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-[9px] uppercase font-semibold tracking-wide',
                              'text-gray-400 dark:text-white/25'
                            )}
                          >
                            Floor
                          </p>
                          <p
                            className={cn(
                              'text-[12px] font-medium',
                              'text-gray-500 dark:text-white/50'
                            )}
                          >
                            {nftToSell.floor}
                          </p>
                        </div>
                      </div>

                      {/* Existing Sell Offers */}
                      {existingSellOffers.length > 0 && (
                        <div className={cn('mb-4 p-3 rounded-lg', 'bg-amber-50 border border-amber-200 dark:bg-[#F6AF01]/10 dark:border dark:border-[#F6AF01]/20')}>
                          <p className={cn('text-[11px] font-medium mb-2', 'text-amber-700 dark:text-[#F6AF01]')}>
                            Active Listings ({existingSellOffers.length})
                          </p>
                          <div className="space-y-2">
                            {existingSellOffers.map((offer) => (
                              <div key={offer.id} className={cn('flex items-center justify-between p-2 rounded', 'bg-white dark:bg-black/30')}>
                                <span className={cn('text-[12px] font-medium', 'text-gray-900 dark:text-white/90')}>
                                  {offer.price}
                                </span>
                                <button
                                  onClick={() => handleCancelNftOffer(offer)}
                                  disabled={cancellingNftOffer === offer.id}
                                  className={cn(
                                    'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                                    cancellingNftOffer === offer.id
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  )}
                                >
                                  {cancellingNftOffer === offer.id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className={cn('text-[9px] mt-2', 'text-amber-600 dark:text-[#F6AF01]/60')}>
                            Cancel existing listing before creating a new one
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              'text-[#137DFE] dark:text-[#137DFE]'
                            )}
                          >
                            Sale Price
                          </label>
                          <div
                            className={cn(
                              'flex items-center rounded-lg overflow-hidden',
                              'bg-gray-50 border border-gray-200 dark:bg-white/[0.04] dark:border dark:border-white/[0.15]'
                            )}
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              value={nftSellPrice}
                              onChange={(e) =>
                                setNftSellPrice(e.target.value.replace(/[^0-9.]/g, ''))
                              }
                              placeholder="0.00"
                              className={cn(
                                'flex-1 px-4 py-3 text-lg font-light bg-transparent outline-none',
                                'text-gray-900 placeholder:text-gray-300 dark:text-white dark:placeholder:text-white/20'
                              )}
                            />
                            <span
                              className={cn(
                                'px-4 py-3 text-[13px] font-medium',
                                'text-gray-500 bg-gray-100 dark:text-white/50 dark:bg-white/[0.04]'
                              )}
                            >
                              XRP
                            </span>
                          </div>
                        </div>
                        <div className={cn('flex items-center justify-between p-3 rounded-lg', 'bg-gray-50 border border-gray-200 dark:bg-white/[0.04] dark:border dark:border-white/[0.15]')}>
                          <span className={cn('text-[11px]', 'text-gray-500 dark:text-white/40')}>You receive <span className={'text-gray-400 dark:text-white/25'}>(1% fee)</span></span>
                          <span className={cn('text-lg font-medium', 'text-gray-900 dark:text-white/90')}>{nftSellPrice ? (parseFloat(nftSellPrice) * 0.99).toFixed(2) : '0.00'} XRP</span>
                        </div>
                        <button
                          onClick={handleCreateSellOffer}
                          disabled={!nftSellPrice || parseFloat(nftSellPrice) <= 0 || creatingSellOffer}
                          className={cn(
                            "w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-colors",
                            nftSellPrice && parseFloat(nftSellPrice) > 0 && !creatingSellOffer
                              ? "bg-[#137DFE] text-white hover:bg-[#137DFE]/90"
                              : "bg-white/10 text-white/30 cursor-not-allowed"
                          )}
                        >
                          {creatingSellOffer ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Offer...
                            </>
                          ) : (
                            <>
                              <ArrowUpRight size={16} /> List for Sale
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {selectedCollection ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'text-[11px] transition-colors',
                          'text-gray-400 hover:text-blue-600 dark:text-white/35 dark:hover:text-[#137DFE]'
                        )}
                      >
                        All Collections
                      </button>
                      <span className={'text-gray-300 dark:text-white/20'}>/</span>
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          'text-gray-900 dark:text-white/90'
                        )}
                      >
                        {selectedCollection}
                      </span>
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors duration-150',
                          'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-[#137DFE]/5 dark:hover:text-[#137DFE]'
                        )}
                      >
                        Clear
                      </button>
                    </div>
                    {collectionNftsLoading ? (
                      <div
                        className={cn(
                          'p-12 text-center',
                          'text-gray-400 dark:text-white/40'
                        )}
                      >
                        Loading NFTs...
                      </div>
                    ) : collectionNfts.length === 0 ? (
                      <div className={cn('rounded-xl py-12 px-8 text-center', 'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]')}>
                        <BearIcon />
                        <p className={cn('text-xs font-medium tracking-widest mb-1', 'text-gray-500 dark:text-white/60')}>
                          NO NFTS FOUND
                        </p>
                        <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#137DFE] hover:underline">
                          Browse collections
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                        {collectionNfts.map((nft) => {
                          const costAmount = nft.cost?.amount ? parseFloat(nft.cost.amount) : 0;
                          const isListed = costAmount > 0;
                          const listingPrice = isListed ? costAmount.toFixed(costAmount < 10 ? 2 : 0) : null;
                          return (
                            <div
                              key={nft.id}
                              className={cn(
                                'rounded-xl overflow-hidden group transition-all duration-300 cursor-pointer',
                                isListed
                                  ? 'bg-white border border-[#08AA09]/40 shadow-sm hover:border-[#08AA09]/60 dark:bg-black/40 dark:backdrop-blur-md dark:border-[#08AA09]/40 dark:shadow-none dark:hover:border-[#08AA09]/60'
                                  : 'bg-white border border-gray-200 shadow-sm hover:border-[#137DFE]/50 dark:bg-black/40 dark:backdrop-blur-md dark:border-white/[0.12] dark:shadow-none dark:hover:border-[#137DFE]/50'
                              )}
                              onClick={() => window.open(`/nft/${nft.nftId}`, '_blank')}
                            >
                              <div className="relative">
                                {nft.image ? (
                                  <NftImg src={nft.image} alt={nft.name} />
                                ) : (
                                  <div className={cn('w-full aspect-square flex flex-col items-center justify-center gap-1', 'bg-[#F1F5F9] text-[#94A3B8] dark:bg-[#111] dark:text-[#4B5563]')}>
                                    <ImageOff size={16} strokeWidth={1.2} />
                                    <span className="text-[9px]">Unavailable</span>
                                  </div>
                                )}
                                {/* Listed badge */}
                                {isListed && (
                                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#08AA09] text-white text-[8px] font-bold uppercase tracking-wide flex items-center gap-1">
                                    <Tag size={8} /> Listed
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex gap-1 p-1.5 bg-gradient-to-t from-black/90 to-black/60">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNftToTransfer(nft); }}
                                    className="flex-1 py-2 rounded-lg bg-white/15 text-white hover:bg-white/25 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all backdrop-blur-sm"
                                    title="Send"
                                  >
                                    <Send size={12} /> Send
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNftToSell(nft); }}
                                    className={cn(
                                      "flex-1 py-2 rounded-lg text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all",
                                      isListed
                                        ? "bg-[#08AA09] hover:bg-[#08AA09]/80"
                                        : "bg-[#137DFE] hover:bg-[#137DFE]/80"
                                    )}
                                    title={isListed ? "Edit listing" : "Sell"}
                                  >
                                    <ArrowUpRight size={12} /> {isListed ? 'Edit' : 'Sell'}
                                  </button>
                                </div>
                              </div>
                              <div className="p-2">
                                <p
                                  className={cn(
                                    'text-[11px] font-semibold truncate',
                                    'text-gray-900 dark:text-white/95'
                                  )}
                                >
                                  {nft.name}
                                </p>
                                {isListed ? (
                                  <p className="text-[10px] font-medium mt-0.5 text-[#08AA09]">
                                    {listingPrice} XRP
                                  </p>
                                ) : nft.rarity > 0 ? (
                                  <p
                                    className={cn(
                                      'text-[9px] font-medium mt-0.5',
                                      'text-[#137DFE] dark:text-[#137DFE]/70'
                                    )}
                                  >
                                    Rank #{nft.rarity}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : collectionsLoading ? (
                  <div
                    className={cn('p-12 text-center', 'text-gray-400 dark:text-white/40')}
                  >
                    Loading collections...
                  </div>
                ) : collections.length === 0 ? (
                  <div className={cn('rounded-xl p-12 text-center', 'bg-white border border-gray-200 dark:bg-black/50 dark:backdrop-blur-sm dark:border dark:border-white/[0.15]')}>
                    <BearIcon />
                    <p className={cn('text-[10px] font-medium tracking-wider mb-1', 'text-gray-500 dark:text-white/60')}>
                      NO NFTS FOUND
                    </p>
                    <p className={cn('text-[9px]', 'text-gray-400 dark:text-white/40')}>
                      NFTs you own will appear here
                    </p>
                    <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#137DFE] hover:underline mt-2 inline-block">
                      Browse collections
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedCollection(col.name)}
                        className={cn(
                          'rounded-xl overflow-hidden text-left group transition-all duration-300',
                          'bg-white border border-gray-200 shadow-sm hover:shadow-md dark:bg-black/40 dark:backdrop-blur-md dark:border dark:border-white/[0.12] dark:hover:border-white/[0.18]'
                        )}
                      >
                        <div className="relative">
                          {col.logo ? (
                            <NftImg src={col.logo} alt={col.name} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className={cn('w-full aspect-square flex flex-col items-center justify-center gap-1', 'bg-[#F1F5F9] text-[#94A3B8] dark:bg-[#111] dark:text-[#4B5563]')}>
                              <ImageOff size={16} strokeWidth={1.2} />
                              <span className="text-[9px]">Unavailable</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p
                            className={cn(
                              'text-[11px] font-semibold truncate',
                              'text-gray-900 dark:text-white/95'
                            )}
                          >
                            {col.name}
                          </p>
                          <p
                            className={cn(
                              'text-[9px] font-medium opacity-60 mt-0.5',
                              'text-gray-500 dark:text-white'
                            )}
                          >
                            {col.count} item{col.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div >
        </div >
      )
      }

      {/* P/L Card Modal */}
      {
        showPLCard && (accountInfo || nftStats) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 max-sm:h-dvh" onClick={() => setShowPLCard(false)}>
            <div onClick={e => e.stopPropagation()} className="relative w-[400px] max-w-[calc(100vw-32px)]">
              {/* Card for display and capture */}
              <div
                ref={plCardRef}
                className={cn("w-full p-6 rounded-2xl", 'bg-white border border-gray-200 dark:bg-black dark:border dark:border-white/10')}
              >
                {/* Header with logo */}
                <div className="flex items-center justify-between mb-4">
                  <img src={'/logo/xrpl-to-logo-black.svg dark:/logo/xrpl-to-logo-white.svg'} alt="XRPL.to" className="h-5" />
                  <span className={cn("text-[10px] uppercase tracking-wider", 'text-gray-400 dark:text-white/40')}>
                    {plType === 'token' ? 'Token Stats' : plType === 'nft' ? 'NFT Stats' : 'Trading Stats'}
                  </span>
                </div>

                {/* Type Toggle - Inside card */}
                {(accountInfo?.totalTrades > 0 || nftStats?.totalTrades > 0) && (
                  <div className={cn("flex items-center gap-1 p-1 rounded-lg mb-5", 'bg-gray-100 dark:bg-white/5')}>
                    {[
                      { id: 'token', label: 'Token', icon: Coins, show: accountInfo?.totalTrades > 0 },
                      { id: 'nft', label: 'NFT', icon: Image, show: nftStats?.totalTrades > 0 },
                      { id: 'combined', label: 'All', icon: Layers, show: accountInfo?.totalTrades > 0 && nftStats?.totalTrades > 0 }
                    ].filter(opt => opt.show).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPlType(opt.id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
                          plType === opt.id
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/60'
                        )}
                      >
                        <opt.icon size={11} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Address */}
                <div className="mb-5">
                  <div className={cn("text-[9px] uppercase tracking-wider mb-1", 'text-gray-400 dark:text-white/30')}>Wallet</div>
                  <div className={cn("text-xs font-mono", 'text-gray-600 dark:text-white/60')}>{address?.slice(0, 12)}...{address?.slice(-8)}</div>
                </div>

                {/* Main P/L - Dynamic based on plType */}
                {(() => {
                  const tokenPnl = accountInfo?.totalPnl ?? accountInfo?.pnl ?? 0;
                  const tokenRoi = accountInfo?.totalRoi ?? accountInfo?.roi ?? 0;
                  const nftPnl = (nftStats?.profit || 0) + (nftStats?.unrealizedProfit || 0);
                  const nftRoi = nftStats?.roi || 0;
                  const pnl = plType === 'token' ? tokenPnl : plType === 'nft' ? nftPnl : tokenPnl + nftPnl;
                  const roi = plType === 'token' ? tokenRoi : plType === 'nft' ? nftRoi : (tokenPnl + nftPnl) !== 0 ? ((tokenRoi * Math.abs(tokenPnl) + nftRoi * Math.abs(nftPnl)) / (Math.abs(tokenPnl) + Math.abs(nftPnl))) : 0;
                  return (
                    <div className="mb-5">
                      <div className={cn("text-[9px] uppercase tracking-wider mb-1", 'text-gray-400 dark:text-white/30')}>Total P/L</div>
                      <div className={cn('text-3xl font-bold tabular-nums', pnl >= 0 ? 'text-[#08AA09]' : 'text-red-400')}>
                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                      </div>
                      <div className={cn('text-sm tabular-nums', roi >= 0 ? 'text-[#08AA09]/60' : 'text-red-400/60')}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                      </div>
                    </div>
                  );
                })()}

                {/* Stats Grid - Dynamic based on plType */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Trades', value: plType === 'token' ? (accountInfo?.totalTrades || 0) : plType === 'nft' ? (nftStats?.totalTrades || 0) : ((accountInfo?.totalTrades || 0) + (nftStats?.totalTrades || 0)) },
                    { label: 'Win Rate', value: `${(plType === 'token' ? (accountInfo?.winRate || 0) : plType === 'nft' ? (nftStats?.winRate || 0) : (((accountInfo?.winRate || 0) + (nftStats?.winRate || 0)) / ((accountInfo?.totalTrades ? 1 : 0) + (nftStats?.totalTrades ? 1 : 0) || 1))).toFixed(0)}%` },
                    { label: plType === 'nft' ? 'NFTs' : plType === 'token' ? 'Tokens' : 'Assets', value: plType === 'token' ? (accountInfo?.totalTokensTraded || 0) : plType === 'nft' ? (nftStats?.holdingsCount || 0) : ((accountInfo?.totalTokensTraded || 0) + (nftStats?.holdingsCount || 0)) }
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className={cn("text-[9px] uppercase tracking-wider mb-1", 'text-gray-400 dark:text-white/30')}>{stat.label}</div>
                      <div className={cn("text-lg font-semibold tabular-nums", 'text-gray-900 dark:text-white')}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Win/Loss or NFT-specific stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {plType === 'nft' ? (
                    <>
                      <div className={cn("rounded-xl p-3 text-center", 'bg-gray-50 dark:bg-white/5')}>
                        <div className={cn("text-[9px] uppercase tracking-wider mb-1", 'text-gray-400 dark:text-white/30')}>Realized</div>
                        <div className={cn("font-semibold tabular-nums", (nftStats?.profit || 0) >= 0 ? "text-[#08AA09]" : "text-red-400")}>
                          {(nftStats?.profit || 0) >= 0 ? '+' : ''}{(nftStats?.profit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                        </div>
                      </div>
                      <div className={cn("rounded-xl p-3 text-center", 'bg-gray-50 dark:bg-white/5')}>
                        <div className={cn("text-[9px] uppercase tracking-wider mb-1", 'text-gray-400 dark:text-white/30')}>Unrealized</div>
                        <div className={cn("font-semibold tabular-nums", (nftStats?.unrealizedProfit || 0) >= 0 ? "text-[#08AA09]" : "text-amber-400")}>
                          {(nftStats?.unrealizedProfit || 0) >= 0 ? '+' : ''}{(nftStats?.unrealizedProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={cn("rounded-xl p-3 text-center", 'bg-gray-50 dark:bg-white/5')}>
                        <div className="text-[#08AA09]/50 text-[9px] uppercase tracking-wider mb-1">Best Trade</div>
                        <div className="text-[#08AA09] font-semibold tabular-nums">+{(accountInfo?.maxProfitTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</div>
                      </div>
                      <div className={cn("rounded-xl p-3 text-center", 'bg-gray-50 dark:bg-white/5')}>
                        <div className="text-red-400/50 text-[9px] uppercase tracking-wider mb-1">Worst Trade</div>
                        <div className="text-red-400 font-semibold tabular-nums">{(accountInfo?.maxLossTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ranking / NFT extras */}
                {accountInfo?.tradingRank && plType !== 'nft' && (
                  <div className="flex items-center justify-center gap-2 text-[#F6AF01]/70 pt-2">
                    <Trophy size={13} />
                    <span className="text-xs">Trading Rank #{accountInfo.tradingRank.toLocaleString()}</span>
                  </div>
                )}
                {plType === 'nft' && nftStats?.flips > 0 && (
                  <div className={cn("flex items-center justify-center gap-4 text-[11px] pt-2", 'text-gray-500 dark:text-white/40')}>
                    <span>{nftStats.flips} flips</span>
                    <span>{(nftStats.avgHoldingDays || 0).toFixed(0)}d avg hold</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    const tokenPnl = accountInfo?.pnl || 0;
                    const nftPnl = (nftStats?.profit || 0) + (nftStats?.unrealizedProfit || 0);
                    const pnl = plType === 'token' ? tokenPnl : plType === 'nft' ? nftPnl : tokenPnl + nftPnl;
                    const tokenRoi = accountInfo?.roi || 0;
                    const nftRoi = nftStats?.roi || 0;
                    const roi = plType === 'token' ? tokenRoi : plType === 'nft' ? nftRoi : (tokenPnl + nftPnl) !== 0 ? ((tokenRoi * Math.abs(tokenPnl) + nftRoi * Math.abs(nftPnl)) / (Math.abs(tokenPnl) + Math.abs(nftPnl))) : 0;
                    const trades = plType === 'token' ? (accountInfo?.totalTrades || 0) : plType === 'nft' ? (nftStats?.totalTrades || 0) : ((accountInfo?.totalTrades || 0) + (nftStats?.totalTrades || 0));
                    const winRate = plType === 'token' ? (accountInfo?.winRate || 0) : plType === 'nft' ? (nftStats?.winRate || 0) : (((accountInfo?.winRate || 0) + (nftStats?.winRate || 0)) / ((accountInfo?.totalTrades ? 1 : 0) + (nftStats?.totalTrades ? 1 : 0) || 1));
                    const typeLabel = plType === 'token' ? 'Token' : plType === 'nft' ? 'NFT' : 'XRPL';
                    const text = `My ${typeLabel} Trading Stats\n\n${pnl >= 0 ? '📈' : '📉'} P/L: ${pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP (${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%)\n🎯 ${trades} trades | ${winRate.toFixed(0)}% win rate\n\nTrack your trading at @xrplto\nhttps://xrpl.to/address/${address}`;

                    // Generate PNG for sharing
                    const canvas = document.createElement('canvas');
                    const scale = 2;
                    canvas.width = 400 * scale;
                    canvas.height = 288 * scale;
                    const ctx = canvas.getContext('2d');
                    const bgColor = isDark ? '#000' : '#fff';
                    const textColor = isDark ? '#fff' : '#111';
                    const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
                    const addressColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
                    const boxBgColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                    const pnlColor = pnl >= 0 ? '#34d399' : '#f87171';

                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const drawText = (t, x, y, { color = textColor, size = 14, weight = '400', align = 'left' } = {}) => {
                      ctx.fillStyle = color;
                      ctx.font = `${weight} ${size * scale}px -apple-system, system-ui, sans-serif`;
                      ctx.textAlign = align;
                      ctx.fillText(t, x * scale, y * scale);
                    };

                    // Load and draw logo
                    const logoSrc = '/logo/xrpl-to-logo-black.svg dark:/logo/xrpl-to-logo-white.svg';
                    const logo = new window.Image();
                    logo.src = logoSrc;
                    await new Promise((resolve) => {
                      logo.onload = resolve;
                      logo.onerror = resolve;
                    });
                    if (logo.complete && logo.naturalWidth > 0) {
                      const logoHeight = 22 * scale;
                      const logoWidth = (logo.naturalWidth / logo.naturalHeight) * logoHeight;
                      ctx.drawImage(logo, 24 * scale, 16 * scale, logoWidth, logoHeight);
                    }

                    const statsLabel = plType === 'token' ? 'Token Trading Stats' : plType === 'nft' ? 'NFT Trading Stats' : 'Trading Stats';
                    const assets = plType === 'token' ? (accountInfo?.totalTokensTraded || 0) : plType === 'nft' ? (nftStats?.holdingsCount || 0) : ((accountInfo?.totalTokensTraded || 0) + (nftStats?.holdingsCount || 0));
                    const assetsLabel = plType === 'nft' ? 'NFTS' : plType === 'token' ? 'TOKENS' : 'ASSETS';

                    drawText(statsLabel, 376, 36, { size: 11, color: mutedColor, align: 'right' });
                    if (plType !== 'nft' && accountInfo?.tradingRank) {
                      drawText(`#${accountInfo.tradingRank.toLocaleString()}`, 376, 52, { size: 10, color: '#137DFE', align: 'right', weight: '600' });
                    }
                    drawText('TOTAL P/L', 24, 72, { size: 9, color: mutedColor, weight: '500' });
                    drawText(`${pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 24, 106, { size: 28, weight: '700', color: pnlColor });
                    drawText(`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% ROI`, 24, 128, { size: 13, color: pnl >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)' });
                    const statsY = 158;
                    drawText('TRADES', 24, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(String(trades), 24, statsY + 24, { size: 18, weight: '600' });
                    drawText('WIN RATE', 150, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(`${winRate.toFixed(0)}%`, 150, statsY + 24, { size: 18, weight: '600' });
                    drawText(assetsLabel, 276, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(String(assets), 276, statsY + 24, { size: 18, weight: '600' });
                    const boxY = 208;
                    ctx.fillStyle = boxBgColor;
                    ctx.roundRect(24 * scale, boxY * scale, 168 * scale, 52 * scale, 8 * scale);
                    ctx.fill();
                    ctx.roundRect(208 * scale, boxY * scale, 168 * scale, 52 * scale, 8 * scale);
                    ctx.fill();
                    if (plType === 'nft') {
                      drawText('REALIZED', 36, boxY + 18, { size: 9, color: 'rgba(52,211,153,0.6)', weight: '500' });
                      drawText(`${(nftStats?.profit || 0) >= 0 ? '+' : ''}${(nftStats?.profit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 36, boxY + 38, { size: 13, weight: '600', color: (nftStats?.profit || 0) >= 0 ? '#34d399' : '#f87171' });
                      drawText('UNREALIZED', 220, boxY + 18, { size: 9, color: 'rgba(251,191,36,0.6)', weight: '500' });
                      drawText(`${(nftStats?.unrealizedProfit || 0) >= 0 ? '+' : ''}${(nftStats?.unrealizedProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 220, boxY + 38, { size: 13, weight: '600', color: (nftStats?.unrealizedProfit || 0) >= 0 ? '#34d399' : '#fbbf24' });
                    } else {
                      drawText('BEST TRADE', 36, boxY + 18, { size: 9, color: 'rgba(52,211,153,0.6)', weight: '500' });
                      drawText(`+${(accountInfo?.maxProfitTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 36, boxY + 38, { size: 13, weight: '600', color: '#34d399' });
                      drawText('WORST TRADE', 220, boxY + 18, { size: 9, color: 'rgba(248,113,113,0.6)', weight: '500' });
                      drawText(`${(accountInfo?.maxLossTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 220, boxY + 38, { size: 13, weight: '600', color: '#f87171' });
                    }

                    // Try Web Share API with image
                    try {
                      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
                      const file = new File([blob], 'xrpl-pl.png', { type: 'image/png' });
                      if (navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ text, files: [file] });
                        return;
                      }
                    } catch { }
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors", 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-white/90')}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Post
                </button>
                <button
                  onClick={async () => {
                    const tokenPnl = accountInfo?.pnl || 0;
                    const nftPnl = (nftStats?.profit || 0) + (nftStats?.unrealizedProfit || 0);
                    const pnl = plType === 'token' ? tokenPnl : plType === 'nft' ? nftPnl : tokenPnl + nftPnl;
                    const tokenRoi = accountInfo?.roi || 0;
                    const nftRoi = nftStats?.roi || 0;
                    const roi = plType === 'token' ? tokenRoi : plType === 'nft' ? nftRoi : (tokenPnl + nftPnl) !== 0 ? ((tokenRoi * Math.abs(tokenPnl) + nftRoi * Math.abs(nftPnl)) / (Math.abs(tokenPnl) + Math.abs(nftPnl))) : 0;
                    const trades = plType === 'token' ? (accountInfo?.totalTrades || 0) : plType === 'nft' ? (nftStats?.totalTrades || 0) : ((accountInfo?.totalTrades || 0) + (nftStats?.totalTrades || 0));
                    const winRate = plType === 'token' ? (accountInfo?.winRate || 0) : plType === 'nft' ? (nftStats?.winRate || 0) : (((accountInfo?.winRate || 0) + (nftStats?.winRate || 0)) / ((accountInfo?.totalTrades ? 1 : 0) + (nftStats?.totalTrades ? 1 : 0) || 1));

                    const canvas = document.createElement('canvas');
                    const scale = 2;
                    canvas.width = 400 * scale;
                    canvas.height = 288 * scale;
                    const ctx = canvas.getContext('2d');
                    const bgColor = isDark ? '#000' : '#fff';
                    const textColor = isDark ? '#fff' : '#111';
                    const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
                    const addressColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
                    const boxBgColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                    const pnlColor = pnl >= 0 ? '#34d399' : '#f87171';

                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const drawText = (t, x, y, { color = textColor, size = 14, weight = '400', align = 'left' } = {}) => {
                      ctx.fillStyle = color;
                      ctx.font = `${weight} ${size * scale}px -apple-system, system-ui, sans-serif`;
                      ctx.textAlign = align;
                      ctx.fillText(t, x * scale, y * scale);
                    };

                    // Load and draw logo
                    const logoSrc = '/logo/xrpl-to-logo-black.svg dark:/logo/xrpl-to-logo-white.svg';
                    const logo = new window.Image();
                    logo.src = logoSrc;
                    await new Promise((resolve) => {
                      logo.onload = resolve;
                      logo.onerror = resolve;
                    });
                    if (logo.complete && logo.naturalWidth > 0) {
                      const logoHeight = 22 * scale;
                      const logoWidth = (logo.naturalWidth / logo.naturalHeight) * logoHeight;
                      ctx.drawImage(logo, 24 * scale, 16 * scale, logoWidth, logoHeight);
                    }

                    const statsLabel = plType === 'token' ? 'Token Trading Stats' : plType === 'nft' ? 'NFT Trading Stats' : 'Trading Stats';
                    const assets = plType === 'token' ? (accountInfo?.totalTokensTraded || 0) : plType === 'nft' ? (nftStats?.holdingsCount || 0) : ((accountInfo?.totalTokensTraded || 0) + (nftStats?.holdingsCount || 0));
                    const assetsLabel = plType === 'nft' ? 'NFTS' : plType === 'token' ? 'TOKENS' : 'ASSETS';

                    drawText(statsLabel, 376, 36, { size: 11, color: mutedColor, align: 'right' });
                    if (plType !== 'nft' && accountInfo?.tradingRank) {
                      drawText(`#${accountInfo.tradingRank.toLocaleString()}`, 376, 52, { size: 10, color: '#137DFE', align: 'right', weight: '600' });
                    }
                    drawText('TOTAL P/L', 24, 72, { size: 9, color: mutedColor, weight: '500' });
                    drawText(`${pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 24, 106, { size: 28, weight: '700', color: pnlColor });
                    drawText(`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% ROI`, 24, 128, { size: 13, color: pnl >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)' });
                    const statsY = 158;
                    drawText('TRADES', 24, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(String(trades), 24, statsY + 24, { size: 18, weight: '600' });
                    drawText('WIN RATE', 150, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(`${winRate.toFixed(0)}%`, 150, statsY + 24, { size: 18, weight: '600' });
                    drawText(assetsLabel, 276, statsY, { size: 9, color: mutedColor, weight: '500' });
                    drawText(String(assets), 276, statsY + 24, { size: 18, weight: '600' });
                    const boxY = 208;
                    ctx.fillStyle = boxBgColor;
                    ctx.roundRect(24 * scale, boxY * scale, 168 * scale, 52 * scale, 8 * scale);
                    ctx.fill();
                    ctx.roundRect(208 * scale, boxY * scale, 168 * scale, 52 * scale, 8 * scale);
                    ctx.fill();
                    if (plType === 'nft') {
                      drawText('REALIZED', 36, boxY + 18, { size: 9, color: 'rgba(52,211,153,0.6)', weight: '500' });
                      drawText(`${(nftStats?.profit || 0) >= 0 ? '+' : ''}${(nftStats?.profit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 36, boxY + 38, { size: 13, weight: '600', color: (nftStats?.profit || 0) >= 0 ? '#34d399' : '#f87171' });
                      drawText('UNREALIZED', 220, boxY + 18, { size: 9, color: 'rgba(251,191,36,0.6)', weight: '500' });
                      drawText(`${(nftStats?.unrealizedProfit || 0) >= 0 ? '+' : ''}${(nftStats?.unrealizedProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 220, boxY + 38, { size: 13, weight: '600', color: (nftStats?.unrealizedProfit || 0) >= 0 ? '#34d399' : '#fbbf24' });
                    } else {
                      drawText('BEST TRADE', 36, boxY + 18, { size: 9, color: 'rgba(52,211,153,0.6)', weight: '500' });
                      drawText(`+${(accountInfo?.maxProfitTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 36, boxY + 38, { size: 13, weight: '600', color: '#34d399' });
                      drawText('WORST TRADE', 220, boxY + 18, { size: 9, color: 'rgba(248,113,113,0.6)', weight: '500' });
                      drawText(`${(accountInfo?.maxLossTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`, 220, boxY + 38, { size: 13, weight: '600', color: '#f87171' });
                    }

                    const link = document.createElement('a');
                    const typeLabel = plType === 'token' ? 'token' : plType === 'nft' ? 'nft' : 'combined';
                    link.download = `xrpl-to-${typeLabel}-pl-${address?.slice(0, 8)}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#137DFE] hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Download size={16} />
                  Save
                </button>
                <button
                  onClick={() => setShowPLCard(false)}
                  className={cn("p-3 rounded-xl transition-colors", 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Burn Modal */}
      {
        burnModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 max-sm:h-dvh">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBurnModal(null)} />
            <div className={cn(
              "relative w-full max-w-sm rounded-2xl border p-6",
              'bg-white border-gray-200 dark:bg-[#0a0a0a] dark:border-white/10'
            )}>
              <div className="flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative", 'bg-orange-50 border border-orange-200 dark:bg-orange-500/10 dark:border dark:border-orange-500/20')}>
                  {burnModal.md5 ? (
                    <img src={`https://s1.xrpl.to/token/${burnModal.md5}`} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <Flame size={26} className="text-orange-500" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                    <Flame size={10} className="text-white" />
                  </div>
                </div>
                <h3 className={cn("text-[16px] font-semibold mb-1", 'text-gray-900 dark:text-white')}>Burn {burnModal.symbol}</h3>
                <p className={cn("text-[12px] mb-4", 'text-gray-500 dark:text-white/40')}>
                  Permanently destroy tokens
                </p>
                <div className={cn("w-full mb-3", 'text-gray-500 dark:text-white/50')}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px]">Amount to burn</p>
                    <p className="text-[10px]">Balance: <span className={'text-gray-700 dark:text-white/70'}>{burnModal.amount}</span></p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl text-[14px] font-mono outline-none border transition-colors",
                        parseFloat(burnAmount) > burnModal.rawAmount
                          ? "border-red-500 focus:border-red-500"
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:border-orange-500/50'
                      )}
                    />
                    <button onClick={() => setBurnAmount(String(burnModal.rawAmount))} className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-2 py-1 rounded-md", 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-400/10')}>
                      MAX
                    </button>
                  </div>
                  {parseFloat(burnAmount) > burnModal.rawAmount && (
                    <p className="text-[10px] mt-1.5 text-right text-red-400">Exceeds balance</p>
                  )}
                  {burnAmount && parseFloat(burnAmount) > 0 && parseFloat(burnAmount) <= burnModal.rawAmount && (
                    <div className="flex justify-between mt-1.5">
                      {burnModal.price > 0 && (
                        <p className={cn("text-[10px]", 'text-gray-400 dark:text-white/40')}>
                          ≈ {(parseFloat(burnAmount) * burnModal.price).toFixed(2)} XRP
                        </p>
                      )}
                      {burnModal.percentOwned > 0 && (
                        <p className={cn("text-[10px]", 'text-orange-600 dark:text-orange-400/70')}>
                          {(() => {
                            const pct = (parseFloat(burnAmount) / burnModal.rawAmount) * burnModal.percentOwned;
                            return pct >= 0.01 ? pct.toFixed(2) : pct >= 0.0001 ? pct.toFixed(4) : pct.toExponential(2);
                          })()}% of supply
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn("w-full flex items-start gap-2 rounded-lg p-2.5 mb-4 text-left", 'bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border dark:border-red-500/20')}>
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className={cn("text-[10px]", 'text-red-600 dark:text-red-400/80')}>This action cannot be undone. Tokens sent to issuer are permanently destroyed.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setBurnModal(null)}
                    className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors", 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBurnTokens(burnModal, burnAmount)}
                    disabled={!burnAmount || parseFloat(burnAmount) <= 0 || parseFloat(burnAmount) > burnModal.rawAmount}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Burn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Trade Modal */}
      {
        tradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 max-sm:h-dvh">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTradeModal(null)} />
            <div className={cn(
              "relative w-full max-w-[340px] rounded-2xl border p-5",
              'bg-white border-gray-200 dark:bg-[#0a0a0a] dark:border-white/10'
            )}>
              <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    {tradeModal.md5 ? (
                      <img src={`https://s1.xrpl.to/token/${tradeModal.md5}`} alt="" className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#137DFE]/20 flex items-center justify-center text-[#137DFE] text-sm font-bold">{tradeModal.symbol?.[0]}</div>
                    )}
                    <div>
                      <h3 className={cn("text-[14px] font-semibold leading-tight", 'text-gray-900 dark:text-white')}>{tradeModal.symbol}</h3>
                      <p className={cn("text-[11px] font-mono", 'text-gray-400 dark:text-white/40')}>
                        {(() => { const p = tradeModal.price || 0; return p >= 1 ? p.toFixed(4) : p >= 0.0001 ? p.toFixed(6) : p >= 0.00000001 ? p.toFixed(10) : p.toFixed(15); })()} XRP
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setTradeModal(null)} className={cn("p-1.5 rounded-lg -mr-1", 'hover:bg-gray-100 dark:hover:bg-white/10')}>
                    <X size={16} className={'text-gray-400 dark:text-white/40'} />
                  </button>
                </div>

                {/* Direction Toggle */}
                <div className={cn("flex rounded-lg p-0.5 mb-4", 'bg-gray-100 dark:bg-white/[0.04]')}>
                  <button onClick={() => setTradeDirection('sell')} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", tradeDirection === 'sell' ? "bg-red-500/15 text-red-400" : ('text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60'))}>
                    Sell
                  </button>
                  <button onClick={() => setTradeDirection('buy')} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", tradeDirection === 'buy' ? "bg-[#08AA09]/15 text-[#08AA09]" : ('text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60'))}>
                    Buy
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-3">
                  <div className={cn("flex justify-between items-center mb-1.5 text-[10px]", 'text-gray-400 dark:text-white/40')}>
                    <span>{tradeDirection === 'sell' ? 'You sell' : 'You pay'}</span>
                    {tradeDirection === 'sell' && (
                      <button onClick={() => setTradeAmount(String(tradeModal.rawAmount))} className="hover:underline">
                        Bal: <span className={'text-gray-600 dark:text-white/60'}>{tradeModal.rawAmount >= 1000000 ? `${(tradeModal.rawAmount / 1000000).toFixed(2)}M` : tradeModal.rawAmount >= 1000 ? `${(tradeModal.rawAmount / 1000).toFixed(2)}K` : tradeModal.rawAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </button>
                    )}
                  </div>
                  <div className={cn("flex items-center rounded-xl border transition-colors", 'bg-gray-50 border-gray-200 focus-within:border-[#137DFE] dark:bg-white/[0.03] dark:border-white/10 dark:focus-within:border-[#137DFE]/40')}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0"
                      className={cn(
                        "flex-1 px-3 py-2.5 bg-transparent text-[16px] font-mono outline-none",
                        'text-gray-900 placeholder:text-gray-300 dark:text-white dark:placeholder:text-white/20'
                      )}
                    />
                    <div className={cn("flex items-center gap-1.5 pr-3", 'text-gray-500 dark:text-white/50')}>
                      {tradeDirection === 'sell' && tradeModal.md5 && <img src={`https://s1.xrpl.to/token/${tradeModal.md5}`} alt="" className="w-4 h-4 rounded-full" />}
                      <span className="text-[11px] font-medium">{tradeDirection === 'sell' ? tradeModal.symbol : 'XRP'}</span>
                    </div>
                  </div>
                </div>

                {/* Quote Results */}
                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className={cn("rounded-xl p-3 mb-3", 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                    {quoteLoading ? (
                      <div className={cn("text-[11px] animate-pulse", 'text-gray-400 dark:text-white/40')}>Getting quote...</div>
                    ) : tradeQuote?.error ? (
                      <div className="text-[11px] text-red-400">{tradeQuote.error}</div>
                    ) : tradeQuote ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[10px]", 'text-gray-400 dark:text-white/40')}>You receive</span>
                          <span className={cn("text-[13px] font-mono font-medium", 'text-green-600 dark:text-[#08AA09]')}>
                            {(() => {
                              const val = parseFloat(tradeDirection === 'sell' ? tradeQuote.source_amount?.value : tradeQuote.destination_amount?.value) || 0;
                              const decimals = val >= 1 ? 4 : val >= 0.0001 ? 6 : val >= 0.00000001 ? 10 : 15;
                              return `${val.toFixed(decimals)} ${tradeDirection === 'sell' ? 'XRP' : tradeModal.symbol}`;
                            })()}
                          </span>
                        </div>
                        <div className={cn("flex justify-between text-[10px]", 'text-gray-400 dark:text-white/30')}>
                          <span>Min received ({tradeSlippage}% slip)</span>
                          <span className="font-mono">{(() => {
                            const val = parseFloat(tradeQuote.minimum_received) || 0;
                            const decimals = val >= 1 ? 4 : val >= 0.0001 ? 6 : val >= 0.00000001 ? 10 : 15;
                            return val.toFixed(decimals);
                          })()} {tradeDirection === 'sell' ? 'XRP' : tradeModal.symbol}</span>
                        </div>
                        {tradeQuote.price_impact && (
                          <div className={cn("flex justify-between text-[10px]", 'text-gray-400 dark:text-white/30')}>
                            <span>Price impact</span>
                            <span className={parseFloat(tradeQuote.price_impact.percent) > 1 ? 'text-red-400' : 'font-mono'}>{tradeQuote.price_impact.percent}</span>
                          </div>
                        )}
                        {tradeQuote.fallback && <div className="text-[9px] text-amber-400/80">⚡ Estimate via DEX orderbook</div>}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Slippage */}
                <div className="mb-4">
                  <div className={cn("flex items-center justify-between mb-2", 'text-gray-400 dark:text-white/40')}>
                    <span className="text-[10px]">Slippage tolerance</span>
                    <span className={cn("text-[10px] font-mono", 'text-gray-500 dark:text-white/60')}>{tradeSlippage}%</span>
                  </div>
                  <div className={cn("flex rounded-lg p-0.5", 'bg-gray-100 dark:bg-white/[0.04]')}>
                    {[0.5, 1, 2, 'custom'].map(v => (
                      <button
                        key={v}
                        onClick={() => v !== 'custom' && setTradeSlippage(v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                          (v === 'custom' ? ![0.5, 1, 2].includes(tradeSlippage) : tradeSlippage === v)
                            ? ('bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white')
                            : ('text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60')
                        )}
                      >
                        {v === 'custom' ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={![0.5, 1, 2].includes(tradeSlippage) ? tradeSlippage : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              if (val === '') return;
                              setTradeSlippage(Math.max(0.1, Math.min(50, parseFloat(val) || 0.5)));
                            }}
                            placeholder="Custom"
                            className={cn("w-full text-center bg-transparent outline-none text-[10px] max-sm:text-base font-medium", 'placeholder:text-gray-400 dark:placeholder:text-white/30')}
                          />
                        ) : `${v}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTrade}
                  disabled={trading || !tradeQuote || tradeQuote.error || quoteLoading || (tradeDirection === 'sell' && parseFloat(tradeAmount) > tradeModal.rawAmount)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-medium bg-[#137DFE] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {trading ? 'Trading...' : quoteLoading ? 'Getting quote...' : tradeDirection === 'sell' ? `Sell ${tradeModal.symbol}` : `Buy ${tradeModal.symbol}`}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Dust Confirmation Modal */}
      {
        dustConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 max-sm:h-dvh">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDustConfirm(null)} />
            <div className={cn(
              "relative w-full max-w-sm rounded-2xl border p-6",
              'bg-white border-gray-200 dark:bg-[#0a0a0a] dark:border-white/10'
            )}>
              <div className="flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", dustConfirm.step === 'dex' ? ('bg-blue-50 border border-blue-200 dark:bg-[#137DFE]/10 dark:border dark:border-[#137DFE]/20') : ('bg-amber-50 border border-amber-200 dark:bg-[#F6AF01]/10 dark:border dark:border-[#F6AF01]/20'))}>
                  {dustConfirm.step === 'dex' ? <ArrowRightLeft size={26} className="text-[#137DFE]" /> : <Sparkles size={26} className="text-[#F6AF01]" />}
                </div>
                <h3 className={cn("text-[16px] font-semibold mb-1", 'text-gray-900 dark:text-white')}>
                  {dustConfirm.step === 'dex' ? 'Sell Dust on DEX?' : 'Burn by Sending to Issuer?'}
                </h3>
                <p className={cn("text-[12px] mb-3", 'text-gray-500 dark:text-white/40')}>
                  {dustConfirm.step === 'dex' ? 'Create a sell order to clear your tiny balance' : 'DEX sell failed. Send tokens back to issuer?'}
                </p>
                <div className={cn("w-full rounded-xl p-3 mb-3", 'bg-gray-50 border border-gray-100 dark:bg-white/[0.03] dark:border dark:border-white/[0.06]')}>
                  <p className={cn("font-mono text-[15px] font-semibold", 'text-gray-900 dark:text-white')}>{dustConfirm.token.amount} {dustConfirm.token.symbol}</p>
                  <p className={cn("text-[11px] mt-0.5", 'text-gray-400 dark:text-white/30')}>Value: &lt; 0.01 XRP</p>
                </div>
                <div className={cn("w-full flex items-start gap-2 rounded-lg p-2.5 mb-4 text-left", 'bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border dark:border-red-500/20')}>
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className={cn("text-[10px]", 'text-red-600 dark:text-red-400/80')}>This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDustConfirm(null)}
                    className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors", 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => executeDustClear(dustConfirm.token, dustConfirm.step)}
                    className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors", dustConfirm.step === 'dex' ? "bg-[#137DFE] text-white hover:bg-[#137DFE]/90" : "bg-[#F6AF01] text-black hover:bg-[#F6AF01]/90")}
                  >
                    {dustConfirm.step === 'dex' ? 'Sell on DEX' : 'Burn Tokens'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      </main>
      <Footer />
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/wallet',
        title: 'Wallet | Manage Your XRPL Wallet',
        url: 'https://xrpl.to/wallet',
        imgUrl: 'https://xrpl.to/api/og/wallet',
        imgType: 'image/png',
        desc: 'Manage your XRP Ledger wallet. View balances, send payments, and trade tokens.'
      }
    }
  };
}
