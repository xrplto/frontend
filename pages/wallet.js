import { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { MD5 } from 'crypto-js';
import { Client, Wallet as XRPLWallet } from 'xrpl';
import { toast } from 'sonner';
import { AppContext } from 'src/context/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { withdrawalStorage } from 'src/utils/withdrawalStorage';
import { getNftCoverUrl, parseTransaction, normalizeCurrencyCode } from 'src/utils/parseUtils';
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
  Crown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import QRCode from 'react-qr-code';

const BASE_URL = 'https://api.xrpl.to';

export default function WalletPage() {
  const router = useRouter();
  const { tab: initialTab } = router.query;
  const { themeName, accountProfile, setOpenWalletModal, activeFiatCurrency } =
    useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const BearIcon = () => (
    <div className="relative w-14 h-14 mx-auto mb-3">
      <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-200')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
          ))}
        </div>
        <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
          <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-400')} />
        </div>
      </div>
    </div>
  );

  const metrics = useSelector(selectMetrics);
  const metricsRate =
    metrics?.[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics?.CNY : null) || 1;
  const currencySymbols = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };
  const accountLogin = accountProfile?.account;
  const address = accountLogin;

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
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
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedToken, setSelectedToken] = useState('XRP');
  const [showPanel, setShowPanel] = useState(null); // 'send' | 'receive' | null
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tokenSort, setTokenSort] = useState('value');
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [tokenPage, setTokenPage] = useState(1);
  const tokensPerPage = 20;

  // Referral state
  const [referralUser, setReferralUser] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
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
  const [userPerks, setUserPerks] = useState(null);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [xrpInvoice, setXrpInvoice] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [displayBadges, setDisplayBadges] = useState({ current: null, available: [] });
  const [settingBadge, setSettingBadge] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

  const handleRemoveTrustline = async (token) => {
    if (!token.currency || !token.issuer) return;
    setRemovingTrustline(token.currency + token.issuer);
    const toastId = toast.loading(`Removing ${token.symbol}...`, { description: 'Connecting to XRPL' });

    try {
      let seed = null;

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed;
          }
        }
      }

      if (!seed) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      toast.loading(`Removing ${token.symbol}...`, { id: toastId, description: 'Signing transaction' });
      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Check account's defaultRipple flag to determine correct TrustSet flags
      const accountInfo = await client.request({ command: 'account_info', account: address });
      const accountFlags = accountInfo.result.account_data.Flags || 0;
      const hasDefaultRipple = (accountFlags & 0x00800000) !== 0; // lsfDefaultRipple

      // tfSetNoRipple = 131072, tfClearNoRipple = 262144
      // If account has NO defaultRipple, set NoRipple to match default state
      // If account HAS defaultRipple, clear NoRipple to match default state
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
      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      await client.disconnect();

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        const txHash = result.result.hash;
        setTokens(prev => prev.filter(t => !(t.currency === token.currency && t.issuer === token.issuer)));
        toast.success(`${token.symbol} trustline removed`, {
          id: toastId,
          duration: 6000,
          description: <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline flex items-center gap-1">View transaction <ExternalLink size={10} /></a>
        });
      } else {
        toast.error('Transaction failed', { id: toastId, description: result.result.meta.TransactionResult });
      }
    } catch (err) {
      console.error('Remove trustline error:', err);
      toast.error('Failed to remove trustline', { id: toastId, description: err.message });
    } finally {
      setRemovingTrustline(null);
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
        const res = await axios.post('https://api.xrpl.to/api/dex/quote', body);
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
      let seed = null;
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed;
          }
        }
      }

      if (!seed) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setBurning(null);
        return;
      }

      toast.loading(`Burning ${token.symbol}...`, { id: toastId, description: 'Sending to issuer...' });
      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Check issuer flags
      const issuerInfo = await client.request({ command: 'account_info', account: token.issuer });
      const issuerFlags = issuerInfo.result.account_flags || {};

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
      if (issuerFlags.requireDestinationTag) tx.DestinationTag = 0;

      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      await client.disconnect();

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        const txHash = result.result.hash;
        const newBalance = token.rawAmount - parseFloat(amount);
        setTokens(prev => prev.map(t =>
          t.currency === token.currency && t.issuer === token.issuer
            ? { ...t, rawAmount: newBalance, amount: newBalance > 0 ? newBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0' }
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
      } else {
        toast.error('Burn failed', { id: toastId, description: result.result.meta.TransactionResult });
      }
    } catch (err) {
      console.error('Burn error:', err);
      toast.error('Burn failed', { id: toastId, description: err.message });
    } finally {
      setBurning(null);
      setBurnAmount('');
    }
  };

  const handleTrade = async () => {
    if (!tradeModal || !tradeAmount || parseFloat(tradeAmount) <= 0 || !tradeQuote || tradeQuote.error) return;
    setTrading(true);
    const toastId = toast.loading(`Trading ${tradeModal.symbol}...`, { description: 'Connecting to XRPL' });

    try {
      let seed = null;
      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed;
          }
        }
      }

      if (!seed) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setTrading(false);
        return;
      }

      toast.loading(`Trading ${tradeModal.symbol}...`, { id: toastId, description: 'Executing swap...' });
      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Use Payment for AMM swap with slippage protection
      // SendMax = what we're willing to pay, Amount = what we want, DeliverMin = minimum acceptable
      const slippage = tradeSlippage / 100;
      let tx;

      // Helper to format token value with safe precision (max 15 significant digits)
      const formatTokenValue = (val) => {
        const n = parseFloat(val);
        if (n >= 1) return n.toPrecision(15).replace(/\.?0+$/, '');
        return n.toFixed(Math.min(15, Math.max(6, -Math.floor(Math.log10(n)) + 6)));
      };

      if (tradeDirection === 'sell') {
        // Sell tokens for XRP
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
        // Buy tokens with XRP
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

      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      await client.disconnect();

      const txResult = result.result.meta.TransactionResult;
      const txHash = result.result.hash;
      const txLink = <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a>;

      if (txResult === 'tesSUCCESS') {
        toast.success('Trade executed', { id: toastId, description: txLink });
        setTradeModal(null);
        setTradeAmount('');
        setTradeQuote(null);
      } else if (txResult === 'tecKILLED') {
        toast.error('No liquidity at this price', { id: toastId, description: <span>Offer couldn't be filled. {txLink}</span> });
      } else {
        toast.error('Trade failed', { id: toastId, description: <span>{txResult} {txLink}</span> });
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error('Trade failed', { id: toastId, description: err.message });
    } finally {
      setTrading(false);
    }
  };

  const executeDustClear = async (token, method) => {
    if (!token?.currency || !token?.issuer || token.rawAmount === 0) return;
    setSendingDust(token.currency + token.issuer);
    setDustConfirm(null);
    const toastId = toast.loading(`Clearing ${token.symbol} dust...`, { description: method === 'dex' ? 'Selling on DEX' : 'Sending to issuer' });

    try {
      let seed = null;

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed;
          }
        }
      }

      if (!seed) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      if (method === 'dex') {
        const offerTx = {
          TransactionType: 'OfferCreate',
          Account: address,
          SourceTag: 161803,
          TakerGets: '1',
          TakerPays: { currency: token.currency, issuer: token.issuer, value: String(token.rawAmount) },
          Flags: 655360
        };
        const preparedOffer = await client.autofill(offerTx);
        const signedOffer = wallet.sign(preparedOffer);
        const offerResult = await client.submitAndWait(signedOffer.tx_blob);
        await client.disconnect();

        if (offerResult.result.meta.TransactionResult === 'tesSUCCESS') {
          const txHash = offerResult.result.hash;
          setTokens(prev => prev.map(t =>
            t.currency === token.currency && t.issuer === token.issuer ? { ...t, rawAmount: 0, amount: '0' } : t
          ));
          toast.success(`${token.symbol} dust sold on DEX`, {
            id: toastId,
            duration: 6000,
            description: <span>Balance cleared. <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a></span>
          });
        } else {
          toast.error('DEX sell failed', { id: toastId, description: offerResult.result.meta.TransactionResult });
          setDustConfirm({ token, step: 'issuer' }); // Prompt for issuer burn
        }
      } else {
        const issuerInfo = await client.request({ command: 'account_info', account: token.issuer });
        const needsTag = issuerInfo.result.account_flags?.requireDestinationTag;
        const tx = {
          TransactionType: 'Payment',
          Account: address,
          SourceTag: 161803,
          Destination: token.issuer,
          Amount: { currency: token.currency, issuer: token.issuer, value: String(token.rawAmount) }
        };
        if (needsTag) tx.DestinationTag = 0;

        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        await client.disconnect();

        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          const txHash = result.result.hash;
          setTokens(prev => prev.map(t =>
            t.currency === token.currency && t.issuer === token.issuer ? { ...t, rawAmount: 0, amount: '0' } : t
          ));
          toast.success(`${token.symbol} dust burned`, {
            id: toastId,
            duration: 6000,
            description: <span>Balance cleared. <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#137DFE] hover:underline">View tx</a></span>
          });
        } else {
          toast.error('Burn failed', { id: toastId, description: result.result.meta.TransactionResult });
        }
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
  const [txMarker, setTxMarker] = useState(null);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const txLimit = 20;
  const txTypes = ['all', 'Payment', 'OfferCreate', 'OfferCancel', 'TrustSet', 'AMMDeposit', 'AMMWithdraw', 'NFTokenMint', 'NFTokenAcceptOffer', 'NFTokenCreateOffer', 'NFTokenBurn', 'CheckCreate', 'CheckCash', 'EscrowCreate', 'EscrowFinish', 'AccountSet'];

  // Offers state
  const [tokenOffers, setTokenOffers] = useState([]);
  const [nftOffers, setNftOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Withdrawal addresses state
  const [withdrawals, setWithdrawals] = useState([]);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({ name: '', address: '', tag: '' });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [removingTrustline, setRemovingTrustline] = useState(null);
  const [withdrawalError, setWithdrawalError] = useState('');

  // Debug info state
  const [debugInfo, setDebugInfo] = useState(null);

  // Account status
  const [isInactive, setIsInactive] = useState(false);

  // Account info & trading stats
  const [accountInfo, setAccountInfo] = useState(null);
  const [nftStats, setNftStats] = useState(null);
  const [showPLCard, setShowPLCard] = useState(false);
  const [plType, setPlType] = useState('combined'); // 'token' | 'nft' | 'combined'
  const plCardRef = useRef(null);

  // Activity/History state
  const [recentView, setRecentView] = useState('onchain');
  const [historyView, setHistoryView] = useState('onchain');
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [tokenHistoryPage, setTokenHistoryPage] = useState(0);
  const [tokenHistoryTotal, setTokenHistoryTotal] = useState(0);
  const [tokenHistoryType, setTokenHistoryType] = useState('all');
  const tokenHistoryLimit = 20;
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);

  // Performance logging - track initial load
  useEffect(() => {
    if (address) {
      console.log('[Wallet] ========== INITIAL LOAD START ==========');
      console.log('[Wallet] Address:', address);
      console.time('[Wallet] TOTAL INITIAL LOAD');
    }
  }, [address]);

  // Log when all loading states are done
  useEffect(() => {
    if (address && !tokensLoading && !txLoading) {
      console.timeEnd('[Wallet] TOTAL INITIAL LOAD');
      console.log('[Wallet] ========== INITIAL LOAD COMPLETE ==========');
    }
  }, [address, tokensLoading, txLoading]);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) {
        setDebugInfo(null);
        return;
      }
      let walletKeyId =
        accountProfile.walletKeyId ||
        (accountProfile.provider && accountProfile.provider_id
          ? `${accountProfile.provider}_${accountProfile.provider_id}`
          : null);
      let seed = accountProfile.seed || null;

      if (
        !seed &&
        (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')
      ) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(
              accountProfile.account,
              storedPassword
            );
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) {
          seed = 'error: ' + e.message;
        }
      }

      if (!seed && accountProfile.wallet_type === 'device') {
        try {
          const { EncryptedWalletStorage, deviceFingerprint } =
            await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const deviceKeyId = await deviceFingerprint.getDeviceId();
          walletKeyId = deviceKeyId;
          if (deviceKeyId) {
            const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
            if (storedPassword) {
              const walletData = await walletStorage.getWallet(
                accountProfile.account,
                storedPassword
              );
              seed = walletData?.seed || 'encrypted';
            }
          }
        } catch (e) {
          seed = 'error: ' + e.message;
        }
      }

      setDebugInfo({
        wallet_type: accountProfile.wallet_type,
        account: accountProfile.account,
        walletKeyId,
        seed: seed || 'N/A'
      });
    };
    loadDebugInfo();
  }, [accountProfile]);

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
      amount: balance === 0 ? '0' : balance >= 0.01
        ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
        : balance < 1e-12 ? balance.toExponential(2) : balance.toFixed(12).replace(/\.?0+$/, ''),
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
      } catch {
        return currency;
      }
    }
    return currency;
  };

  // Use shared parseTransaction from parseUtils.js
  const parseTx = (rawTx) => parseTransaction(rawTx, address, decodeCurrency);

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
      try {
        const res = await fetch(
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
      fetch(`${BASE_URL}/v1/account/balance/${address}?rank=true`).then(res => res.json()).catch(() => null),
      fetch(`${BASE_URL}/v1/traders/${address}`).then(res => res.json()).catch(() => null),
      fetch(`${BASE_URL}/v1/nft/analytics/trader/${address}`).then(res => res.json()).catch(() => null)
    ]).then(([balanceData, traderData, nftData]) => {
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
      }
      setAccountInfo(merged);
      if (nftData && !nftData.error) {
        setNftStats(nftData);
      }
    }).catch(() => console.timeEnd('[Wallet] fetchAccountInfo'));
  }, [address]);

  // Load token trading history when trades tab + tokens view OR overview + tokens recent
  useEffect(() => {
    const shouldFetch = (activeTab === 'trades' && historyView === 'tokens') || (activeTab === 'overview' && recentView === 'tokens');
    if (!shouldFetch || !address) return;
    setTokenHistoryLoading(true);
    console.time('[Wallet] fetchTokenHistory');
    const url = `${BASE_URL}/v1/history?account=${address}&limit=${tokenHistoryLimit}&page=${tokenHistoryPage}${tokenHistoryType !== 'all' ? `&type=${tokenHistoryType}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.timeEnd('[Wallet] fetchTokenHistory');
        console.log('[Wallet] fetchTokenHistory: received', data.hists?.length || 0, 'trades');
        setTokenHistory(data.hists || []);
        setTokenHistoryTotal(data.count || data.totalRecords || 0);
      })
      .catch(() => {
        console.timeEnd('[Wallet] fetchTokenHistory');
        setTokenHistory([]);
      })
      .finally(() => setTokenHistoryLoading(false));
  }, [activeTab, historyView, recentView, address, tokenHistoryType, tokenHistoryPage]);

  // Load NFT trades when trades tab + nfts view OR overview + nfts recent
  useEffect(() => {
    const shouldFetch = (activeTab === 'trades' && historyView === 'nfts') || (activeTab === 'overview' && recentView === 'nfts');
    if (!shouldFetch || !address || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    console.time('[Wallet] fetchNftTrades');
    fetch(`${BASE_URL}/v1/nft/analytics/trader/${address}/trades?limit=50`)
      .then(res => res.json())
      .then(data => {
        console.timeEnd('[Wallet] fetchNftTrades');
        console.log('[Wallet] fetchNftTrades: received', data.trades?.length || 0, 'trades');
        setNftTrades(data.trades || []);
      })
      .catch(() => {
        console.timeEnd('[Wallet] fetchNftTrades');
        setNftTrades([]);
      })
      .finally(() => setNftTradesLoading(false));
  }, [activeTab, historyView, recentView, address]);


  // Load recent transactions directly from XRP Ledger node via WebSocket
  useEffect(() => {
    let cancelled = false;
    const fetchTx = async () => {
      if (!address) return;
      setTxLoading(true);
      console.time('[Wallet] fetchTransactions');
      const client = new Client('wss://s1.ripple.com');
      try {
        await client.connect();
        const response = await client.request({
          command: 'account_tx',
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: txLimit
        });
        console.timeEnd('[Wallet] fetchTransactions');
        if (cancelled) return;
        const txs = response.result?.transactions || [];
        console.log('[Wallet] fetchTransactions: received', txs.length, 'txs');
        setTransactions(txs.map(parseTx));
        setTxMarker(response.result?.marker || null);
        setTxHasMore(!!response.result?.marker);
      } catch (e) {
        console.timeEnd('[Wallet] fetchTransactions');
        if (!cancelled) console.error('Failed to load transactions:', e);
      } finally {
        client.disconnect();
        if (!cancelled) setTxLoading(false);
      }
    };
    fetchTx();
    return () => { cancelled = true; };
  }, [address]);

  // Load NFT collections summary - only when NFTs tab is active
  useEffect(() => {
    if (activeTab !== 'nfts' || !address || collections.length > 0) return;
    const controller = new AbortController();
    const fetchCollections = async () => {
      setCollectionsLoading(true);
      console.time('[Wallet] fetchNftCollections');
      try {
        const res = await fetch(`${BASE_URL}/api/nft/account/${address}/nfts`, {
          signal: controller.signal
        });
        const data = await res.json();
        console.timeEnd('[Wallet] fetchNftCollections');
        console.log('[Wallet] fetchNftCollections: received', data.collections?.length || 0, 'collections');
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

  // Load offers (DEX + NFT) - only when Offers tab is active
  useEffect(() => {
    if (activeTab !== 'offers' || !address || tokenOffers.length > 0 || nftOffers.length > 0) return;
    const controller = new AbortController();
    const fetchOffers = async () => {
      setOffersLoading(true);
      console.time('[Wallet] fetchOffers (DEX+NFT)');
      try {
        const [dexRes, nftRes] = await Promise.all([
          fetch(`${BASE_URL}/api/account/offers/${address}`, { signal: controller.signal }),
          fetch(`${BASE_URL}/api/nft/account/${address}/offers?limit=50`, {
            signal: controller.signal
          })
        ]);
        const [dexData, nftData] = await Promise.all([dexRes.json(), nftRes.json()]);
        console.timeEnd('[Wallet] fetchOffers (DEX+NFT)');
        console.log('[Wallet] fetchOffers: DEX', dexData.offers?.length || 0, ', NFT', (nftData.offers?.length || 0) + (nftData.incomingOffers?.length || 0));
        if (dexData.success && dexData.offers) {
          setTokenOffers(
            dexData.offers.map((offer) => {
              const gets = offer.gets || offer.taker_gets || offer.TakerGets;
              const pays = offer.pays || offer.taker_pays || offer.TakerPays;
              const getsAmt = parseFloat(gets?.value || 0);
              const getsCur = gets?.name || gets?.currency || 'XRP';
              const paysAmt = parseFloat(pays?.value || 0);
              const paysCur = pays?.name || pays?.currency || 'XRP';
              const rate = getsAmt > 0 ? paysAmt / getsAmt : 0;
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
                rate: rateDisplay ? `${rateDisplay} ${paysCur}/${getsCur}` : '',
                seq: offer.seq || offer.Sequence,
                funded: offer.funded !== false
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
            typeof offer.amount === 'number' ? `${(offer.amount / 1000000).toFixed(2)} XRP` : '',
          floor: offer.floor || 0,
          floorDiffPct: offer.floorDiffPct || 0,
          type
        });
        const sellOffers = (nftData.offers || []).map((o) => parseNftOffer(o, 'sell'));
        const buyOffers = (nftData.incomingOffers || []).map((o) => parseNftOffer(o, 'buy'));
        setNftOffers([...sellOffers, ...buyOffers]);
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

  // Fetch more transactions when History tab opened
  useEffect(() => {
    if (activeTab !== 'trades' || !address || transactions.length >= 50) return;
    let cancelled = false;
    const fetchMore = async () => {
      setTxLoading(true);
      console.time('[Wallet] fetchMoreTx (tab)');
      const client = new Client('wss://s1.ripple.com');
      try {
        await client.connect();
        const response = await client.request({
          command: 'account_tx',
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 50
        });
        console.timeEnd('[Wallet] fetchMoreTx (tab)');
        if (cancelled) return;
        const txs = response.result?.transactions || [];
        setTransactions(txs.map(parseTx));
        setTxMarker(response.result?.marker || null);
        setTxHasMore(!!response.result?.marker);
      } catch (e) {
        console.timeEnd('[Wallet] fetchMoreTx (tab)');
        if (!cancelled) console.error('Failed to load more transactions:', e);
      } finally {
        client.disconnect();
        if (!cancelled) setTxLoading(false);
      }
    };
    fetchMore();
    return () => { cancelled = true; };
  }, [activeTab, address]);

  // Fetch referral data
  useEffect(() => {
    if (!address || activeTab !== 'referral') return;
    const refParam = router.query.ref;
    if (refParam && !referralUser) setReferralForm(f => ({ ...f, referredBy: refParam }));
    const fetchReferral = async () => {
      setReferralLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/referral/${address}`),
          fetch(`${BASE_URL}/api/referral/${address}/stats`)
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.success && data.profile) setReferralUser(data.profile);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.success && data.stats) setReferralStats(data.stats);
        }
      } catch (e) { }
      setReferralLoading(false);
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
      const res = await fetch(`${BASE_URL}/api/referral/register`, {
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
      const profileRes = await fetch(`${BASE_URL}/api/referral/${address}`);
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
      const res = await fetch(`${BASE_URL}/api/referral/${address}/code`, {
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
    if (!address || activeTab !== 'profile') return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const res = await fetch(`${BASE_URL}/api/user/${address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) setProfileUser(data.user);
        } else if (res.status === 404) {
          setProfileUser(null);
        }
      } catch (e) {
        setProfileError('Failed to load profile');
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
      const res = await fetch(`${BASE_URL}/api/user/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(username ? { username } : {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
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
      const res = await fetch(`${BASE_URL}/api/user/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
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
        const res = await fetch(`${BASE_URL}/api/user/${address}/nfts?limit=50&offset=0`);
        if (res.ok) {
          const data = await res.json();
          if (data.nfts) setAvatarNfts(data.nfts);
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
      const res = await fetch(`${BASE_URL}/api/user/${address}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set avatar');
      setProfileUser(u => ({ ...u, avatar: data.avatar, avatarNftId: data.avatarNftId }));
      setShowAvatarPicker(false);
      toast.success('Avatar updated');
    } catch (e) {
      setProfileError(e.message);
    }
    setSettingAvatar(false);
  };

  // Fetch wallet labels
  useEffect(() => {
    if (!address || activeTab !== 'profile') return;
    const fetchLabels = async () => {
      setLabelsLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/user/${address}/labels`);
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
      const res = await fetch(`${BASE_URL}/api/user/${address}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${BASE_URL}/api/user/${address}/labels/${wallet}`, { method: 'DELETE' });
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
          fetch(`${BASE_URL}/api/user/tiers`),
          address ? fetch(`${BASE_URL}/api/user/${address}/perks`) : Promise.resolve(null),
          address ? fetch(`${BASE_URL}/v1/user/${address}/badges`) : Promise.resolve(null)
        ]);
        if (tiersRes.ok) {
          const data = await tiersRes.json();
          if (data.config) setTiers(data.config);
        }
        if (perksRes?.ok) {
          const data = await perksRes.json();
          setUserPerks({ tier: data.tier, perks: data.perks, expiry: data.expiry, roles: data.roles, groups: data.groups, contentAccess: data.contentAccess });
        }
        if (badgesRes?.ok) {
          const data = await badgesRes.json();
          setDisplayBadges({ current: data.current, available: data.available || [] });
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
      const res = await fetch(`${BASE_URL}/api/user/tier/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tier: tierName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      setXrpInvoice(data);
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
      const res = await fetch(`${BASE_URL}/api/user/tier/verify/${xrpInvoice.invoiceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment not verified');
      if (data.success) {
        setUserPerks(data.perks);
        setProfileUser(u => u ? { ...u, tier: data.tier } : u);
        setXrpInvoice(null);
        toast.success(`Upgraded to ${data.tier}!`);
      } else {
        throw new Error('Payment not yet received');
      }
    } catch (e) {
      setProfileError(e.message);
    }
    setVerifyingPayment(false);
  };

  const handleSetDisplayBadge = async (badge) => {
    if (!address || settingBadge) return;
    setSettingBadge(true);
    try {
      const res = await fetch(`${BASE_URL}/v1/user/${address}/display-badge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge })
      });
      if (res.ok) {
        setDisplayBadges(prev => ({ ...prev, current: badge }));
        window.dispatchEvent(new CustomEvent('badgeChanged', { detail: { badge } }));
      }
    } catch (e) { }
    setSettingBadge(false);
  };

  const handlePurchaseTierStripe = async (tierName) => {
    if (!address) return;
    setPurchaseLoading(tierName);
    setProfileError('');
    try {
      const res = await fetch(`${BASE_URL}/api/user/tier/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tier: tierName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
      if (data.url) window.location.href = data.url;
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
        console.log('[Wallet] fetchCollectionNfts: received', data.nfts?.length || 0, 'NFTs');
        if (data.nfts) {
          setCollectionNfts(
            data.nfts.map((nft) => ({
              id: nft._id || nft.NFTokenID,
              nftId: nft.NFTokenID || nft._id,
              name: nft.name || nft.meta?.name || 'Unnamed NFT',
              image: getNftCoverUrl(nft, 'large') || '',
              rarity: nft.rarity_rank || 0,
              cost: nft.cost
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
  const xrpToken = xrpData
    ? (() => {
      const x = xrpData.xrp || {};
      const bal = parseFloat(x.balance || xrpData.balance || 0);
      const change = x.pro24h ?? 0;
      return {
        symbol: 'XRP',
        name: 'XRP',
        amount: bal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        }),
        rawAmount: bal,
        value: `${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`,
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
    })()
    : null;
  const allTokens = xrpToken ? [xrpToken, ...tokens] : tokens;
  const totalValue = allTokens.reduce((sum, t) => sum + (t.rawValue || 0), 0);

  // XRP price in fiat for conversions (from API)
  const xrpUsdPrice = xrpData?.xrp?.usd ? parseFloat(xrpData.xrp.usd) : 1;
  // For converting XRP values to fiat: multiply by xrpUsdPrice
  // exchRate kept for backwards compatibility with metricsRate pattern
  const exchRate = metricsRate;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'tokens', label: 'Tokens', icon: () => <span className="text-xs">◎</span> },
    { id: 'nfts', label: 'NFTs', icon: Image },
    { id: 'offers', label: 'Offers', icon: RotateCcw },
    { id: 'trades', label: 'History', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: Building2 },
    { id: 'referral', label: 'Referral', icon: Swords },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      <Head>
        <title>Wallet | XRPL.to</title>
      </Head>

      <Header />

      {!address ? (
        <div
          className={cn(
            'min-h-[calc(100vh-64px)] flex items-center justify-center',
            isDark ? 'bg-black' : 'bg-gray-50'
          )}
        >
          <div
            className={cn(
              'text-center p-10 rounded-xl max-w-md',
              isDark
                ? 'bg-white/[0.04] border border-white/[0.15]'
                : 'bg-white border border-gray-200'
            )}
          >
            <div
              className={cn(
                'w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6',
                isDark ? 'bg-[#137DFE]/10' : 'bg-blue-50'
              )}
            >
              <Wallet size={36} className="text-[#137DFE]" />
            </div>
            <h2
              className={cn('text-xl font-medium mb-3', isDark ? 'text-white/90' : 'text-gray-900')}
            >
              Connect Wallet
            </h2>
            <p
              className={cn(
                'text-[13px] mb-8 leading-relaxed',
                isDark ? 'text-white/50' : 'text-gray-500'
              )}
            >
              Manage your tokens, NFTs, offers, and transaction history all in one place
            </p>
            <button
              onClick={() => setOpenWalletModal(true)}
              className="w-full py-4 rounded-lg text-[13px] font-medium bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors"
            >
              Connect Wallet
            </button>
            <p className={cn('text-[11px] mt-4', isDark ? 'text-white/25' : 'text-gray-400')}>
              Secure • Non-custodial • Encrypted locally
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'min-h-screen',
            isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
          )}
        >
          <div className="max-w-[1920px] mx-auto w-full px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1
                className={cn(
                  'text-[13px] font-medium',
                  isDark ? 'text-white/90' : 'text-gray-900'
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
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors duration-150',
                    copied
                      ? 'bg-emerald-500/10 text-[#08AA09]'
                      : isDark
                        ? 'bg-white/[0.04] text-white/50 hover:bg-[#137DFE]/5 hover:text-[#137DFE]'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
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
            <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium tracking-wider rounded-md border transition-all whitespace-nowrap',
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
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Send/Receive Modal */}
            {showPanel && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowPanel(null)}
                />

                {/* Modal */}
                <div
                  className={cn(
                    'relative w-full max-w-md rounded-2xl overflow-hidden',
                    isDark
                      ? 'bg-[#09090b] border-[1.5px] border-white/15'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  {/* Header with Tabs */}
                  <div
                    className={cn(
                      'flex items-center justify-between p-4 border-b',
                      isDark ? 'border-white/[0.08]' : 'border-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'flex p-1 rounded-lg',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                      )}
                    >
                      <button
                        onClick={() => setShowPanel('send')}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                          showPanel === 'send'
                            ? 'bg-[#137DFE] text-white'
                            : isDark
                              ? 'text-white/50 hover:text-white/80'
                              : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <ArrowUpRight size={15} /> Send
                      </button>
                      <button
                        onClick={() => setShowPanel('receive')}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                          showPanel === 'receive'
                            ? 'bg-emerald-500 text-white'
                            : isDark
                              ? 'text-white/50 hover:text-white/80'
                              : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <ArrowDownLeft size={15} /> Receive
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPanel(null)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isDark
                          ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  {showPanel === 'send' ? (
                    <div className="p-5">
                      {/* Amount Section */}
                      {/* Token Selector - Embedded */}
                      <div
                        className={cn(
                          'rounded-xl mb-4 overflow-hidden',
                          isDark
                            ? 'bg-white/[0.02] border border-white/[0.08]'
                            : 'bg-gray-50 border border-gray-100'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 transition-colors',
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-100/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const t = allTokens.find((t) => t.symbol === selectedToken);
                              return t?.md5 ? (
                                <img
                                  src={`https://s1.xrpl.to/token/${t.md5}`}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ background: t?.color || '#333' }}
                                >
                                  {t?.icon || selectedToken[0]}
                                </div>
                              );
                            })()}
                            <div className="text-left">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {selectedToken}
                              </p>
                              <p
                                className={cn(
                                  'text-[11px]',
                                  isDark ? 'text-white/40' : 'text-gray-500'
                                )}
                              >
                                Tap to change token
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={cn(
                                  'text-[10px] uppercase',
                                  isDark ? 'text-white/40' : 'text-gray-500'
                                )}
                              >
                                Balance
                              </p>
                              <p
                                className={cn(
                                  'text-sm font-medium tabular-nums',
                                  isDark ? 'text-white/80' : 'text-gray-700'
                                )}
                              >
                                {allTokens.find((t) => t.symbol === selectedToken)?.amount || '0'}
                              </p>
                            </div>
                            <ChevronDown
                              size={18}
                              className={cn(
                                'transition-transform duration-200',
                                tokenDropdownOpen && 'rotate-180',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            />
                          </div>
                        </button>
                        {tokenDropdownOpen && (
                          <div
                            className={cn(
                              'border-t max-h-[160px] overflow-y-auto',
                              isDark ? 'border-white/[0.08]' : 'border-gray-100'
                            )}
                          >
                            {allTokens.map((t) => (
                              <button
                                key={t.symbol}
                                type="button"
                                onClick={() => {
                                  setSelectedToken(t.symbol);
                                  setTokenDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors',
                                  selectedToken === t.symbol
                                    ? isDark
                                      ? 'bg-[#137DFE]/10'
                                      : 'bg-blue-50'
                                    : '',
                                  isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-100/50'
                                )}
                              >
                                {t.md5 ? (
                                  <img
                                    src={`https://s1.xrpl.to/token/${t.md5}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                    style={{ background: t.color }}
                                  >
                                    {t.icon || t.symbol[0]}
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    'text-sm font-medium flex-1',
                                    isDark ? 'text-white/90' : 'text-gray-900'
                                  )}
                                >
                                  {t.symbol}
                                </span>
                                <span
                                  className={cn(
                                    'text-xs tabular-nums',
                                    isDark ? 'text-white/40' : 'text-gray-500'
                                  )}
                                >
                                  {t.amount}
                                </span>
                                {selectedToken === t.symbol && (
                                  <Check size={16} className="text-[#137DFE]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Amount Input */}
                      <div
                        className={cn(
                          'rounded-xl p-4 mb-4',
                          isDark ? 'bg-white/[0.02]' : 'bg-gray-50'
                        )}
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          className={cn(
                            'w-full text-4xl font-semibold bg-transparent outline-none tabular-nums text-center py-3',
                            isDark
                              ? 'text-white placeholder:text-white/15'
                              : 'text-gray-900 placeholder:text-gray-300'
                          )}
                        />
                        {(() => {
                          const amt = parseFloat(sendAmount) || 0;
                          const token = allTokens.find((t) => t.symbol === selectedToken);
                          const pricePerToken =
                            token?.rawAmount > 0 ? token.rawValue / token.rawAmount : 0;
                          const valueInXrp = amt * pricePerToken;
                          const displayValue =
                            activeFiatCurrency === 'XRP' ? valueInXrp : valueInXrp / exchRate;
                          const symbol = currencySymbols[activeFiatCurrency] || '$';
                          return (
                            <p
                              className={cn(
                                'text-xs text-center mb-3',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              ≈ {symbol}
                              {displayValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}{' '}
                              {activeFiatCurrency}
                            </p>
                          );
                        })()}

                        {/* Quick Amount Buttons */}
                        <div className="flex items-center justify-center gap-1.5">
                          {[25, 50, 75, 100].map((pct) => {
                            const maxAmt =
                              allTokens.find((t) => t.symbol === selectedToken)?.rawAmount || 0;
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setSendAmount(((maxAmt * pct) / 100).toFixed(2))}
                                className={cn(
                                  'px-3 py-1 rounded-md text-[11px] font-medium transition-colors',
                                  isDark
                                    ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                                )}
                              >
                                {pct === 100 ? 'MAX' : `${pct}%`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="mb-3">
                        <label
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider mb-1.5 block',
                            isDark ? 'text-white/40' : 'text-gray-500'
                          )}
                        >
                          Recipient
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            onFocus={() => setShowAddressSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                            placeholder="rAddress..."
                            className={cn(
                              'w-full pl-3 pr-9 py-2.5 rounded-xl text-sm font-mono outline-none transition-all duration-150',
                              isDark
                                ? 'bg-white/[0.03] text-white border placeholder:text-white/25'
                                : 'bg-gray-50 border placeholder:text-gray-400',
                              sendTo && sendTo.startsWith('r') && sendTo.length >= 25
                                ? isDark
                                  ? 'border-emerald-500/50'
                                  : 'border-emerald-400'
                                : sendTo
                                  ? isDark
                                    ? 'border-amber-500/50'
                                    : 'border-amber-400'
                                  : isDark
                                    ? 'border-white/[0.15] focus:border-[#137DFE]/50'
                                    : 'border-gray-200 focus:border-[#137DFE]'
                            )}
                          />
                          {sendTo && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {sendTo.startsWith('r') && sendTo.length >= 25 ? (
                                <Check size={14} className="text-[#08AA09]" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F6AF01]" />
                              )}
                            </div>
                          )}
                          {/* Address Suggestions Dropdown */}
                          {showAddressSuggestions && withdrawals.length > 0 && (
                            <div className={cn(
                              "absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-10 max-h-[160px] overflow-y-auto",
                              isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-lg"
                            )}>
                              {withdrawals.filter(w => !sendTo || w.address.toLowerCase().includes(sendTo.toLowerCase()) || w.name.toLowerCase().includes(sendTo.toLowerCase())).slice(0, 5).map((w) => (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => {
                                    setSendTo(w.address);
                                    if (w.tag) setSendTag(w.tag);
                                    setShowAddressSuggestions(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 text-left transition-colors flex items-center justify-between",
                                    isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                                  )}
                                >
                                  <div>
                                    <p className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>{w.name}</p>
                                    <p className={cn("text-[10px] font-mono", isDark ? "text-white/40" : "text-gray-400")}>{w.address.slice(0, 8)}...{w.address.slice(-6)}</p>
                                  </div>
                                  {w.tag && <span className={cn("text-[9px] px-1.5 py-0.5 rounded", isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>Tag: {w.tag}</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Destination Tag */}
                      <div className="mb-4">
                        <label
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider mb-1.5 block',
                            isDark ? 'text-white/40' : 'text-gray-500'
                          )}
                        >
                          Destination Tag{' '}
                          <span className={isDark ? 'text-white/20' : 'text-gray-400'}>
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={sendTag}
                          onChange={(e) => setSendTag(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 12345678"
                          className={cn(
                            'w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors duration-150',
                            isDark
                              ? 'bg-white/[0.03] text-white border border-white/[0.15] placeholder:text-white/25 focus:border-[#137DFE]/50'
                              : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                          )}
                        />
                      </div>

                      {/* Fee Display */}
                      <div
                        className={cn(
                          'flex items-center justify-between py-2.5 px-3 rounded-lg mb-4 text-xs',
                          isDark ? 'bg-white/[0.02] text-white/50' : 'bg-gray-50 text-gray-500'
                        )}
                      >
                        <span>Network Fee</span>
                        <span className="font-medium">~0.00001 XRP</span>
                      </div>

                      {/* Send Button */}
                      <button
                        disabled={
                          !sendTo || !sendAmount || !(sendTo.startsWith('r') && sendTo.length >= 25)
                        }
                        className={cn(
                          'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                          sendTo && sendAmount && sendTo.startsWith('r') && sendTo.length >= 25
                            ? 'bg-[#137DFE] text-white hover:bg-[#137DFE]/90 active:scale-[0.98]'
                            : isDark
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                          <QRCode value={address} size={160} />
                        </div>

                        {/* Address Display */}
                        <div
                          className={cn(
                            'w-full rounded-xl p-3 mb-4',
                            isDark ? 'bg-white/[0.03]' : 'bg-gray-50'
                          )}
                        >
                          <p
                            className={cn(
                              'font-mono text-[11px] text-center break-all leading-relaxed',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            {address}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleCopy(address)}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200',
                              copied
                                ? 'bg-emerald-500/10 text-[#08AA09] border border-emerald-500/20'
                                : 'bg-[#08AA09] text-white hover:bg-[#08AA09]/90'
                            )}
                          >
                            {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
                            {copied ? 'Copied!' : 'Copy Address'}
                          </button>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({ title: 'My XRP Address', text: address });
                              } else {
                                handleCopy(address);
                              }
                            }}
                            className={cn(
                              'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                              isDark
                                ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debug Info */}
                  {debugInfo && (
                    <div className={cn('px-4 py-3 border-t text-[10px] font-mono', isDark ? 'border-white/[0.08] text-white/40' : 'border-gray-100 text-gray-400')}>
                      <div>wallet_type: <span className="text-[#137DFE]">{debugInfo.wallet_type || 'undefined'}</span></div>
                      <div>account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span></div>
                      <div>walletKeyId: <span className={debugInfo.walletKeyId ? 'text-[#08AA09]' : 'text-red-400'}>{debugInfo.walletKeyId || 'undefined'}</span></div>
                      <div>seed: <span className="text-[#08AA09] break-all">{debugInfo.seed}</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Portfolio Header */}
                {(() => {
                  const totalPortfolio = totalValue + nftPortfolioValue;
                  const xrpValue = xrpToken ? parseFloat(xrpToken.amount) : 0;
                  const tokensOnlyValue = totalValue - xrpValue;
                  const xrpPercent = totalPortfolio > 0 ? (xrpValue / totalPortfolio) * 100 : 0;
                  const tokensPercent = totalPortfolio > 0 ? (tokensOnlyValue / totalPortfolio) * 100 : 0;
                  const nftsPercent = totalPortfolio > 0 ? (nftPortfolioValue / totalPortfolio) * 100 : 0;
                  const nftCount = collections.reduce((sum, c) => sum + c.count, 0);

                  return (
                    <div className={cn('rounded-xl border-[1.5px] p-4', isDark ? 'border-white/10' : 'border-gray-200')}>
                      {/* Portfolio Row */}
                      <div className="flex items-center">
                        {/* Portfolio */}
                        <div className="flex items-center gap-2 pr-6">
                          <span className={cn('text-[11px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>Portfolio</span>
                          <span className={cn('text-xl font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                            {tokensLoading ? '...' : <>{activeFiatCurrency !== 'XRP' && currencySymbols[activeFiatCurrency]}{(activeFiatCurrency === 'XRP' ? totalPortfolio : totalPortfolio * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                            <span className={cn('text-xs font-medium ml-1', isDark ? 'text-white/30' : 'text-gray-400')}>{activeFiatCurrency}</span>
                          </span>
                        </div>

                        <div className={cn('w-px h-6', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                        {/* XRP */}
                        <div className="flex items-center gap-2 px-6">
                          <span className={cn('text-[11px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>XRP</span>
                          <span className={cn('text-base font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                            {xrpToken ? parseFloat(xrpToken.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </span>
                        </div>

                        <div className={cn('w-px h-6', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                        {/* Tokens */}
                        <div className="flex items-center gap-2 px-6">
                          <span className={cn('text-[11px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>
                            Tokens <span className={isDark ? 'text-white/25' : 'text-gray-400'}>{allTokens.length}</span>
                          </span>
                          <span className={cn('text-base font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                            {activeFiatCurrency !== 'XRP' && currencySymbols[activeFiatCurrency]}{(activeFiatCurrency === 'XRP' ? tokensOnlyValue : tokensOnlyValue * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className={cn('text-[10px] font-medium ml-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>{activeFiatCurrency}</span>
                          </span>
                        </div>

                        <div className={cn('w-px h-6', isDark ? 'bg-white/10' : 'bg-gray-200')} />

                        {/* NFTs */}
                        <div className="flex items-center gap-2 px-6">
                          <span className={cn('text-[11px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-500')}>
                            NFTs <span className={isDark ? 'text-white/25' : 'text-gray-400'}>{nftCount}</span>
                          </span>
                          <span className={cn('text-base font-semibold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                            {activeFiatCurrency !== 'XRP' && currencySymbols[activeFiatCurrency]}{(activeFiatCurrency === 'XRP' ? nftPortfolioValue : nftPortfolioValue * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className={cn('text-[10px] font-medium ml-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>{activeFiatCurrency}</span>
                          </span>
                        </div>

                        {/* Actions - pushed right */}
                        <div className="flex items-center gap-2 ml-auto">
                          {isInactive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-[#F6AF01] font-semibold">Inactive</span>}
                          <button onClick={() => setShowPanel('send')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors">
                            <ArrowUpRight size={14} /> Send
                          </button>
                          <button onClick={() => setShowPanel('receive')} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors', isDark ? 'bg-white/[0.05] text-white/80 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                            <ArrowDownLeft size={14} /> Receive
                          </button>
                        </div>
                      </div>
                      {/* Account Stats */}
                      {accountInfo && (
                        <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3 mt-3 text-[11px] border-t', isDark ? 'text-white/40 border-white/10' : 'text-gray-500 border-gray-100')}>
                          {accountInfo.inception && (
                            <span>Created <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{new Date(accountInfo.inception).toLocaleDateString()}</span></span>
                          )}
                          {accountInfo.reserve > 0 && (
                            <span>Reserve <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{accountInfo.reserve} XRP</span></span>
                          )}
                          {accountInfo.ownerCount > 0 && (
                            <span>Objects <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{accountInfo.ownerCount}</span></span>
                          )}
                          {accountInfo.rank && (
                            <span>XRP Rank <span className={isDark ? 'text-white/70' : 'text-gray-700'}>#{accountInfo.rank.toLocaleString()}</span></span>
                          )}
                          {accountInfo.tradingRank && (
                            <span>Trading Rank <span className={isDark ? 'text-white/70' : 'text-gray-700'}>#{accountInfo.tradingRank.toLocaleString()}</span></span>
                          )}
                          {(accountInfo.pnl !== undefined || accountInfo.dex_profit !== undefined) && (
                            <span>P&L <span className={((accountInfo.pnl || accountInfo.dex_profit || 0) >= 0) ? 'text-[#08AA09]' : 'text-red-500'}>
                              {((accountInfo.pnl || accountInfo.dex_profit || 0) >= 0 ? '+' : '')}{(accountInfo.pnl || accountInfo.dex_profit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP
                            </span></span>
                          )}
                          {accountInfo.roi !== undefined && (
                            <span>ROI <span className={(accountInfo.roi >= 0) ? 'text-[#08AA09]' : 'text-red-500'}>
                              {accountInfo.roi >= 0 ? '+' : ''}{accountInfo.roi.toFixed(1)}%
                            </span></span>
                          )}
                          {(accountInfo.totalTrades > 0 || nftStats?.totalTrades > 0) && (
                            <button
                              onClick={() => setShowPLCard(true)}
                              className={cn(
                                'ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                                isDark ? 'bg-[#137DFE]/20 text-[#137DFE] hover:bg-[#137DFE]/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              )}
                            >
                              <Share2 size={10} />
                              Share P/L
                            </button>
                          )}
                        </div>
                      )}
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
                        'rounded-xl h-full flex flex-col transition-all duration-300',
                        isDark
                          ? 'bg-black/40 backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18]'
                          : 'bg-white border border-gray-200 shadow-sm'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isDark ? "bg-[#137DFE]" : "bg-blue-500")} />
                          <p
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            Top Assets
                          </p>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded font-bold',
                              isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            {allTokens.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('tokens')}
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wide transition-all hover:scale-105 active:scale-95',
                            isDark
                              ? 'text-[#137DFE] hover:text-blue-400'
                              : 'text-[#137DFE] hover:text-blue-600'
                          )}
                        >
                          View All
                        </button>
                      </div>
                      {tokensLoading ? (
                        <div className={cn('flex-1 flex items-center justify-center py-12', isDark ? 'text-white/40' : 'text-gray-400')}>
                          <div className="animate-pulse flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#137DFE]" />
                            <span className="text-[10px] uppercase tracking-widest font-medium">Loading Assets</span>
                          </div>
                        </div>
                      ) : allTokens.length === 0 ? (
                        <div className={cn('p-8 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <div className={cn("w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center", isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-100")}>
                            <Coins size={20} className={cn(isDark ? "text-white/20" : "text-gray-300")} />
                          </div>
                          <p className={cn('text-[11px] font-semibold tracking-wide mb-1', isDark ? 'text-white/50' : 'text-gray-500')}>No Tokens Yet</p>
                          <p className={cn('text-[10px] mb-4 opacity-70', isDark ? 'text-white/40' : 'text-gray-400')}>Start building your portfolio</p>
                          <a href="/" className={cn("inline-flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95", isDark ? "text-white bg-[#137DFE] hover:bg-blue-600" : "text-white bg-[#137DFE] hover:bg-blue-600")}>
                            Browse Market
                          </a>
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className={cn("grid grid-cols-[1.5fr_1fr_1fr_0.6fr_40px] gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-wider", isDark ? "text-white/30 border-b border-white/[0.05]" : "text-gray-400 border-b border-gray-50")}>
                            <span>Asset</span>
                            <span className="text-right">Balance</span>
                            <span className="text-right">Value</span>
                            <span className="text-right">24h</span>
                            <span></span>
                          </div>
                          {/* Table Body */}
                          <div className={cn("divide-y", isDark ? "divide-white/[0.04]" : "divide-gray-50")}>
                            {allTokens.slice(0, 5).map((token) => (
                              <div key={token.symbol} className={cn("grid grid-cols-[1.5fr_1fr_1fr_0.6fr_40px] gap-2 items-center px-4 py-2.5 transition-all duration-200", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50/50")}>
                                {/* Token */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative shrink-0">
                                    <img
                                      src={`https://s1.xrpl.to/token/${token.md5 || MD5(`${token.issuer}_${token.currency}`).toString()}`}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover bg-white/10 ring-1 ring-white/10 shadow-sm"
                                      onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                    />
                                  </div>
                                  <p className={cn("text-xs font-semibold truncate", isDark ? "text-white/95" : "text-gray-900")}>{token.symbol}</p>
                                </div>
                                {/* Balance */}
                                <p className={cn("text-[11px] tabular-nums text-right truncate", isDark ? "text-white/60" : "text-gray-600")}>{token.amount}</p>
                                {/* Value */}
                                <p className={cn("text-[11px] font-bold tabular-nums text-right", isDark ? "text-white/90" : "text-gray-900")}>
                                  {activeFiatCurrency === 'XRP' ? token.value : <>{currencySymbols[activeFiatCurrency]}{((token.rawValue || 0) * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                                </p>
                                {/* 24h Change */}
                                <p className={cn("text-[10px] tabular-nums text-right font-bold", token.positive ? "text-[#08AA09]" : "text-red-400")}>
                                  {token.change}
                                </p>
                                {/* Send */}
                                <button
                                  onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }}
                                  className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:scale-110 active:scale-90 justify-self-end",
                                    isDark ? "bg-white/[0.05] text-[#137DFE] hover:bg-white/[0.1] hover:text-blue-400" : "bg-blue-50 text-[#137DFE] hover:bg-blue-100"
                                  )}
                                  title="Send Asset"
                                >
                                  <Send size={12} />
                                </button>
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
                        'rounded-xl h-full flex flex-col transition-all duration-300',
                        isDark
                          ? 'bg-black/40 backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18]'
                          : 'bg-white border border-gray-200 shadow-sm'
                      )}
                    >
                      <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isDark ? "bg-[#137DFE]" : "bg-blue-500")} />
                          <p
                            className={cn(
                              'text-[11px] font-bold uppercase tracking-wider',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            NFT Collections
                          </p>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded font-bold',
                              isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            {collections.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTabChange('nfts')}
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wide transition-all hover:scale-105 active:scale-95',
                            isDark
                              ? 'text-[#137DFE] hover:text-blue-400'
                              : 'text-[#137DFE] hover:text-blue-600'
                          )}
                        >
                          View All
                        </button>
                      </div>
                      {collectionsLoading ? (
                        <div className={cn('flex-1 flex items-center justify-center py-12', isDark ? 'text-white/40' : 'text-gray-400')}>
                          <div className="animate-pulse flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#137DFE]" />
                            <span className="text-[10px] uppercase tracking-widest font-medium">Loading Collections</span>
                          </div>
                        </div>
                      ) : collections.length === 0 ? (
                        <div className={cn('flex-1 flex flex-col items-center justify-center py-10')}>
                          <div className={cn("w-12 h-12 mb-3 rounded-2xl flex items-center justify-center", isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-100")}>
                            <Image size={20} className={cn(isDark ? "text-white/20" : "text-gray-300")} />
                          </div>
                          <p className={cn('text-[11px] font-semibold tracking-wide mb-1', isDark ? 'text-white/50' : 'text-gray-500')}>NO NFTS FOUND</p>
                          <p className={cn('text-[10px] mb-4 opacity-70', isDark ? 'text-white/40' : 'text-gray-400')}>Start your NFT collection</p>
                          <a href="/nfts" className={cn("inline-flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95", isDark ? "text-white bg-[#137DFE] hover:bg-blue-600" : "text-white bg-[#137DFE] hover:bg-blue-600")}>
                            Explore NFTs
                          </a>
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className={cn("grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-wider", isDark ? "text-white/30 border-b border-white/[0.05]" : "text-gray-400 border-b border-gray-50")}>
                            <span>Collection</span>
                            <span className="text-right">Items</span>
                            <span className="text-right">Floor</span>
                            <span className="text-right">Value</span>
                          </div>
                          {/* Table Body */}
                          <div className={cn("divide-y", isDark ? "divide-white/[0.04]" : "divide-gray-50")}>
                            {collections.slice(0, 5).map((col) => (
                              <button
                                key={col.id}
                                onClick={() => { setSelectedCollection(col.name); handleTabChange('nfts'); }}
                                className={cn("w-full grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center px-4 py-3 text-left transition-all duration-200", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50/50")}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {col.logo ? (
                                    <img src={col.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-white/10 shadow-sm" />
                                  ) : (
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[9px] shrink-0", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>NFT</div>
                                  )}
                                  <p className={cn("text-xs font-semibold truncate", isDark ? "text-white/95" : "text-gray-900")}>{col.name}</p>
                                </div>
                                <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/60" : "text-gray-600")}>{col.count}</p>
                                <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/50" : "text-gray-500")}>
                                  {col.floor} <span className={cn("text-[9px]", isDark ? "text-white/20" : "text-gray-400")}>XRP</span>
                                </p>
                                <p className={cn("text-[11px] font-bold tabular-nums text-right", isDark ? "text-white/90" : "text-gray-900")}>
                                  {col.value.toLocaleString()} <span className={cn("text-[9px] font-normal", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
                                </p>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity - Full Width */}
                <div
                  className={cn(
                    'w-full rounded-xl mt-4 overflow-hidden',
                    isDark
                      ? 'bg-black/50 backdrop-blur-sm border border-white/[0.12]'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  {/* Header */}
                  <div className={cn("flex items-center justify-between px-4 py-3", isDark ? "border-b border-white/[0.08]" : "border-b border-gray-100")}>
                    <div className="flex items-center gap-1">
                      {['onchain', 'tokens', 'nfts'].map((view) => (
                        <button
                          key={view}
                          onClick={() => setRecentView(view)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wide transition-colors',
                            recentView === view
                              ? (isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900')
                              : (isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600')
                          )}
                        >
                          {view === 'onchain' ? 'On-chain' : view === 'nfts' ? 'NFTs' : 'Tokens'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {recentView === 'onchain' && (
                        <div className="flex items-center gap-1">
                          {['all', 'Payment', 'OfferCreate', 'TrustSet'].map(t => (
                            <button
                              key={t}
                              onClick={() => setTxTypeFilter(t)}
                              className={cn(
                                'px-2 py-1 rounded-md text-[9px] font-medium transition-colors',
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
                              'px-1.5 py-1 rounded-md text-[9px] font-medium outline-none cursor-pointer transition-colors',
                              !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter)
                                ? (isDark ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900')
                                : (isDark ? 'bg-transparent text-white/40 hover:text-white/70' : 'bg-transparent text-gray-400 hover:text-gray-600'),
                              isDark ? '[&>option]:bg-[#1a1a1a] [&>option]:text-white' : ''
                            )}
                          >
                            <option value="" disabled>More</option>
                            {txTypes.filter(t => !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(t)).map(t => (
                              <option key={t} value={t}>{t.replace('NFToken', 'NFT ').replace('AMM', 'AMM ')}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={() => handleTabChange('trades')}
                        className={cn(
                          'text-[10px] font-medium uppercase tracking-wide transition-colors',
                          isDark ? 'text-[#137DFE] hover:text-blue-300' : 'text-[#137DFE] hover:text-blue-600'
                        )}
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {/* On-chain Content */}
                  {recentView === 'onchain' && (
                    txLoading ? (
                      <div className="p-6">
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("h-12 rounded-lg animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                          ))}
                        </div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className={cn('py-10 text-center')}>
                        <Clock size={24} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                        <p className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "w-full grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider",
                          isDark ? "text-white/30 border-b border-white/[0.06]" : "text-gray-400 border-b border-gray-100"
                        )}>
                          <span></span>
                          <span>Type</span>
                          <span>Details</span>
                          <span>Time</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Signature</span>
                        </div>
                        <div className={cn("divide-y", isDark ? "divide-white/[0.08]" : "divide-gray-50")}>
                          {transactions.filter(tx => txTypeFilter === 'all' || tx.txType === txTypeFilter).slice(0, 20).map((tx) => (
                            <div
                              key={tx.id}
                              className={cn(
                                "w-full grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-center px-4 py-2 transition-colors cursor-pointer group",
                                isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"
                              )}
                              onClick={() => window.open(`/tx/${tx.hash}`, '_blank')}
                            >
                              {/* Icon */}
                              <div className="relative">
                                {tx.tokenCurrency ? (
                                  <img
                                    src={`https://s1.xrpl.to/token/${tx.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${tx.tokenIssuer}_${tx.tokenCurrency}`).toString()}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover bg-white/10"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                  />
                                ) : (
                                  <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center",
                                    tx.type === 'failed' ? 'bg-amber-500/10' : tx.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                  )}>
                                    {tx.type === 'failed' ? <AlertTriangle size={14} className="text-[#F6AF01]" /> : tx.type === 'in' ? <ArrowDownLeft size={14} className="text-[#08AA09]" /> : <ArrowUpRight size={14} className="text-red-400" />}
                                  </div>
                                )}
                                <div className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px]",
                                  isDark ? "border-[#070b12]" : "border-white",
                                  tx.type === 'failed' ? 'bg-amber-500' : tx.type === 'in' ? 'bg-emerald-500' : 'bg-red-500'
                                )}>
                                  {tx.type === 'failed' ? <AlertTriangle size={7} className="text-white" /> : tx.type === 'in' ? <ArrowDownLeft size={7} className="text-white" /> : <ArrowUpRight size={7} className="text-white" />}
                                </div>
                              </div>
                              {/* Type */}
                              <div className="min-w-0 flex items-center gap-2">
                                <p className={cn("text-[13px] font-medium truncate", isDark ? "text-white" : "text-gray-900")}>{tx.label}</p>
                                {tx.type === 'failed' && <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0", isDark ? "bg-amber-500/15 text-[#F6AF01]" : "bg-amber-100 text-amber-600")}>Failed</span>}
                                {tx.isDust && <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0", isDark ? "bg-amber-500/10 text-[#F6AF01]" : "bg-amber-100 text-amber-600")}>Dust</span>}
                                {tx.sourceTag && <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0", isDark ? "bg-[#137DFE]/15 text-[#137DFE]" : "bg-blue-100 text-blue-600")}>{tx.sourceTagName || `Tag: ${tx.sourceTag}`}</span>}
                              </div>
                              {/* Details */}
                              <p className={cn("text-[11px] font-mono truncate", isDark ? "text-white/50" : "text-gray-500")}>
                                {tx.counterparty ? (tx.counterparty.startsWith('r') ? <Link href={`/address/${tx.counterparty}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#137DFE] hover:underline">{tx.counterparty.slice(0, 10)}...{tx.counterparty.slice(-6)}</Link> : tx.counterparty) : tx.fromAmount ? 'DEX Swap' : '—'}
                              </p>
                              {/* Time */}
                              <p className={cn("text-[10px] tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>
                                {tx.time ? formatDistanceToNow(new Date(tx.time), { addSuffix: false }) : '—'}
                              </p>
                              {/* Amount */}
                              <div className="flex items-center justify-end gap-1.5">
                                {tx.fromAmount && tx.toAmount ? (
                                  <>
                                    <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md text-red-400 bg-red-500/10">-{tx.fromAmount}</span>
                                    <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md text-[#08AA09] bg-emerald-500/10">+{tx.toAmount}</span>
                                  </>
                                ) : tx.amount ? (
                                  tx.amount.includes('→') ? (
                                    <>
                                      {tx.amount.split('→').map((part, i) => (
                                        <span key={i} className={cn(
                                          "text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md",
                                          tx.type === 'failed' ? 'text-[#F6AF01] bg-amber-500/10' :
                                            i === 0 ? "text-red-400 bg-red-500/10" : "text-[#08AA09] bg-emerald-500/10"
                                        )}>
                                          {tx.type !== 'failed' && (i === 0 ? '-' : '+')}{part.trim()}
                                        </span>
                                      ))}
                                    </>
                                  ) : (
                                    <span className={cn(
                                      "text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md",
                                      tx.type === 'failed' ? 'text-[#F6AF01] bg-amber-500/10' :
                                        tx.type === 'in' ? 'text-[#08AA09] bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                                    )}>
                                      {tx.type !== 'failed' && (tx.type === 'in' ? '+' : '-')}{tx.amount}
                                    </span>
                                  )
                                ) : (
                                  <span className={cn("text-[10px] px-2 py-1 rounded-md", isDark ? "text-white/20 bg-white/[0.04]" : "text-gray-400 bg-gray-100")}>—</span>
                                )}
                              </div>
                              {/* Signature */}
                              <div className="flex items-center gap-1 justify-end">
                                <span className={cn("text-[10px] font-mono", isDark ? "text-white/40" : "text-gray-500")}>
                                  {tx.hash ? `${tx.hash.slice(0, 12)}...` : '—'}
                                </span>
                                {tx.hash && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tx.hash);
                                      setCopiedHash(tx.hash);
                                      setTimeout(() => setCopiedHash(null), 2000);
                                    }}
                                    className={cn("p-1 rounded transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                                  >
                                    {copiedHash === tx.hash ? <Check size={12} className="text-[#08AA09]" /> : <Copy size={12} className={isDark ? "text-white/40" : "text-gray-400"} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  )}

                  {/* Tokens Content */}
                  {recentView === 'tokens' && (
                    tokenHistoryLoading ? (
                      <div className="p-6">
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("h-12 rounded-lg animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                          ))}
                        </div>
                      </div>
                    ) : tokenHistory.length === 0 ? (
                      <div className={cn('py-10 text-center')}>
                        <Coins size={24} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                        <p className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>No token trades</p>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "grid grid-cols-[44px_1.5fr_2fr_1.5fr_1fr_32px] gap-2 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider",
                          isDark ? "text-white/30 border-b border-white/[0.06]" : "text-gray-400 border-b border-gray-100"
                        )}>
                          <span></span>
                          <span>Type</span>
                          <span>Pair</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Time</span>
                          <span></span>
                        </div>
                        <div className={cn("divide-y", isDark ? "divide-white/[0.08]" : "divide-gray-50")}>
                          {tokenHistory.slice(0, 20).map((h) => {
                            const isBuy = h.got?.currency !== 'XRP';
                            const gotCurrency = decodeCurrency(h.got?.currency);
                            const paidCurrency = decodeCurrency(h.paid?.currency);
                            return (
                              <div
                                key={h._id}
                                className={cn("grid grid-cols-[44px_1.5fr_2fr_1.5fr_1fr_32px] gap-2 items-center px-4 py-3 transition-colors cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}
                                onClick={() => window.open(`/tx/${h.hash}`, '_blank')}
                              >
                                <div className="relative">
                                  <img
                                    src={`https://s1.xrpl.to/token/${isBuy ? (h.got?.currency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${h.got?.issuer}_${h.got?.currency}`).toString()) : (h.paid?.currency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${h.paid?.issuer}_${h.paid?.currency}`).toString())}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover bg-white/10"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                  />
                                  <div className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px]",
                                    isDark ? "border-[#070b12]" : "border-white",
                                    isBuy ? 'bg-emerald-500' : 'bg-red-500'
                                  )}>
                                    {isBuy ? <ArrowDownLeft size={7} className="text-white" /> : <ArrowUpRight size={7} className="text-white" />}
                                  </div>
                                </div>
                                <p className={cn("text-[12px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{isBuy ? 'Buy' : 'Sell'}</p>
                                <p className={cn("text-[11px] truncate", isDark ? "text-white/50" : "text-gray-500")}>{gotCurrency}/{paidCurrency}</p>
                                <p className={cn("text-[12px] font-medium tabular-nums text-right truncate", isBuy ? 'text-[#08AA09]' : 'text-red-400')}>
                                  {h.got?.value ? `${parseFloat(h.got.value).toFixed(2)} ${gotCurrency}` : '—'}
                                </p>
                                <p className={cn("text-[10px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>
                                  {h.time ? formatDistanceToNow(new Date(h.time), { addSuffix: false }) : '—'}
                                </p>
                                <ExternalLink size={12} className={cn("justify-self-end", isDark ? "text-white/20" : "text-gray-300")} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )
                  )}

                  {/* NFTs Content */}
                  {recentView === 'nfts' && (
                    nftTradesLoading ? (
                      <div className="p-6">
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("h-12 rounded-lg animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                          ))}
                        </div>
                      </div>
                    ) : nftTrades.length === 0 ? (
                      <div className={cn('py-10 text-center')}>
                        <Image size={24} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                        <p className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>No NFT trades</p>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "grid grid-cols-[44px_1.5fr_2fr_1.5fr_1fr_32px] gap-2 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider",
                          isDark ? "text-white/30 border-b border-white/[0.06]" : "text-gray-400 border-b border-gray-100"
                        )}>
                          <span></span>
                          <span>Type</span>
                          <span>NFT</span>
                          <span className="text-right">Price</span>
                          <span className="text-right">Time</span>
                          <span></span>
                        </div>
                        <div className={cn("divide-y", isDark ? "divide-white/[0.08]" : "divide-gray-50")}>
                          {nftTrades.slice(0, 5).map((t) => {
                            const isSeller = t.seller === address;
                            return (
                              <div
                                key={t._id}
                                className={cn("grid grid-cols-[44px_1.5fr_2fr_1.5fr_1fr_32px] gap-2 items-center px-4 py-3 transition-colors cursor-pointer", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}
                                onClick={() => window.open(`/tx/${t.hash}`, '_blank')}
                              >
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isSeller ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                                  {isSeller ? <ArrowUpRight size={16} className="text-[#08AA09]" /> : <ArrowDownLeft size={16} className="text-red-400" />}
                                </div>
                                <p className={cn("text-[12px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{isSeller ? 'Sold' : 'Bought'}</p>
                                <p className={cn("text-[11px] truncate", isDark ? "text-white/50" : "text-gray-500")}>{t.name || t.NFTokenID?.slice(0, 12) + '...'}</p>
                                <p className={cn("text-[12px] font-medium tabular-nums text-right truncate", isSeller ? 'text-[#08AA09]' : 'text-red-400')}>
                                  {t.price ? `${parseFloat(t.price).toFixed(2)} XRP` : '—'}
                                </p>
                                <p className={cn("text-[10px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>
                                  {t.time ? formatDistanceToNow(new Date(t.time), { addSuffix: false }) : '—'}
                                </p>
                                <ExternalLink size={12} className={cn("justify-self-end", isDark ? "text-white/20" : "text-gray-300")} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )
                  )}
                </div>
              </div>
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
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                          <Search
                            size={16}
                            className={cn(
                              'absolute left-3 top-1/2 -translate-y-1/2',
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
                            )}
                          />
                          <input
                            type="text"
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search tokens..."
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-[#137DFE]/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                            )}
                          />
                        </div>
                        {/* Sort */}
                        <div className="flex items-center gap-2">
                          <select
                            value={tokenSort}
                            onChange={(e) => setTokenSort(e.target.value)}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-[#1a1a1a] text-white border border-white/[0.15] [&>option]:bg-[#1a1a1a]'
                                : 'bg-gray-50 border border-gray-200'
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
                          className={cn('text-[11px]', isDark ? 'text-white/35' : 'text-gray-400')}
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
                              isDark
                                ? 'text-[#137DFE] hover:text-blue-300'
                                : 'text-[#137DFE] hover:text-blue-600'
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
                        'rounded-xl overflow-hidden',
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      {/* Table Header */}
                      <div className={cn("grid grid-cols-[2fr_1fr_1fr_1fr_80px_90px_80px_140px] gap-4 px-5 py-2.5 text-[9px] uppercase tracking-wider font-semibold border-b", isDark ? "text-white/40 border-white/[0.08] bg-white/[0.02]" : "text-gray-500 border-gray-100 bg-gray-50")}>
                        <div>Asset</div>
                        <div className="text-right">Balance</div>
                        <div className="text-right">Price</div>
                        <div className="text-right">Value</div>
                        <div className="text-right">24h</div>
                        <div className="text-right">Vol 24h</div>
                        <div className="text-right">Holders</div>
                        <div className="text-right"></div>
                      </div>

                      {/* Token Rows */}
                      {filteredTokens.length === 0 ? (
                        <div className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <BearIcon />
                          <p className={cn('text-[10px] font-medium tracking-wider mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                            NO TOKENS FOUND
                          </p>
                          <a href="/" className="text-[9px] text-[#137DFE] hover:underline">Browse tokens</a>
                        </div>
                      ) : (
                        <div className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-50")}>
                          {filteredTokens.slice((tokenPage - 1) * tokensPerPage, tokenPage * tokensPerPage).map((token) => (
                            <div key={token.symbol} onClick={() => token.slug && router.push(`/token/${token.slug}`)} className={cn("grid grid-cols-[2fr_1fr_1fr_1fr_80px_90px_80px_140px] gap-4 px-5 py-3 items-center transition-colors", token.slug && "cursor-pointer", isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50")}>
                              {/* Asset */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={`https://s1.xrpl.to/token/${token.md5 || MD5(`${token.issuer}_${token.currency}`).toString()}`}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover shrink-0 bg-white/10"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={cn("text-xs font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{token.symbol}</p>
                                    {token.verified && (
                                      <span
                                        className={cn(
                                          'px-1 py-0.5 rounded text-[8px] font-medium flex-shrink-0',
                                          isDark
                                            ? 'bg-emerald-500/10 text-[#08AA09]'
                                            : 'bg-emerald-50 text-emerald-600'
                                        )}
                                      >
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  <p className={cn("text-[10px] truncate", isDark ? "text-white/35" : "text-gray-500")}>{token.name}</p>
                                </div>
                              </div>
                              {/* Balance */}
                              <div className="text-right">
                                <p className={cn("text-[11px] tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{token.amount}</p>
                                {token.percentOwned > 0 && <p className={cn("text-[9px] tabular-nums", isDark ? "text-white/30" : "text-gray-400")}>{token.percentOwned.toFixed(2)}% supply</p>}
                              </div>
                              {/* Price */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/50" : "text-gray-500")}>{token.symbol === 'XRP' ? (activeFiatCurrency === 'XRP' ? '--' : <>{currencySymbols[activeFiatCurrency]}{xrpUsdPrice.toFixed(2)} <span className={isDark ? "text-white/25" : "text-gray-400"}>{activeFiatCurrency}</span></>) : (activeFiatCurrency === 'XRP' ? <>{typeof token.priceDisplay === 'object' && token.priceDisplay.compact ? <>0.0<sub className="text-[0.7em]">{token.priceDisplay.zeros}</sub>{token.priceDisplay.significant}</> : token.priceDisplay} <span className={isDark ? "text-white/25" : "text-gray-400"}>XRP</span></> : <>{currencySymbols[activeFiatCurrency]}{((token.price || 0) * xrpUsdPrice).toFixed((token.price || 0) * xrpUsdPrice >= 1 ? 2 : 6)} <span className={isDark ? "text-white/25" : "text-gray-400"}>{activeFiatCurrency}</span></>)}</p>
                              {/* Value */}
                              <p className={cn("text-xs font-semibold tabular-nums text-right tracking-tight", isDark ? "text-white" : "text-gray-900")}>{activeFiatCurrency === 'XRP' ? token.value : <>{currencySymbols[activeFiatCurrency]}{((token.rawValue || 0) * xrpUsdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>{activeFiatCurrency}</span></>}</p>
                              {/* 24h */}
                              <p className={cn("text-[11px] tabular-nums text-right font-medium", token.positive ? "text-[#08AA09]" : "text-red-400")}>{token.change}</p>
                              {/* Vol 24h */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>{token.vol24h > 0 ? (activeFiatCurrency === 'XRP' ? <>{token.vol24h >= 1000000 ? `${(token.vol24h / 1000000).toFixed(1)}M` : token.vol24h >= 1000 ? `${(token.vol24h / 1000).toFixed(1)}K` : token.vol24h.toFixed(0)} <span className={isDark ? "text-white/25" : "text-gray-400"}>XRP</span></> : <>{currencySymbols[activeFiatCurrency]}{(() => { const v = token.vol24h * xrpUsdPrice; return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0); })()} <span className={isDark ? "text-white/25" : "text-gray-400"}>{activeFiatCurrency}</span></>) : '—'}</p>
                              {/* Holders */}
                              <p className={cn("text-[11px] tabular-nums text-right", isDark ? "text-white/40" : "text-gray-500")}>{token.holders > 0 ? token.holders.toLocaleString() : '—'}</p>
                              {/* Actions */}
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {token.rawAmount >= 0.000001 && token.currency && token.issuer && (
                                  <button onClick={() => { setBurnModal(token); setBurnAmount(''); }} disabled={burning === token.currency + token.issuer} className={cn("p-1.5 rounded-md transition-colors", isDark ? "text-white/30 hover:text-orange-400 hover:bg-orange-400/10" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50")} title="Burn">
                                    <Flame size={12} />
                                  </button>
                                )}
                                {token.currency && token.issuer && <button onClick={() => { setTradeModal(token); setTradeAmount(''); setTradeDirection('sell'); }} className={cn("p-1.5 rounded-md transition-colors", isDark ? "text-white/30 hover:text-[#137DFE] hover:bg-[#137DFE]/10" : "text-gray-400 hover:text-[#137DFE] hover:bg-blue-50")} title="Trade"><ArrowRightLeft size={12} /></button>}
                                {token.rawAmount > 0 && token.rawAmount < 0.000001 && token.currency && token.issuer ? (
                                  <button
                                    onClick={() => setDustConfirm({ token, step: 'dex' })}
                                    disabled={sendingDust === token.currency + token.issuer}
                                    className={cn("flex items-center justify-center gap-1 w-[52px] py-1 rounded-md text-[10px] font-medium transition-all disabled:opacity-50", isDark ? "text-[#F6AF01] hover:bg-[#F6AF01]/10" : "text-amber-600 hover:bg-amber-50")}
                                    title="Clear dust"
                                  >
                                    <Sparkles size={11} /> {sendingDust === token.currency + token.issuer ? '...' : 'Clear'}
                                  </button>
                                ) : (
                                  <button onClick={() => { setSelectedToken(token.symbol); setShowPanel('send'); }} className={cn("flex items-center justify-center gap-1 w-[52px] py-1 rounded-md text-[10px] font-medium transition-all", isDark ? "text-[#137DFE] hover:bg-[#137DFE]/10" : "text-[#137DFE] hover:bg-blue-50")} title="Send"><Send size={11} /> Send</button>
                                )}
                                {token.rawAmount === 0 && token.currency && token.issuer && (
                                  <button
                                    onClick={() => handleRemoveTrustline(token)}
                                    disabled={removingTrustline === token.currency + token.issuer}
                                    className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all disabled:opacity-50", isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50")}
                                    title="Remove trustline"
                                  >
                                    <Trash2 size={11} /> {removingTrustline === token.currency + token.issuer ? '...' : 'Remove'}
                                  </button>
                                )}
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
                          isDark
                            ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                            : 'bg-white border border-gray-200'
                        )}
                      >
                        <span
                          className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}
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
                              isDark
                                ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                    : isDark
                                      ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                              isDark
                                ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

            {/* Offers Tab */}
            {activeTab === 'offers' && (
              <div className="space-y-4">
                {offersLoading ? (
                  <div
                    className={cn(
                      'p-8 text-center rounded-xl',
                      isDark
                        ? 'bg-white/[0.04] border border-white/[0.15] text-white/40'
                        : 'bg-white border border-gray-200 text-gray-400'
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
                        isDark
                          ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                        <RotateCcw
                          size={14}
                          className={isDark ? 'text-white/50' : 'text-gray-500'}
                        />
                        <p
                          className={cn(
                            'text-[11px] font-semibold uppercase tracking-[0.15em]',
                            isDark ? 'text-white/50' : 'text-gray-500'
                          )}
                        >
                          Dex Offers
                        </p>
                        <span
                          className={cn(
                            'ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                            isDark
                              ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {tokenOffers.length}
                        </span>
                      </div>
                      {tokenOffers.length === 0 ? (
                        <div className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <BearIcon />
                          <p className={cn('text-[10px] font-medium tracking-wider', isDark ? 'text-white/60' : 'text-gray-500')}>
                            NO OPEN DEX OFFERS
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-blue-500/5">
                          {tokenOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 transition-all duration-150',
                                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                  offer.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                )}
                              >
                                {offer.type === 'buy' ? (
                                  <ArrowDownLeft size={16} className="text-[#08AA09]" />
                                ) : (
                                  <ArrowUpRight size={16} className="text-red-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.from} → {offer.to}
                                  </p>
                                  {!offer.funded && (
                                    <span
                                      className={cn(
                                        'text-[9px] px-1 py-0.5 rounded font-medium',
                                        isDark
                                          ? 'bg-amber-500/10 text-[#F6AF01]'
                                          : 'bg-amber-100 text-amber-600'
                                      )}
                                    >
                                      Unfunded
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    isDark ? 'text-white/35' : 'text-gray-400'
                                  )}
                                >
                                  Rate: {offer.rate} • Seq: {offer.seq}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NFT Offers */}
                    <div
                      className={cn(
                        'rounded-xl',
                        isDark
                          ? 'bg-black/40 backdrop-blur-sm border border-gray-500/20'
                          : 'bg-white border border-gray-200'
                      )}
                    >
                      <div className="p-4 border-b border-gray-500/20 flex items-center gap-2">
                        <Image size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                        <p
                          className={cn(
                            'text-[11px] font-semibold uppercase tracking-[0.15em]',
                            isDark ? 'text-white/50' : 'text-gray-500'
                          )}
                        >
                          NFT Offers
                        </p>
                        <span
                          className={cn(
                            'ml-auto text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                            isDark
                              ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {nftOffers.length}
                        </span>
                      </div>
                      {nftOffers.length === 0 ? (
                        <div className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                          <BearIcon />
                          <p className={cn('text-[10px] font-medium tracking-wider', isDark ? 'text-white/60' : 'text-gray-500')}>
                            NO NFT OFFERS
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-500/20">
                          {nftOffers.map((offer) => (
                            <Link
                              key={offer.id}
                              href={`/nft/${offer.nftId}`}
                              className={cn(
                                'flex items-center gap-4 px-4 py-3 transition-all duration-150',
                                isDark
                                  ? 'bg-black/40 backdrop-blur-sm hover:bg-white/[0.03]'
                                  : 'bg-white hover:bg-gray-50'
                              )}
                            >
                              {offer.image ? (
                                <img
                                  src={offer.image}
                                  alt={offer.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                                    isDark ? 'bg-white/5' : 'bg-gray-100'
                                  )}
                                >
                                  <Image
                                    size={16}
                                    className={isDark ? 'text-white/30' : 'text-gray-400'}
                                  />
                                </div>
                              )}
                              <div className="w-[180px] min-w-0 shrink-0">
                                <p
                                  className={cn(
                                    'text-[13px] font-medium truncate',
                                    isDark ? 'text-white/90' : 'text-gray-900'
                                  )}
                                >
                                  {offer.name}
                                </p>
                                <p
                                  className={cn(
                                    'text-[10px] truncate',
                                    isDark ? 'text-white/40' : 'text-gray-400'
                                  )}
                                >
                                  {offer.collection}
                                </p>
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Price
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.price}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Floor
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      isDark ? 'text-white/90' : 'text-gray-900'
                                    )}
                                  >
                                    {offer.floor > 0 ? `${offer.floor.toFixed(2)} XRP` : '-'}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    vs Floor
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[13px] font-medium tabular-nums',
                                      offer.floorDiffPct >= 0 ? 'text-[#08AA09]' : 'text-red-400'
                                    )}
                                  >
                                    {offer.floor > 0
                                      ? `${offer.floorDiffPct >= 0 ? '+' : ''}${offer.floorDiffPct.toFixed(0)}%`
                                      : '-'}
                                  </p>
                                </div>
                                <div className="text-center px-3">
                                  <p
                                    className={cn(
                                      'text-[10px] uppercase tracking-wide mb-0.5',
                                      isDark ? 'text-white/30' : 'text-gray-400'
                                    )}
                                  >
                                    Type
                                  </p>
                                  <span
                                    className={cn(
                                      'text-[11px] px-2 py-0.5 rounded font-medium',
                                      offer.type === 'sell'
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-emerald-500/10 text-[#08AA09]'
                                    )}
                                  >
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

            {/* Activity Tab */}
            {activeTab === 'trades' && (
              <div
                className={cn(
                  'rounded-xl',
                  isDark
                    ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                    : 'bg-white border border-gray-200'
                )}
              >
                {/* View Toggle */}
                <div className={cn('flex items-center border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {['onchain', 'tokens', 'nfts'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setHistoryView(view)}
                      className={cn(
                        'px-4 py-3 text-[12px] font-medium tracking-wide transition-colors border-b-2 -mb-px',
                        historyView === view
                          ? cn('border-white', isDark ? 'text-white' : 'text-gray-900 border-gray-900')
                          : cn('border-transparent', isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-500 hover:text-gray-700')
                      )}
                    >
                      {view === 'tokens' ? 'TOKENS' : view === 'nfts' ? 'NFTS' : 'ONCHAIN'}
                    </button>
                  ))}
                </div>

                {/* Tokens View */}
                {historyView === 'tokens' && (
                  <>
                    {/* Type Filter */}
                    <div className={cn('flex items-center gap-2 px-4 py-2 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                      {['all', 'buy', 'sell'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setTokenHistoryType(type)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
                            tokenHistoryType === type
                              ? type === 'buy' ? 'bg-emerald-500/10 text-[#08AA09]'
                                : type === 'sell' ? 'bg-red-500/10 text-red-400'
                                  : isDark ? 'bg-[#137DFE]/10 text-[#137DFE]' : 'bg-blue-50 text-[#137DFE]'
                              : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'
                          )}
                        >
                          {type === 'all' ? 'All' : type === 'buy' ? 'Buys' : 'Sells'}
                        </button>
                      ))}
                    </div>
                    {tokenHistoryLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : tokenHistory.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No token trades</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/40 border-white/[0.08]' : 'text-gray-500 border-gray-100')}>
                          <div></div>
                          <div>Token</div>
                          <div className="text-right">Amount</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Time</div>
                          <div></div>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-gray-50')}>
                          {tokenHistory.map((trade, i) => {
                            const isBuy = trade.got?.currency !== 'XRP';
                            const tokenData = isBuy ? trade.got : trade.paid;
                            const xrpData = isBuy ? trade.paid : trade.got;
                            const tokenAmount = Math.abs(parseFloat(tokenData?.value || 0));
                            const xrpAmount = Math.abs(parseFloat(xrpData?.value || 0));
                            const price = tokenAmount > 0 ? xrpAmount / tokenAmount : 0;
                            const tokenName = decodeCurrency(tokenData?.currency) || 'Unknown';
                            return (
                              <div key={trade.hash || i} className={cn('grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2.5 items-center', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}>
                                <div className="relative">
                                  <img
                                    src={`https://s1.xrpl.to/token/${tokenData?.currency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${tokenData?.issuer}_${tokenData?.currency}`).toString()}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover bg-white/10"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                  />
                                  <div className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px]",
                                    isDark ? "border-[#070b12]" : "border-white",
                                    isBuy ? 'bg-emerald-500' : 'bg-red-500'
                                  )}>
                                    {isBuy ? <ArrowDownLeft size={7} className="text-white" /> : <ArrowUpRight size={7} className="text-white" />}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/90' : 'text-gray-900')}>{tokenName}</span>
                                </div>
                                <p className={cn('text-[11px] tabular-nums text-right', isBuy ? 'text-[#08AA09]' : 'text-red-400')}>
                                  {isBuy ? '+' : '-'}{tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                                <p className={cn('text-[11px] tabular-nums text-right', isDark ? 'text-white/60' : 'text-gray-600')}>
                                  {price > 0 ? price.toFixed(6) : '—'} XRP
                                </p>
                                <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                  {trade.time ? new Date(trade.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </p>
                                <a href={`/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer" className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-[#137DFE]' : 'text-gray-400 hover:text-[#137DFE]')}>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                        {/* Pagination */}
                        {tokenHistoryTotal > tokenHistoryLimit && (
                          <div className={cn('flex items-center justify-center gap-2 p-3 border-t', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                            <button
                              onClick={() => setTokenHistoryPage(p => p - 1)}
                              disabled={tokenHistoryPage === 0 || tokenHistoryLoading}
                              className={cn('px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors', tokenHistoryPage === 0 ? 'opacity-30 cursor-not-allowed' : '', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              Prev
                            </button>
                            <span className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                              {tokenHistoryPage + 1} / {Math.ceil(tokenHistoryTotal / tokenHistoryLimit)}
                            </span>
                            <button
                              onClick={() => setTokenHistoryPage(p => p + 1)}
                              disabled={(tokenHistoryPage + 1) * tokenHistoryLimit >= tokenHistoryTotal || tokenHistoryLoading}
                              className={cn('px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors', (tokenHistoryPage + 1) * tokenHistoryLimit >= tokenHistoryTotal ? 'opacity-30 cursor-not-allowed' : '', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* NFTs View */}
                {historyView === 'nfts' && (
                  <>
                    {nftTradesLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : nftTrades.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No NFT trades</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[60px_1.5fr_1fr_1fr_40px] gap-3 px-4 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/40 border-white/[0.08]' : 'text-gray-500 border-gray-100')}>
                          <div></div>
                          <div>NFT</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Time</div>
                          <div></div>
                        </div>
                        <div className={cn('divide-y max-h-[400px] overflow-y-auto', isDark ? 'divide-white/5' : 'divide-gray-50')}>
                          {nftTrades.map((trade, i) => (
                            <div key={i} className={cn('grid grid-cols-[60px_1.5fr_1fr_1fr_40px] gap-3 px-4 py-2.5 items-center', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}>
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5">
                                {trade.nft?.image && <img src={trade.nft.image} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="min-w-0">
                                <p className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/90' : 'text-gray-900')}>{trade.nft?.name || 'NFT'}</p>
                                <p className={cn('text-[10px] truncate', isDark ? 'text-white/40' : 'text-gray-400')}>{trade.collection?.name || ''}</p>
                              </div>
                              <p className={cn('text-[11px] font-medium tabular-nums text-right', isDark ? 'text-white/80' : 'text-gray-700')}>
                                {trade.price ? `${parseFloat(trade.price).toLocaleString()} XRP` : '—'}
                              </p>
                              <p className={cn('text-[10px] tabular-nums text-right', isDark ? 'text-white/40' : 'text-gray-400')}>
                                {trade.time ? new Date(trade.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </p>
                              <a href={`/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer" className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-[#137DFE]' : 'text-gray-400 hover:text-[#137DFE]')}>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* On-chain View */}
                {historyView === 'onchain' && (
                  <>
                    {/* Type Filter */}
                    <div className={cn('flex items-center gap-1 px-4 py-2.5 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
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
                    {txLoading ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</div>
                    ) : transactions.length === 0 ? (
                      <div className={cn('p-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>No transactions</div>
                    ) : (
                      <>
                        <div className={cn('grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-2.5 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/30 border-white/[0.06]' : 'text-gray-400 border-gray-100')}>
                          <span></span>
                          <span>Type</span>
                          <span>Details</span>
                          <span>Date</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Signature</span>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/[0.08]' : 'divide-gray-50')}>
                          {transactions.filter(tx => txTypeFilter === 'all' || tx.txType === txTypeFilter).map((tx) => (
                            <div
                              key={tx.id}
                              className={cn('grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-3 items-center cursor-pointer group', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                              onClick={() => window.open(`/tx/${tx.hash}`, '_blank')}
                            >
                              {/* Icon */}
                              <div className="relative">
                                {tx.tokenCurrency ? (
                                  <img
                                    src={`https://s1.xrpl.to/token/${tx.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${tx.tokenIssuer}_${tx.tokenCurrency}`).toString()}`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover bg-white/10"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                                  />
                                ) : (
                                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', tx.type === 'failed' ? 'bg-amber-500/10' : tx.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                                    {tx.type === 'failed' ? <AlertTriangle size={14} className="text-[#F6AF01]" /> : tx.type === 'in' ? <ArrowDownLeft size={14} className="text-[#08AA09]" /> : <ArrowUpRight size={14} className="text-red-400" />}
                                  </div>
                                )}
                                <div className={cn(
                                  'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px]',
                                  isDark ? 'border-[#070b12]' : 'border-white',
                                  tx.type === 'failed' ? 'bg-amber-500' : tx.type === 'in' ? 'bg-emerald-500' : 'bg-red-500'
                                )}>
                                  {tx.type === 'failed' ? <AlertTriangle size={7} className="text-white" /> : tx.type === 'in' ? <ArrowDownLeft size={7} className="text-white" /> : <ArrowUpRight size={7} className="text-white" />}
                                </div>
                              </div>
                              {/* Type */}
                              <div className="min-w-0 flex items-center gap-2">
                                <p className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{tx.label}</p>
                                {tx.type === 'failed' && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0', isDark ? 'bg-amber-500/15 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Failed</span>}
                                {tx.isDust && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0', isDark ? 'bg-amber-500/10 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Dust</span>}
                                {tx.sourceTag && <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0', isDark ? 'bg-[#137DFE]/15 text-[#137DFE]' : 'bg-blue-100 text-blue-600')}>{tx.sourceTagName || `Tag: ${tx.sourceTag}`}</span>}
                              </div>
                              {/* Details */}
                              <p className={cn('text-[11px] font-mono truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
                                {tx.counterparty ? (tx.counterparty.startsWith('r') ? <Link href={`/address/${tx.counterparty}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#137DFE] hover:underline">{tx.counterparty.slice(0, 10)}...{tx.counterparty.slice(-6)}</Link> : tx.counterparty) : tx.fromAmount ? 'DEX Swap' : '—'}
                              </p>
                              {/* Date */}
                              <p className={cn('text-[10px] tabular-nums', isDark ? 'text-white/40' : 'text-gray-400')}>
                                {tx.time ? new Date(tx.time).toLocaleDateString() : '—'}
                              </p>
                              {/* Amount */}
                              <div className="flex items-center justify-end gap-1.5">
                                {tx.fromAmount && tx.toAmount ? (
                                  <>
                                    <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md text-red-400 bg-red-500/10">-{tx.fromAmount}</span>
                                    <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md text-[#08AA09] bg-emerald-500/10">+{tx.toAmount}</span>
                                  </>
                                ) : tx.amount ? (
                                  tx.amount.includes('→') ? (
                                    <>
                                      {tx.amount.split('→').map((part, i) => (
                                        <span key={i} className={cn(
                                          'text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md',
                                          tx.type === 'failed' ? 'text-[#F6AF01] bg-amber-500/10' :
                                            i === 0 ? 'text-red-400 bg-red-500/10' : 'text-[#08AA09] bg-emerald-500/10'
                                        )}>
                                          {tx.type !== 'failed' && (i === 0 ? '-' : '+')}{part.trim()}
                                        </span>
                                      ))}
                                    </>
                                  ) : (
                                    <span className={cn(
                                      'text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md',
                                      tx.type === 'failed' ? 'text-[#F6AF01] bg-amber-500/10' :
                                        tx.type === 'in' ? 'text-[#08AA09] bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                                    )}>
                                      {tx.type !== 'failed' && (tx.type === 'in' ? '+' : '-')}{tx.amount}
                                    </span>
                                  )
                                ) : (
                                  <span className={cn('text-[10px] px-2 py-1 rounded-md', isDark ? 'text-white/20 bg-white/[0.04]' : 'text-gray-400 bg-gray-100')}>—</span>
                                )}
                              </div>
                              {/* Signature */}
                              <div className="flex items-center gap-1 justify-end">
                                <span className={cn('text-[10px] font-mono', isDark ? 'text-white/40' : 'text-gray-500')}>
                                  {tx.hash ? `${tx.hash.slice(0, 12)}...` : '—'}
                                </span>
                                {tx.hash && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tx.hash);
                                      setCopiedHash(tx.hash);
                                      setTimeout(() => setCopiedHash(null), 2000);
                                    }}
                                    className={cn('p-1 rounded transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
                                  >
                                    {copiedHash === tx.hash ? <Check size={12} className="text-[#08AA09]" /> : <Copy size={12} className={isDark ? 'text-white/40' : 'text-gray-400'} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {txHasMore && (
                          <div className={cn('flex items-center justify-center gap-2 p-3 border-t', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                            <button
                              type="button"
                              onClick={async (evt) => {
                                evt.preventDefault();
                                evt.stopPropagation();
                                if (!txMarker || txLoading) return;
                                setTxLoading(true);
                                const client = new Client('wss://s1.ripple.com');
                                try {
                                  await client.connect();
                                  const response = await client.request({
                                    command: 'account_tx',
                                    account: address,
                                    ledger_index_min: -1,
                                    ledger_index_max: -1,
                                    limit: txLimit,
                                    marker: txMarker
                                  });
                                  const txs = response.result?.transactions || [];
                                  setTransactions(prev => [...prev, ...txs.map(parseTx)]);
                                  setTxMarker(response.result?.marker || null);
                                  setTxHasMore(!!response.result?.marker);
                                } catch (err) {
                                  console.error('Failed to load more:', err);
                                } finally {
                                  client.disconnect();
                                  setTxLoading(false);
                                }
                              }}
                              disabled={txLoading}
                              className={cn('px-4 py-1.5 text-[11px] font-medium rounded-lg transition-colors', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                            >
                              {txLoading ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-sm rounded-xl p-5',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-red-500/20'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isDark ? 'bg-red-500/10' : 'bg-red-50'
                          )}
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </div>
                        <div>
                          <h3
                            className={cn(
                              'text-[14px] font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            Delete Address?
                          </h3>
                          <p
                            className={cn(
                              'text-[11px]',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            This cannot be undone
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className={cn(
                            'flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-colors',
                            isDark
                              ? 'bg-white/5 text-white/70 hover:bg-white/10'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteWithdrawal(deleteConfirmId)}
                          className="flex-1 py-2.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Withdrawal Modal */}
                {showAddWithdrawal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowAddWithdrawal(false)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-2xl p-6',
                        isDark
                          ? 'bg-[#09090b] border-[1.5px] border-white/15'
                          : 'bg-white border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          Add Withdrawal Address
                        </h3>
                        <button
                          onClick={() => setShowAddWithdrawal(false)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-[#137DFE]/5 text-white/40 hover:text-[#137DFE]'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
                            )}
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.name}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g. Binance, Coinbase"
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-[#137DFE]/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                            )}
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
                            )}
                          >
                            XRPL Address
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.address}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({ ...prev, address: e.target.value }))
                            }
                            placeholder="rAddress..."
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-[#137DFE]/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                            )}
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
                            )}
                          >
                            Destination Tag (optional)
                          </label>
                          <input
                            type="text"
                            value={newWithdrawal.tag}
                            onChange={(e) =>
                              setNewWithdrawal((prev) => ({
                                ...prev,
                                tag: e.target.value.replace(/\D/g, '')
                              }))
                            }
                            placeholder="e.g. 12345678"
                            className={cn(
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-[#137DFE]/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                            )}
                          />
                        </div>
                        {withdrawalError && (
                          <p className="text-[11px] text-red-400">{withdrawalError}</p>
                        )}
                        <button
                          onClick={handleAddWithdrawal}
                          disabled={withdrawalLoading}
                          className="w-full py-4 rounded-lg text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-2 bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors"
                        >
                          {withdrawalLoading ? (
                            'Saving...'
                          ) : (
                            <>
                              <Plus size={16} /> Save Address
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-xl',
                    isDark
                      ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]'
                      : 'bg-white border border-gray-200'
                  )}
                >
                  <div className="p-4 border-b border-gray-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'text-[11px] font-semibold uppercase tracking-[0.15em]',
                          isDark ? 'text-white/50' : 'text-gray-500'
                        )}
                      >
                        Saved Withdrawal Addresses
                      </p>
                      <span
                        className={cn(
                          'text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide',
                          isDark
                            ? 'bg-white/5 text-white/50 border border-white/[0.15]'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {withdrawals.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAddWithdrawal(true)}
                      className={cn(
                        'text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 transition-colors',
                        isDark
                          ? 'text-[#137DFE]/80 hover:text-blue-300'
                          : 'text-[#137DFE] hover:text-blue-600'
                      )}
                    >
                      <Plus size={12} /> Add New
                    </button>
                  </div>
                  {withdrawals.length === 0 ? (
                    <div className={cn('p-6 text-center', isDark ? 'text-white/35' : 'text-gray-400')}>
                      <BearIcon />
                      <p className={cn('text-[10px] font-medium tracking-wider mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                        NO SAVED ADDRESSES
                      </p>
                      <p className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                        Add exchange or wallet addresses for quick withdrawals
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-blue-500/5">
                      {withdrawals.map((wallet) => (
                        <div
                          key={wallet.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 group transition-all duration-150',
                            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                              isDark ? 'bg-[#137DFE]/10' : 'bg-blue-50'
                            )}
                          >
                            <Building2
                              size={16}
                              className={isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-[13px] font-medium',
                                isDark ? 'text-white/90' : 'text-gray-900'
                              )}
                            >
                              {wallet.name}
                            </p>
                            <p
                              className={cn(
                                'text-[10px] font-mono truncate',
                                isDark ? 'text-white/35' : 'text-gray-400'
                              )}
                            >
                              {wallet.address}
                            </p>
                            {wallet.tag && (
                              <p
                                className={cn(
                                  'text-[10px]',
                                  isDark ? 'text-white/25' : 'text-gray-400'
                                )}
                              >
                                Tag: {wallet.tag}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(wallet.address)}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150',
                                isDark
                                  ? 'hover:bg-[#137DFE]/5 text-white/40 hover:text-[#137DFE]'
                                  : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                              )}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedToken('XRP');
                                setSendTo(wallet.address);
                                setSendTag(wallet.tag || '');
                                setShowPanel('send');
                                setActiveTab('overview');
                              }}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150',
                                isDark
                                  ? 'hover:bg-[#137DFE]/5 text-white/40 hover:text-[#137DFE]'
                                  : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                              )}
                            >
                              <Send size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(wallet.id)}
                              className={cn(
                                'p-2 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100',
                                isDark
                                  ? 'hover:bg-red-500/10 text-white/40 hover:text-red-400'
                                  : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                              )}
                            >
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

            {/* XRP Army Referral Tab */}
            {activeTab === 'referral' && (
              <div className="space-y-4">
                {referralLoading ? (
                  <div className={cn('rounded-2xl p-12 text-center', isDark ? 'bg-black/50 border border-white/10' : 'bg-white border border-gray-100')}>
                    <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</p>
                  </div>
                ) : referralUser ? (
                  <div className="space-y-4">
                    {/* Main Card: Tier & Key Stats */}
                    <div className={cn('rounded-2xl p-5 relative overflow-hidden', isDark ? 'bg-black/40 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200 shadow-sm')}>
                      <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20', isDark ? 'bg-[#650CD4]' : 'bg-purple-400')} />

                      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5 mb-6">
                        <div className="flex items-center gap-4">
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3', isDark ? 'bg-gradient-to-br from-[#650CD4]/30 to-[#650CD4]/10 border border-white/10' : 'bg-purple-50 border border-purple-100')}>
                            {['supreme_commander', 'general', 'brigadier'].includes(referralUser.tierData?.id) || ['Supreme Commander', 'General', 'Brigadier'].includes(referralUser.tier) ? <Crown size={22} className="text-[#F6AF01]" /> :
                              ['colonel', 'major', 'captain', 'lieutenant'].includes(referralUser.tierData?.id) || ['Colonel', 'Major', 'Captain', 'Lieutenant'].includes(referralUser.tier) ? <Medal size={22} className="text-[#650CD4]" /> :
                                ['master_sergeant', 'staff_sergeant', 'sergeant', 'corporal'].includes(referralUser.tierData?.id) || ['Master Sergeant', 'Staff Sergeant', 'Sergeant', 'Corporal'].includes(referralUser.tier) ? <Award size={22} className="text-[#137DFE]" /> :
                                  <Swords size={22} className={isDark ? 'text-white/60' : 'text-gray-600'} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className={cn('text-[16px] font-bold leading-none', isDark ? 'text-white' : 'text-gray-900')}>
                                {referralUser.activeTier || referralUser.tier || 'Recruit'}
                              </h3>
                              <div className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', isDark ? 'bg-[#08AA09]/20 text-[#08AA09]' : 'bg-green-100 text-green-700')}>
                                {((referralUser.share || 0.2) * 100).toFixed(0)}% Share
                              </div>
                            </div>
                            <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>Current Rank Status</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="text-center sm:text-right">
                            <p className={cn('text-[20px] font-black leading-none mb-1', isDark ? 'text-white' : 'text-gray-900')}>{referralUser.recruits || 0}</p>
                            <p className={cn('text-[9px] uppercase tracking-[0.1em] font-semibold', isDark ? 'text-[#137DFE]' : 'text-[#137DFE]')}>Recruits</p>
                          </div>
                          <div className="text-center sm:text-right">
                            <p className={cn('text-[20px] font-black leading-none mb-1', isDark ? 'text-[#08AA09]' : 'text-green-600')}>${(referralUser.earnings || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p className={cn('text-[9px] uppercase tracking-[0.1em] font-semibold', isDark ? 'text-[#08AA09]' : 'text-green-600')}>Earned</p>
                          </div>
                        </div>
                      </div>

                      {/* Next Tier Progress */}
                      {referralUser.nextTier && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-medium">
                            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Progress to {referralUser.nextTier.name}</span>
                            <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{referralUser.nextTier.needed} more to go</span>
                          </div>
                          <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-gray-100')}>
                            <div
                              className="h-full bg-gradient-to-r from-[#137DFE] via-[#650CD4] to-[#F6AF01] rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, ((referralUser.recruits || 0) / (referralUser.nextTier.min || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Secondary Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className={cn('rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all', isDark ? 'bg-white/5 border border-white/5 hover:bg-white/[0.08]' : 'bg-white border border-gray-100 shadow-sm')}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDark ? 'bg-[#F6AF01]/10' : 'bg-amber-50')}>
                          <Zap size={16} className="text-[#F6AF01]" />
                        </div>
                        <p className={cn('text-[18px] font-bold leading-none mb-1', isDark ? 'text-white' : 'text-gray-900')}>{referralStats?.streaks?.current || referralUser.streak || 0}</p>
                        <p className={cn('text-[9px] uppercase tracking-wider font-semibold', isDark ? 'text-white/30' : 'text-gray-400')}>Day Streak</p>
                      </div>
                      <div className={cn('rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all', isDark ? 'bg-white/5 border border-white/5 hover:bg-white/[0.08]' : 'bg-white border border-gray-100 shadow-sm')}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDark ? 'bg-[#137DFE]/10' : 'bg-blue-50')}>
                          <Gem size={16} className="text-[#137DFE]" />
                        </div>
                        <p className={cn('text-[18px] font-bold leading-none mb-1', isDark ? 'text-white' : 'text-gray-900')}>{referralStats?.recruits?.whales || referralUser.whales || 0}</p>
                        <p className={cn('text-[9px] uppercase tracking-wider font-semibold', isDark ? 'text-white/30' : 'text-gray-400')}>Whales</p>
                      </div>
                      <div className={cn('rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all', isDark ? 'bg-white/5 border border-white/5 hover:bg-white/[0.08]' : 'bg-white border border-gray-100 shadow-sm')}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDark ? 'bg-[#650CD4]/10' : 'bg-purple-50')}>
                          <Target size={16} className="text-[#650CD4]" />
                        </div>
                        <p className={cn('text-[18px] font-bold leading-none mb-1', isDark ? 'text-white' : 'text-gray-900')}>{referralStats?.recruits?.tier2 || referralUser.tier2 || 0}</p>
                        <p className={cn('text-[9px] uppercase tracking-wider font-semibold', isDark ? 'text-white/30' : 'text-gray-400')}>Tier 2</p>
                      </div>
                    </div>

                    {/* Bottom Section: Badges & Links */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Badges Column */}
                      <div className={cn('rounded-2xl p-5', isDark ? 'bg-black/40 border border-white/10' : 'bg-white border border-gray-200 shadow-sm')}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={cn('text-[11px] font-bold uppercase tracking-widest', isDark ? 'text-white/40' : 'text-gray-500')}>Badges</h4>
                          {referralStats?.badges && (
                            <span className={cn('text-[10px] font-mono', isDark ? 'text-[#137DFE]' : 'text-blue-600')}>{referralStats.badges.done}/{referralStats.badges.total}</span>
                          )}
                        </div>

                        {(referralStats?.badges?.list || referralUser.badges || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(referralStats?.badges?.list || referralUser.badges || []).slice(0, 8).map((badge, i) => {
                              const badgeConfig = {
                                first_recruit: { icon: Users, bg: 'bg-[#CD7F32]/10', text: 'text-[#CD7F32]', border: 'border-[#CD7F32]/20' },
                                platoon_leader: { icon: Medal, bg: 'bg-white/10', text: 'text-white/70', border: 'border-white/20' },
                                battalion_leader: { icon: Medal, bg: 'bg-[#F6AF01]/10', text: 'text-[#F6AF01]', border: 'border-[#F6AF01]/20' },
                                army_commander: { icon: Crown, bg: 'bg-[#650CD4]/10', text: 'text-[#a855f7]', border: 'border-[#650CD4]/20' },
                              };
                              const config = badgeConfig[badge] || { icon: Award, bg: isDark ? 'bg-white/5' : 'bg-gray-100', text: isDark ? 'text-white/50' : 'text-gray-500', border: isDark ? 'border-white/10' : 'border-gray-200' };
                              const Icon = config.icon;
                              return (
                                <div key={i} className={cn('p-1.5 rounded-lg border transition-transform hover:scale-105', config.bg, config.text, config.border)} title={badge.replace(/_/g, ' ')}>
                                  <Icon size={14} />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={cn('text-[11px] italic', isDark ? 'text-white/20' : 'text-gray-400')}>No badges yet</p>
                        )}
                      </div>

                      {/* Referral Code Column */}
                      <div className={cn('rounded-2xl p-5 flex flex-col justify-between', isDark ? 'bg-black/40 border border-white/10' : 'bg-white border border-gray-200 shadow-sm')}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={cn('text-[11px] font-bold uppercase tracking-widest', isDark ? 'text-white/40' : 'text-gray-500')}>Referral Link</h4>
                            <button onClick={() => { setEditingCode(true); setNewReferralCode(referralUser.referralCode); }} className={cn('text-[10px] font-medium hover:underline', isDark ? 'text-[#137DFE]' : 'text-blue-600')}>Settings</button>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn('flex-1 px-3 py-2 rounded-xl text-[12px] font-mono truncate border', isDark ? 'bg-white/5 border-white/5 text-white/60' : 'bg-gray-50 border-gray-100 text-gray-500')}>
                              {`${window.location.origin}/signup?ref=${referralUser.referralCode}`}
                            </div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralUser.referralCode}`); setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000); }}
                              className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-all', referralCopied ? 'bg-[#08AA09] text-white' : isDark ? 'bg-[#137DFE] text-white' : 'bg-[#137DFE] text-white')}
                            >
                              {referralCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {referralUser.referrer && (
                          <div className={cn('mt-2 text-[10px] flex items-center gap-1.5 opacity-60', isDark ? 'text-white/50' : 'text-gray-500')}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#08AA09]" />
                            Referred by {referralUser.referrer.slice(0, 6)}...{referralUser.referrer.slice(-4)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code Edit Overlay */}
                    {editingCode && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCode(false)}>
                        <div className={cn('w-full max-w-sm rounded-2xl p-6 shadow-2xl', isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-200')} onClick={e => e.stopPropagation()}>
                          <h3 className={cn('text-[16px] font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Referral Settings</h3>
                          <div className="space-y-4">
                            <div>
                              <label className={cn('text-[11px] font-bold uppercase tracking-wider mb-2 block', isDark ? 'text-white/40' : 'text-gray-500')}>Custom Suffix</label>
                              <input
                                type="text"
                                value={newReferralCode}
                                onChange={(e) => setNewReferralCode(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                                className={cn('w-full px-4 py-3 rounded-xl text-[14px] font-mono outline-none border transition-all', isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#137DFE]/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500')}
                              />
                            </div>
                            {referralError && <p className="text-[11px] text-red-400">{referralError}</p>}
                            <div className="flex gap-3">
                              <button onClick={() => setEditingCode(false)} className={cn('flex-1 py-3 rounded-xl text-[13px] font-medium transition-colors', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>Cancel</button>
                              <button onClick={handleUpdateReferralCode} disabled={referralLoading || newReferralCode.length < 3} className="flex-1 py-3 rounded-xl text-[13px] font-bold bg-[#137DFE] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20">Save Changes</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn('rounded-2xl p-8 text-center relative overflow-hidden', isDark ? 'bg-black/40 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100 shadow-xl')}>
                    <div className={cn('absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-[#650CD4]')} />

                    <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-2xl', isDark ? 'bg-gradient-to-br from-[#650CD4] to-[#137DFE]' : 'bg-purple-600')}>
                      <Swords size={40} className="text-white" />
                    </div>

                    <h3 className={cn('text-2xl font-black mb-2 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Join the XRP Army</h3>
                    <p className={cn('text-[14px] mb-8 max-w-xs mx-auto', isDark ? 'text-white/40' : 'text-gray-500')}>Recruit new members and earn up to 50% revenue share from every trade they make.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className={cn('p-4 rounded-2xl border text-left', isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100')}>
                        <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', isDark ? 'text-[#08AA09]' : 'text-green-600')}>Start</p>
                        <p className={cn('text-[15px] font-black', isDark ? 'text-white' : 'text-gray-900')}>20% Share</p>
                      </div>
                      <div className={cn('p-4 rounded-2xl border text-left', isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100')}>
                        <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', isDark ? 'text-[#F6AF01]' : 'text-amber-600')}>Max</p>
                        <p className={cn('text-[15px] font-black', isDark ? 'text-white' : 'text-gray-900')}>50% Share</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto">
                      <div className="relative">
                        <label className={cn('absolute -top-2 left-3 px-1.5 text-[9px] font-bold uppercase tracking-widest z-10', isDark ? 'bg-[#0a0a0a] text-white/40' : 'bg-white text-gray-400')}>Your Custom Code</label>
                        <input
                          type="text"
                          value={referralForm.referralCode}
                          onChange={(e) => setReferralForm(f => ({ ...f, referralCode: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) }))}
                          placeholder="Leave empty for auto-gen"
                          className={cn('w-full px-4 py-4 rounded-2xl text-[14px] font-mono outline-none border transition-all text-center', isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#650CD4]/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500')}
                        />
                      </div>

                      <button
                        onClick={handleReferralRegister}
                        disabled={referralLoading}
                        className="w-full py-4 rounded-2xl text-[15px] font-black bg-gradient-to-r from-[#650CD4] to-[#137DFE] text-white shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {referralLoading ? 'ENLISTING...' : 'ENLIST NOW'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {profileLoading ? (
                  <div className={cn('rounded-xl p-12 text-center', isDark ? 'bg-black/50 border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                    <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>Loading...</p>
                  </div>
                ) : profileUser ? (
                  <div className={cn('rounded-2xl p-6 relative overflow-hidden', isDark ? 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-white border border-gray-100 shadow-xl')}>
                    {/* Background Accent */}
                    <div className={cn('absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20', isDark ? 'bg-[#137DFE]' : 'bg-blue-400')} />

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Avatar Wrapper */}
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="relative group shrink-0"
                        title="Change avatar"
                      >
                        <div className={cn(
                          'w-24 h-24 rounded-2xl p-1 transition-all duration-500 group-hover:rotate-3 shadow-lg',
                          isDark ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10' : 'bg-white border border-gray-200'
                        )}>
                          {profileUser.avatar ? (
                            <img
                              src={profileUser.avatar}
                              alt="Avatar"
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className={cn(
                              'w-full h-full rounded-xl flex items-center justify-center text-3xl font-bold bg-gradient-to-br',
                              isDark ? 'from-[#137DFE]/20 to-[#650CD4]/20 text-[#137DFE]' : 'from-blue-50 to-indigo-50 text-blue-600'
                            )}>
                              {profileUser.username?.[0]?.toUpperCase() || address?.[1]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-2 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
                          <Image size={24} className="text-white" />
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#0a0a0a] bg-emerald-500 shadow-md" />
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
                                  isDark
                                    ? 'bg-white/5 border-white/10 text-white focus:border-[#137DFE]/50'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
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
                                className={cn('p-2 rounded-xl transition-colors', isDark ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-500')}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              <h2 className={cn('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                {profileUser.username || 'Anonymous User'}
                              </h2>
                              {(!profileUser.username || userPerks?.perks?.canChangeUsername) && (
                                <button
                                  onClick={() => { setEditingUsername(true); setNewUsername(profileUser.username || ''); }}
                                  className={cn('p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all', isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}
                                >
                                  <Plus size={14} className="rotate-45" /> {/* Edit icon visual */}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <button
                            onClick={() => handleCopy(address)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono transition-all',
                              isDark ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            )}
                          >
                            <Wallet size={12} />
                            {address?.slice(0, 12)}...{address?.slice(-8)}
                            <Copy size={10} className="ml-1 opacity-40" />
                          </button>

                          <div className={cn('px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-2', isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-500')}>
                            <Clock size={12} />
                            Joined {profileUser.createdAt ? formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true }) : 'Recently'}
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="md:absolute md:top-0 md:right-0">
                        {profileUser.username && !userPerks?.perks?.canChangeUsername && !editingUsername && (
                          <div className={cn('px-3 py-1 rounded-full text-[9px] font-bold tracking-wider border', isDark ? 'bg-amber-500/5 text-amber-500/60 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100')}>
                            XRP VIP+ REQUIRED TO RENAME
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid - Concise Footer */}
                    <div className={cn('grid grid-cols-2 gap-4 mt-8 pt-6 border-t', isDark ? 'border-white/5' : 'border-gray-100')}>
                      <div className="text-center md:text-left">
                        <p className={cn('text-[10px] uppercase tracking-[0.1em] font-bold mb-1', isDark ? 'text-white/20' : 'text-gray-400')}>Activity Status</p>
                        <p className={cn('text-[13px] font-medium', isDark ? 'text-emerald-400' : 'text-emerald-600')}>Online Now</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className={cn('text-[10px] uppercase tracking-[0.1em] font-bold mb-1', isDark ? 'text-white/20' : 'text-gray-400')}>Last Profile Update</p>
                        <p className={cn('text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-600')}>{profileUser.updatedAt ? formatDistanceToNow(new Date(profileUser.updatedAt), { addSuffix: true }) : 'Never'}</p>
                      </div>
                    </div>

                    {/* Avatar Picker Modal - Moved inside for better scoping or logic flow */}
                    {showAvatarPicker && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowAvatarPicker(false)}>
                        <div
                          className={cn('w-full max-w-md rounded-2xl p-5 shadow-2xl transition-all duration-300 transform scale-100', isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-200')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div>
                              <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Select NFT Avatar</h3>
                              <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>Choose an NFT from your wallet</p>
                            </div>
                            <button onClick={() => setShowAvatarPicker(false)} className={cn('p-2 rounded-xl transition-colors', isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-500')}>
                              <X size={20} />
                            </button>
                          </div>

                          {avatarNftsLoading ? (
                            <div className="py-12 text-center animate-pulse">
                              <div className={cn('w-12 h-12 rounded-full mx-auto mb-4 bg-white/5')} />
                              <p className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-gray-400')}>Loading your NFTs...</p>
                            </div>
                          ) : avatarNfts.length === 0 ? (
                            <div className="py-12 text-center">
                              <Image size={32} className={cn('mx-auto mb-3 opacity-20', isDark ? 'text-white' : 'text-gray-300')} />
                              <p className={cn('text-[11px] font-medium mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>No NFTs Available</p>
                              <p className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>Own an NFT to set it as your profile image</p>
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
                                      ? 'border-[#137DFE] scale-95 shadow-lg shadow-[#137DFE]/20'
                                      : isDark ? 'border-white/5 hover:border-white/20' : 'border-transparent hover:border-gray-200',
                                    (settingAvatar || !nft.files?.[0]?.thumbnail?.large) && 'opacity-50 grayscale'
                                  )}
                                >
                                  <img
                                    src={nft.files?.[0]?.thumbnail?.large ? `https://s1.xrpl.to/nft/${nft.files[0].thumbnail.large}` : getNftCoverUrl(nft.meta, nft.url)}
                                    alt={nft.meta?.name || 'NFT'}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                                  />
                                  {profileUser.avatarNftId === nft.NFTokenID && (
                                    <div className="absolute inset-0 bg-[#137DFE]/30 backdrop-blur-[2px] flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
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
                      <div className={cn('flex items-center gap-2 p-3 rounded-xl text-[11px] mt-4 animate-in fade-in slide-in-from-top-2', isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100')}>
                        <AlertTriangle size={14} className="shrink-0" />
                        {profileError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn('rounded-xl p-6', isDark ? 'bg-black/50 border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', isDark ? 'bg-[#137DFE]/10' : 'bg-blue-50')}>
                        <User size={18} className="text-[#137DFE]" />
                      </div>
                      <div>
                        <h3 className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>Create Profile</h3>
                        <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>Claim a unique username</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className={cn('text-[10px] uppercase tracking-wider mb-1.5 block', isDark ? 'text-white/40' : 'text-gray-500')}>Username <span className={isDark ? 'text-white/20' : 'text-gray-300'}>(optional)</span></label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 14))}
                          placeholder="2-14 characters"
                          className={cn('w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-colors', isDark ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/25 focus:border-[#137DFE]/40' : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]')}
                        />
                      </div>

                      {profileError && (
                        <div className={cn('flex items-center gap-2 p-3 rounded-lg text-[11px]', isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100')}>
                          <AlertTriangle size={14} />
                          {profileError}
                        </div>
                      )}

                      <button
                        onClick={() => handleCreateProfile(newUsername.length >= 2 ? newUsername : null)}
                        disabled={profileLoading}
                        className="w-full py-3 rounded-xl text-[13px] font-medium bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profileLoading ? 'Creating...' : 'Create Profile'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Wallet Labels Section - Available to all users */}
                <div className={cn('rounded-xl p-4', isDark ? 'bg-black/50 border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                  <p className={cn('text-[10px] uppercase tracking-wider mb-3', isDark ? 'text-white/30' : 'text-gray-400')}>Wallet Labels</p>

                  {/* Add new label */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newLabelWallet}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || /^r[a-zA-Z0-9]*$/.test(val)) setNewLabelWallet(val.slice(0, 35));
                      }}
                      placeholder="rAddress..."
                      className={cn('flex-1 px-2 py-1.5 rounded-lg text-[12px] font-mono outline-none', isDark ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/25' : 'bg-white text-gray-900 border border-gray-200 placeholder:text-gray-400')}
                    />
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value.slice(0, 30))}
                      placeholder="Label"
                      className={cn('w-28 px-2 py-1.5 rounded-lg text-[12px] outline-none', isDark ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/25' : 'bg-white text-gray-900 border border-gray-200 placeholder:text-gray-400')}
                    />
                    <button
                      onClick={handleAddLabel}
                      disabled={labelsLoading || !newLabelWallet || newLabelWallet.length < 25 || !newLabelName}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#137DFE] text-white disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Labels list */}
                  {labelsLoading && walletLabels.length === 0 ? (
                    <p className={cn('text-[11px] text-center py-2', isDark ? 'text-white/30' : 'text-gray-400')}>Loading...</p>
                  ) : walletLabels.length === 0 ? (
                    <p className={cn('text-[11px] text-center py-2', isDark ? 'text-white/30' : 'text-gray-400')}>No labels yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {walletLabels.map((item) => (
                        <div key={item.wallet} className={cn('flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/80' : 'text-gray-700')}>{item.label}</p>
                            <p className={cn('text-[10px] font-mono truncate', isDark ? 'text-white/30' : 'text-gray-400')}>{item.wallet}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteLabel(item.wallet)}
                            disabled={deletingLabel === item.wallet}
                            className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membership Tiers Section */}
                <div className={cn('rounded-xl overflow-hidden', isDark ? 'bg-black/50 border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                  <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className={cn(isDark ? 'text-white/40' : 'text-gray-400')} />
                        <p className={cn('text-[11px] font-medium', isDark ? 'text-white/70' : 'text-gray-600')}>Membership</p>
                      </div>
                      {(userPerks?.groups?.length > 0 || userPerks?.roles?.length > 0) && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {[...new Set([...(userPerks.roles || []).filter(r => r !== 'member'), ...(userPerks.groups || [])])].map(tierName => {
                            const tierConfig = {
                              admin: { icon: Shield, bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
                              moderator: { icon: Shield, bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
                              verified: { icon: Check, bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'text-white', border: 'border-[#FFD700]/30', gradient: true, gradientFrom: '#FFD700' },
                              diamond: { icon: Gem, bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
                              nova: { icon: Star, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                              vip: { icon: Sparkles, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                              private: { icon: Crown, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
                            };
                            const config = tierConfig[tierName] || { icon: Trophy, bg: isDark ? 'bg-white/5' : 'bg-gray-100', text: isDark ? 'text-white/50' : 'text-gray-500', border: isDark ? 'border-white/10' : 'border-gray-200' };
                            const Icon = config.icon;
                            return (
                              <span key={tierName} className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight flex items-center gap-1.5 border backdrop-blur-md whitespace-nowrap', config.bg, config.border)}>
                                {Icon && <Icon size={10} className={config.gradient ? 'text-[#FFD700]' : config.text} />}
                                <span className={cn(config.gradient ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' : config.text)}>
                                  {tierName.toUpperCase()}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Display Tier Selector - only tier badges are selectable */}
                  {displayBadges.available.filter(b => b.startsWith('tier:')).length > 1 && (
                    <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                      <div className="flex items-center justify-between">
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-white/30' : 'text-gray-400')}>Active Badge</p>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {displayBadges.available.filter(b => b.startsWith('tier:')).map(badgeId => {
                            const name = badgeId.split(':')[1];
                            const tierConfig = {
                              verified: { icon: Check, bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'text-white', border: 'border-[#FFD700]/30', gradient: true },
                              diamond: { icon: Gem, bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
                              nova: { icon: Star, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                              vip: { icon: Sparkles, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
                            };
                            const config = tierConfig[name] || { icon: Star, bg: isDark ? 'bg-white/5' : 'bg-gray-100', text: isDark ? 'text-white/50' : 'text-gray-500', border: isDark ? 'border-white/10' : 'border-gray-200' };
                            const Icon = config.icon;
                            const isSelected = displayBadges.current === badgeId;

                            return (
                              <button
                                key={badgeId}
                                onClick={() => handleSetDisplayBadge(badgeId)}
                                disabled={settingBadge}
                                className={cn(
                                  'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight flex items-center gap-1.5 border transition-all duration-300',
                                  isSelected
                                    ? cn(config.bg, config.border, 'ring-1 ring-white/20 shadow-lg shadow-black/20 scale-105')
                                    : 'bg-transparent border-transparent opacity-40 hover:opacity-100 grayscale hover:grayscale-0',
                                  settingBadge && 'cursor-wait'
                                )}
                              >
                                {Icon && <Icon size={10} className={config.gradient ? 'text-[#FFD700]' : config.text} />}
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

                  {/* Achievement Badges - earned badges, not selectable */}
                  {displayBadges.available.filter(b => b.startsWith('badge:')).length > 0 && (
                    <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/[0.08]' : 'border-gray-100')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award size={14} className={cn(isDark ? 'text-white/40' : 'text-gray-400')} />
                          <p className={cn('text-[11px] font-medium', isDark ? 'text-white/70' : 'text-gray-600')}>Badges</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displayBadges.available.filter(b => b.startsWith('badge:')).map(badgeId => {
                            const name = badgeId.split(':')[1];
                            const achievementConfig = {
                              first_recruit: { icon: Users, bg: 'bg-[#137DFE]/15', text: 'text-[#137DFE]', border: 'border-[#137DFE]/20', label: 'First Recruit' },
                              squad_leader: { icon: Swords, bg: 'bg-[#F6AF01]/15', text: 'text-[#F6AF01]', border: 'border-[#F6AF01]/20', label: 'Squad Leader' },
                              early_adopter: { icon: Zap, bg: 'bg-[#08AA09]/15', text: 'text-[#08AA09]', border: 'border-[#08AA09]/20', label: 'Early Adopter' },
                              top_trader: { icon: TrendingUp, bg: 'bg-[#137DFE]/15', text: 'text-[#137DFE]', border: 'border-[#137DFE]/20', label: 'Top Trader' },
                              whale: { icon: Gem, bg: 'bg-[#650CD4]/15', text: 'text-[#a855f7]', border: 'border-[#650CD4]/20', label: 'Whale' },
                              og: { icon: Medal, bg: 'bg-[#F6AF01]/15', text: 'text-[#F6AF01]', border: 'border-[#F6AF01]/20', label: 'OG' },
                              contributor: { icon: Gift, bg: 'bg-[#08AA09]/15', text: 'text-[#08AA09]', border: 'border-[#08AA09]/20', label: 'Contributor' },
                              army_general: { icon: Crown, bg: 'bg-[#650CD4]/15', text: 'text-[#a855f7]', border: 'border-[#650CD4]/20', label: 'Army General' }
                            };
                            const defaultConfig = { icon: Award, bg: isDark ? 'bg-white/5' : 'bg-gray-100', text: isDark ? 'text-white/50' : 'text-gray-500', border: isDark ? 'border-white/10' : 'border-gray-200' };
                            const config = achievementConfig[name] || defaultConfig;
                            const Icon = config.icon;
                            const displayLabel = config.label || name.replace(/_/g, ' ').toUpperCase();

                            return (
                              <span
                                key={badgeId}
                                className={cn(
                                  'px-2 py-0.5 rounded text-[9px] font-semibold tracking-wide flex items-center gap-1 border',
                                  config.bg, config.border
                                )}
                              >
                                {Icon && <Icon size={9} className={config.text} />}
                                <span className={config.text}>{displayLabel}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* XRP Invoice Modal */}
                  {xrpInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setXrpInvoice(null)}>
                      <div className={cn('w-full max-w-sm rounded-2xl p-6', isDark ? 'bg-[#0a0a0a] border border-white/[0.15]' : 'bg-white border border-gray-200')} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-[#137DFE]/10' : 'bg-blue-50')}>
                              <Coins size={16} className="text-[#137DFE]" />
                            </div>
                            <p className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Pay with XRP</p>
                          </div>
                          <button onClick={() => setXrpInvoice(null)} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                            <X size={18} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                          </button>
                        </div>
                        <div className={cn('rounded-xl p-4 mb-4 text-center', isDark ? 'bg-gradient-to-b from-[#137DFE]/10 to-transparent border border-[#137DFE]/20' : 'bg-gradient-to-b from-blue-50 to-white border border-blue-100')}>
                          <p className={cn('text-[10px] uppercase tracking-wider mb-1', isDark ? 'text-white/40' : 'text-gray-400')}>Amount Due</p>
                          <p className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>{xrpInvoice.amount} <span className="text-[#137DFE]">XRP</span></p>
                        </div>
                        <div className={cn('rounded-xl p-4 mb-4', isDark ? 'bg-white/[0.02] border border-white/[0.08]' : 'bg-gray-50 border border-gray-100')}>
                          <p className={cn('text-[10px] uppercase tracking-wider mb-2', isDark ? 'text-white/40' : 'text-gray-400')}>Send to address</p>
                          <p className={cn('text-[12px] font-mono break-all', isDark ? 'text-white/80' : 'text-gray-700')}>{xrpInvoice.destination}</p>
                          {xrpInvoice.destinationTag && (
                            <div className={cn('mt-3 pt-3 border-t', isDark ? 'border-white/[0.08]' : 'border-gray-200')}>
                              <p className={cn('text-[10px] uppercase tracking-wider mb-1', isDark ? 'text-white/40' : 'text-gray-400')}>Destination Tag</p>
                              <p className={cn('text-[14px] font-mono font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{xrpInvoice.destinationTag}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(`${xrpInvoice.destination}${xrpInvoice.destinationTag ? `:${xrpInvoice.destinationTag}` : ''}`)}
                          className={cn('w-full py-2.5 rounded-xl text-[12px] font-medium mb-2 flex items-center justify-center gap-2 transition-colors', isDark ? 'bg-white/[0.05] text-white/70 hover:bg-white/10 border border-white/[0.08]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200')}
                        >
                          <Copy size={14} />
                          Copy Address
                        </button>
                        <button
                          onClick={handleVerifyXrpPayment}
                          disabled={verifyingPayment}
                          className="w-full py-3 rounded-xl text-[13px] font-semibold bg-[#137DFE] text-white hover:bg-[#137DFE]/90 disabled:opacity-50 transition-colors"
                        >
                          {verifyingPayment ? 'Verifying...' : 'I have paid'}
                        </button>
                        {profileError && (
                          <p className={cn('text-[11px] mt-3 text-center', 'text-red-400')}>{profileError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {tiersLoading ? (
                      <p className={cn('text-[11px] text-center py-6', isDark ? 'text-white/30' : 'text-gray-400')}>Loading tiers...</p>
                    ) : Object.keys(tiers).length === 0 ? (
                      <p className={cn('text-[11px] text-center py-6', isDark ? 'text-white/30' : 'text-gray-400')}>No tiers available</p>
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
                                'rounded-2xl p-4 border transition-all duration-500 relative overflow-hidden group',
                                isCurrentTier
                                  ? `${isDark ? config.bg : 'bg-white'} ${config.border} shadow-xl ${config.glow}`
                                  : isDark ? 'bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/20' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
                              )}
                            >
                              {isCurrentTier && (
                                <div className={cn('absolute top-0 right-0 px-2.5 py-1 text-[9px] font-bold rounded-bl-xl bg-gradient-to-r text-white z-10', config.gradient)}>
                                  CURRENT
                                </div>
                              )}

                              <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300', isCurrentTier ? `bg-gradient-to-br ${config.gradient} shadow-lg shadow-black/20` : isDark ? 'bg-white/[0.05]' : 'bg-white shadow-sm border border-gray-100')}>
                                    <TierIcon size={20} className={isCurrentTier ? 'text-white' : config.text} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={cn('text-[15px] font-bold capitalize', isDark ? 'text-white' : 'text-gray-900')}>
                                      {name}
                                    </h4>
                                    <div className="flex items-baseline gap-1">
                                      <span className={cn('text-lg font-black', isDark ? 'text-white/90' : 'text-gray-900')}>
                                        €{tier.price}
                                      </span>
                                      {tier.billing && (
                                        <span className={cn('text-[10px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                          {tier.billing === 'lifetime' ? 'once' : '/' + tier.billing}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {tier.perks && (
                                  <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className={cn('w-1 h-1 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                      <span className={cn('text-[11px] font-medium', isDark ? 'text-white/50' : 'text-gray-500')}>{tier.perks.privateMessageLimit?.toLocaleString()} messages</span>
                                    </div>
                                    {tier.perks.canChangeUsername && (
                                      <div className="flex items-center gap-2">
                                        <div className={cn('w-1 h-1 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                        <span className={cn('text-[11px] font-medium', isDark ? 'text-white/50' : 'text-gray-500')}>Custom username</span>
                                      </div>
                                    )}
                                    {tier.perks.verifiedBadge && (
                                      <div className="flex items-center gap-2">
                                        <div className={cn('w-1 h-1 rounded-full', isCurrentTier ? 'bg-white' : config.text)} />
                                        <span className={cn('text-[11px] font-medium', isDark ? 'text-white/50' : 'text-gray-500')}>Verified badge</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Chat Name Preview */}
                                <div className={cn('flex items-center gap-2 mb-4 p-2 rounded-lg', isDark ? 'bg-black/20' : 'bg-gray-100/50')}>
                                  <span className={cn('text-[10px] font-bold uppercase truncate max-w-[80px]',
                                    name === 'verified' ? 'bg-gradient-to-r from-[#FFD700] via-[#FF6B9D] to-[#00FFFF] bg-clip-text text-transparent' :
                                      name === 'vip' ? 'text-emerald-400' :
                                        name === 'nova' ? 'text-amber-400' :
                                          name === 'diamond' ? 'text-violet-400' : 'text-emerald-400'
                                  )}>
                                    {profileUser?.username || 'User'}
                                  </span>
                                  <span className={cn('text-[10px] opacity-40 italic', isDark ? 'text-white' : 'text-gray-500')}>Chat preview</span>
                                </div>

                                {!isCurrentTier && tier.price > 0 && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handlePurchaseTierXRP(name)}
                                      disabled={purchaseLoading === name}
                                      className={cn('flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-md', isDark ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm')}
                                    >
                                      <Coins size={12} />
                                      XRP
                                    </button>
                                    <button
                                      onClick={() => handlePurchaseTierStripe(name)}
                                      disabled={purchaseLoading === name}
                                      className={cn('flex-2 py-2.5 px-4 rounded-xl text-[11px] font-bold text-white transition-all shadow-lg active:scale-95 bg-gradient-to-r', config.gradient)}
                                    >
                                      {purchaseLoading === name ? '...' : 'Upgrade'}
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
              </div>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <div>
                {/* NFT Transfer Modal */}
                {nftToTransfer && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setNftToTransfer(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-white/[0.15]'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          Transfer NFT
                        </h3>
                        <button
                          onClick={() => setNftToTransfer(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-[#137DFE]/5 text-white/40 hover:text-[#137DFE]'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          isDark
                            ? 'bg-white/[0.04] border border-white/[0.15]'
                            : 'bg-gray-50 border border-gray-200'
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
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftToTransfer.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isDark ? 'text-white/35' : 'text-gray-400'
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
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
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
                              'w-full px-4 py-3 rounded-lg text-[13px] font-mono outline-none transition-colors duration-150',
                              isDark
                                ? 'bg-white/[0.04] text-white border border-white/[0.15] placeholder:text-white/30 focus:border-[#137DFE]/40'
                                : 'bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:border-[#137DFE]'
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            'p-3 rounded-lg text-[11px]',
                            isDark
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          )}
                        >
                          This will transfer ownership. This action cannot be undone.
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors">
                          <Send size={16} /> Transfer NFT
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NFT Sell Modal */}
                {nftToSell && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setNftToSell(null)}
                  >
                    <div
                      className={cn(
                        'w-full max-w-md rounded-xl p-6',
                        isDark
                          ? 'bg-[#070b12]/98 backdrop-blur-xl border border-white/[0.15]'
                          : 'bg-white/98 backdrop-blur-xl border border-gray-200'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          className={cn(
                            'text-[13px] font-medium',
                            isDark ? 'text-white/90' : 'text-gray-900'
                          )}
                        >
                          List NFT for Sale
                        </h3>
                        <button
                          onClick={() => setNftToSell(null)}
                          className={cn(
                            'p-2 rounded-lg transition-colors duration-150',
                            isDark
                              ? 'hover:bg-[#137DFE]/5 text-white/40 hover:text-[#137DFE]'
                              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                          )}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg mb-4',
                          isDark
                            ? 'bg-white/[0.04] border border-white/[0.15]'
                            : 'bg-gray-50 border border-gray-200'
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
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftToSell.name}
                          </p>
                          <p
                            className={cn(
                              'text-[10px]',
                              isDark ? 'text-white/35' : 'text-gray-400'
                            )}
                          >
                            {nftToSell.collection}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-[9px] uppercase font-semibold tracking-wide',
                              isDark ? 'text-white/25' : 'text-gray-400'
                            )}
                          >
                            Floor
                          </p>
                          <p
                            className={cn(
                              'text-[12px] font-medium',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            {nftToSell.floor}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block',
                              isDark ? 'text-[#137DFE]' : 'text-[#137DFE]'
                            )}
                          >
                            Sale Price
                          </label>
                          <div
                            className={cn(
                              'flex items-center rounded-lg overflow-hidden',
                              isDark
                                ? 'bg-white/[0.04] border border-white/[0.15]'
                                : 'bg-gray-50 border border-gray-200'
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
                                isDark
                                  ? 'text-white placeholder:text-white/20'
                                  : 'text-gray-900 placeholder:text-gray-300'
                              )}
                            />
                            <span
                              className={cn(
                                'px-4 py-3 text-[13px] font-medium',
                                isDark
                                  ? 'text-white/50 bg-white/[0.04]'
                                  : 'text-gray-500 bg-gray-100'
                              )}
                            >
                              XRP
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg text-[11px]',
                            isDark
                              ? 'bg-white/[0.04] border border-white/[0.15]'
                              : 'bg-gray-50 border border-gray-200'
                          )}
                        >
                          <span className={isDark ? 'text-white/35' : 'text-gray-400'}>
                            Marketplace fee (2.5%)
                          </span>
                          <span className={isDark ? 'text-white/50' : 'text-gray-500'}>
                            {nftSellPrice ? (parseFloat(nftSellPrice) * 0.025).toFixed(2) : '0.00'}{' '}
                            XRP
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            isDark
                              ? 'bg-white/[0.04] border border-white/[0.15]'
                              : 'bg-gray-50 border border-gray-200'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[13px]',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            You receive
                          </span>
                          <span
                            className={cn(
                              'text-lg font-medium',
                              isDark ? 'text-white/90' : 'text-gray-900'
                            )}
                          >
                            {nftSellPrice ? (parseFloat(nftSellPrice) * 0.975).toFixed(2) : '0.00'}{' '}
                            XRP
                          </span>
                        </div>
                        <button className="w-full py-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 bg-[#137DFE] text-white hover:bg-[#137DFE]/90 transition-colors">
                          <ArrowUpRight size={16} /> List for Sale
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCollection ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'text-[11px] transition-colors',
                          isDark
                            ? 'text-white/35 hover:text-[#137DFE]'
                            : 'text-gray-400 hover:text-blue-600'
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
                        {selectedCollection}
                      </span>
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={cn(
                          'ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors duration-150',
                          isDark
                            ? 'bg-white/[0.04] text-white/50 hover:bg-[#137DFE]/5 hover:text-[#137DFE]'
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                        )}
                      >
                        Clear
                      </button>
                    </div>
                    {collectionNftsLoading ? (
                      <div
                        className={cn(
                          'p-12 text-center',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Loading NFTs...
                      </div>
                    ) : collectionNfts.length === 0 ? (
                      <div className={cn('rounded-xl py-12 px-8 text-center', isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                        <BearIcon />
                        <p className={cn('text-xs font-medium tracking-widest mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                          NO NFTS FOUND
                        </p>
                        <a href="/nfts" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#137DFE] hover:underline">
                          Browse collections
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                        {collectionNfts.map((nft) => (
                          <div
                            key={nft.id}
                            className={cn(
                              'rounded-xl overflow-hidden group transition-all duration-300',
                              isDark
                                ? 'bg-black/40 backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18]'
                                : 'bg-white border border-gray-200 shadow-sm'
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
                                    'w-full aspect-square flex items-center justify-center text-[9px]',
                                    isDark
                                      ? 'bg-white/5 text-white/30'
                                      : 'bg-gray-100 text-gray-400'
                                  )}
                                >
                                  No image
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                <Link
                                  href={`/nft/${nft.nftId}`}
                                  className="w-full py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 text-[9px] font-bold flex items-center justify-center gap-1 transition-all"
                                >
                                  <ExternalLink size={10} /> View
                                </Link>
                                <div className="flex w-full gap-1.5">
                                  <button
                                    onClick={() => setNftToTransfer(nft)}
                                    className="flex-1 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-[9px] font-bold flex items-center justify-center transition-all"
                                    title="Send"
                                  >
                                    <Send size={10} />
                                  </button>
                                  <button
                                    onClick={() => setNftToSell(nft)}
                                    className="flex-1 py-1.5 rounded-lg bg-[#137DFE] text-white hover:bg-[#137DFE]/90 text-[9px] font-bold flex items-center justify-center transition-all"
                                    title="Sell"
                                  >
                                    <ArrowUpRight size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <p
                                className={cn(
                                  'text-[11px] font-semibold truncate',
                                  isDark ? 'text-white/95' : 'text-gray-900'
                                )}
                              >
                                {nft.name}
                              </p>
                              {nft.rarity > 0 && (
                                <p
                                  className={cn(
                                    'text-[9px] font-medium mt-0.5',
                                    isDark ? 'text-[#137DFE]/70' : 'text-[#137DFE]'
                                  )}
                                >
                                  Rank #{nft.rarity}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : collectionsLoading ? (
                  <div
                    className={cn('p-12 text-center', isDark ? 'text-white/40' : 'text-gray-400')}
                  >
                    Loading collections...
                  </div>
                ) : collections.length === 0 ? (
                  <div className={cn('rounded-xl p-12 text-center', isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200')}>
                    <BearIcon />
                    <p className={cn('text-[10px] font-medium tracking-wider mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                      NO NFTS FOUND
                    </p>
                    <p className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-400')}>
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
                          isDark
                            ? 'bg-black/40 backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18]'
                            : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                        )}
                      >
                        <div className="relative">
                          {col.logo ? (
                            <img
                              src={col.logo}
                              alt={col.name}
                              className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-full aspect-square flex items-center justify-center text-[9px]',
                                isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                              )}
                            >
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p
                            className={cn(
                              'text-[11px] font-semibold truncate',
                              isDark ? 'text-white/95' : 'text-gray-900'
                            )}
                          >
                            {col.name}
                          </p>
                          <p
                            className={cn(
                              'text-[9px] font-medium opacity-60 mt-0.5',
                              isDark ? 'text-white' : 'text-gray-500'
                            )}
                          >
                            {col.count} item{col.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div >
        </div >
      )
      }

      {/* Debug Info */}
      {
        debugInfo && (
          <div
            className={cn(
              'max-w-5xl mx-auto px-4 py-4 mb-4 rounded-xl text-[11px] font-mono',
              isDark ? 'bg-white/[0.02] border border-white/[0.15]' : 'bg-gray-50 border border-gray-200'
            )}
          >
            <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
              wallet_type:{' '}
              <span className="text-[#137DFE]">{debugInfo.wallet_type || 'undefined'}</span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
              account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
              walletKeyId:{' '}
              <span className={debugInfo.walletKeyId ? 'text-[#08AA09]' : 'text-red-400'}>
                {debugInfo.walletKeyId || 'undefined'}
              </span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-500'}>
              seed: <span className="text-[#08AA09] break-all">{debugInfo.seed}</span>
            </div>
          </div>
        )
      }

      {/* P/L Card Modal */}
      {
        showPLCard && (accountInfo || nftStats) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowPLCard(false)}>
            <div onClick={e => e.stopPropagation()} className="relative w-[400px]">
              {/* Card for display and capture */}
              <div
                ref={plCardRef}
                className={cn("w-full p-6 rounded-2xl", isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200")}
              >
                {/* Header with logo */}
                <div className="flex items-center justify-between mb-4">
                  <img src={isDark ? "/logo/xrpl-to-logo-white.svg" : "/logo/xrpl-to-logo-black.svg"} alt="XRPL.to" className="h-5" />
                  <span className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                    {plType === 'token' ? 'Token Stats' : plType === 'nft' ? 'NFT Stats' : 'Trading Stats'}
                  </span>
                </div>

                {/* Type Toggle - Inside card */}
                {(accountInfo?.totalTrades > 0 || nftStats?.totalTrades > 0) && (
                  <div className={cn("flex items-center gap-1 p-1 rounded-lg mb-5", isDark ? "bg-white/5" : "bg-gray-100")}>
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
                            ? isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm"
                            : isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700"
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
                  <div className={cn("text-[9px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>Wallet</div>
                  <div className={cn("text-xs font-mono", isDark ? "text-white/60" : "text-gray-600")}>{address?.slice(0, 12)}...{address?.slice(-8)}</div>
                </div>

                {/* Main P/L - Dynamic based on plType */}
                {(() => {
                  const tokenPnl = accountInfo?.pnl || 0;
                  const tokenRoi = accountInfo?.roi || 0;
                  const nftPnl = (nftStats?.profit || 0) + (nftStats?.unrealizedProfit || 0);
                  const nftRoi = nftStats?.roi || 0;
                  const pnl = plType === 'token' ? tokenPnl : plType === 'nft' ? nftPnl : tokenPnl + nftPnl;
                  const roi = plType === 'token' ? tokenRoi : plType === 'nft' ? nftRoi : (tokenPnl + nftPnl) !== 0 ? ((tokenRoi * Math.abs(tokenPnl) + nftRoi * Math.abs(nftPnl)) / (Math.abs(tokenPnl) + Math.abs(nftPnl))) : 0;
                  return (
                    <div className="mb-5">
                      <div className={cn("text-[9px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>Total P/L</div>
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
                      <div className={cn("text-[9px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</div>
                      <div className={cn("text-lg font-semibold tabular-nums", isDark ? "text-white" : "text-gray-900")}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Win/Loss or NFT-specific stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {plType === 'nft' ? (
                    <>
                      <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-gray-50")}>
                        <div className={cn("text-[9px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>Realized</div>
                        <div className={cn("font-semibold tabular-nums", (nftStats?.profit || 0) >= 0 ? "text-[#08AA09]" : "text-red-400")}>
                          {(nftStats?.profit || 0) >= 0 ? '+' : ''}{(nftStats?.profit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                        </div>
                      </div>
                      <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-gray-50")}>
                        <div className={cn("text-[9px] uppercase tracking-wider mb-1", isDark ? "text-white/30" : "text-gray-400")}>Unrealized</div>
                        <div className={cn("font-semibold tabular-nums", (nftStats?.unrealizedProfit || 0) >= 0 ? "text-[#08AA09]" : "text-amber-400")}>
                          {(nftStats?.unrealizedProfit || 0) >= 0 ? '+' : ''}{(nftStats?.unrealizedProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-gray-50")}>
                        <div className="text-[#08AA09]/50 text-[9px] uppercase tracking-wider mb-1">Best Trade</div>
                        <div className="text-[#08AA09] font-semibold tabular-nums">+{(accountInfo?.maxProfitTrade || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP</div>
                      </div>
                      <div className={cn("rounded-xl p-3 text-center", isDark ? "bg-white/5" : "bg-gray-50")}>
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
                  <div className={cn("flex items-center justify-center gap-4 text-[11px] pt-2", isDark ? "text-white/40" : "text-gray-500")}>
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
                      ctx.font = `${weight} ${size * scale}px Inter, system-ui, sans-serif`;
                      ctx.textAlign = align;
                      ctx.fillText(t, x * scale, y * scale);
                    };

                    // Load and draw logo
                    const logoSrc = isDark ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
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
                  className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors", isDark ? "bg-white text-black hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800")}
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
                      ctx.font = `${weight} ${size * scale}px Inter, system-ui, sans-serif`;
                      ctx.textAlign = align;
                      ctx.fillText(t, x * scale, y * scale);
                    };

                    // Load and draw logo
                    const logoSrc = isDark ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';
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
                  className={cn("p-3 rounded-xl transition-colors", isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600")}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBurnModal(null)} />
            <div className={cn(
              "relative w-full max-w-sm rounded-2xl border p-6",
              isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative", isDark ? "bg-orange-500/10 border border-orange-500/20" : "bg-orange-50 border border-orange-200")}>
                  {burnModal.md5 ? (
                    <img src={`https://s1.xrpl.to/token/${burnModal.md5}`} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <Flame size={26} className="text-orange-500" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                    <Flame size={10} className="text-white" />
                  </div>
                </div>
                <h3 className={cn("text-[16px] font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>Burn {burnModal.symbol}</h3>
                <p className={cn("text-[12px] mb-4", isDark ? "text-white/40" : "text-gray-500")}>
                  Permanently destroy tokens
                </p>
                <div className={cn("w-full mb-3", isDark ? "text-white/50" : "text-gray-500")}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px]">Amount to burn</p>
                    <p className="text-[10px]">Balance: <span className={isDark ? "text-white/70" : "text-gray-700"}>{burnModal.amount}</span></p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl text-[14px] font-mono outline-none border transition-colors",
                        parseFloat(burnAmount) > burnModal.rawAmount
                          ? "border-red-500 focus:border-red-500"
                          : isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500"
                      )}
                    />
                    <button onClick={() => setBurnAmount(String(burnModal.rawAmount))} className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-2 py-1 rounded-md", isDark ? "text-orange-400 hover:bg-orange-400/10" : "text-orange-600 hover:bg-orange-50")}>
                      MAX
                    </button>
                  </div>
                  {parseFloat(burnAmount) > burnModal.rawAmount && (
                    <p className="text-[10px] mt-1.5 text-right text-red-400">Exceeds balance</p>
                  )}
                  {burnAmount && parseFloat(burnAmount) > 0 && parseFloat(burnAmount) <= burnModal.rawAmount && (
                    <div className="flex justify-between mt-1.5">
                      {burnModal.price > 0 && (
                        <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                          ≈ {(parseFloat(burnAmount) * burnModal.price).toFixed(2)} XRP
                        </p>
                      )}
                      {burnModal.percentOwned > 0 && (
                        <p className={cn("text-[10px]", isDark ? "text-orange-400/70" : "text-orange-600")}>
                          {(() => {
                            const pct = (parseFloat(burnAmount) / burnModal.rawAmount) * burnModal.percentOwned;
                            return pct >= 0.01 ? pct.toFixed(2) : pct >= 0.0001 ? pct.toFixed(4) : pct.toExponential(2);
                          })()}% of supply
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn("w-full flex items-start gap-2 rounded-lg p-2.5 mb-4 text-left", isDark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100")}>
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className={cn("text-[10px]", isDark ? "text-red-400/80" : "text-red-600")}>This action cannot be undone. Tokens sent to issuer are permanently destroyed.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setBurnModal(null)}
                    className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTradeModal(null)} />
            <div className={cn(
              "relative w-full max-w-[340px] rounded-2xl border p-5",
              isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
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
                      <h3 className={cn("text-[14px] font-semibold leading-tight", isDark ? "text-white" : "text-gray-900")}>{tradeModal.symbol}</h3>
                      <p className={cn("text-[11px] font-mono", isDark ? "text-white/40" : "text-gray-400")}>
                        {(() => { const p = tradeModal.price || 0; return p >= 1 ? p.toFixed(4) : p >= 0.0001 ? p.toFixed(6) : p >= 0.00000001 ? p.toFixed(10) : p.toFixed(15); })()} XRP
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setTradeModal(null)} className={cn("p-1.5 rounded-lg -mr-1", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                    <X size={16} className={isDark ? "text-white/40" : "text-gray-400"} />
                  </button>
                </div>

                {/* Direction Toggle */}
                <div className={cn("flex rounded-lg p-0.5 mb-4", isDark ? "bg-white/[0.04]" : "bg-gray-100")}>
                  <button onClick={() => setTradeDirection('sell')} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", tradeDirection === 'sell' ? "bg-red-500/15 text-red-400" : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>
                    Sell
                  </button>
                  <button onClick={() => setTradeDirection('buy')} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", tradeDirection === 'buy' ? "bg-[#08AA09]/15 text-[#08AA09]" : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>
                    Buy
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-3">
                  <div className={cn("flex justify-between items-center mb-1.5 text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                    <span>{tradeDirection === 'sell' ? 'You sell' : 'You pay'}</span>
                    {tradeDirection === 'sell' && (
                      <button onClick={() => setTradeAmount(String(tradeModal.rawAmount))} className="hover:underline">
                        Bal: <span className={isDark ? "text-white/60" : "text-gray-600"}>{tradeModal.rawAmount >= 1000000 ? `${(tradeModal.rawAmount / 1000000).toFixed(2)}M` : tradeModal.rawAmount >= 1000 ? `${(tradeModal.rawAmount / 1000).toFixed(2)}K` : tradeModal.rawAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </button>
                    )}
                  </div>
                  <div className={cn("flex items-center rounded-xl border transition-colors", isDark ? "bg-white/[0.03] border-white/10 focus-within:border-[#137DFE]/40" : "bg-gray-50 border-gray-200 focus-within:border-[#137DFE]")}>
                    <input
                      type="text"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0"
                      className={cn(
                        "flex-1 px-3 py-2.5 bg-transparent text-[16px] font-mono outline-none",
                        isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300"
                      )}
                    />
                    <div className={cn("flex items-center gap-1.5 pr-3", isDark ? "text-white/50" : "text-gray-500")}>
                      {tradeDirection === 'sell' && tradeModal.md5 && <img src={`https://s1.xrpl.to/token/${tradeModal.md5}`} alt="" className="w-4 h-4 rounded-full" />}
                      <span className="text-[11px] font-medium">{tradeDirection === 'sell' ? tradeModal.symbol : 'XRP'}</span>
                    </div>
                  </div>
                </div>

                {/* Quote Results */}
                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className={cn("rounded-xl p-3 mb-3", isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-100")}>
                    {quoteLoading ? (
                      <div className={cn("text-[11px] animate-pulse", isDark ? "text-white/40" : "text-gray-400")}>Getting quote...</div>
                    ) : tradeQuote?.error ? (
                      <div className="text-[11px] text-red-400">{tradeQuote.error}</div>
                    ) : tradeQuote ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>You receive</span>
                          <span className={cn("text-[13px] font-mono font-medium", isDark ? "text-[#08AA09]" : "text-green-600")}>
                            {(() => {
                              const val = parseFloat(tradeDirection === 'sell' ? tradeQuote.source_amount?.value : tradeQuote.destination_amount?.value) || 0;
                              const decimals = val >= 1 ? 4 : val >= 0.0001 ? 6 : val >= 0.00000001 ? 10 : 15;
                              return `${val.toFixed(decimals)} ${tradeDirection === 'sell' ? 'XRP' : tradeModal.symbol}`;
                            })()}
                          </span>
                        </div>
                        <div className={cn("flex justify-between text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>
                          <span>Min received ({tradeSlippage}% slip)</span>
                          <span className="font-mono">{(() => {
                            const val = parseFloat(tradeQuote.minimum_received) || 0;
                            const decimals = val >= 1 ? 4 : val >= 0.0001 ? 6 : val >= 0.00000001 ? 10 : 15;
                            return val.toFixed(decimals);
                          })()} {tradeDirection === 'sell' ? 'XRP' : tradeModal.symbol}</span>
                        </div>
                        {tradeQuote.price_impact && (
                          <div className={cn("flex justify-between text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>
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
                  <div className={cn("flex items-center justify-between mb-2", isDark ? "text-white/40" : "text-gray-400")}>
                    <span className="text-[10px]">Slippage tolerance</span>
                    <span className={cn("text-[10px] font-mono", isDark ? "text-white/60" : "text-gray-500")}>{tradeSlippage}%</span>
                  </div>
                  <div className={cn("flex rounded-lg p-0.5", isDark ? "bg-white/[0.04]" : "bg-gray-100")}>
                    {[0.5, 1, 2, 'custom'].map(v => (
                      <button
                        key={v}
                        onClick={() => v !== 'custom' && setTradeSlippage(v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                          (v === 'custom' ? ![0.5, 1, 2].includes(tradeSlippage) : tradeSlippage === v)
                            ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm")
                            : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")
                        )}
                      >
                        {v === 'custom' ? (
                          <input
                            type="text"
                            value={![0.5, 1, 2].includes(tradeSlippage) ? tradeSlippage : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              if (val === '') return;
                              setTradeSlippage(Math.max(0.1, Math.min(50, parseFloat(val) || 0.5)));
                            }}
                            placeholder="Custom"
                            className={cn("w-full text-center bg-transparent outline-none text-[10px] font-medium", isDark ? "placeholder:text-white/30" : "placeholder:text-gray-400")}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDustConfirm(null)} />
            <div className={cn(
              "relative w-full max-w-sm rounded-2xl border p-6",
              isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex flex-col items-center text-center">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", dustConfirm.step === 'dex' ? (isDark ? "bg-[#137DFE]/10 border border-[#137DFE]/20" : "bg-blue-50 border border-blue-200") : (isDark ? "bg-[#F6AF01]/10 border border-[#F6AF01]/20" : "bg-amber-50 border border-amber-200"))}>
                  {dustConfirm.step === 'dex' ? <ArrowRightLeft size={26} className="text-[#137DFE]" /> : <Sparkles size={26} className="text-[#F6AF01]" />}
                </div>
                <h3 className={cn("text-[16px] font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                  {dustConfirm.step === 'dex' ? 'Sell Dust on DEX?' : 'Burn by Sending to Issuer?'}
                </h3>
                <p className={cn("text-[12px] mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                  {dustConfirm.step === 'dex' ? 'Create a sell order to clear your tiny balance' : 'DEX sell failed. Send tokens back to issuer?'}
                </p>
                <div className={cn("w-full rounded-xl p-3 mb-3", isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-100")}>
                  <p className={cn("font-mono text-[15px] font-semibold", isDark ? "text-white" : "text-gray-900")}>{dustConfirm.token.amount} {dustConfirm.token.symbol}</p>
                  <p className={cn("text-[11px] mt-0.5", isDark ? "text-white/30" : "text-gray-400")}>Value: &lt; 0.01 XRP</p>
                </div>
                <div className={cn("w-full flex items-start gap-2 rounded-lg p-2.5 mb-4 text-left", isDark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100")}>
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className={cn("text-[10px]", isDark ? "text-red-400/80" : "text-red-600")}>This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDustConfirm(null)}
                    className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
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

      <Footer />
    </>
  );
}
