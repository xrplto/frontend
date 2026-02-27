import api, { submitTransaction, previewTransaction } from 'src/utils/api';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import Decimal from 'decimal.js-light';
import { useRouter } from 'next/router';

// Set Decimal precision immediately after import
Decimal.set({ precision: 50 });

import { ClipLoader } from './Spinners';

// Lucide React Icons
import {
  Wallet as WalletIcon,
  ChevronDown,
  CheckCircle,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Info as InfoIcon,
  Share2,
  Search,
  ArrowLeft,
  TrendingUp,
  Settings,
  Zap,
  Flame
} from 'lucide-react';

import { ApiButton } from './ApiEndpointsModal';
import BoostModal from './BoostModal';
import NFTQuickBuy from './NFTQuickBuy';

// Utils
import { cn } from 'src/utils/cn';

// Context
import { useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';
import { processOrderbookOffers } from 'src/utils/parseUtils';

// Components
import { ConnectWallet } from 'src/components/Wallet';

// Constants
const PLATFORM_FEE_ADDRESS = 'rxrpLTomVR5DpqHbro9J36jUAw8Pzsku8';
const PLATFORM_FEE_RATE = 0.004; // 0.4% (launch special)

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const BASE_URL = 'https://api.xrpl.to/v1';
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';

// Tiny inline sparkline SVG
const MiniSparkline = memo(({ data, color, width = 48, height = 16 }) => {
  if (!data?.length || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
MiniSparkline.displayName = 'MiniSparkline';

const fmtStat = (n) => {
  if (!n) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
};

const ExchangeButton = memo(({ onClick, disabled, children, className, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'w-full rounded-xl border-[1.5px] px-4 py-3 text-[14px] font-normal tracking-wide transition-colors',
      disabled
        ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
        : 'border-primary bg-primary text-white hover:bg-primary/90',
      'sm:py-2.5 sm:text-[13px]',
      className
    )}
    {...props}
  >
    {children}
  </button>
));

const AllowButton = memo(({ onClick, children, className, ...props }) => (
  <button
    onClick={onClick}
    className={cn(
      'rounded-lg border-[1.5px] px-3 py-1 text-[11px] font-normal transition-all',
      'border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10',
      className
    )}
    {...props}
  >
    {children}
  </button>
));

const ToggleButton = memo(({ onClick, isSwitching, children, ...props }) => (
  <button
    onClick={onClick}
    className={cn(
      'absolute left-1/2 top-1/2 z-[2] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-lg border-[1.5px] transition-all',
      'border-gray-200 bg-white dark:border-white/[0.08] dark:bg-black',
      'hover:border-primary hover:bg-primary hover:text-white',
      isSwitching && 'rotate-180'
    )}
    {...props}
  >
    {children}
  </button>
));

const getPriceImpactColor = (impact) => {
  if (impact <= 1) return '#22C55E'; // Green for low impact
  if (impact <= 3) return '#F59E0B'; // Yellow for medium impact
  return '#EF4444'; // Red for high impact
};

const getPriceImpactSeverity = (impact) => {
  if (impact <= 1) return 'Low';
  if (impact <= 3) return 'Medium';
  return 'High';
};

const WalletDisplay = memo(({ children, ...props }) => (
  <div
    className={cn(
      'mb-2 flex items-center justify-between rounded-lg border-[1.5px] px-2.5 py-2 transition-colors',
      'border-green-500/10 bg-green-500/5 hover:border-green-500/20 hover:bg-green-500/10',
      'sm:mb-1.5 sm:px-2 sm:py-1.5'
    )}
    {...props}
  >
    {children}
  </div>
));

const WalletInfo = ({ children, ...props }) => (
  <div className="flex items-center gap-0.5" {...props}>
    {children}
  </div>
);

const WalletIconBox = ({ children, ...props }) => (
  <div
    className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/10 text-green-500"
    {...props}
  >
    {children}
  </div>
);

const WalletDetails = ({ children, ...props }) => (
  <div className="flex flex-col gap-0" {...props}>
    {children}
  </div>
);

const WalletAddress = ({ children, ...props }) => (
  <span
    className={cn(
      'text-[12px] font-medium leading-tight sm:text-[11px]',
      'text-black dark:text-white'
    )}
    {...props}
  >
    {children}
  </span>
);

const WalletType = ({ children, ...props }) => (
  <span className="text-[10px] font-normal capitalize leading-tight text-green-500" {...props}>
    {children}
  </span>
);

const StatusIndicator = () => (
  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
);

// Token Selector Components
const MAX_RECENT_SEARCHES = 6;

const TokenImage = ({ className, ...props }) => (
  <img className={cn('rounded-full overflow-hidden border border-white/10', className)} {...props} />
);


const PanelContainer = ({ className, children, ...props }) => (
  <div
    className={cn(
      'w-full max-w-[540px] mx-auto max-h-[80dvh] h-[600px] rounded-xl flex flex-col overflow-hidden border-[1.5px] shadow-none',
      'dark:bg-[#020a1a] dark:border-white/[0.12]',
      'bg-white border-black/[0.12]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const PanelHeader = ({ className, children, ...props }) => (
  <div className={cn('p-3 border-b dark:border-white/[0.08] border-black/[0.08]', className)} {...props}>
    {children}
  </div>
);

const SearchContainer = ({ className, children, ...props }) => (
  <div className={cn('px-3 pt-3 pb-2 border-b dark:border-white/[0.08] border-black/[0.08]', className)} {...props}>
    {children}
  </div>
);

const ScrollableContent = ({ className, children, ...props }) => (
  <div className={cn('flex-1 overflow-hidden flex flex-col p-2 pb-4', className)} {...props}>
    {children}
  </div>
);

const TokenCard = ({ className, children, ...props }) => (
  <div
    className={cn(
      'p-3 rounded-xl cursor-pointer border border-transparent',
      'hover:bg-blue-500/[0.04] hover:border-blue-500/[0.12]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

function Swap({ pair, setPair, revert, setRevert, bids: propsBids, asks: propsAsks }) {
  const router = useRouter();

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const curr1 = pair?.curr1;
  const curr2 = pair?.curr2;

  const { darkMode } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { setLoading, sync, setSync, openSnackbar, activeFiatCurrency, trustlineUpdate, setTrustlineUpdate } =
    useContext(AppContext);
  const isDark = darkMode;

  const [token1, setToken1] = useState(curr1);
  const [token2, setToken2] = useState(curr2);

  const [amount1, setAmount1] = useState(''); // XRP
  const [amount2, setAmount2] = useState(''); // Token

  const [tokenExch1, setTokenExch1] = useState(0);
  const [tokenExch2, setTokenExch2] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);

  const [active, setActive] = useState('AMOUNT');

  const [accountPairBalance, setAccountPairBalance] = useState(null);

  const [focusTop, setFocusTop] = useState(false);
  const [focusBottom, setFocusBottom] = useState(false);

  const [isSwitching, setIsSwitching] = useState(false);
  const [trustlines, setTrustlines] = useState([]);
  const [hasTrustline1, setHasTrustline1] = useState(true);
  const [hasTrustline2, setHasTrustline2] = useState(true);
  const [transactionType, setTransactionType] = useState('');

  // Add slippage state (persist in localStorage)
  const [slippage, setSlippage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swap_slippage');
      return saved ? parseFloat(saved) : 2;
    }
    return 2;
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [txFee, setTxFee] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swap_txfee') || '12';
    }
    return '12';
  });
  const [tradeMode, setTradeMode] = useState('tokens'); // 'tokens' or 'nfts'
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('never'); // 'never', '1h', '24h', '7d', '30d', 'custom'
  const [customExpiry, setCustomExpiry] = useState(24); // hours for custom expiry
  const [showOrders, setShowOrders] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [orderBookPos, setOrderBookPos] = useState({ x: 100, y: 100 });
  const [isDraggingOB, setIsDraggingOB] = useState(false);
  const dragOffsetOB = useRef({ x: 0, y: 0 });
  const asksContainerRef = useRef(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showDepthPanel, setShowDepthPanel] = useState(false);
  const amount1Ref = useRef(null);

  // Trending tokens state
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [boostToken, setBoostToken] = useState(null);
  const [sparklines, setSparklines] = useState({});
  const [platformStats, setPlatformStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);

  // Transaction preview state (simulation results)
  const [txPreview, setTxPreview] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);

  // User open offers state
  const [userOffers, setUserOffers] = useState([]);
  const [cancellingOffer, setCancellingOffer] = useState(null);

  // Track recent trustline update to skip stale API responses
  const trustlineUpdateRef = useRef(null);

  // Persist slippage & txFee
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swap_slippage', slippage.toString());
    }
  }, [slippage]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swap_txfee', txFee);
    }
  }, [txFee]);

  // Floating orderbook drag handlers
  const handleDragStartOB = (e) => {
    setIsDraggingOB(true);
    dragOffsetOB.current = {
      x: e.clientX - orderBookPos.x,
      y: e.clientY - orderBookPos.y
    };
  };

  useEffect(() => {
    if (!isDraggingOB) return;
    const handleMove = (e) => {
      setOrderBookPos({
        x: e.clientX - dragOffsetOB.current.x,
        y: e.clientY - dragOffsetOB.current.y
      });
    };
    const handleUp = () => setIsDraggingOB(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingOB]);

  // Orderbook state
  const [bids, setBids] = useState(propsBids || []);
  const [asks, setAsks] = useState(propsAsks || []);

  // Scroll asks to bottom when orderbook opens or limit price changes
  useEffect(() => {
    if (showOrderbook && asksContainerRef.current) {
      asksContainerRef.current.scrollTop = asksContainerRef.current.scrollHeight;
    }
  }, [showOrderbook, asks, limitPrice]);

  // Fetch orderbook via REST API - only when limit order or orderbook view is enabled
  useEffect(() => {
    // Only fetch when user needs orderbook data
    if (orderType !== 'limit' && !showOrderbook) return;
    if (!token1?.currency || !token2?.currency) return;

    const controller = new AbortController();

    async function fetchOrderbook() {
      try {
        const params = new URLSearchParams({
          base_currency: token1.currency,
          quote_currency: token2.currency,
          limit: '60'
        });
        if (token1.currency !== 'XRP' && token1.issuer) params.append('base_issuer', token1.issuer);
        if (token2.currency !== 'XRP' && token2.issuer)
          params.append('quote_issuer', token2.issuer);

        const res = await api.get(`${BASE_URL}/orderbook?${params}`, {
          signal: controller.signal
        });
        if (res.data?.success) {
          const parseBids = (res.data.bids || []).map((b) => ({
            ...b,
            price: parseFloat(b.price) || 0,
            amount: parseFloat(b.amount) || 0,
            total: parseFloat(b.total) || 0
          }));
          const parseAsks = (res.data.asks || []).map((a) => ({
            ...a,
            price: parseFloat(a.price) || 0,
            amount: parseFloat(a.amount) || 0,
            total: parseFloat(a.total) || 0
          }));
          setBids(parseBids);
          setAsks(parseAsks);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Orderbook fetch error:', err);
        }
      }
    }

    fetchOrderbook();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchOrderbook();
    }, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchOrderbook();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token1, token2, orderType, showOrderbook]);

  // Fetch user open offers for the current pair
  const fetchUserOffersInner = useCallback(async (signal) => {
    if (orderType !== 'limit' || !accountProfile?.account || !token1?.currency || !token2?.currency) {
      setUserOffers([]);
      return;
    }
    try {
      const res = await api.get(`${BASE_URL}/account/offers/${accountProfile.account}?limit=50`, signal ? { signal } : undefined);
      if (signal?.aborted) return;
      const offers = res.data?.offers || [];

      const matchesCurrency = (obj, tok) => {
        if (!obj) return false;
        if (tok.currency === 'XRP') return obj.currency === 'XRP';
        return obj.currency === tok.currency && obj.issuer === tok.issuer;
      };

      const filtered = offers.filter((o) => {
        const getsMatch1 = matchesCurrency(o.gets, token1) && matchesCurrency(o.pays, token2);
        const getsMatch2 = matchesCurrency(o.gets, token2) && matchesCurrency(o.pays, token1);
        return getsMatch1 || getsMatch2;
      }).map((o) => {
        const isSell = matchesCurrency(o.gets, token1);
        const getsVal = parseFloat(o.gets.value) || 0;
        const paysVal = parseFloat(o.pays.value) || 0;
        return {
          seq: o.seq,
          side: isSell ? 'Sell' : 'Buy',
          price: isSell && getsVal > 0 ? paysVal / getsVal : paysVal > 0 ? getsVal / paysVal : 0,
          amount: isSell ? getsVal : paysVal
        };
      });
      if (!signal?.aborted) setUserOffers(filtered);
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to fetch user offers:', err);
      }
    }
  }, [orderType, accountProfile?.account, token1, token2]);

  const fetchUserOffers = useCallback(() => fetchUserOffersInner(), [fetchUserOffersInner]);

  useEffect(() => {
    const controller = new AbortController();
    fetchUserOffersInner(controller.signal);
    return () => controller.abort();
  }, [fetchUserOffersInner, sync]);

  const onCancelOffer = useCallback(async (seq) => {
    if (!accountProfile?.account || cancellingOffer) return;
    setCancellingOffer(seq);
    const toastId = toast.loading('Cancelling order...');
    try {
      const { Wallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (!storedPassword) { toast.error('Wallet locked', { id: toastId }); return; }

      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) { toast.error('Wallet error', { id: toastId }); return; }

      const seed = walletData.seed.trim();
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = Wallet.fromSeed(seed, { algorithm });

      const tx = {
        Account: accountProfile.account,
        TransactionType: 'OfferCancel',
        OfferSequence: seq,
        SourceTag: 161803
      };

      const [seqRes, feeRes] = await Promise.all([
        api.get(`${BASE_URL}/submit/account/${accountProfile.account}/sequence`),
        api.get(`${BASE_URL}/submit/fee`)
      ]);

      if (!seqRes?.data?.sequence || !feeRes?.data?.base_fee) throw new Error('Failed to fetch sequence/fee');

      const prepared = { ...tx, Sequence: seqRes.data.sequence, Fee: feeRes.data.base_fee, LastLedgerSequence: seqRes.data.ledger_index + 20 };
      const signed = deviceWallet.sign(prepared);
      const result = await api.post(`${BASE_URL}/submit`, { tx_blob: signed.tx_blob });

      if (result?.data?.engine_result === 'tesSUCCESS') {
        // Optimistic UI: remove the offer immediately
        setUserOffers((prev) => prev.filter((o) => o.seq !== seq));

        toast.loading('Order submitted', { id: toastId, description: 'Waiting for confirmation...' });
        const txHash = signed.hash;
        let validated = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 500));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated) { validated = true; break; }
          } catch (e) { /* continue */ }
        }

        if (validated) {
          toast.success('Order cancelled', { id: toastId, description: `TX: ${txHash.slice(0, 8)}...` });
        } else {
          toast.loading('Cancel submitted', { id: toastId, description: 'Validation pending...' });
        }
        fetchUserOffers();
        setSync((s) => s + 1);
      } else {
        toast.error('Cancel failed', { id: toastId, description: result?.data?.engine_result || 'Unknown error' });
      }
    } catch (err) {
      console.error('Cancel offer error:', err);
      toast.error('Cancel failed', { id: toastId, description: err.message?.slice(0, 50) });
    } finally {
      setCancellingOffer(null);
    }
  }, [accountProfile?.account, cancellingOffer, fetchUserOffers, setSync]);

  // Token Selector Panel states
  const [panel1Open, setPanel1Open] = useState(false);
  const [panel2Open, setPanel2Open] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectorTokens, setSelectorTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [recentTokens, setRecentTokens] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);

  // Hardcoded categories with their API endpoints
  const categories = [
    { value: 'all', label: 'All Tokens' },
    { value: 'trending', label: 'Trending' },
    { value: 'spotlight', label: 'Spotlight' },
    { value: 'new', label: 'New' },
    { value: 'gainers-24h', label: 'Gainers 24h' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];

  // URL parsing and token loading state
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [urlParsed, setUrlParsed] = useState(false);

  const amount = revert ? amount2 : amount1;
  let value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;
  const curr1IsXRP = curr1?.currency === 'XRP';
  const curr2IsXRP = curr2?.currency === 'XRP';

  // Helper function to calculate token price in fiat
  const calculateTokenPrice = useCallback(
    (token, otherToken, amount, tokenExch, activeFiatCurrency, metrics) => {
      try {
        const tokenIsXRP = token?.currency === 'XRP';
        const otherTokenIsXRP = otherToken?.currency === 'XRP';
        const tokenIsRLUSD =
          token?.currency === '524C555344000000000000000000000000000000' || token?.name === 'RLUSD';

        if (activeFiatCurrency === 'XRP') {
          // When display currency is XRP, show XRP value
          if (tokenIsXRP) {
            return new Decimal(amount || 0).toNumber();
          } else if (otherTokenIsXRP && tokenExch > 0) {
            return new Decimal(amount || 0).mul(tokenExch).toNumber();
          } else {
            return 0;
          }
        } else {
          // For other fiat currencies (USD, EUR, etc.)
          if (tokenIsXRP) {
            return new Decimal(amount || 0).div(metrics[activeFiatCurrency] || 1).toNumber();
          } else if (otherTokenIsXRP && tokenIsRLUSD) {
            if (activeFiatCurrency === 'USD') {
              return new Decimal(amount || 0).toNumber();
            } else {
              const usdValue = new Decimal(amount || 0);
              const usdToXrp = new Decimal(metrics['USD'] || 1);
              const targetToXrp = new Decimal(metrics[activeFiatCurrency] || 1);
              return usdValue.mul(usdToXrp).div(targetToXrp).toNumber();
            }
          } else if (otherTokenIsXRP) {
            const xrpValue = new Decimal(amount || 0).mul(tokenExch || 0);
            return xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
          } else {
            return new Decimal(tokenExch || 0)
              .mul(amount || 0)
              .div(metrics[activeFiatCurrency] || 1)
              .toNumber();
          }
        }
      } catch (e) {
        return 0;
      }
    },
    []
  );

  const tokenPrice1 = useMemo(
    () => calculateTokenPrice(token1, token2, amount1, tokenExch1, activeFiatCurrency, metrics),
    [calculateTokenPrice, token1, token2, amount1, tokenExch1, activeFiatCurrency, metrics]
  );

  const tokenPrice2 = useMemo(
    () => calculateTokenPrice(token2, token1, amount2, tokenExch2, activeFiatCurrency, metrics),
    [calculateTokenPrice, token2, token1, amount2, tokenExch2, activeFiatCurrency, metrics]
  );

  const inputPrice = revert ? tokenPrice2 : tokenPrice1;
  const outputPrice = revert ? tokenPrice1 : tokenPrice2;
  const priceImpact = useMemo(() => {
    if (inputPrice <= 0) return 0;

    const result = new Decimal(outputPrice).sub(inputPrice).mul(100).div(inputPrice).toNumber();

    // Round to 2 decimal places
    return Math.round(result * 100) / 100;
  }, [inputPrice, outputPrice]);

  // Helper function to convert hex currency code to readable name
  const getCurrencyDisplayName = (currency, tokenName) => {
    if (currency === 'XRP') return 'XRP';
    if (currency === 'USD') return 'USD';
    if (currency === 'EUR') return 'EUR';
    if (currency === 'BTC') return 'BTC';
    if (currency === 'ETH') return 'ETH';

    // If we have a token name, use it
    if (tokenName && tokenName !== currency) {
      return tokenName;
    }

    // Try to convert hex to ASCII for display
    try {
      if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
        const hex = currency.replace(/00+$/, ''); // Remove trailing zeros
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte > 0) ascii += String.fromCharCode(byte);
        }
        return ascii.toUpperCase() || currency;
      }
    } catch (e) {
      // Fall back to original currency code
    }

    return currency;
  };

  const isWalletConnected = accountProfile && accountProfile.account;
  const isAccountActivated = accountPairBalance !== null;
  const isLoggedIn = isWalletConnected && isAccountActivated;

  let isSufficientBalance = false;
  let errMsg = '';

  if (!isWalletConnected) {
    errMsg = 'Connect your wallet!';
    isSufficientBalance = false;
  } else if (!isAccountActivated) {
    errMsg = 'Account not activated';
    isSufficientBalance = false;
  } else {
    errMsg = '';
    isSufficientBalance = false;

    // Check trustlines first
    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, curr1?.name);
      errMsg = `No trustline for ${displayName}`;
    } else if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, curr2?.name);
      errMsg = `No trustline for ${displayName}`;
    } else {
      // Check balance if trustlines exist
      try {
        const fAmount = parseFloat(amount || 0);
        const fValue = parseFloat(value || 0);
        const accountAmount = parseFloat(accountPairBalance.curr1.value || 0);
        const accountValue = parseFloat(accountPairBalance.curr2.value || 0);

        if (amount1 && amount2) {
          if (fAmount > 0 && fValue > 0) {
            const spendingAmount = revert ? parseFloat(amount2 || 0) : parseFloat(amount1 || 0);
            const availableBalance = revert ? accountValue : accountAmount;

            if (availableBalance >= spendingAmount) {
              isSufficientBalance = true;
            } else {
              errMsg = 'Insufficient wallet balance';
            }
          } else {
            errMsg = 'Insufficient wallet balance';
          }
        }
      } catch (e) {
        errMsg = 'Insufficient wallet balance';
      }
    }
  }

  const canPlaceOrder = isLoggedIn && isSufficientBalance;

  // Handle trustline updates from context (e.g. after creating a trustline elsewhere)
  useEffect(() => {
    if (!trustlineUpdate) return;
    const { issuer, currency, hasTrustline } = trustlineUpdate;
    trustlineUpdateRef.current = { issuer, currency, hasTrustline, ts: Date.now() };
    if (curr1?.issuer === issuer && curr1?.currency === currency) setHasTrustline1(hasTrustline);
    if (curr2?.issuer === issuer && curr2?.currency === currency) setHasTrustline2(hasTrustline);
    setTrustlineUpdate(null);
  }, [trustlineUpdate, curr1, curr2, setTrustlineUpdate]);

  // Check trustlines via API (more reliable than fetching all trustlines)
  useEffect(() => {
    if (!accountProfile?.account) return;

    const recentUpdate = trustlineUpdateRef.current;
    const isRecent = recentUpdate && (Date.now() - recentUpdate.ts < 5000);

    if (curr1 && curr1.currency !== 'XRP' && curr1.issuer) {
      api.get(`${BASE_URL}/account/trustline/${accountProfile.account}/${curr1.issuer}/${encodeURIComponent(curr1.currency)}`)
        .then(res => {
          if (res.data?.success) {
            if (isRecent && recentUpdate.issuer === curr1.issuer && recentUpdate.currency === curr1.currency) return;
            setHasTrustline1(res.data.hasTrustline === true);
          }
        })
        .catch(err => { console.warn('[SwapInterface] Trustline check failed (curr1):', err.message); });
    } else if (curr1?.currency === 'XRP') {
      setHasTrustline1(true);
    }

    if (curr2 && curr2.currency !== 'XRP' && curr2.issuer) {
      api.get(`${BASE_URL}/account/trustline/${accountProfile.account}/${curr2.issuer}/${encodeURIComponent(curr2.currency)}`)
        .then(res => {
          if (res.data?.success) {
            if (isRecent && recentUpdate.issuer === curr2.issuer && recentUpdate.currency === curr2.currency) return;
            setHasTrustline2(res.data.hasTrustline === true);
          }
        })
        .catch(err => { console.warn('[SwapInterface] Trustline check failed (curr2):', err.message); });
    } else if (curr2?.currency === 'XRP') {
      setHasTrustline2(true);
    }
  }, [accountProfile?.account, curr1?.currency, curr1?.issuer, curr2?.currency, curr2?.issuer, sync]);

  // WebSocket-based real-time pair balance updates
  useEffect(() => {
    if (!accountProfile?.account || !curr1?.currency || !curr2?.currency) {
      setAccountPairBalance(null);
      return;
    }
    if (curr1.currency !== 'XRP' && !curr1.issuer) return;
    if (curr2.currency !== 'XRP' && !curr2.issuer) return;

    const account = accountProfile.account;
    const params = new URLSearchParams({
      curr1: curr1.currency,
      issuer1: curr1.currency === 'XRP' ? 'XRPL' : curr1.issuer,
      curr2: curr2.currency,
      issuer2: curr2.currency === 'XRP' ? 'XRPL' : curr2.issuer
    });

    let ws = null;
    let reconnectTimeout = null;
    let attempts = 0;
    const MAX_RECONNECT = 5;

    const connect = async () => {
      try {
        const { getSessionWsUrl } = await import('src/utils/wsToken');
        const wsUrl = await getSessionWsUrl('balancePair', account, Object.fromEntries(new URLSearchParams(params)));
        if (!wsUrl) return;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => { attempts = 0; };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'initial' || data.e === 'pair') {
              setAccountPairBalance(data.pair);
            }
          } catch (err) {
            console.error('[Swap WS] Parse error:', err);
          }
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
          if (attempts < MAX_RECONNECT) {
            const delay = Math.min(3000 * Math.pow(2, attempts), 60000);
            attempts++;
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
      } catch (e) {
        if (attempts < MAX_RECONNECT) {
          const delay = Math.min(3000 * Math.pow(2, attempts), 60000);
          attempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [accountProfile?.account, curr1?.currency, curr1?.issuer, curr2?.currency, curr2?.issuer, sync, isSwapped]);

  useEffect(() => {
    function getTokenPrice() {
      // Check if tokens have required md5 properties
      if (!token1?.md5 || !token2?.md5) {
        return;
      }

      const md51 = token1.md5;
      const md52 = token2.md5;

      // Get dynamic exchange rates from API
      api
        .get(`${BASE_URL}/stats/rates?md51=${md51}&md52=${md52}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            // Use the rates as they come from the API
            setTokenExch1(Number(ret.rate1) || 0);
            setTokenExch2(Number(ret.rate2) || 0);
          }
        })
        .catch((err) => { });
    }

    // Only call if both tokens exist
    if (token1 && token2) {
      getTokenPrice();
    }
  }, [token1, token2]);

  useEffect(() => {
    // Calculate when token prices change
    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    // For XRP pairs, we only need one rate. For non-XRP pairs, we need both rates.
    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0 // XRP pair: need at least one rate
        : tokenExch1 > 0 && tokenExch2 > 0; // Non-XRP pair: need both rates

    if (hasValidRates) {
      if (active === 'AMOUNT' && amount && amount !== '') {
        const newValue = calcQuantity(amount, active);
        if (newValue && newValue !== value && newValue !== '0') {
          setValue(newValue);
        }
      } else if (active === 'VALUE' && value && value !== '') {
        const newAmount = calcQuantity(value, active);
        if (newAmount && newAmount !== amount && newAmount !== '0') {
          setAmount(newAmount);
        }
      }
    }
  }, [tokenExch1, tokenExch2, revert, active]);

  useEffect(() => {
    const newCurr1 = revert ? token2 : token1;
    const newCurr2 = revert ? token1 : token2;
    // Skip when pair hasn't actually changed (e.g. revert toggle double-swaps to same pair)
    if (newCurr1?.md5 !== curr1?.md5 || newCurr2?.md5 !== curr2?.md5) {
      setPair({ curr1: newCurr1, curr2: newCurr2 });
    }
  }, [revert, token1, token2]);

  // Swap quote from API
  const [swapQuoteApi, setSwapQuoteApi] = useState(null);
  const [quoteRequiresTrustline, setQuoteRequiresTrustline] = useState(null); // null or { currency, issuer, limit }
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteAbortRef = useRef(null);

  // Fetch swap quote from API (works with or without login)
  useEffect(() => {
    if (orderType !== 'market') return;
    if (!amount2 || parseFloat(amount2) <= 0 || !token2?.currency) {
      setSwapQuoteApi(null);
      setQuoteRequiresTrustline(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (quoteAbortRef.current) quoteAbortRef.current.abort();
      quoteAbortRef.current = new AbortController();

      setQuoteLoading(true);
      try {
        const destAmount =
          token2.currency === 'XRP'
            ? { currency: 'XRP', value: amount2 }
            : { currency: token2.currency, issuer: token2.issuer, value: amount2 };

        // Use logged-in account or default quote account
        const quoteAccount = accountProfile?.account || 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';

        const res = await api.post(
          `${BASE_URL}/dex/quote`,
          {
            source_account: quoteAccount,
            destination_amount: destAmount,
            source_currencies:
              token1?.currency === 'XRP'
                ? [{ currency: 'XRP' }]
                : [{ currency: token1.currency, issuer: token1.issuer }],
            slippage: slippage / 100
          },
          { signal: quoteAbortRef.current.signal }
        );

        if (res.data?.status === 'success' && res.data.quote) {
          setSwapQuoteApi(res.data.quote);
          setQuoteRequiresTrustline(res.data.requiresTrustline || null);
        } else {
          setSwapQuoteApi(null);
          setQuoteRequiresTrustline(null);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setSwapQuoteApi(null);
          setQuoteRequiresTrustline(null);
        }
      } finally {
        setQuoteLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [amount2, token1, token2, accountProfile?.account, slippage, orderType]);

  // Client-side fallback calculation from orderbook
  const swapQuoteFallback = useMemo(() => {
    if (!amount1 || !amount2 || parseFloat(amount1) <= 0 || parseFloat(amount2) <= 0) return null;
    if (!asks.length && !bids.length) return null;

    const inputAmt = parseFloat(amount1);
    const outputAmt = parseFloat(amount2);
    const minReceived = outputAmt * (1 - slippage / 100);

    const relevantOrders = revert ? bids : asks;
    let orderbookFill = 0;
    let remaining = outputAmt;

    for (const order of relevantOrders) {
      if (remaining <= 0) break;
      const filled = Math.min(parseFloat(order.amount) || 0, remaining);
      orderbookFill += filled;
      remaining -= filled;
    }

    const ammFill = remaining > 0 ? remaining : 0;
    const bestPrice = revert ? bids[0]?.price || 0 : asks[0]?.price || 0;
    const effectivePrice = outputAmt > 0 ? inputAmt / outputAmt : 0;
    const impactPct = bestPrice > 0 ? ((effectivePrice - bestPrice) / bestPrice) * 100 : 0;
    const ammFeeXrp = ammFill > 0 && bestPrice > 0 ? ammFill * bestPrice * 0.006 : 0;

    return {
      slippage_tolerance: `${slippage}%`,
      minimum_received: minReceived.toFixed(6),
      from_orderbook: orderbookFill > 0 ? orderbookFill.toFixed(6) : null,
      from_amm: ammFill > 0.000001 ? ammFill.toFixed(6) : null,
      price_impact:
        Math.abs(impactPct) > 0.01 ? `${impactPct > 0 ? '+' : ''}${impactPct.toFixed(2)}%` : null,
      amm_pool_fee: ammFeeXrp > 0.000001 ? `${ammFeeXrp.toFixed(4)} XRP` : null,
      execution_rate: (outputAmt / inputAmt).toFixed(6)
    };
  }, [amount1, amount2, asks, bids, slippage, revert]);

  // Show fallback immediately, API quote when ready (no blocking)
  const swapQuoteCalc = swapQuoteApi || swapQuoteFallback;

  const onSwap = async () => {
    const currentOrderType = orderType;
    const currentLimitPrice = limitPrice;
    const currentRevert = revert;

    const fAmount = Number(amount1);
    const fValue = Number(amount2);

    if (!(fAmount > 0 && fValue > 0)) {
      toast.error('Invalid values');
      return;
    }
    if (currentOrderType === 'limit' && !currentLimitPrice) {
      toast.error('Please enter a limit price');
      return;
    }
    if (!accountProfile?.account) {
      toast.error('Please connect wallet');
      return;
    }

    const toastId = toast.loading('Processing swap...', { description: 'Preparing transaction' });

    try {
      const { Wallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        toast.error('Wallet locked', { id: toastId, description: 'Please unlock your wallet first' });
        return;
      }

      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) {
        toast.error('Wallet error', { id: toastId, description: 'Could not retrieve credentials' });
        return;
      }

      const seed = walletData.seed.trim();
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = Wallet.fromSeed(seed, { algorithm });

      // Auto-create trustlines if needed
      const needsTrustline1 = !hasTrustline1 && curr1.currency !== 'XRP';
      const needsTrustline2 = !hasTrustline2 && curr2.currency !== 'XRP';

      if (needsTrustline1) {
        toast.loading('Processing swap...', { id: toastId, description: `Setting trustline for ${curr1.name || curr1.currency}` });
        const success = await onCreateTrustline(curr1, true);
        if (!success) {
          toast.error('Trustline failed', { id: toastId });
          return;
        }
        setHasTrustline1(true);
        setSync((s) => s + 1);
      }
      if (needsTrustline2) {
        toast.loading('Processing swap...', { id: toastId, description: `Setting trustline for ${curr2.name || curr2.currency}` });
        const success = await onCreateTrustline(curr2, true);
        if (!success) {
          toast.error('Trustline failed', { id: toastId });
          return;
        }
        setHasTrustline2(true);
        setSync((s) => s + 1);
      }

      const createdTrustline = needsTrustline1 || needsTrustline2;

      // Recalculate amounts if we created a trustline and are paying XRP
      let fAmount1Final = fAmount;
      let fValue1Final = fValue;

      if (curr1.currency === 'XRP' && createdTrustline) {
        try {
          const balRes = await api.get(`${BASE_URL}/account/balance/${accountProfile.account}`);
          let newXrpAvailable = parseFloat(balRes.data?.spendableDrops || 0) / 1000000;
          const trustlinesCreated = (needsTrustline1 ? 1 : 0) + (needsTrustline2 ? 1 : 0);
          newXrpAvailable = Math.max(0, newXrpAvailable - (trustlinesCreated * 0.2));

          if (newXrpAvailable < fAmount) {
            fAmount1Final = Math.max(0, newXrpAvailable - 0.000015);
            if (fAmount1Final <= 0) {
              toast.error('Insufficient balance', { id: toastId, description: 'Not enough XRP after trustline reserve' });
              return;
            }
            const ratio = fAmount1Final / fAmount;
            fValue1Final = fValue * ratio;
            toast.loading('Processing swap...', { id: toastId, description: `Adjusted to ${fAmount1Final.toFixed(4)} XRP` });
          }
        } catch (e) {
          console.warn('[Swap] Could not refetch balance after trustline:', e);
        }
      }

      toast.loading('Processing swap...', { id: toastId, description: 'Submitting to XRPL' });

      const formatTokenValue = (val) => {
        const n = parseFloat(val);
        return n >= 1 ? n.toPrecision(15).replace(/\.?0+$/, '') : n.toFixed(Math.min(15, Math.max(6, -Math.floor(Math.log10(n)) + 6)));
      };

      if (currentOrderType === 'market') {
        const slippageFactor = slippage / 100;
        let tx;

        if (curr1.currency === 'XRP') {
          const maxXrpDrops = Math.floor(fAmount1Final * (1 + 0.005) * 1000000);
          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final) },
            DeliverMin: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final * (1 - slippageFactor)) },
            SendMax: String(maxXrpDrops),
            Flags: 131072
          };
        } else if (curr2.currency === 'XRP') {
          const userBalance = parseFloat(accountPairBalance?.curr1?.value || 0);
          const isSellingAll = Math.abs(userBalance - fAmount1Final) < 0.000001;
          const targetXrpDrops = Math.floor(fValue1Final * 1000000);
          const minXrpDrops = Math.max(Math.floor(fValue1Final * (1 - slippageFactor) * 1000000), 1);
          const sendMaxValue = isSellingAll ? userBalance : fAmount1Final * 1.005;

          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: String(targetXrpDrops),
            DeliverMin: String(minXrpDrops),
            SendMax: { currency: curr1.currency, issuer: curr1.issuer, value: formatTokenValue(sendMaxValue) },
            Flags: 131072
          };
        } else {
          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final) },
            DeliverMin: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final * (1 - slippageFactor)) },
            SendMax: { currency: curr1.currency, issuer: curr1.issuer, value: formatTokenValue(fAmount1Final * 1.005) },
            Flags: 131072
          };
        }

        // Check trustline limit for receiving token
        if (curr2.currency !== 'XRP') {
          const trustlineRes = await api.get(`${BASE_URL}/account/trustline/${accountProfile.account}/${curr2.issuer}/${curr2.currency}`).then(r => r.data);
          const currentBalance = parseFloat(trustlineRes.balance) || 0;
          const currentLimit = parseFloat(trustlineRes.limit) || 0;
          const needed = currentBalance + fValue;

          if (!trustlineRes.hasTrustline || currentLimit < needed) {
            toast.loading('Processing swap...', { id: toastId, description: 'Setting trustline...' });
            const success = await onCreateTrustline(curr2, true);
            if (!success) {
              toast.error('Trustline failed', { id: toastId, description: 'Could not set trustline' });
              return;
            }
          }
        }

        // Simulate transaction first (XLS-69)
        toast.loading('Simulating swap...', { id: toastId });
        try {
          const simResult = await previewTransaction(tx);
          const engineResult = simResult.engine_result;
          const expectedOutput = fValue1Final;
          const actualOutput = simResult.delivered_amount || 0;
          const priceImpactSim = expectedOutput > 0 && actualOutput > 0
            ? ((expectedOutput - actualOutput) / expectedOutput) * 100
            : null;

          const preview = {
            sending: { amount: fAmount1Final, currency: curr1.currency, name: curr1.name || curr1.currency },
            receiving: { expected: expectedOutput, actual: actualOutput, currency: curr2.currency, name: curr2.name || curr2.currency },
            priceImpact: priceImpactSim,
            engineResult,
            status: engineResult === 'tesSUCCESS' ? 'success' : engineResult?.startsWith('tec') ? 'warning' : 'error'
          };

          if (engineResult === 'tecPATH_PARTIAL' || engineResult === 'tecPATH_DRY') {
            toast.loading('Finding available liquidity...', { id: toastId });
            let maxAvailable = null;
            let workingAmount = null;
            let workingOutput = null;

            try {
              const noMinTx = { ...tx };
              delete noMinTx.DeliverMin;
              const availableResult = await previewTransaction(noMinTx);

              if (availableResult.engine_result === 'tesSUCCESS' && availableResult.delivered_amount > 0) {
                maxAvailable = availableResult.delivered_amount;

                toast.loading('Calculating optimal amount...', { id: toastId });
                let low = 0;
                let high = fAmount1Final;
                let bestAmount = null;
                let bestOutput = null;

                for (let i = 0; i < 6; i++) {
                  const mid = (low + high) / 2;
                  const testTx = { ...tx };
                  const testOutput = mid * (expectedOutput / fAmount1Final);
                  const testMin = testOutput * (1 - slippage / 100);

                  if (curr2.currency === 'XRP') {
                    testTx.Amount = String(Math.floor(testOutput * 1000000));
                    testTx.DeliverMin = String(Math.floor(testMin * 1000000));
                  } else {
                    testTx.Amount = { ...testTx.Amount, value: String(testOutput) };
                    testTx.DeliverMin = { ...testTx.DeliverMin, value: String(testMin) };
                  }

                  if (curr1.currency === 'XRP') {
                    testTx.SendMax = String(Math.floor(mid * 1.005 * 1000000));
                  } else {
                    testTx.SendMax = { ...testTx.SendMax, value: String(mid * 1.005) };
                  }

                  try {
                    const testResult = await previewTransaction(testTx);
                    if (testResult.engine_result === 'tesSUCCESS') {
                      bestAmount = mid;
                      bestOutput = testResult.delivered_amount;
                      low = mid;
                    } else {
                      high = mid;
                    }
                  } catch (e) {
                    high = mid;
                  }
                }

                workingAmount = bestAmount;
                workingOutput = bestOutput;
              }
            } catch (e) {
              console.warn('[Swap] Could not determine available liquidity:', e.message);
            }

            const actualSlippagePct = maxAvailable && expectedOutput > 0
              ? ((expectedOutput - maxAvailable) / expectedOutput * 100).toFixed(1)
              : null;

            toast.dismiss(toastId);
            setTxPreview({
              ...preview,
              status: 'error',
              errorMessage: `Insufficient liquidity at ${slippage}% slippage`,
              maxAvailable,
              workingAmount,
              workingOutput,
              actualSlippage: actualSlippagePct,
              suggestedAction: maxAvailable
                ? `Without slippage protection: ~${fNumber(maxAvailable)} ${curr2.name || curr2.currency} (${actualSlippagePct}% slippage)`
                : 'Try a smaller amount or increase slippage tolerance'
            });
            return;
          }

          if (engineResult !== 'tesSUCCESS') {
            toast.dismiss(toastId);
            setTxPreview({
              ...preview,
              status: 'error',
              errorMessage: simResult.engine_result_message || engineResult
            });
            return;
          }

          if (priceImpactSim !== null && priceImpactSim > slippage) {
            toast.dismiss(toastId);
            setTxPreview({
              ...preview,
              status: 'warning',
              warningMessage: `Price impact (${priceImpactSim.toFixed(2)}%) exceeds your ${slippage}% slippage tolerance`
            });
            setPendingTx({ tx, deviceWallet, toastId: null, feeAmounts: { fAmt1: fAmount1Final, fAmt2: fValue1Final, c1: curr1, c2: curr2 } });
            return;
          }

          toast.dismiss(toastId);
          setTxPreview(preview);
          setPendingTx({ tx, deviceWallet, toastId: null, feeAmounts: { fAmt1: fAmount1Final, fAmt2: fValue1Final, c1: curr1, c2: curr2 } });
          return;

        } catch (simErr) {
          console.warn('[Swap] Simulation failed, proceeding without preview:', simErr.message);
        }

        // Fallback: submit directly if simulation unavailable
        toast.loading('Submitting...', { id: toastId });
        const submitResult = await submitTransaction(deviceWallet, tx);
        const txHash = submitResult.hash || submitResult.tx_json?.hash;
        const engineResult = submitResult.engine_result;

        if (engineResult !== 'tesSUCCESS') {
          toast.error('Rejected', { id: toastId, description: engineResult });
          return;
        }

        toast.loading('Submitted', { id: toastId, description: 'Waiting for confirmation...' });
        let validated = false;
        let txResult = null;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 500));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated) {
              validated = true;
              txResult = txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
              break;
            }
          } catch (e) { /* continue */ }
        }

        if (!validated) {
          toast.loading('Swap submitted', { id: toastId, description: 'Validation pending...' });
          setAmount1(''); setAmount2(''); setLimitPrice('');
          setSync((s) => s + 1); setIsSwapped((v) => !v);
          return;
        }

        if (txResult === 'tesSUCCESS') {
          const balanceValue = parseFloat(accountPairBalance?.curr1?.value || 0);
          const soldAllTokens = curr1.currency !== 'XRP' &&
            accountPairBalance?.curr1?.value &&
            Math.abs(balanceValue - fAmount1Final) < 0.000001;

          if (soldAllTokens) {
            const tokenData = { issuer: curr1.issuer, currency: curr1.currency, name: curr1.name };
            toast.success('Swap complete!', {
              id: toastId,
              description: 'Remove trustline to free 0.2 XRP?',
              action: { label: 'Remove', onClick: () => onRemoveTrustline(tokenData) },
              duration: 10000
            });
          } else {
            toast.success('Swap complete!', { id: toastId, description: `TX: ${txHash.slice(0, 8)}...` });
          }
          submitPlatformFee(deviceWallet, fAmount1Final, fValue1Final, curr1, curr2);
          setAmount1(''); setAmount2(''); setLimitPrice('');
          setSync((s) => s + 1); setIsSwapped((v) => !v);
        } else if (txResult === 'tecKILLED') {
          toast.error('No liquidity', { id: toastId, description: 'Order couldn\'t be filled at this price' });
        } else if (txResult === 'tecPATH_PARTIAL' || txResult === 'tecPATH_DRY') {
          toast.error('No liquidity path', { id: toastId, description: 'Try a smaller amount or increase slippage' });
        } else if (txResult === 'tecUNFUNDED_PAYMENT') {
          toast.error('Insufficient funds', { id: toastId, description: 'Not enough balance for this swap' });
        } else {
          toast.error('Swap failed', { id: toastId, description: txResult });
        }
      } else {
        // Limit order via OfferCreate
        const lp = Number(currentLimitPrice);
        let takerGets, takerPays;

        if (currentRevert) {
          const tokenAmount = fAmount1Final;
          const xrpAmount = tokenAmount * lp;
          takerGets = { currency: curr1.currency, issuer: curr1.issuer, value: String(tokenAmount) };
          takerPays = String(Math.floor(xrpAmount * 1000000));
        } else {
          const tokenAmount = fValue1Final;
          const xrpAmount = tokenAmount * lp;
          takerGets = String(Math.floor(xrpAmount * 1000000));
          takerPays = { currency: curr2.currency, issuer: curr2.issuer, value: String(tokenAmount) };
        }

        const tx = {
          Account: accountProfile.account,
          TransactionType: 'OfferCreate',
          TakerGets: takerGets,
          TakerPays: takerPays,
          Flags: 0,
          SourceTag: 161803
        };

        // Calculate expiration if not "never"
        if (orderExpiry !== 'never') {
          const RIPPLE_EPOCH = 946684800;
          const now = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;
          let expiryHours = 0;
          switch (orderExpiry) {
            case '1h': expiryHours = 1; break;
            case '24h': expiryHours = 24; break;
            case '7d': expiryHours = 24 * 7; break;
            case '30d': expiryHours = 24 * 30; break;
            case 'custom': expiryHours = customExpiry; break;
          }
          if (expiryHours > 0) {
            tx.Expiration = now + expiryHours * 60 * 60;
          }
        }

        const [seqRes, feeRes] = await Promise.all([
          api.get(`${BASE_URL}/submit/account/${accountProfile.account}/sequence`),
          api.get(`${BASE_URL}/submit/fee`)
        ]);

        if (!seqRes?.data?.sequence || !feeRes?.data?.base_fee) {
          throw new Error('Failed to fetch account sequence or network fee');
        }

        const prepared = {
          ...tx,
          Sequence: seqRes.data.sequence,
          Fee: txFee || feeRes.data.base_fee,
          LastLedgerSequence: seqRes.data.ledger_index + 20
        };

        const signed = deviceWallet.sign(prepared);
        const result = await api.post(`${BASE_URL}/submit`, { tx_blob: signed.tx_blob });

        if (result?.data?.engine_result === 'tesSUCCESS') {
          toast.loading('Order submitted', { id: toastId, description: 'Waiting for validation...' });
          const txHash = signed.hash;
          let validated = false;
          for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 500));
            try {
              const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
              if (txRes.data?.validated === true || txRes.data?.meta?.TransactionResult === 'tesSUCCESS') {
                validated = true;
                break;
              }
            } catch (e) { /* continue */ }
          }

          if (validated) {
            toast.success('Order placed!', { id: toastId, description: `TX: ${txHash.slice(0, 8)}...` });
          } else {
            toast.loading('Order submitted', { id: toastId, description: 'Validation pending...' });
          }

          submitPlatformFee(deviceWallet, fAmount1Final, fValue1Final, curr1, curr2);
          setAmount1(''); setAmount2(''); setLimitPrice('');
          setSync((s) => s + 1); setIsSwapped((v) => !v);
          // Refresh user offers after order placement
          setTimeout(() => fetchUserOffers(), 2000);
        } else {
          toast.error('Order failed', { id: toastId, description: result?.data?.engine_result || 'Unknown error' });
        }
      }
    } catch (err) {
      console.error('Swap error:', err);
      toast.error('Swap failed', { description: err.message?.slice(0, 50) });
      dispatch(updateProcess(0));
    }
    setLoading(false);
  };

  const calcQuantity = (amount, active) => {
    try {
      const amt = new Decimal(amount || 0);
      if (amt.eq(0)) return '';

      const rate1 = new Decimal(tokenExch1 || 0);
      const rate2 = new Decimal(tokenExch2 || 0);

      // Check if this is an XRP pair based on actual tokens (not curr1/curr2)
      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';

      // API rates depend on token order:
      // When token1=XRP, token2=RLUSD: rate1=1, rate2=XRP per RLUSD (e.g., 2.84)
      // When token1=RLUSD, token2=XRP: rate1=XRP per RLUSD (e.g., 2.84), rate2=1

      let result = new Decimal(0);

      if (token1IsXRP && !token2IsXRP) {
        // XRP -> Token (e.g., XRP -> RLUSD)
        // rate2 = XRP per RLUSD, so divide XRP by rate2 to get RLUSD
        if (active === 'AMOUNT') {
          result = !revert ? amt.div(rate2) : amt.mul(rate2);
        } else {
          result = !revert ? amt.mul(rate2) : amt.div(rate2);
        }
      } else if (!token1IsXRP && token2IsXRP) {
        // Token -> XRP (e.g., RLUSD -> XRP)
        // rate1 = XRP per RLUSD, so multiply RLUSD by rate1 to get XRP
        if (active === 'AMOUNT') {
          result = !revert ? amt.mul(rate1) : amt.div(rate1);
        } else {
          result = !revert ? amt.div(rate1) : amt.mul(rate1);
        }
      } else {
        // Non-XRP pairs
        if (active === 'AMOUNT') {
          result = !revert ? amt.mul(rate1).div(rate2) : amt.mul(rate2).div(rate1);
        } else {
          result = !revert ? amt.mul(rate2).div(rate1) : amt.mul(rate1).div(rate2);
        }
      }

      // Check if result is valid - use toString and check for invalid values
      const resultStr = result.toString();
      if (resultStr === 'NaN' || resultStr === 'Infinity' || resultStr === '-Infinity') {
        return '';
      }

      // Use safe precision for XRPL (max 16 significant digits total)
      const finalValue = result.toFixed(6, 1);
      return finalValue;
    } catch (e) {
      return '';
    }
  };

  const onCreateTrustline = async (currency, silent = false) => {
    if (!accountProfile?.account) return false;

    if (!silent) dispatch(updateProcess(1));
    try {
      const { Wallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        if (!silent) toast.error('Wallet locked', { description: 'Please unlock first' });
        if (!silent) dispatch(updateProcess(0));
        return false;
      }

      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) {
        if (!silent) toast.error('Wallet error', { description: 'Could not retrieve credentials' });
        if (!silent) dispatch(updateProcess(0));
        return false;
      }

      const seed = walletData.seed.trim();
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = Wallet.fromSeed(seed, { algorithm });

      const tx = {
        Account: accountProfile.account,
        TransactionType: 'TrustSet',
        LimitAmount: {
          issuer: currency.issuer,
          currency: currency.currency,
          value: currency.supply ? new Decimal(currency.supply).toFixed(0) : '1000000000000000'
        },
        Flags: 0x00020000,
        SourceTag: 161803
      };

      const [seqRes, feeRes] = await Promise.all([
        api.get(`${BASE_URL}/submit/account/${accountProfile.account}/sequence`),
        api.get(`${BASE_URL}/submit/fee`)
      ]);

      if (!seqRes?.data?.sequence || !feeRes?.data?.base_fee) {
        throw new Error('Failed to fetch account sequence or network fee');
      }

      const prepared = {
        ...tx,
        Sequence: seqRes.data.sequence,
        Fee: feeRes.data.base_fee,
        LastLedgerSequence: seqRes.data.ledger_index + 20
      };

      const signed = deviceWallet.sign(prepared);
      const result = await api.post(`${BASE_URL}/submit`, { tx_blob: signed.tx_blob });

      if (result?.data?.engine_result === 'tesSUCCESS') {
        const txHash = signed.hash;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 400));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated === true || txRes.data?.meta?.TransactionResult === 'tesSUCCESS') break;
          } catch (e) { /* continue */ }
        }

        if (!silent) {
          toast.success('Trustline set!', { description: `TX: ${txHash.slice(0, 8)}...` });
          setSync((s) => s + 1);
          setIsSwapped((v) => !v);
        }
        if (!silent) dispatch(updateProcess(0));
        return true;
      } else {
        if (!silent) toast.error('Trustline failed', { description: result?.data?.engine_result || 'Unknown error' });
        if (!silent) dispatch(updateProcess(0));
        return false;
      }
    } catch (err) {
      console.error('Trustline error:', err);
      if (!silent) toast.error('Trustline failed', { description: err.message?.slice(0, 50) });
      if (!silent) dispatch(updateProcess(0));
      return false;
    }
  };

  const onRemoveTrustline = async (tokenToRemove) => {
    if (!accountProfile?.account) return;
    if (!tokenToRemove?.issuer || !tokenToRemove?.currency) {
      toast.error('Invalid token data');
      return;
    }

    const toastId = toast.loading('Removing trustline...');
    try {
      const { Wallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);

      if (!storedPassword) {
        toast.error('Wallet locked', { id: toastId });
        return;
      }

      const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      if (!walletData?.seed) {
        toast.error('Wallet error', { id: toastId });
        return;
      }

      const seed = walletData.seed.trim();
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = Wallet.fromSeed(seed, { algorithm });

      const tx = {
        Account: accountProfile.account,
        TransactionType: 'TrustSet',
        LimitAmount: {
          issuer: tokenToRemove.issuer,
          currency: tokenToRemove.currency,
          value: '0'
        },
        Flags: 0x00020000,
        SourceTag: 161803
      };

      const [seqRes, feeRes] = await Promise.all([
        api.get(`${BASE_URL}/submit/account/${accountProfile.account}/sequence`),
        api.get(`${BASE_URL}/submit/fee`)
      ]);

      if (!seqRes?.data?.sequence || !feeRes?.data?.base_fee) {
        throw new Error('Failed to fetch account sequence or network fee');
      }

      const prepared = {
        ...tx,
        Sequence: seqRes.data.sequence,
        Fee: feeRes.data.base_fee,
        LastLedgerSequence: seqRes.data.ledger_index + 20
      };

      const signed = deviceWallet.sign(prepared);
      const result = await api.post(`${BASE_URL}/submit`, { tx_blob: signed.tx_blob });

      if (result?.data?.engine_result === 'tesSUCCESS') {
        toast.success('Trustline removed!', { id: toastId, description: '0.2 XRP freed' });
        setSync((s) => s + 1);
      } else {
        toast.error('Remove failed', { id: toastId, description: result?.data?.engine_result || 'Unknown error' });
      }
    } catch (err) {
      console.error('Remove trustline error:', err);
      toast.error('Remove failed', { id: toastId, description: err.message?.slice(0, 50) });
    }
  };

  // Calculate platform fee in XRP drops and submit silently
  const calcFeeXrpDrops = (fAmt1, fAmt2, c1, c2, exch1, exch2) => {
    let xrpValue = 0;
    if (c1.currency === 'XRP') xrpValue = fAmt1;
    else if (c2.currency === 'XRP') xrpValue = fAmt2;
    else if (exch1 > 0) xrpValue = fAmt1 * exch1; // token1 in XRP terms
    if (xrpValue <= 0) return 0;
    return Math.floor(xrpValue * PLATFORM_FEE_RATE * 1000000);
  };

  const submitPlatformFee = async (deviceWallet, fAmt1, fAmt2, c1, c2) => {
    try {
      const drops = calcFeeXrpDrops(fAmt1, fAmt2, c1, c2, tokenExch1, tokenExch2);
      if (drops < 1) return;
      await submitTransaction(deviceWallet, {
        TransactionType: 'Payment',
        Account: accountProfile.account,
        Destination: PLATFORM_FEE_ADDRESS,
        Amount: String(drops),
        SourceTag: 161803
      });
    } catch (_) { /* fee is best-effort */ }
  };

  const handleConfirmSwap = async () => {
    if (!pendingTx) return;
    const { tx, deviceWallet, feeAmounts } = pendingTx;
    const toastId = toast.loading('Executing swap...');

    setTxPreview(null);
    setPendingTx(null);

    try {
      const submitResult = await submitTransaction(deviceWallet, tx);
      const txHash = submitResult.hash || submitResult.tx_json?.hash;
      const engineResult = submitResult.engine_result;

      if (engineResult !== 'tesSUCCESS') {
        toast.error('Rejected', { id: toastId, description: engineResult });
        return;
      }

      toast.loading('Confirming...', { id: toastId });
      let validated = false;
      let txResult = null;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
          if (txRes.data?.validated) {
            validated = true;
            txResult = txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
            break;
          }
        } catch (e) { /* continue */ }
      }

      if (validated && txResult === 'tesSUCCESS') {
        toast.success('Swap complete!', { id: toastId, description: `TX: ${txHash.slice(0, 8)}...` });
        if (feeAmounts) submitPlatformFee(deviceWallet, feeAmounts.fAmt1, feeAmounts.fAmt2, feeAmounts.c1, feeAmounts.c2);
      } else if (validated) {
        toast.error('Swap failed', { id: toastId, description: txResult });
      } else {
        toast.success('Swap submitted', { id: toastId, description: 'Confirming...' });
        if (feeAmounts) submitPlatformFee(deviceWallet, feeAmounts.fAmt1, feeAmounts.fAmt2, feeAmounts.c1, feeAmounts.c2);
      }

      setAmount1(''); setAmount2(''); setLimitPrice('');
      setSync((s) => s + 1); setIsSwapped((v) => !v);
    } catch (err) {
      toast.error('Swap failed', { id: toastId, description: err.message?.slice(0, 50) });
    }
  };

  const handleCancelPreview = () => {
    setTxPreview(null);
    setPendingTx(null);
  };

  const handlePlaceOrder = (e) => {
    // Check if we need to create trustlines first
    if (
      isLoggedIn &&
      ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))
    ) {
      const missingCurrency = !hasTrustline1 && curr1.currency !== 'XRP' ? curr1 : curr2;
      onCreateTrustline(missingCurrency);
      return;
    }

    const fAmount1 = Number(amount1);
    const fAmount2 = Number(amount2);

    if (fAmount1 > 0 && fAmount2 > 0) {
      if (orderType === 'limit' && !limitPrice) {
        toast.error('Please enter a limit price!');
        return;
      }
      onSwap();
    } else {
      toast.error('Invalid values! Please enter amounts for both currencies.');
    }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value === '.') value = '0.';
    if (value === '0' && amount1 === '') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive('AMOUNT'); // Top field is always AMOUNT

    // Calculate using token prices - use token1/token2, not curr1/curr2
    const token1IsXRP = token1?.currency === 'XRP';
    const token2IsXRP = token2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      token1IsXRP || token2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const activeType = revert ? 'VALUE' : 'AMOUNT';
      const calculatedValue = calcQuantity(value, activeType);

      if (calculatedValue && calculatedValue !== '0') {
        setAmount2(calculatedValue);
      }
    } else if (!value || value === '') {
      setAmount2('');
    }
  };

  const handleChangeAmount2 = (e) => {
    let value = e.target.value;

    if (value === '.') value = '0.';
    if (value === '0' && amount2 === '') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount2(value);
    setActive('VALUE'); // Bottom field is always VALUE

    // Calculate using token prices - use token1/token2, not curr1/curr2
    const token1IsXRP = token1?.currency === 'XRP';
    const token2IsXRP = token2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      token1IsXRP || token2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const activeType = revert ? 'AMOUNT' : 'VALUE';

      const calculatedValue = calcQuantity(value, activeType);

      if (calculatedValue && calculatedValue !== '0') {
        setAmount1(calculatedValue);
      }
    } else if (!value || value === '') {
      setAmount1('');
    }
  };

  const onChangeToken1 = (token) => {
    if (token.md5 !== token2.md5) {
      setToken1(token);
    } else {
      onRevertExchange();
    }
  };

  const onChangeToken2 = (token) => {
    if (token.md5 !== token1.md5) {
      setToken2(token);
    } else {
      onRevertExchange();
    }
  };

  const onRevertExchange = useCallback(() => {
    setIsSwitching(true);

    // Store current tokens
    const tempToken1 = token1;
    const tempToken2 = token2;

    // Clear amounts immediately when switching
    setAmount1('');
    setAmount2('');

    // Switch the tokens and revert state
    setToken1(tempToken2);
    setToken2(tempToken1);
    setRevert(!revert);

    // Note: setPair is handled by the useEffect([revert, token1, token2]) to keep
    // curr1/curr2 stable and avoid flipping the WS balance subscription params.

    // Update URL with switched tokens - only if we're not loading from URL
    if (urlParsed && !isLoadingFromUrl && typeof window !== 'undefined') {
      // Inline URL update to avoid dependency issues
      if (tempToken2 && tempToken1) {
        const createUrlString = (token) => {
          if (!token) return '';
          if (token.currency === 'XRP') return 'xrp';
          return `${token.currency}-${token.issuer}`;
        };

        const currency1String = createUrlString(tempToken2);
        const currency2String = createUrlString(tempToken1);

        if (currency1String && currency2String) {
          const newPath = `/swap/${currency1String}/${currency2String}`;
          const currentCurrency1 = router.query.currencies?.[0];
          const currentCurrency2 = router.query.currencies?.[1];

          if (currentCurrency1 !== currency1String || currentCurrency2 !== currency2String) {
            router.push(newPath, undefined, { shallow: true });
          }
        }
      }
    }

    // Complete the switching animation without restoring amounts
    setTimeout(() => {
      setIsSwitching(false);
    }, 200);
  }, [token1, token2, revert, urlParsed, isLoadingFromUrl, router]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Alt + S to switch
      if (event.altKey && event.key.toLowerCase() === 's') {
        onRevertExchange();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onRevertExchange]);

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Exchanging';

    // Check for missing trustlines
    if (
      isLoggedIn &&
      ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))
    ) {
      const missingToken =
        !hasTrustline1 && curr1.currency !== 'XRP'
          ? getCurrencyDisplayName(curr1.currency, curr1?.name)
          : getCurrencyDisplayName(curr2.currency, curr2?.name);
      return `Set Trustline for ${missingToken}`;
    }

    if (!amount1 || !amount2) return 'Enter an Amount';
    else if (orderType === 'limit' && !limitPrice) return 'Enter Limit Price';
    else if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    else return orderType === 'limit' ? 'Place Limit Order' : 'Exchange';
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getWalletTypeDisplay = (walletType) => {
    switch (walletType) {
      case 'device':
        return 'Passkeys Authentication';
      default:
        return 'Unknown';
    }
  };

  // Helper function to create URL-friendly currency string
  const createCurrencyUrlString = (token) => {
    if (!token) return '';

    if (token.currency === 'XRP') {
      return 'xrp';
    }

    // For other currencies, use format: CURRENCY-ISSUER
    return `${token.currency}-${token.issuer}`;
  };

  // Helper function to parse currency from URL string
  const parseCurrencyFromUrl = (currencyString) => {
    if (!currencyString) return null;

    if (currencyString.toLowerCase() === 'xrp') {
      return {
        currency: 'XRP',
        issuer: ''
      };
    }

    // Split by last dash to handle currency codes that might contain dashes
    const lastDashIndex = currencyString.lastIndexOf('-');
    if (lastDashIndex === -1) return null;

    const currency = currencyString.substring(0, lastDashIndex);
    const issuer = currencyString.substring(lastDashIndex + 1);

    return {
      currency,
      issuer
    };
  };

  // Function to update URL based on current tokens
  const updateUrl = useCallback(
    (token1, token2) => {
      if (!token1 || !token2) return;

      const currency1String = createCurrencyUrlString(token1);
      const currency2String = createCurrencyUrlString(token2);

      if (currency1String && currency2String) {
        const newPath = `/swap/${currency1String}/${currency2String}`;
        // Only update URL if it's different from current path
        // For Next.js dynamic routes, we need to check both pathname and query
        const currentCurrency1 = router.query.currencies?.[0];
        const currentCurrency2 = router.query.currencies?.[1];

        if (currentCurrency1 !== currency1String || currentCurrency2 !== currency2String) {
          router.push(newPath, undefined, { shallow: true });
        }
      }
    },
    [router]
  );

  // Function to find token by currency and issuer
  const findTokenByCurrencyAndIssuer = async (currency, issuer) => {
    try {
      // For XRP, return a standard XRP token object
      if (currency === 'XRP') {
        return {
          currency: 'XRP',
          issuer: '',
          name: 'XRP',
          md5: '84e5efeb89c4eae8f68188982dc290d8', // Standard XRP md5
          pro24h: 'pro24h'
        };
      }

      // 1. Try main tokens endpoint with currency filter
      try {
        const tokensResponse = await api.get(`${BASE_URL}/tokens`, {
          params: {
            filter: currency,
            limit: 100,
            start: 0,
            sortBy: 'vol24hxrp',
            sortType: 'desc'
          }
        });

        if (tokensResponse.data && tokensResponse.data.tokens) {
          const foundToken = tokensResponse.data.tokens.find(
            (token) => token.currency === currency && token.issuer === issuer
          );

          if (foundToken) {
            return foundToken;
          }
        }
      } catch (e) { }

      // 2. Try xrpnft tokens endpoint (used by CurrencySearchModal)
      try {
        const nftResponse = await api.get(`${BASE_URL}/integrations/xrpnft/tokens`, {
          params: {
            filter: currency
          }
        });

        if (nftResponse.data && nftResponse.data.tokens) {
          const foundToken = nftResponse.data.tokens.find(
            (token) => token.currency === currency && token.issuer === issuer
          );

          if (foundToken) {
            return foundToken;
          }
        }
      } catch (e) { }

      // 3. Try direct token lookup by issuer_currency format
      try {
        const directResponse = await api.get(`${BASE_URL}/token/${issuer}_${currency}`);

        if (directResponse.data && directResponse.data.token) {
          return directResponse.data.token;
        }
      } catch (e) { }

      // 4. Fallback - create basic token object
      return {
        currency,
        issuer,
        name: currency,
        md5: `${currency}_${issuer}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        pro24h: 'pro24h'
      };
    } catch (error) {
      // Return a basic token object as final fallback
      return {
        currency,
        issuer,
        name: currency,
        md5: `${currency}_${issuer}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        pro24h: 'pro24h'
      };
    }
  };

  // Function to load tokens from URL parameters
  const loadTokensFromUrl = async () => {
    const currencies = router.query.currencies;
    const currency1 = currencies?.[0];
    const currency2 = currencies?.[1];

    if (!currency1 || !currency2) {
      setUrlParsed(true);
      return;
    }

    setIsLoadingFromUrl(true);

    try {
      const parsedCurrency1 = parseCurrencyFromUrl(currency1);
      const parsedCurrency2 = parseCurrencyFromUrl(currency2);

      if (!parsedCurrency1 || !parsedCurrency2) {
        setUrlParsed(true);
        setIsLoadingFromUrl(false);
        return;
      }

      // Load both tokens
      const [token1Data, token2Data] = await Promise.all([
        findTokenByCurrencyAndIssuer(parsedCurrency1.currency, parsedCurrency1.issuer),
        findTokenByCurrencyAndIssuer(parsedCurrency2.currency, parsedCurrency2.issuer)
      ]);

      if (token1Data && token2Data) {
        // Ensure tokens are different
        if (
          token1Data.currency === token2Data.currency &&
          token1Data.issuer === token2Data.issuer
        ) {
          setUrlParsed(true);
          setIsLoadingFromUrl(false);
          return;
        }

        setToken1(token1Data);
        setToken2(token2Data);

        // Update pair
        setPair({
          curr1: token1Data,
          curr2: token2Data
        });
      }
    } catch (error) { }

    setUrlParsed(true);
    setIsLoadingFromUrl(false);
  };

  // Load tokens from URL on component mount
  useEffect(() => {
    if (!urlParsed && router.query.currencies) {
      loadTokensFromUrl();
    }
  }, [router.query.currencies, urlParsed]);

  // Update URL when tokens change (but not during initial URL parsing)
  useEffect(() => {
    // Only update URL when:
    // 1. URL has been parsed (not initial load from URL)
    // 2. Not currently loading from URL (not setting tokens from URL)
    // 3. Both tokens exist
    // 4. We're in a browser environment
    if (urlParsed && !isLoadingFromUrl && token1 && token2 && typeof window !== 'undefined') {
      updateUrl(token1, token2);
    }
  }, [token1, token2, urlParsed, isLoadingFromUrl]);

  // Add function to generate shareable URL
  const getShareableUrl = () => {
    if (!token1 || !token2) return '';

    const currency1String = createCurrencyUrlString(token1);
    const currency2String = createCurrencyUrlString(token2);

    if (currency1String && currency2String) {
      // Use window.location.origin in client-side context
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/swap/${currency1String}/${currency2String}`;
      }
      // Fallback for server-side rendering
      return `/swap/${currency1String}/${currency2String}`;
    }
    return '';
  };

  // Add copy to clipboard function
  const handleShareUrl = async () => {
    try {
      const shareUrl = getShareableUrl();
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        openSnackbar('Swap link copied to clipboard!', 'success');
      } else {
        openSnackbar('Unable to generate share link', 'error');
      }
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      try {
        const shareUrl = getShareableUrl();
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        openSnackbar('Swap link copied to clipboard!', 'success');
      } catch (fallbackErr) {
        openSnackbar('Failed to copy link to clipboard', 'error');
      }
    }
  };

  // Fetch trending tokens for bottom section
  useEffect(() => {
    const ctrl = new AbortController();
    api.get(`${BASE_URL}/tokens?start=0&limit=20&sortBy=trendingScore&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const tokens = res.data?.tokens || [];
        setTrendingTokens(tokens);
        setTrendingLoading(false);
        // Fetch sparklines for top 5
        tokens.slice(0, 5).forEach((t) => {
          if (!t.md5) return;
          api.get(`${BASE_URL}/sparkline/${t.md5}?period=24h&lightweight=true&max_points=20`)
            .then((r) => {
              const prices = r.data?.data?.prices;
              if (prices?.length) setSparklines((prev) => ({ ...prev, [t.md5]: prices.map(Number) }));
            })
            .catch(() => {});
        });
      })
      .catch((err) => { if (!api.isCancel?.(err)) setTrendingLoading(false); });
    return () => ctrl.abort();
  }, []);

  // Fetch recent large trades from top trending tokens
  useEffect(() => {
    if (!trendingTokens.length) return;
    const top3 = trendingTokens.slice(0, 3).filter((t) => t.md5);
    if (!top3.length) return;
    Promise.allSettled(
      top3.map((t) =>
        api.get(`${BASE_URL}/history?md5=${t.md5}&limit=2&xrp_amount=100`)
          .then((r) => (r.data?.data || []).map((h) => ({ ...h, _token: t })))
      )
    ).then((results) => {
      const all = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        .sort((a, b) => (b.time || 0) - (a.time || 0))
        .slice(0, 5);
      if (all.length) setRecentTrades(all);
    });
  }, [trendingTokens]);

  // Fetch platform stats
  useEffect(() => {
    api.get(`${BASE_URL}/stats`)
      .then((res) => { if (res.data?.H24) setPlatformStats(res.data.H24); })
      .catch(() => {});
  }, []);

  // Token Selector Functions
  useEffect(() => {
    if (panel1Open || panel2Open) {
      loadTokensForSelector();
      loadRecentTokens();
      // Focus search after animation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
    } else {
      // Reset state when closing
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [panel1Open, panel2Open]);

  useEffect(() => {
    filterSelectorTokens();
  }, [searchQuery, selectorTokens, selectedCategory]);

  const loadTokensForSelector = async () => {
    if (loadingTokens) return;
    setLoadingTokens(true);
    try {
      // Fetch more tokens and XRP data in parallel
      const [tokensRes, xrpRes] = await Promise.all([
        api.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=vol24hxrp&sortType=desc&filter=`),
        api.get(`${BASE_URL}/token/84e5efeb89c4eae8f68188982dc290d8`)
      ]);

      const tokenList = tokensRes.data?.tokens || [];

      // Use actual XRP data from API
      const xrpToken = xrpRes.data?.token || {
        md5: '84e5efeb89c4eae8f68188982dc290d8',
        name: 'XRP',
        user: 'XRP',
        issuer: 'XRPL',
        currency: 'XRP',
        ext: 'png',
        isOMCF: 'yes',
        exch: 1,
        marketcap: 65080887109,
        vol24hxrp: 3834501
      };

      setSelectorTokens([xrpToken, ...tokenList]);
      // Also set initial filtered tokens
      setFilteredTokens([xrpToken, ...tokenList]);
    } catch (err) {
      // Fallback XRP token on error
      const xrpToken = {
        md5: '84e5efeb89c4eae8f68188982dc290d8',
        name: 'XRP',
        user: 'XRP',
        issuer: 'XRPL',
        currency: 'XRP',
        ext: 'png',
        isOMCF: 'yes',
        exch: 1
      };
      setSelectorTokens([xrpToken]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadRecentTokens = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentTokens') || '[]');
      setRecentTokens(recent.slice(0, MAX_RECENT_SEARCHES));
    } catch (e) {
      setRecentTokens([]);
    }
  };

  const filterSelectorTokens = async () => {
    // If searching, apply search filter on current tokens
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      let filtered = selectorTokens.filter(
        (token) =>
          token.name?.toLowerCase().includes(query) ||
          token.currency?.toLowerCase().includes(query) ||
          token.user?.toLowerCase().includes(query)
      );

      // Also search via API for more results
      if (searchQuery.length > 2) {
        try {
          const res = await api.get(
            `${BASE_URL}/tokens?filter=${encodeURIComponent(searchQuery)}&limit=50`
          );
          if (res.status === 200 && res.data?.tokens) {
            const remoteTokens = res.data.tokens || [];
            const existingMd5s = new Set(filtered.map((t) => t.md5));
            remoteTokens.forEach((rt) => {
              if (!existingMd5s.has(rt.md5)) {
                filtered.push(rt);
              }
            });
          }
        } catch (err) { }
      }

      setFilteredTokens(filtered);
      return;
    }

    // For categories, fetch from appropriate API endpoint
    if (selectedCategory && selectedCategory !== 'all') {
      setLoadingTokens(true);
      try {
        // Map category to API endpoint
        const categoryEndpoints = {
          trending: `${BASE_URL}/tokens?start=0&limit=50&sortBy=trendingScore&sortType=desc`,
          spotlight: `${BASE_URL}/tokens?start=0&limit=50&sortBy=assessmentScore&sortType=desc`,
          new: `${BASE_URL}/tokens?start=0&limit=50&sortBy=dateon&sortType=desc`,
          'gainers-24h': `${BASE_URL}/tokens?start=0&limit=50&sortBy=pro24h&sortType=desc`,
          'most-viewed': `${BASE_URL}/tokens?start=0&limit=50&sortBy=nginxScore&sortType=desc`
        };

        const apiUrl = categoryEndpoints[selectedCategory];
        if (!apiUrl) {
          setFilteredTokens(selectorTokens);
          setLoadingTokens(false);
          return;
        }

        const res = await api.get(apiUrl);
        if (res.status === 200 && res.data?.tokens) {
          // Filter out XRP for category views
          const nonXrpTokens = (res.data.tokens || []).filter((t) => t.currency !== 'XRP');
          setFilteredTokens(nonXrpTokens);
        } else {
          setFilteredTokens(selectorTokens);
        }
      } catch (err) {
        // Fall back to showing all tokens
        setFilteredTokens(selectorTokens);
      } finally {
        setLoadingTokens(false);
      }
    } else {
      // Show all tokens
      setFilteredTokens(selectorTokens);
    }
  };

  const handleSelectToken = (token, isToken1) => {
    // Save to recent tokens
    const recent = [token, ...recentTokens.filter((t) => t.md5 !== token.md5)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem('recentTokens', JSON.stringify(recent));

    if (isToken1) {
      onChangeToken1(token);
      setPanel1Open(false);
    } else {
      onChangeToken2(token);
      setPanel2Open(false);
    }
  };

  const handleClearRecent = () => {
    localStorage.removeItem('recentTokens');
    setRecentTokens([]);
  };

  const renderTokenItem = (token, isToken1) => (
    <div
      key={token.md5}
      onClick={() => handleSelectToken(token, isToken1)}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150',
        'hover:bg-gray-100/80 hover:border-gray-200/60 border border-transparent dark:hover:bg-white/[0.06] dark:hover:border-white/[0.08] dark:border dark:border-transparent'
      )}
    >
      <img
        src={`https://s1.xrpl.to/token/${token.md5}`}
        alt={token.name}
        className="w-9 h-9 rounded-full object-cover"
        onError={(e) => {
          e.target.src = '/static/alt.webp';
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn('text-[14px] font-medium', 'text-gray-900 dark:text-white')}
          >
            {token.user || token.name || token.currency}
          </span>
          {(token.kyc || token.isOMCF === 'yes') && (
            <CheckCircle size={14} className="text-primary flex-shrink-0" />
          )}
          <span className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>
            {token.name || token.currency}
          </span>
        </div>
        <p
          className={cn(
            'text-[11px] font-mono truncate mt-0.5',
            'text-gray-400 dark:text-white/25'
          )}
        >
          {token.issuer || 'XRPL'}
        </p>
      </div>
      <div className="text-right min-w-[60px]">
        {token.pro24h !== undefined && token.pro24h !== null ? (
          <span
            className={cn(
              'text-[13px] font-medium tabular-nums',
              token.pro24h > 0 ? 'text-green-500' : token.pro24h < 0 ? 'text-red-500' : 'text-gray-600 dark:text-white/70'
            )}
          >
            {token.pro24h > 0 ? '+' : ''}{token.pro24h.toFixed(1)}%
          </span>
        ) : (
          <span className={cn('text-[13px] font-medium tabular-nums', 'text-gray-600 dark:text-white/70')}>
            {token.holders?.toLocaleString() || '-'}
          </span>
        )}
        <p
          className={cn(
            'text-[9px] uppercase tracking-wide',
            'text-gray-400 dark:text-white/30'
          )}
        >
          {token.pro24h !== undefined && token.pro24h !== null ? '24h' : 'Holders'}
        </p>
      </div>
    </div>
  );

  const renderTokenSelector = (token, onClickToken, panelTitle) => {
    if (!token) return null;

    const { md5 = '', name = 'Select Token', kyc = false } = token;
    const imgUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : '/static/alt.webp';

    return (
      <button
        onClick={onClickToken}
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 transition-all',
          'border-[1.5px] bg-transparent cursor-pointer',
          'border-gray-200 hover:border-primary/30 hover:bg-gray-50 dark:border-white/[0.08] dark:hover:border-primary/30 dark:hover:bg-white/[0.02]'
        )}
      >
        <div className="relative flex-shrink-0">
          <img
            src={imgUrl}
            width={32}
            height={32}
            alt={name || 'Token'}
            className="rounded-full"
            onError={(e) => (e.target.src = '/static/alt.webp')}
          />
          {kyc && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
              <span className="text-[6px] text-white">✓</span>
            </div>
          )}
        </div>
        <span className={cn('text-[14px] font-normal', 'text-gray-900 dark:text-white')}>
          {name || 'Select'}
        </span>
        <ChevronDown size={16} className="text-primary ml-auto" />
      </button>
    );
  };

  const renderTokenSelectorPanel = (currentToken, title, isToken1, onClose) => (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[1200]',
          'bg-white/60 backdrop-blur-md dark:bg-black/70 dark:backdrop-blur-md'
        )}
      />

      {/* Modal Panel - Glassmorphism */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] max-sm:max-w-[calc(100vw-32px)] rounded-[2rem] overflow-hidden max-h-[85dvh] flex flex-col z-[1201]',
          'bg-white/95 backdrop-blur-3xl border-[1.5px] border-gray-200/60 shadow-2xl shadow-gray-400/20 dark:bg-black/90 dark:backdrop-blur-3xl dark:border-[1.5px] dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/80'
        )}
      >
        {/* Search Header */}
        <div
          className={cn(
            'flex items-center gap-4 px-6 h-[70px] border-b',
            'border-gray-200/60 dark:border-white/[0.06]'
          )}
        >
          <Search size={20} className={'text-primary/60 dark:text-primary/60'} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols or addresses..."
            aria-label="Search tokens"
            className={cn(
              'flex-1 bg-transparent text-[16px] font-medium outline-none',
              'text-gray-900 placeholder:text-gray-300 dark:text-white dark:placeholder:text-white/20'
            )}
          />
          <button
            onClick={onClose}
            aria-label="Close token selector"
            className={cn(
              'p-2 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              'hover:bg-gray-100 text-gray-400 dark:hover:bg-white/5 dark:text-white/40'
            )}
          >
            <X size={20} />
          </button>
        </div>


        {/* Category Filters */}
        <div
          className={cn(
            'flex flex-wrap gap-1.5 px-4 py-2 border-b',
            'border-gray-200/60 dark:border-white/[0.06]'
          )}
        >
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors',
                selectedCategory === cat.value
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/[0.05]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'bg-gray-50/50 dark:bg-black/20'
          )}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Recent Tokens */}
          {!searchQuery && recentTokens.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">
                  Recent
                </span>
                <div
                  className="flex-1 h-[14px]"
                  style={{
                    backgroundImage: isDark ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                    backgroundSize: '8px 5px',
                    WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                    maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                  }}
                />
                <button
                  onClick={handleClearRecent}
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-blue-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentTokens.map((token) => renderTokenItem(token, isToken1))}
            </div>
          )}

          {/* Token List */}
          <div className="p-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">
                {searchQuery
                  ? `Results (${filteredTokens.length})`
                  : selectedCategory === 'all'
                    ? 'Tokens'
                    : categories.find((c) => c.value === selectedCategory)?.label}
              </span>
              <div
                className="flex-1 h-[14px]"
                style={{
                  backgroundImage: isDark ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                  backgroundSize: '8px 5px',
                  WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                  maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                }}
              />
            </div>

            {loadingTokens ? (
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex items-center gap-3 px-2 py-3 animate-pulse"
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full',
                        'bg-gray-200 dark:bg-white/10'
                      )}
                    />
                    <div className="flex-1">
                      <div
                        className={cn(
                          'h-3 w-[40%] rounded mb-1.5',
                          'bg-gray-200 dark:bg-white/10'
                        )}
                      />
                      <div
                        className={cn(
                          'h-2 w-[60%] rounded',
                          'bg-gray-100 dark:bg-white/5'
                        )}
                      />
                    </div>
                    <div
                      className={cn('h-6 w-12 rounded', 'bg-gray-200 dark:bg-white/10')}
                    />
                  </div>
                ))}
              </div>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.slice(0, 100).map((token) => renderTokenItem(token, isToken1))
            ) : (
              <div className="py-6 text-center">
                <p className={cn('text-[13px]', 'text-gray-400 dark:text-white/40')}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No tokens available'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Check if we should show token selector
  const showTokenSelector = panel1Open || panel2Open;
  const currentSelectorToken = panel1Open ? token1 : token2;
  const selectorTitle = panel1Open ? 'Select token to swap from' : 'Select token to receive';
  const isToken1Selector = panel1Open;

  // Auto-focus first input when modal closes
  useEffect(() => {
    if (amount1Ref.current && !showTokenSelector) {
      setTimeout(() => amount1Ref.current?.focus(), 100);
    }
  }, [showTokenSelector]);

  return (
    <div className="w-full overflow-x-hidden">
      {/* Transaction Preview Modal */}
      {txPreview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-[8px] max-sm:h-dvh"
          onClick={handleCancelPreview}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'rounded-[20px] p-5 max-w-[360px] w-[92%] shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
              'bg-white border border-black/[0.08] dark:bg-[#0d0d0f] dark:border dark:border-white/[0.08]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-[10px]">
                {txPreview.status === 'error' && (
                  <div className="w-9 h-9 rounded-[10px] bg-red-500/15 flex items-center justify-center">
                    <X size={20} className="text-[#ef4444]" />
                  </div>
                )}
                {txPreview.status === 'warning' && (
                  <div className="w-9 h-9 rounded-[10px] bg-amber-500/15 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-[#f59e0b]" />
                  </div>
                )}
                {txPreview.status === 'success' && (
                  <div className="w-9 h-9 rounded-[10px] bg-green-500/15 flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#22c55e]" />
                  </div>
                )}
                <span className={cn('text-[16px] font-semibold', 'text-black dark:text-white')}>
                  {txPreview.status === 'error' ? 'Swap Will Fail' : txPreview.status === 'warning' ? 'Review Swap' : 'Confirm Swap'}
                </span>
              </div>
              <button
                onClick={handleCancelPreview}
                aria-label="Close preview"
                className={cn(
                  'border-none rounded-lg cursor-pointer p-1.5 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'bg-black/5 text-black/40 dark:bg-white/5 dark:text-white/40'
                )}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error/Warning Message */}
            {(txPreview.errorMessage || txPreview.warningMessage) && (
              <div className={cn(
                'px-3 py-2.5 rounded-[10px] mb-3',
                txPreview.errorMessage ? 'bg-red-500/[0.08]' : 'bg-amber-500/[0.08]'
              )}>
                <span className={cn('text-[12px]', txPreview.errorMessage ? 'text-[#ef4444]' : 'text-[#f59e0b]')}>
                  {txPreview.errorMessage || txPreview.warningMessage}
                </span>
              </div>
            )}

            {/* Available Liquidity Options */}
            {(txPreview.maxAvailable || txPreview.workingAmount) && (
              <div className={cn(
                'p-3 rounded-[10px] mb-3 border',
                'bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.03] dark:border-white/[0.06]'
              )}>
                {txPreview.maxAvailable && txPreview.actualSlippage && (
                  <div className={cn(
                    txPreview.workingAmount && 'mb-3 pb-3 border-b',
                    txPreview.workingAmount && ('border-black/[0.06] dark:border-white/[0.06]')
                  )}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn('text-[10px] uppercase tracking-[0.5px]', 'text-black/40 dark:text-white/40')}>Option 1: Higher slippage</span>
                      <span className="text-[10px] px-[5px] py-0.5 rounded bg-amber-500/[0.12] text-[#f59e0b]">{txPreview.actualSlippage}% impact</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[14px] font-semibold', 'text-black dark:text-white')}>~{fNumber(txPreview.maxAvailable)} {txPreview.receiving?.name}</span>
                      {parseFloat(txPreview.actualSlippage) <= 50 && (
                        <button
                          onClick={() => {
                            const newSlippage = Math.ceil(parseFloat(txPreview.actualSlippage) + 1);
                            setSlippage(newSlippage);
                            setTxPreview(null);
                            setPendingTx(null);
                            toast.success(`Slippage set to ${newSlippage}%`, { duration: 5000 });
                          }}
                          className={cn(
                            'px-2.5 py-1.5 rounded-md bg-transparent font-medium cursor-pointer text-[10px] border',
                            'border-black/10 text-black dark:border-white/10 dark:text-white'
                          )}
                        >
                          Set {Math.ceil(parseFloat(txPreview.actualSlippage) + 1)}%
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {txPreview.workingAmount && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn('text-[10px] uppercase tracking-[0.5px]', 'text-black/40 dark:text-white/40')}>Option 2: Keep {slippage}% slippage</span>
                      <span className="text-[10px] px-[5px] py-0.5 rounded bg-green-500/[0.12] text-[#22c55e]">Guaranteed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[#22c55e]">~{fNumber(txPreview.workingOutput || 0)} {txPreview.receiving?.name}</div>
                        <div className={cn('text-[10px]', 'text-black/40 dark:text-white/40')}>for {fNumber(txPreview.workingAmount)} {txPreview.sending?.name}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newAmount = txPreview.workingAmount.toFixed(6);
                          setAmount1(newAmount);
                          if (txPreview.workingOutput) {
                            setAmount2(txPreview.workingOutput.toFixed(6));
                          } else {
                            const calculated = calcQuantity(newAmount, 'AMOUNT');
                            if (calculated) setAmount2(calculated);
                          }
                          setTxPreview(null);
                          setPendingTx(null);
                          toast.success('Amount adjusted', {
                            description: `${fNumber(txPreview.workingAmount)} ${txPreview.sending?.name} → ~${fNumber(txPreview.workingOutput || 0)} ${txPreview.receiving?.name}`,
                            duration: 6000
                          });
                        }}
                        className="px-3 py-1.5 rounded-md border-none bg-[#22c55e] text-white font-semibold cursor-pointer text-[10px]"
                      >
                        Use this
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Details */}
            <div className={cn('rounded-[10px] p-3 mb-3', 'bg-black/[0.02] dark:bg-white/[0.03]')}>
              <div className="flex justify-between items-center mb-2">
                <span className={cn('text-[11px] uppercase tracking-[0.5px]', 'text-black/40 dark:text-white/40')}>Send</span>
                <span className={cn('font-medium text-[13px]', 'text-black dark:text-white')}>{fNumber(txPreview.sending?.amount)} {txPreview.sending?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={cn('text-[11px] uppercase tracking-[0.5px]', 'text-black/40 dark:text-white/40')}>Receive</span>
                <div className="text-right">
                  {txPreview.receiving?.actual > 0 ? (
                    <span className="text-[#22c55e] font-semibold text-[13px]">{fNumber(txPreview.receiving.actual)} {txPreview.receiving?.name}</span>
                  ) : (
                    <div>
                      <span className="text-[#ef4444] font-medium text-[12px] italic">Failed</span>
                      <div className={cn('text-[9px] mt-0.5', 'text-black/30 dark:text-white/30')}>Would lose tx fee</div>
                    </div>
                  )}
                </div>
              </div>
              {(txPreview.priceImpact !== null && txPreview.priceImpact > 0.01) || txPreview.receiving?.actual > 0 ? (
                <div className={cn('mt-2.5 pt-2.5 border-t', 'border-black/[0.06] dark:border-white/[0.06]')}>
                  {txPreview.priceImpact !== null && txPreview.priceImpact > 0.01 && (
                    <div className="flex justify-between mb-1">
                      <span className={cn('text-[11px]', 'text-black/40 dark:text-white/40')}>Impact</span>
                      <span className={cn('font-medium text-[11px]', txPreview.priceImpact > 5 ? 'text-[#ef4444]' : txPreview.priceImpact > 2 ? 'text-[#f59e0b]' : 'text-[#22c55e]')}>-{txPreview.priceImpact.toFixed(2)}%</span>
                    </div>
                  )}
                  {txPreview.receiving?.actual > 0 && txPreview.sending?.amount > 0 && (
                    <div className="flex justify-between">
                      <span className={cn('text-[11px]', 'text-black/40 dark:text-white/40')}>Rate</span>
                      <span className={cn('text-[11px]', 'text-black/60 dark:text-white/60')}>1 {txPreview.receiving?.name} = {fNumber(txPreview.sending.amount / txPreview.receiving.actual)} {txPreview.sending?.name}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Preview Badge */}
            <div className={cn('text-center mb-3 p-1.5 rounded-md', 'bg-black/[0.02] dark:bg-white/[0.03]')}>
              <span className={cn('text-[10px]', 'text-black/40 dark:text-white/40')}>Preview · No funds sent yet</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                className={cn(
                  'flex-1 p-3 rounded-[10px] bg-transparent font-medium cursor-pointer text-[13px] border',
                  'border-black/10 text-black dark:border-white/10 dark:text-white'
                )}
              >
                Cancel
              </button>
              {txPreview.status !== 'error' && pendingTx && (
                <button
                  onClick={handleConfirmSwap}
                  className={cn(
                    'flex-1 p-3 rounded-[10px] border-none text-white font-semibold cursor-pointer text-[13px]',
                    txPreview.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                  )}
                >
                  {txPreview.status === 'warning' ? 'Swap Anyway' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Token Selector Modal */}
      {(panel1Open || panel2Open) &&
        renderTokenSelectorPanel(currentSelectorToken, selectorTitle, isToken1Selector, () => {
          setPanel1Open(false);
          setPanel2Open(false);
        })}

      {/* Swap UI */}
      {!showTokenSelector && (
        <div className="flex flex-col items-center gap-4 sm:gap-5 md:gap-8 mx-auto w-full max-w-[1000px] px-2 sm:px-3 md:px-4 pt-1 sm:pt-2 md:pt-0">
          {/* Trade Mode Toggle: Tokens | NFTs */}
          <div className="flex items-center justify-between w-full px-1 sm:px-2 mb-1">
            <h1 className={cn(
              'text-[18px] sm:text-[22px] font-bold tracking-tight m-0',
              'text-[#0F172A] dark:text-white'
            )}>
              {tradeMode === 'tokens' ? 'Swap Tokens' : 'Buy NFTs'}
            </h1>
            <div role="tablist" aria-label="Trade mode" className={cn(
              'flex p-0.5 sm:p-1 rounded-xl backdrop-blur-md border-[1.5px]',
              'bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/[0.06]'
            )}>
              <button
                role="tab"
                aria-selected={tradeMode === 'tokens'}
                onClick={() => setTradeMode('tokens')}
                className={cn(
                  'px-5 sm:px-8 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  tradeMode === 'tokens'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                Tokens
              </button>
              <button
                role="tab"
                aria-selected={tradeMode === 'nfts'}
                onClick={() => setTradeMode('nfts')}
                className={cn(
                  'px-5 sm:px-8 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#650CD4]',
                  tradeMode === 'nfts'
                    ? 'bg-[#650CD4] text-white shadow-lg shadow-[#650CD4]/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                NFTs
              </button>
            </div>
          </div>

          {/* NFT Mode */}
          {tradeMode === 'nfts' && <NFTQuickBuy />}

          {/* Token Swap Mode */}
          {tradeMode === 'tokens' && (<>
          {/* Header with Market/Limit Tabs - Futuristic & Sleek */}
          <div className="flex flex-wrap items-center justify-between w-full px-1 sm:px-2 gap-2">
            <div role="tablist" aria-label="Order type" className={cn(
              'flex p-0.5 sm:p-1 rounded-xl backdrop-blur-md border-[1.5px]',
              'bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/[0.06]'
            )}>
              <button
                role="tab"
                aria-selected={orderType === 'market'}
                onClick={() => {
                  setOrderType('market');
                  setShowOrders(false);
                  setShowOrderbook(false);
                }}
                className={cn(
                  'px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  orderType === 'market'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                Market
              </button>
              <button
                role="tab"
                aria-selected={orderType === 'limit'}
                onClick={() => {
                  setOrderType('limit');
                  setShowOrders(false);
                }}
                className={cn(
                  'px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  orderType === 'limit'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                Limit
              </button>
            </div>
            <div className={cn(
              'flex items-center p-0.5 sm:p-1 rounded-xl backdrop-blur-md border-[1.5px] gap-0',
              'bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/[0.06]'
            )}>
              <button
                onClick={() => setShowSettingsModal(true)}
                aria-label="Swap settings"
                className={cn(
                  'flex items-center gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[13px] font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                <Settings size={13} className="sm:w-[14px] sm:h-[14px]" />
                <span>{slippage}%</span>
              </button>
              <button
                onClick={handleShareUrl}
                aria-label="Share swap URL"
                className={cn(
                  'flex items-center px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                <Share2 size={13} className="sm:w-[14px] sm:h-[14px]" />
              </button>
              <ApiButton className="!rounded-lg !border-0 !py-1.5 sm:!py-2 !px-1.5 sm:!px-3 !text-[11px] sm:!text-[13px] !font-bold !bg-transparent" />
            </div>
          </div>


          {/* Unified Swap Card */}
          <div className={cn(
            'w-full rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 transition-all duration-500 relative overflow-hidden backdrop-blur-3xl border-[1.5px]',
            'border-gray-200/80 bg-white/40 shadow-xl shadow-gray-200/20 dark:border-white/[0.06] dark:bg-white/[0.01] dark:shadow-2xl dark:shadow-black/40'
          )}>
            {/* Background Mesh */}
            <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

            {/* Platform Stats */}
            {platformStats && (
              <div className="flex items-center justify-center gap-4 sm:gap-5 mb-4 relative z-10 flex-wrap">
                {[
                  { label: '24h Vol', value: `${fmtStat(platformStats.tradedXRP24H)} XRP` },
                  { label: 'Tokens', value: fmtStat(platformStats.tradedTokens24H) },
                  { label: 'Traders', value: fmtStat(platformStats.uniqueTraders24H) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={cn('text-[10px] font-mono', 'text-black/25 dark:text-white/25')}>
                      {label}
                    </span>
                    <span className={cn('text-[10px] font-mono font-semibold', 'text-black/50 dark:text-white/50')}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Token Pair Row */}
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 w-full relative z-10">
            {/* First Token Card - You Pay */}
            <div className="flex-1 min-w-0 relative">

              {/* Token Display - Futuristic Glow */}
              <div className="flex flex-col items-start mb-4 sm:mb-6 relative z-10">
                <span className={cn(
                  'text-[10px] uppercase tracking-[0.2em] font-bold mb-3 sm:mb-4 px-1',
                  'text-primary dark:text-[#5ba3fe]'
                )}>
                  You Pay
                </span>
                <button
                  onClick={() => setPanel1Open(true)}
                  aria-label="Select token to pay"
                  className="flex items-center gap-3 sm:gap-4 group relative max-w-full outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded-xl"
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all duration-500 scale-110" />
                    <img
                      src={
                        token1?.md5 ? `https://s1.xrpl.to/token/${token1.md5}` : '/static/alt.webp'
                      }
                      width={64}
                      height={64}
                      alt={token1?.name || 'Token'}
                      className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-[1.5px] border-primary/40 relative z-10 group-hover:border-primary group-hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20"
                      onError={(e) => (e.target.src = '/static/alt.webp')}
                    />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="flex items-center gap-2 min-w-0 max-w-full">
                      <span className={cn(
                        'text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate',
                        'text-gray-900 dark:text-white'
                      )}>
                        {token1?.name || token1?.currency || 'Select'}
                      </span>
                      <ChevronDown size={18} className="text-primary group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
                    </div>
                    {token1?.issuer && (
                      <span className={cn("text-[10px] font-mono truncate max-w-[100px] sm:max-w-[120px]", 'text-gray-500 dark:text-white/60')}>
                        {token1.issuer}
                      </span>
                    )}
                  </div>
                </button>
              </div>


              {/* Amount Input - Sleek Design */}
              <div
                className={cn(
                  'rounded-2xl px-3 py-3 sm:px-5 sm:py-5 transition-all duration-300 relative z-10 border-[1.5px]',
                  focusTop
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-white/60 border-gray-200/60 dark:bg-black/40 dark:border-white/[0.06]'
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <input
                      ref={amount1Ref}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-label="Amount to pay"
                      value={amount1}
                      onChange={handleChangeAmount1}
                      onFocus={() => setFocusTop(true)}
                      onBlur={() => setFocusTop(false)}
                      className={cn(
                        'flex-1 min-w-0 text-left text-xl sm:text-2xl md:text-4xl font-bold bg-transparent border-none outline-none font-mono tracking-tight focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded',
                        'text-gray-900 placeholder:text-gray-200 dark:text-white dark:placeholder:text-white/10'
                      )}
                    />
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        'text-[12px] font-medium',
                        'text-gray-500 dark:text-white/70'
                      )}>
                        {token1?.name || token1?.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Balance */}
              <div className="flex items-center justify-end mt-3 relative z-10">
                {isLoggedIn && accountPairBalance ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}
                    >
                      Bal:{' '}
                      {fNumber(
                        revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value
                      )}
                    </span>
                    <button
                      onClick={() => {
                        const balance = revert
                          ? accountPairBalance?.curr2.value
                          : accountPairBalance?.curr1.value;
                        handleChangeAmount1({ target: { value: balance.toString() } });
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded text-[11px] font-medium transition-colors border',
                        'text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-white/60 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <span className={cn('text-[12px]', 'text-gray-400 dark:text-white/30')}>
                    &nbsp;
                  </span>
                )}
              </div>
            </div>

            {/* Swap Toggle Button - Integrated & Dynamic */}
            <div className="flex items-center justify-center md:self-center relative py-1 md:py-0 z-20">
              <div className="absolute w-px h-12 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block -top-12" />
              <div className="absolute w-px h-12 bg-gradient-to-b from-primary/30 via-transparent to-transparent hidden md:block -bottom-12" />
              <button
                onClick={onRevertExchange}
                disabled={isSwitching}
                title="Switch currencies (Alt + S)"
                aria-label="Switch currencies"
                className={cn(
                  'w-11 h-11 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-[1.5px]',
                  'backdrop-blur-xl shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'bg-white/80 border-gray-200/60 hover:border-primary hover:shadow-primary/10 text-gray-400 hover:text-primary dark:bg-black/60 dark:border-white/[0.08] dark:hover:border-primary dark:hover:shadow-primary/20 dark:text-white/70 dark:hover:text-white',
                  isSwitching && 'rotate-180 scale-90'
                )}
              >
                <div className="relative">
                  <ArrowLeftRight size={22} className="relative z-10" />
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>


            {/* Second Token Card - You Receive */}
            <div className="flex-1 min-w-0 relative">

              {/* Token Display - Receive */}
              <div className="flex flex-col items-start mb-4 sm:mb-6 relative z-10">
                <span className={cn(
                  'text-[10px] uppercase tracking-[0.2em] font-bold mb-3 sm:mb-4 px-1',
                  'text-primary dark:text-[#5ba3fe]'
                )}>
                  You Receive
                </span>
                <button
                  onClick={() => setPanel2Open(true)}
                  aria-label="Select token to receive"
                  className="flex items-center gap-3 sm:gap-4 group relative max-w-full outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded-xl"
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all duration-500 scale-110" />
                    <img
                      src={
                        token2?.md5 ? `https://s1.xrpl.to/token/${token2.md5}` : '/static/alt.webp'
                      }
                      width={64}
                      height={64}
                      alt={token2?.name || 'Token'}
                      className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-[1.5px] border-primary/40 relative z-10 group-hover:border-primary group-hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20"
                      onError={(e) => (e.target.src = '/static/alt.webp')}
                    />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="flex items-center gap-2 min-w-0 max-w-full">
                      <span className={cn(
                        'text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate',
                        'text-gray-900 dark:text-white'
                      )}>
                        {token2?.name || token2?.currency || 'Select'}
                      </span>
                      <ChevronDown size={18} className="text-primary group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
                    </div>
                    {token2?.issuer && (
                      <span className={cn("text-[10px] font-mono truncate max-w-[100px] sm:max-w-[120px]", 'text-gray-500 dark:text-white/60')}>
                        {token2.issuer}
                      </span>
                    )}
                  </div>
                </button>
              </div>


              {/* Amount Input - Receive */}
              <div
                className={cn(
                  'rounded-2xl px-3 py-3 sm:px-5 sm:py-5 transition-all duration-300 relative z-10 border-[1.5px]',
                  focusBottom
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-white/60 border-gray-200/60 dark:bg-black/40 dark:border-white/[0.06]'
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-label="Amount to receive"
                      value={amount1 === '' ? '' : amount2}
                      onChange={handleChangeAmount2}
                      onFocus={() => setFocusBottom(true)}
                      onBlur={() => setFocusBottom(false)}
                      className={cn(
                        'flex-1 min-w-0 text-left text-xl sm:text-2xl md:text-4xl font-bold bg-transparent border-none outline-none font-mono tracking-tight focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded',
                        'text-gray-900 placeholder:text-gray-200 dark:text-white dark:placeholder:text-white/10'
                      )}
                    />
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        'text-[12px] font-medium',
                        'text-gray-500 dark:text-white/70'
                      )}>
                        {token2?.name || token2?.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Balance info */}
              <div className="flex items-center justify-end mt-3 relative z-10">
                {isLoggedIn && accountPairBalance ? (
                  <span className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>
                    Bal:{' '}
                    {fNumber(
                      revert ? accountPairBalance?.curr1.value : accountPairBalance?.curr2.value
                    )}
                  </span>
                ) : (
                  <span className={cn('text-[12px]', 'text-gray-400 dark:text-white/30')}>
                    &nbsp;
                  </span>
                )}
              </div>
            </div>
          </div>

            {/* Controls & Action Button */}
            <div className="flex flex-col relative z-10 mt-6">
                {/* Settings Modal */}
                {showSettingsModal && (
                  <div
                    className={cn(
                      'fixed inset-0 z-[1200] flex items-center justify-center max-sm:h-dvh',
                      'bg-white/60 backdrop-blur-md dark:bg-black/70 dark:backdrop-blur-md'
                    )}
                    onClick={() => setShowSettingsModal(false)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-[320px] rounded-2xl border-[1.5px] p-5',
                        'bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-2xl shadow-gray-300/30 dark:bg-black/80 dark:backdrop-blur-2xl dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`text-[15px] font-medium ${'text-gray-900 dark:text-white'}`}
                        >
                          Settings
                        </span>
                        <button
                          onClick={() => setShowSettingsModal(false)}
                          aria-label="Close settings"
                          className="p-1.5 rounded-lg hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                        >
                          <X size={16} className={'text-gray-400 dark:text-white/40'} />
                        </button>
                      </div>

                      {/* Max Slippage Section */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`text-[11px] font-medium uppercase tracking-wide ${'text-gray-500 dark:text-white/40'}`}
                          >
                            Max Slippage
                          </span>
                          <div
                            className="flex-1 h-px"
                            style={{
                              backgroundImage: isDark ? 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.3) 1px, transparent 1px)',
                              backgroundSize: '6px 1px'
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => setSlippage(val)}
                              className={`flex-1 h-9 text-[13px] font-normal rounded-lg border-[1.5px] transition-colors ${slippage === val
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-200 text-gray-600 hover:border-primary/50 dark:border-white/10 dark:text-white/60 dark:hover:border-primary/50'
                                }`}
                            >
                              {val}%
                            </button>
                          ))}
                          <div
                            className={`flex items-center justify-center h-9 px-3 min-w-[56px] rounded-lg border-[1.5px] ${'border-gray-200 dark:border-white/10'}`}
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label="Custom slippage percentage"
                              value={slippage}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                if (
                                  val === '' ||
                                  (!isNaN(parseFloat(val)) &&
                                    parseFloat(val) >= 0 &&
                                    parseFloat(val) <= 25)
                                ) {
                                  setSlippage(val === '' ? '' : parseFloat(val) || val);
                                }
                              }}
                              className={`w-5 bg-transparent border-none outline-none text-[13px] max-sm:text-base font-medium text-center ${'text-gray-900 dark:text-white'}`}
                            />
                            <span
                              className={`text-[12px] ${'text-gray-400 dark:text-white/40'}`}
                            >
                              %
                            </span>
                          </div>
                        </div>
                        {slippage >= 4 && (
                          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-amber-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[11px] text-amber-500">
                              High slippage may cause front-running
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Network Fee Section */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`text-[11px] font-medium uppercase tracking-wide ${'text-gray-500 dark:text-white/40'}`}
                          >
                            Network Fee
                          </span>
                          <span
                            className={`text-[10px] ${'text-gray-400 dark:text-white/25'}`}
                          >
                            (drops)
                          </span>
                          <div
                            className="flex-1 h-px"
                            style={{
                              backgroundImage: isDark ? 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(66,133,244,0.3) 1px, transparent 1px)',
                              backgroundSize: '6px 1px'
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          {[12, 15, 20, 50].map((val) => (
                            <button
                              key={val}
                              onClick={() => setTxFee(String(val))}
                              className={`flex-1 h-9 text-[13px] font-normal rounded-lg border-[1.5px] transition-colors ${txFee === String(val)
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-200 text-gray-600 hover:border-primary/50 dark:border-white/10 dark:text-white/60 dark:hover:border-primary/50'
                                }`}
                            >
                              {val}
                            </button>
                          ))}
                          <div
                            className={`flex items-center h-9 px-3 min-w-[60px] rounded-lg border-[1.5px] ${'border-gray-200 dark:border-white/10'}`}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              value={txFee}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setTxFee(val);
                              }}
                              className={`w-8 bg-transparent border-none outline-none text-[13px] max-sm:text-base font-medium text-center ${'text-gray-900 dark:text-white'}`}
                            />
                          </div>
                        </div>
                        <p
                          className={`text-[10px] mt-2 ${'text-gray-400 dark:text-white/30'}`}
                        >
                          Higher fees = priority during congestion
                        </p>
                        {parseInt(txFee) >= 50 && (
                          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[11px] text-amber-500">
                              Only needed during extreme congestion
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setShowSettingsModal(false)}
                        className="w-full py-3 rounded-lg bg-primary text-white text-[14px] font-medium border-none cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Market Order UI - Quote Summary */}
                {orderType === 'market' && (
                  <>
                    {/* Swap Quote Summary */}
                    {amount1 && parseFloat(amount1) > 0 && (
                      <div
                        className={cn(
                          'mb-4 rounded-lg p-2.5 space-y-1 relative',
                          'bg-gray-50 border border-gray-200 dark:bg-white/[0.02] dark:border dark:border-white/[0.06]'
                        )}
                      >
                        {/* Rate - show when we have both amounts */}
                        {amount2 && parseFloat(amount2) > 0 && (
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-[10px]',
                                'text-gray-500 dark:text-white/50'
                              )}
                            >
                              Rate {quoteLoading && <span className="opacity-50">•••</span>}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-mono',
                                'text-gray-700 dark:text-white/80'
                              )}
                            >
                              1 {token1?.name || token1?.currency} ={' '}
                              {(() => {
                                const srcVal = parseFloat(amount1);
                                const dstVal = parseFloat(amount2);
                                if (srcVal > 0 && dstVal > 0) {
                                  const rate = dstVal / srcVal;
                                  if (rate >= 1000000) return fNumber(rate);
                                  if (rate >= 1) return rate.toFixed(4);
                                  if (rate >= 0.0001) return rate.toFixed(8);
                                  return rate.toExponential(4);
                                }
                                return '—';
                              })()}{' '}
                              {token2?.name || token2?.currency}
                            </span>
                          </div>
                        )}

                        {/* Min Received - show when we have quote data */}
                        {swapQuoteCalc && amount2 && (
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-[10px]',
                                'text-gray-500 dark:text-white/50'
                              )}
                            >
                              Min received
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-mono',
                                'text-gray-700 dark:text-white/80'
                              )}
                            >
                              {fNumber(swapQuoteCalc.minimum_received)}{' '}
                              {token2?.name || token2?.currency}
                            </span>
                          </div>
                        )}

                        {/* AMM Fee - only show if present */}
                        {swapQuoteCalc?.amm_pool_fee && (
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-[10px]',
                                'text-gray-500 dark:text-white/50'
                              )}
                            >
                              AMM fee{' '}
                              {swapQuoteCalc.amm_trading_fee_bps
                                ? `(${(swapQuoteCalc.amm_trading_fee_bps / 1000).toFixed(2)}%)`
                                : ''}
                            </span>
                            <span className="text-[10px] font-mono text-orange-400">
                              {swapQuoteCalc.amm_pool_fee}
                            </span>
                          </div>
                        )}

                        {/* Network Fee - always show */}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[10px]',
                              'text-gray-500 dark:text-white/50'
                            )}
                          >
                            Network Fee
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-mono',
                              'text-gray-700 dark:text-white/80'
                            )}
                          >
                            ~0.000012 XRP
                          </span>
                        </div>

                        {/* Platform Fee */}
                        {amount1 && amount2 && (() => {
                          const drops = calcFeeXrpDrops(
                            parseFloat(amount1) || 0, parseFloat(amount2) || 0,
                            curr1, curr2, tokenExch1, tokenExch2
                          );
                          if (drops < 1) return null;
                          const xrp = drops / 1000000;
                          return (
                            <div className="flex items-center justify-between">
                              <span className={cn('text-[10px]', 'text-gray-500 dark:text-white/50')}>
                                Platform fee (0.08%)
                              </span>
                              <span className={cn('text-[10px] font-mono', 'text-gray-700 dark:text-white/80')}>
                                {xrp < 0.01 ? xrp.toFixed(6) : fNumber(xrp)} XRP
                              </span>
                            </div>
                          );
                        })()}

                        {/* Paths count if > 1 */}
                        {swapQuoteCalc?.paths_count > 1 && (
                          <div
                            className={cn(
                              'text-[9px] text-right',
                              'text-gray-400 dark:text-white/40'
                            )}
                          >
                            via {swapQuoteCalc.paths_count} paths
                          </div>
                        )}

                        {/* Trustline Warning */}
                        {quoteRequiresTrustline && (
                          <div className="mt-1.5 p-1.5 rounded bg-orange-500/10 border border-orange-500/20">
                            <span className="text-[10px] text-orange-400">
                              Trustline required for{' '}
                              {getCurrencyDisplayName(
                                quoteRequiresTrustline.currency,
                                token2?.name
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Limit Order UI */}
                {orderType === 'limit' && (
                  <div className="space-y-3 mb-4">
                    {/* Limit Price Section */}
                    <div
                      className={cn(
                        'rounded-xl p-3 border',
                        'bg-gray-50 border-black/[0.08] dark:bg-white/[0.03] dark:border-white/[0.08]'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            'text-[11px] uppercase tracking-wide',
                            'text-gray-500 dark:text-white/40'
                          )}
                        >
                          Your Price ({token2?.name || token2?.currency} per{' '}
                          {token1?.name || token1?.currency})
                        </span>
                        {/* Quick adjust buttons inline */}
                        <div className="flex items-center gap-1">
                          {[
                            { label: '-1%', mult: 0.99 },
                            { label: 'Mid', mult: 'mid' },
                            { label: '+1%', mult: 1.01 }
                          ].map((adj) => (
                            <button
                              key={adj.label}
                              disabled={!bids[0]?.price || !asks[0]?.price}
                              onClick={() => {
                                if (!bids[0]?.price || !asks[0]?.price) return;
                                const midPrice = (bids[0].price + asks[0].price) / 2;
                                if (adj.mult === 'mid') {
                                  setLimitPrice(midPrice.toFixed(6));
                                } else {
                                  const basePrice = parseFloat(limitPrice) || midPrice;
                                  setLimitPrice((basePrice * adj.mult).toFixed(6));
                                }
                              }}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] transition-colors',
                                !bids[0]?.price || !asks[0]?.price
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'text-primary/70 hover:text-primary hover:bg-primary/10 dark:text-primary/60 dark:hover:text-primary dark:hover:bg-primary/10'
                              )}
                            >
                              {adj.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={limitPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '.') {
                            setLimitPrice('0.');
                            return;
                          }
                          if (!isNaN(Number(val)) || val === '') setLimitPrice(val);
                        }}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg text-[18px] font-mono bg-transparent outline-none transition-colors text-center border',
                          'text-gray-900 placeholder:text-gray-400 border-black/10 dark:text-white dark:placeholder:text-white/20 dark:border-white/10'
                        )}
                      />

                      {/* Best Buy / Spread / Best Sell */}
                      {(bids[0] || asks[0]) && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <button
                              onClick={() => bids[0] && setLimitPrice(bids[0].price.toFixed(6))}
                              title="Highest price someone is willing to buy at — click to use"
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded transition-colors',
                                bids[0]
                                  ? 'hover:bg-green-500/10 cursor-pointer'
                                  : 'opacity-40 cursor-default'
                              )}
                            >
                              <span className={cn('text-[9px] uppercase tracking-wide', 'text-gray-500 dark:text-white/40')}>
                                Best Buy
                              </span>
                              <span className="text-green-500 font-medium">
                                {bids[0]?.price.toFixed(4) || '-'}
                              </span>
                            </button>

                            <span className={cn('text-[10px] flex items-center gap-1', 'text-gray-400 dark:text-white/30')}>
                              <span className="text-[8px] uppercase tracking-wide">spread</span>
                              {bids[0] && asks[0]
                                ? `${(((asks[0].price - bids[0].price) / asks[0].price) * 100).toFixed(2)}%`
                                : '-'}
                            </span>

                            <button
                              onClick={() => asks[0] && setLimitPrice(asks[0].price.toFixed(6))}
                              title="Lowest price someone is willing to sell at — click to use"
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded transition-colors',
                                asks[0]
                                  ? 'hover:bg-red-500/10 cursor-pointer'
                                  : 'opacity-40 cursor-default'
                              )}
                            >
                              <span className="text-red-500 font-medium">{asks[0]?.price.toFixed(4) || '-'}</span>
                              <span className={cn('text-[9px] uppercase tracking-wide', 'text-gray-500 dark:text-white/40')}>
                                Best Sell
                              </span>
                            </button>
                          </div>
                          <p className={cn('text-[9px] text-center', 'text-black/20 dark:text-white/20')}>
                            Click a price to set your limit
                          </p>
                        </div>
                      )}

                      {/* Price difference indicator */}
                      {limitPrice &&
                        parseFloat(limitPrice) > 0 &&
                        (() => {
                          const limit = parseFloat(limitPrice);
                          const currentPrice = !revert ? asks[0]?.price || 0 : bids[0]?.price || 0;
                          if (currentPrice <= 0) return null;
                          const priceDiff = ((limit - currentPrice) / currentPrice) * 100;
                          const isAbove = priceDiff > 0;
                          if (Math.abs(priceDiff) < 0.01) return null;
                          return (
                            <div
                              className={cn(
                                'mt-2 py-1.5 rounded text-[10px] text-center',
                                isAbove
                                  ? 'text-red-400 bg-red-500/10'
                                  : 'text-green-400 bg-green-500/10'
                              )}
                            >
                              {isAbove ? '↑' : '↓'} {Math.abs(priceDiff).toFixed(2)}%{' '}
                              {isAbove ? 'above' : 'below'} market
                            </div>
                          );
                        })()}
                    </div>

                    {/* Order Expiration - Segmented Control */}
                    <div
                      className={cn(
                        'flex rounded-lg overflow-hidden border',
                        'bg-gray-100 border-black/[0.08] dark:bg-white/[0.03] dark:border-white/[0.08]'
                      )}
                    >
                      {[
                        { value: 'never', label: 'GTC', title: 'Good Til Cancelled' },
                        { value: '1h', label: '1h', title: '1 Hour' },
                        { value: '24h', label: '24h', title: '24 Hours' },
                        { value: '7d', label: '7d', title: '7 Days' }
                      ].map((exp, idx) => (
                        <button
                          key={exp.value}
                          title={exp.title}
                          onClick={() => setOrderExpiry(exp.value)}
                          className={cn(
                            'flex-1 py-2 text-[11px] font-medium transition-all relative',
                            orderExpiry === exp.value
                              ? 'text-primary'
                              : 'text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70'
                          )}
                        >
                          {exp.label}
                          {orderExpiry === exp.value && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Mini Orderbook (5 levels) */}
                    {(bids.length > 0 || asks.length > 0) && (() => {
                      const topAsks = asks.slice(0, 5).reverse();
                      const topBids = bids.slice(0, 5);
                      const maxAmount = Math.max(
                        ...topAsks.map(a => a.amount),
                        ...topBids.map(b => b.amount),
                        1
                      );
                      const spread = asks[0]?.price && bids[0]?.price
                        ? ((asks[0].price - bids[0].price) / asks[0].price * 100).toFixed(2)
                        : null;
                      return (
                        <div className={cn(
                          'mt-3 rounded-xl border overflow-hidden',
                          'border-black/[0.08] bg-gray-50/50 dark:border-white/[0.08] dark:bg-white/[0.02]'
                        )}>
                          <div className={cn(
                            'px-3 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide',
                            'text-gray-400 dark:text-white/30'
                          )}>
                            <span>Price</span>
                            <span>Amount</span>
                          </div>
                          {/* Asks (red) - highest at top, lowest near spread */}
                          {topAsks.map((a, i) => (
                            <button
                              key={`a-${i}`}
                              type="button"
                              className="relative flex items-center justify-between w-full px-3 py-[3px] cursor-pointer hover:bg-red-500/5 border-0 bg-transparent"
                              onClick={() => setLimitPrice(a.price.toFixed(6))}
                            >
                              <div
                                className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                                style={{ width: `${(a.amount / maxAmount) * 100}%` }}
                              />
                              <span className="relative text-[11px] font-mono text-red-400">{a.price < 0.01 ? a.price.toExponential(2) : a.price < 1 ? a.price.toFixed(6) : fNumber(a.price)}</span>
                              <span className={cn('relative text-[11px] font-mono', 'text-gray-500 dark:text-white/50')}>{fNumber(a.amount)}</span>
                            </button>
                          ))}
                          {/* Spread divider */}
                          <div className={cn(
                            'flex items-center justify-center py-1 text-[10px] font-mono border-y',
                            'border-black/[0.06] text-gray-500 dark:border-white/[0.06] dark:text-white/40'
                          )}>
                            {spread !== null ? `Spread ${spread}%` : '—'}
                          </div>
                          {/* Bids (green) - highest near spread, lowest at bottom */}
                          {topBids.map((b, i) => (
                            <button
                              key={`b-${i}`}
                              type="button"
                              className="relative flex items-center justify-between w-full px-3 py-[3px] cursor-pointer hover:bg-green-500/5 border-0 bg-transparent"
                              onClick={() => setLimitPrice(b.price.toFixed(6))}
                            >
                              <div
                                className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                                style={{ width: `${(b.amount / maxAmount) * 100}%` }}
                              />
                              <span className="relative text-[11px] font-mono text-green-400">{b.price < 0.01 ? b.price.toExponential(2) : b.price < 1 ? b.price.toFixed(6) : fNumber(b.price)}</span>
                              <span className={cn('relative text-[11px] font-mono', 'text-gray-500 dark:text-white/50')}>{fNumber(b.amount)}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* User Open Orders */}
                    {userOffers.length > 0 && (
                      <div className={cn(
                        'mt-3 rounded-xl border overflow-hidden',
                        'border-black/[0.08] bg-gray-50/50 dark:border-white/[0.08] dark:bg-white/[0.02]'
                      )}>
                        <div className={cn(
                          'px-3 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide',
                          'text-gray-400 dark:text-white/30'
                        )}>
                          <span className="w-8">Side</span>
                          <span className="flex-1 text-center">Price</span>
                          <span className="flex-1 text-right">Amount</span>
                          <span className="w-14 text-right" />
                        </div>
                        {userOffers.map((o) => (
                          <div
                            key={o.seq}
                            className={cn(
                              'flex items-center justify-between px-3 py-1.5 text-[11px] font-mono',
                              'hover:bg-gray-100 dark:hover:bg-white/[0.03]'
                            )}
                          >
                            <span className={cn('w-8', o.side === 'Buy' ? 'text-green-400' : 'text-red-400')}>{o.side}</span>
                            <span className={cn('flex-1 text-center', 'text-gray-600 dark:text-white/60')}>{o.price < 0.01 ? o.price.toExponential(2) : o.price < 1 ? o.price.toFixed(6) : fNumber(o.price)}</span>
                            <span className={cn('flex-1 text-right', 'text-gray-500 dark:text-white/50')}>{fNumber(o.amount)}</span>
                            <button
                              onClick={() => onCancelOffer(o.seq)}
                              disabled={cancellingOffer === o.seq}
                              className={cn(
                                'w-14 text-right px-2 py-0.5 rounded text-[10px] transition-colors',
                                cancellingOffer === o.seq
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                              )}
                            >
                              {cancellingOffer === o.seq ? <ClipLoader size={10} color="#9ca3af" /> : 'Cancel'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {/* Price Impact for Limit Orders (market orders show it in quote summary) */}
                {orderType === 'limit' && amount1 && amount2 && Math.abs(priceImpact) > 0.01 && (
                  <div
                    className={cn(
                      'flex items-center justify-between mb-4 px-3 py-2 rounded-lg border',
                      'bg-gray-100 border-[rgba(66,133,244,0.1)] dark:bg-white/5 dark:border-[rgba(66,133,244,0.15)]'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-mono',
                        'text-primary/50 dark:text-primary/50'
                      )}
                    >
                      Price Impact
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: getPriceImpactColor(Math.abs(priceImpact)) }}
                    >
                      {priceImpact > 0 ? '+' : ''}
                      {priceImpact}%
                    </span>
                  </div>
                )}

                {/* Action Button - Premium Futuristic */}
                {accountProfile && accountProfile.account ? (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      isProcessing === 1 ||
                      !isLoggedIn ||
                      (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                    }
                    className={cn(
                      'w-full py-4 md:py-5 rounded-2xl text-[15px] font-bold transition-all duration-300 relative overflow-hidden group',
                      isProcessing === 1 ||
                        !isLoggedIn ||
                        (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-white/5 dark:text-white/20 dark:cursor-not-allowed dark:border dark:border-white/5'
                        : 'bg-[#0a5cc5] text-white shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                    )}
                  >
                    {/* Glossy overlay effect */}
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20 z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isProcessing === 1 && <ClipLoader size={18} color="#fff" />}
                      {handleMsg()}
                    </span>
                  </button>
                ) : (
                  <ConnectWallet
                    text="Connect Wallet"
                    fullWidth
                    className="!py-4 md:!py-5 !rounded-2xl !text-[15px] !font-bold !bg-[#0a5cc5] !text-white !shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] hover:!shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)] !transition-[box-shadow] !duration-300"
                  />
                )}

            </div>
          </div>
          </>)}

          {/* Trending Tokens */}
          {tradeMode === 'tokens' && (<>
          <div className={cn(
            'w-full rounded-xl border-[1.5px] p-4 sm:p-5 relative overflow-hidden',
            'border-[#E2E8F0] bg-white/40 dark:border-white/[0.06] dark:bg-white/[0.01]'
          )}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center',
                  'bg-[#137DFE]/10 dark:bg-white/[0.06]'
                )}>
                  <TrendingUp size={12} className={'text-[#137DFE] dark:text-white/60'} />
                </div>
                <span className={cn(
                  'text-[12px] sm:text-[13px] font-bold uppercase tracking-[1.5px] font-mono',
                  'text-[#0F172A] dark:text-[#F5F5F5]'
                )}>
                  Trending
                </span>
              </div>
              <a
                href="/trending"
                className={cn(
                  'text-[11px] sm:text-[12px] font-semibold no-underline transition-colors tracking-wide',
                  'text-[#137DFE]/60 hover:text-[#137DFE] dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                View All
              </a>
            </div>

            <div className="flex flex-col gap-1">
              {trendingLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className={cn(
                    'h-12 rounded-lg animate-pulse',
                    'bg-gray-100 dark:bg-white/[0.03]'
                  )} />
                ))
              ) : (
                trendingTokens.slice(0, 5).map((t, i) => {
                  const change = t.pro24h || 0;
                  const isUp = change >= 0;
                  const rate = metrics[activeFiatCurrency] || 1;
                  const sym = currencySymbols[activeFiatCurrency] || '$';
                  const price = activeFiatCurrency === 'XRP' ? t.exch : (t.exch ? t.exch / rate : 0);
                  const isBoosted = t.trendingBoost > 0 && t.trendingBoostExpires > Date.now();
                  const rankColors = ['text-[#FFD700]', 'text-[#C0C0C0]', 'text-[#CD7F32]'];
                  const pressure = t.buyerPressure || 0;

                  const fmtPrice = (p) => {
                    if (!p) return `${sym}0`;
                    if (p < 0.0001) {
                      const z = -Math.floor(Math.log10(p)) - 1;
                      const s = Math.round(p * Math.pow(10, z + 4));
                      return <>{sym}0.0<sub className="text-[8px]">{z}</sub>{s}</>;
                    }
                    if (p < 1) return `${sym}${p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
                    if (p >= 1e6) return `${sym}${(p / 1e6).toFixed(1)}M`;
                    if (p >= 1e3) return `${sym}${(p / 1e3).toFixed(1)}K`;
                    return `${sym}${p < 100 ? p.toFixed(2) : Math.round(p)}`;
                  };

                  return (
                    <a
                      key={t.md5 || i}
                      href={`/token/${t.slug}`}
                      className={cn(
                        'grid items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all duration-200 no-underline',
                        'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      )}
                      style={{ gridTemplateColumns: '20px 28px 1fr 72px 56px 64px 48px 80px 52px' }}
                    >
                      {/* Rank */}
                      <span className={cn(
                        'text-[11px] font-mono font-bold text-center',
                        i < 3 ? rankColors[i] : 'text-gray-300 dark:text-white/20'
                      )}>
                        {i + 1}
                      </span>

                      {/* Token image */}
                      <div className={cn(
                        'w-7 h-7 rounded-lg overflow-hidden border-[1.5px]',
                        'border-[#E2E8F0] bg-white dark:border-white/[0.06] dark:bg-white/[0.03]'
                      )}>
                        {t.md5 ? (
                          <img src={`https://s1.xrpl.to/thumb/${t.md5}_32`} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className={cn('w-full h-full flex items-center justify-center text-[10px] font-bold', 'text-[#64748B]/30 dark:text-white/20')}>{t.currency?.[0]}</div>
                        )}
                      </div>

                      {/* Name + boost */}
                      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <span className={cn(
                          'text-[12px] font-semibold truncate',
                          isBoosted && t.trendingBoost >= 500 ? 'text-[#FFD700]' : 'text-[#0F172A] dark:text-[#F5F5F5]'
                        )}>
                          {t.name}
                        </span>
                        {isBoosted && (
                          <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#F6AF01]">
                            <Flame size={10} fill="#F6AF01" />
                            <span className="text-[9px] font-bold">{t.trendingBoost}</span>
                          </span>
                        )}
                      </div>

                      {/* Traders */}
                      <span className={cn('text-[11px] font-mono text-right tabular-nums', 'text-black/50 dark:text-white/50')}>
                        {fmtStat(t.uniqueTraders24h)} <span className={cn('text-[9px]', 'text-black/30 dark:text-white/30')}>traders</span>
                      </span>

                      {/* Buyer pressure */}
                      <span className={cn('text-[11px] font-mono font-bold text-right tabular-nums', pressure >= 0.5 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                        {pressure > 0 ? `${Math.round(pressure * 100)}%` : '-'} <span className={cn('text-[9px] font-normal', 'text-black/30 dark:text-white/30')}>buy</span>
                      </span>

                      {/* Volume */}
                      <span className={cn('text-[11px] font-mono text-right tabular-nums', 'text-black/50 dark:text-white/50')}>
                        {fmtStat(t.vol24h)} <span className={cn('text-[9px]', 'text-black/30 dark:text-white/30')}>volume</span>
                      </span>

                      {/* Sparkline */}
                      <MiniSparkline data={sparklines[t.md5]} color={isUp ? '#08AA09' : '#ef4444'} width={48} height={16} />

                      {/* Price */}
                      <span className={cn('text-[11px] font-mono font-medium text-right tabular-nums', 'text-[#0F172A]/70 dark:text-white/70')}>
                        {fmtPrice(price)}
                      </span>
                      {/* 24h change */}
                      <span className={cn('text-[11px] font-mono font-bold text-right tabular-nums min-w-[48px]', isUp ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                        {isUp ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </a>
                  );
                })
              )}
            </div>

            {/* Boost CTA */}
            {!trendingLoading && trendingTokens.length > 0 && (
              <div className={cn(
                'flex items-center justify-between mt-2 pt-3 border-t',
                'border-black/[0.06] dark:border-white/[0.06]'
              )}>
                <div className="flex items-center gap-2">
                  <Flame size={12} className="text-[#F6AF01]" fill="#F6AF01" />
                  <span className={cn('text-[11px]', 'text-black/40 dark:text-white/40')}>
                    Want your token here?
                  </span>
                </div>
                <button
                  onClick={() => setBoostToken(trendingTokens[0])}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all border cursor-pointer',
                    'bg-[#F6AF01]/10 text-[#F6AF01] border-[#F6AF01]/20',
                    'hover:bg-[#F6AF01]/20 hover:border-[#F6AF01]/40'
                  )}
                >
                  Boost Trending
                </button>
              </div>
            )}
          </div>

          {/* Recent Large Trades */}
          {recentTrades.length > 0 && (
          <div className={cn(
            'w-full mt-4 rounded-xl border-[1.5px] p-4 sm:p-5 relative overflow-hidden',
            'border-[#E2E8F0] bg-white/40 dark:border-white/[0.06] dark:bg-white/[0.01]'
          )}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                'bg-[#137DFE]/10 dark:bg-white/[0.06]'
              )}>
                <Zap size={12} className={'text-[#137DFE] dark:text-white/60'} />
              </div>
              <span className={cn(
                'text-[12px] sm:text-[13px] font-bold uppercase tracking-[1.5px] font-mono',
                'text-[#0F172A] dark:text-[#F5F5F5]'
              )}>
                Recent Large Trades
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {recentTrades.map((trade, i) => {
                const t = trade._token;
                const isBuy = trade.paid?.currency === 'XRP';
                const xrpSide = isBuy ? trade.paid : trade.got?.currency === 'XRP' ? trade.got : null;
                const tokenSide = isBuy ? trade.got : trade.paid;
                const xrpAmt = xrpSide ? parseFloat(xrpSide.value || xrpSide.amount || 0) : 0;
                const tokenAmt = tokenSide ? parseFloat(tokenSide.value || tokenSide.amount || 0) : 0;
                const trader = trade.taker || '';
                const maxXrp = Math.max(...recentTrades.map((tr) => {
                  const s = tr.paid?.currency === 'XRP' ? tr.paid : tr.got?.currency === 'XRP' ? tr.got : null;
                  return s ? parseFloat(s.value || s.amount || 0) : 0;
                }));
                const barPct = maxXrp > 0 ? Math.max(8, Math.min(100, Math.sqrt(xrpAmt / maxXrp) * 100)) : 8;
                const barBg = isBuy
                  ? (isDark ? 'linear-gradient(90deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)' : 'linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)')
                  : (isDark ? 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.05) 100%)' : 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)');
                const barBorder = isBuy ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626');
                const elapsed = trade.time ? (() => {
                  const s = Math.floor((Date.now() - trade.time) / 1000);
                  if (s < 60) return `${s}s ago`;
                  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
                  return `${Math.floor(s / 86400)}d ago`;
                })() : '';
                return (
                  <a
                    key={trade.hash || i}
                    href={`/token/${t?.slug}`}
                    className={cn(
                      'grid items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all duration-200 no-underline',
                      'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    )}
                    style={{ gridTemplateColumns: '52px 36px 1fr 1fr 72px' }}
                  >
                    {/* Time */}
                    <span suppressHydrationWarning className={cn('text-[11px] font-semibold tabular-nums', 'text-black/60 dark:text-white/60')}>
                      {elapsed}
                    </span>
                    {/* Buy/Sell */}
                    <span className={cn('text-[11px] font-extrabold uppercase tracking-[0.04em]', isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {isBuy ? 'Buy' : 'Sell'}
                    </span>
                    {/* Token amount with bar */}
                    <div className="relative flex items-center h-7 px-[10px] rounded-[6px] overflow-hidden">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[80%] rounded-sm" style={{ width: `${barPct}%`, background: barBg, borderLeft: `3px solid ${barBorder}`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
                      <span className={cn('relative z-[1] text-[11px] font-mono font-medium truncate', 'text-[#1a1a1a] dark:text-white')}>
                        {fmtStat(tokenAmt)}{' '}
                        <span className="opacity-60 text-[9px] font-normal">{t?.name}</span>
                      </span>
                    </div>
                    {/* XRP amount with bar */}
                    <div className="relative flex items-center h-7 px-[10px] rounded-[6px] overflow-hidden">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[80%] rounded-sm" style={{ width: `${barPct}%`, background: barBg, borderLeft: `3px solid ${barBorder}`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
                      <span className={cn('relative z-[1] text-[11px] font-mono font-medium', 'text-[#1a1a1a] dark:text-white')}>
                        {fmtStat(xrpAmt)}{' '}
                        <span className="opacity-60 text-[9px] font-normal">XRP</span>
                      </span>
                    </div>
                    {/* Trader address */}
                    <a
                      href={`/address/${trader}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-mono no-underline truncate',
                        'bg-black/[0.02] border-black/[0.04] text-gray-500 hover:text-gray-900 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white/50 dark:hover:text-white/80'
                      )}
                      title={trader}
                    >
                      {trader ? `${trader.slice(0, 4)}...${trader.slice(-4)}` : '-'}
                    </a>
                  </a>
                );
              })}
            </div>
          </div>
          )}

          {/* Boost Modal */}
          {boostToken && (
            <BoostModal
              token={boostToken}
              onClose={() => setBoostToken(null)}
              onSuccess={() => setBoostToken(null)}
            />
          )}
          </>)}

          {/* NFT Quick Buy moved into trade mode toggle above */}
        </div>
      )}

    </div>
  );
}

export default memo(Swap);
