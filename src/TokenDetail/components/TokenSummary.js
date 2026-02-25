import React, { useState, useContext, useEffect, useLayoutEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { fNumber, checkExpiration, getHashIcon } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';
import {
  TrendingUp,
  Sparkles,
  ExternalLink,
  Star,
  Copy,
  Check,
  Loader2,
  X,
  Link2,
  Unlink2,
  Zap,
  Flame
} from 'lucide-react';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import VerificationBadge from 'src/components/VerificationBadge';
import api, { apiFetch } from 'src/utils/api';
import { toast } from 'sonner';
import Watch from './Watch';
import EditTokenDialog from 'src/components/EditTokenDialog';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import VerifyBadgeModal from 'src/components/VerifyBadgeModal';
import BoostModal from 'src/components/BoostModal';
import TweetPromoteModal from 'src/components/TweetPromoteModal';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: '✕'
};

const CURRENCY_ISSUERS = { XRP_MD5: 'XRP' };

// Convert currency code to 40-char hex (XRPL standard)
const currencyToHex = (currency) => {
  if (!currency || currency.length <= 3) return null;
  return Buffer.from(currency, 'utf8').toString('hex').toUpperCase().padEnd(40, '0');
};

// Price formatter - matches TrendingTokens style
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice) || numPrice === 0) return '0';

  if (numPrice < 0.01) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numPrice.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 1) {
    return numPrice.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 100) {
    return numPrice.toFixed(2);
  } else if (numPrice >= 1e6) {
    return `${(numPrice / 1e6).toFixed(1)}M`;
  } else if (numPrice >= 1e3) {
    return `${(numPrice / 1e3).toFixed(1)}K`;
  }
  return Math.round(numPrice).toString();
};

// Origin Icon
const OriginIcon = ({ origin, isDark }) => {
  const s = 'w-3.5 h-3.5';
  switch (origin) {
    case 'FirstLedger':
      return <ExternalLink className={cn(s, 'text-[#013CFE]')} />;
    case 'XPMarket':
      return <Sparkles className={cn(s, 'text-[#6D1FEE]')} />;
    case 'LedgerMeme':
      return <span className="text-xs">😂</span>;
    case 'Horizon':
      return <Star className={cn(s, 'text-[#f97316]')} />;
    case 'aigent.run':
      return (
        <img src="/static/aigentrun.gif" alt="Aigent.Run" className="w-3.5 h-3.5 object-contain" />
      );
    case 'Magnetic X':
      return (
        <img
          src="/static/magneticx-logo.webp"
          alt="Magnetic X"
          className="w-3.5 h-3.5 object-contain"
        />
      );
    case 'xrp.fun':
      return <TrendingUp className={cn(s, 'text-[#B72136]')} />;
    default:
      return <Sparkles className={cn(s, isDark ? 'text-white/55' : 'text-gray-400')} />;
  }
};

const TokenSummary = memo(({ token }) => {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const metrics = useSelector(selectMetrics);
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { activeFiatCurrency, sync, setSync, setTrustlineUpdate } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ref for cleanup tracking
  const mountedRef = useRef(true);
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // useLayoutEffect prevents CLS from mobile layout switch before paint
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [prevPrice, setPrevPrice] = useState(null);
  const [priceColor, setPriceColor] = useState(null);
  const [isRemove, setIsRemove] = useState(false);
  const [trustlineBalance, setTrustlineBalance] = useState(0);
  const [editToken, setEditToken] = useState(null);
  const [dustConfirm, setDustConfirm] = useState(null); // 'dex' | 'issuer' | null
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [currentVerified, setCurrentVerified] = useState(token?.verified || 0);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [tweetCount, setTweetCount] = useState(0);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const {
    id,
    name,
    exch,
    pro7d,
    pro24h,
    pro5m,
    pro1h,
    maxMin24h,
    usd,
    vol24hxrp,
    marketcap,
    expiration,
    user,
    md5,
    currency,
    issuer,
    verified,
    holders,
    tvl,
    origin,
    creator,
    trustlines,
    AMM,
    supply,
    tokenType,
    mptIssuanceID,
    metadata,
    trendingBoost,
    trendingBoostExpires
  } = token;

  const isMPT = tokenType === 'mpt';

  // Fetch tweet verification count
  useEffect(() => {
    if (!md5) return;
    let cancelled = false;
    api.get(`${BASE_URL}/tweet/token/${md5}?limit=0`)
      .then(res => {
        if (!cancelled && res.data) setTweetCount(res.data.count || 0);
      })
      .catch(err => { console.warn('[TokenSummary] Tweet count fetch failed:', err.message); });
    return () => { cancelled = true; };
  }, [md5]);

  // Trustline handler
  const handleSetTrust = async () => {
    if (isMPT) {
      toast.info('MPT tokens do not require trustlines');
      return;
    }
    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    if (accountProfile.wallet_type !== 'device') {
      toast.error('Unsupported wallet type');
      return;
    }

    // If removing with significant balance, block it
    if (isRemove && trustlineBalance >= 0.000001) {
      toast.error('Cannot remove trustline', { description: 'Sell or transfer your balance first' });
      return;
    }

    // If removing with dust, prompt for confirmation first
    if (isRemove && trustlineBalance > 0 && trustlineBalance < 0.000001) {
      setDustConfirm('dex');
      return;
    }

    // Standard trustline set/remove (no dust)
    await executeTrustSet();
  };

  const executeTrustSet = async () => {
    const action = isRemove ? 'Removing' : 'Setting';
    const toastId = toast.loading(`${action} trustline...`, { description: 'Preparing transaction' });

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
        toast.error('Seed not found', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      const tx = {
        Account: accountProfile.account,
        TransactionType: 'TrustSet',
        SourceTag: 161803,
        LimitAmount: { issuer, currency, value: isRemove ? '0' : new Decimal(supply).toFixed(0) },
        Flags: 0x00020000
      };

      toast.loading(`${action} trustline...`, { id: toastId, description: 'Fetching account info' });
      let seqRes, feeRes;
      try {
        [seqRes, feeRes] = await Promise.all([
          api.get(`https://api.xrpl.to/v1/submit/account/${accountProfile.account}/sequence`),
          api.get('https://api.xrpl.to/v1/submit/fee')
        ]);
      } catch (fetchErr) {
        if (fetchErr?.response?.status === 404) {
          toast.error('Account not activated', { id: toastId, description: 'Fund your account with at least 1 XRP to activate it' });
        } else {
          toast.error('Network error', { id: toastId, description: 'Could not fetch account info' });
        }
        return;
      }

      const prepared = {
        ...tx,
        Sequence: seqRes.data.sequence,
        Fee: feeRes.data.base_fee,
        LastLedgerSequence: seqRes.data.ledger_index + 20
      };

      toast.loading(`${action} trustline...`, { id: toastId, description: 'Signing transaction' });
      const signed = wallet.sign(prepared);

      toast.loading(`${action} trustline...`, { id: toastId, description: 'Submitting to XRPL' });
      const result = await api.post('https://api.xrpl.to/v1/submit', { tx_blob: signed.tx_blob });

      if (result.data.engine_result === 'tesSUCCESS') {
        setIsRemove(!isRemove);
        if (isRemove) setTrustlineBalance(0);
        setTrustlineUpdate({ issuer, currency, hasTrustline: !isRemove });
        setSync(s => s + 1);
        toast.success(isRemove ? 'Trustline removed!' : 'Trustline set!', {
          id: toastId,
          description: `Tx: ${signed.hash.slice(0, 8)}...`
        });
      } else {
        toast.error('Transaction failed', { id: toastId, description: result.data.engine_result_message || result.data.engine_result });
      }
    } catch (err) {
      console.error('Trustline error:', err);
      toast.error('Error', { description: err.message?.slice(0, 50) || 'Unknown error' });
    }
  };

  const executeDustClear = async (method) => {
    setDustConfirm(null);
    const toastId = toast.loading('Clearing dust...', { description: method === 'dex' ? 'Selling on DEX' : 'Sending to issuer' });

    try {
      const { Wallet } = await import('xrpl');
      const { submitTransaction } = await import('src/utils/api');
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
        toast.error('Seed not found', { id: toastId });
        return;
      }

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const wallet = Wallet.fromSeed(walletData.seed, { algorithm });

      if (method === 'dex') {
        const offerTx = {
          TransactionType: 'OfferCreate',
          Account: accountProfile.account,
          SourceTag: 161803,
          TakerGets: '1',
          TakerPays: { currency, issuer, value: new Decimal(trustlineBalance).toFixed(15) },
          Flags: 655360
        };
        const offerResult = await submitTransaction(wallet, offerTx);
        const txHash = offerResult.hash || offerResult.tx_json?.hash;
        setIsRemove(false);
        setTrustlineBalance(0);
        toast.success('Dust sold on DEX!', { id: toastId, description: `Tx: ${txHash?.slice(0, 8)}...` });
      } else {
        // Check issuer flags via API (lsfRequireDestTag = 0x00020000)
        let needsTag = false;
        try {
          const issuerInfo = await apiFetch(`https://api.xrpl.to/v1/account/info/${issuer}`).then(r => r.json());
          needsTag = (issuerInfo?.flags & 0x00020000) !== 0;
        } catch (err) {
          console.warn('[TokenSummary] Could not check issuer flags:', err.message);
        }
        const tx = {
          TransactionType: 'Payment',
          Account: accountProfile.account,
          Destination: issuer,
          SourceTag: 161803,
          Amount: { currency, issuer, value: new Decimal(trustlineBalance).toFixed(15) },
          Flags: 131072
        };
        if (needsTag) tx.DestinationTag = 0;
        const result = await submitTransaction(wallet, tx);
        const txHash = result.hash || result.tx_json?.hash;
        setIsRemove(false);
        setTrustlineBalance(0);
        toast.success('Dust burned!', { id: toastId, description: `Tx: ${txHash?.slice(0, 8)}...` });
      }
    } catch (err) {
      console.error('Dust clear error:', err);
      toast.error('Error', { description: err.message?.slice(0, 50) || 'Unknown error' });
    }
  };

  // Price change animation
  useEffect(() => {
    if (prevPrice !== null && exch !== null && exch !== prevPrice) {
      const curr = parseFloat(exch),
        prev = parseFloat(prevPrice);
      if (!isNaN(curr) && !isNaN(prev)) {
        setPriceColor(curr > prev ? '#22c55e' : '#ef4444');
        const t = setTimeout(() => setPriceColor(null), 1500);
        return () => clearTimeout(t);
      }
    }
    setPrevPrice(exch);
  }, [exch, prevPrice]);

  const priceChanges = useMemo(
    () => [
      { value: pro5m, label: '5m' },
      { value: pro1h, label: '1h' },
      { value: pro24h, label: '24h' },
      { value: pro7d, label: '7d' }
    ],
    [pro5m, pro1h, pro24h, pro7d]
  );

  const range24h = useMemo(() => {
    if (maxMin24h && Array.isArray(maxMin24h) && maxMin24h.length >= 2) {
      const min = Math.min(maxMin24h[0], maxMin24h[1]);
      const max = Math.max(maxMin24h[0], maxMin24h[1]);
      const delta = max - min;
      const currentPrice = exch || usd;
      let percent =
        delta > 0 && currentPrice
          ? Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100))
          : 50;
      return { min, max, percent };
    }
    if (pro24h !== null && pro24h !== undefined) {
      const currentPrice = exch || 1;
      const variation = Math.abs(pro24h) / 100;
      const min = currentPrice * (1 - variation);
      const max = currentPrice * (1 + variation);
      const delta = max - min;
      let percent =
        delta > 0 ? Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100)) : 50;
      return { min, max, percent };
    }
    return null;
  }, [maxMin24h, exch, usd, pro24h]);

  const formatValue = (v) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 999500) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 999.5) return `${(v / 1e3).toFixed(1)}K`;
    return fNumber(v);
  };

  const formatPct = useCallback(
    (v) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`),
    []
  );

  const convertedMarketCap =
    marketcap &&
      (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
      ? new Decimal(marketcap).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber()
      : marketcap || 0;
  const convertedVolume =
    vol24hxrp &&
      (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
      ? new Decimal(vol24hxrp).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber()
      : vol24hxrp || 0;
  const convertedTvl =
    tvl && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
      ? new Decimal(tvl).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber()
      : tvl || 0;

  const fallbackImageUrl = issuer ? getHashIcon(issuer) : '/static/account_logo.webp';
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/thumb/${md5}_128`);
  useEffect(() => { setImgSrc(`https://s1.xrpl.to/thumb/${md5}_128`); }, [md5]);
  const handleGoogleLensSearch = () =>
    window.open(
      `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(`https://s1.xrpl.to/thumb/${md5}_128`)}`,
      '_blank'
    );
  const isExpired = checkExpiration(expiration);

  const copyIssuer = () => {
    navigator.clipboard.writeText(issuer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Check existing trustline - use dedicated API endpoint with peer filter
  useEffect(() => {
    if (!accountProfile || !issuer || isMPT) return;

    const controller = new AbortController();

    const url = `${BASE_URL}/account/trustline/${accountProfile.account}/${issuer}/${encodeURIComponent(currency)}`;
    api
      .get(url, {
        signal: controller.signal,
        timeout: 5000
      })
      .then((res) => {
        if (res.status === 200 && res.data?.success && mountedRef.current) {
          setIsRemove(res.data.hasTrustline);
          setTrustlineBalance(res.data.balance || 0);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error('[TokenSummary] API error:', err.message);
      });

    return () => controller.abort();
  }, [accountProfile, sync, issuer, currency, isMPT]);

  const getPriceDisplay = () => {
    const symbol = currencySymbols[activeFiatCurrency];
    const exchRate =
      Number(metrics[activeFiatCurrency]) ||
      (activeFiatCurrency === 'CNH' ? Number(metrics.CNY) : null) ||
      1;
    const price = Number(activeFiatCurrency === 'XRP' ? exch : exch / exchRate);
    if (!price || !isFinite(price) || price === 0) return { symbol, price: '0', isCompact: false };

    if (price < 0.01) {
      const str = price.toFixed(15);
      const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
      if (zeros >= 4) {
        const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
        return { symbol, zeros, significant: significant.slice(0, 4), isCompact: true };
      }
      return {
        symbol,
        price: price.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''),
        isCompact: false
      };
    } else if (price < 1) {
      return {
        symbol,
        price: price.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''),
        isCompact: false
      };
    } else if (price < 100) {
      return { symbol, price: price.toFixed(2), isCompact: false };
    } else if (price >= 1e6) {
      return { symbol, price: `${(price / 1e6).toFixed(1)}M`, isCompact: false };
    } else if (price >= 1e3) {
      return { symbol, price: `${(price / 1e3).toFixed(1)}K`, isCompact: false };
    }
    return { symbol, price: Math.round(price).toString(), isCompact: false };
  };

  const priceDisplay = getPriceDisplay();
  const mainChange = pro24h ?? pro1h ?? 0;
  const isPositive = mainChange >= 0;

  return (
    <div
      className={cn(
        'rounded-2xl border transition-[opacity,transform,background-color,border-color] duration-200 p-4 relative overflow-hidden',
        isDark
          ? 'border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm'
          : 'border-black/[0.06] bg-white/50 backdrop-blur-sm shadow-sm'
      )}
    >
      {/* Background Accent */}
      <div className={cn('absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20', isDark ? 'bg-[#137DFE]/20' : 'bg-blue-400/20')} />

      <div className="flex items-start justify-between gap-4">
        {/* Left: Token Image + Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={handleGoogleLensSearch}
          >
            <Image
              src={imgSrc}
              alt={name}
              width={52}
              height={52}
              sizes="52px"
              priority
              unoptimized={imgSrc.startsWith('data:')}
              className={cn(
                'w-[52px] h-[52px] rounded-2xl object-cover border shadow-sm transition-[opacity,transform,background-color,border-color] duration-300 group-hover:scale-105 group-hover:shadow-lg',
                isDark ? 'border-white/10 shadow-black/20' : 'border-black/[0.08] shadow-gray-200'
              )}
              onError={() => setImgSrc(fallbackImageUrl)}
            />
            {/* Verification Badge by Tier */}
            <VerificationBadge verified={currentVerified} size="md" isDark={isDark} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'text-lg font-bold truncate tracking-tight',
                  trendingBoost >= 500 && trendingBoostExpires > Date.now()
                    ? 'text-[#FFD700]'
                    : isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                {name}
              </span>
              <div className="flex items-center gap-1.5 uppercase">
                {id && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider',
                      isDark ? 'bg-white/[0.08] text-white/60' : 'bg-black/[0.06] text-gray-500'
                    )}
                  >
                    #{id}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider',
                    isDark ? 'bg-white/[0.06] text-white/60' : 'bg-black/[0.04] text-gray-500'
                  )}
                  title={origin || 'XRPL'}
                >
                  <OriginIcon origin={origin || 'XRPL'} isDark={isDark} />
                  <span className="hidden sm:inline">{origin || 'XRPL'}</span>
                </span>
                {trendingBoost > 0 && trendingBoostExpires > Date.now() && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#F6AF01]/10 text-[#F6AF01]"
                    title={`${trendingBoost} active boosts`}
                  >
                    <Flame size={10} fill="#F6AF01" />
                    {trendingBoost}
                  </span>
                )}
                {tweetCount > 0 && (
                  <button
                    onClick={() => setShowPromoteModal(true)}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider cursor-pointer transition-[background-color,border-color]',
                      isDark ? 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]' : 'bg-black/[0.04] text-gray-500 hover:bg-black/[0.08]'
                    )}
                    title={`${tweetCount} verified tweets`}
                  >
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    {tweetCount}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn('text-[11px] font-semibold truncate tracking-wide', isDark ? 'text-white/55' : 'text-gray-500')}
              >
                {user || name}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Price */}
        <div className="flex flex-col items-end min-w-0 max-w-[45%] sm:max-w-none sm:flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            <span
              role="status"
              aria-live="polite"
              aria-label={`Price: ${priceDisplay.symbol}${priceDisplay.isCompact ? `0.0${priceDisplay.zeros}${priceDisplay.significant}` : priceDisplay.price}`}
              className={cn(
                'text-[20px] sm:text-[28px] font-black tracking-tighter leading-none truncate',
                priceColor ? '' : isDark ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]' : 'text-gray-900'
              )}
              style={priceColor ? { color: priceColor } : undefined}
            >
              {priceDisplay.isCompact ? (
                <>
                  {priceDisplay.symbol}0.0<sub className="text-[0.6em] opacity-80 bottom-0">{priceDisplay.zeros}</sub>
                  {priceDisplay.significant}
                </>
              ) : (
                <>
                  {priceDisplay.symbol}
                  {priceDisplay.price}
                </>
              )}
            </span>
          </div>
          <div className={cn(
            'text-[10px] font-bold opacity-50 uppercase tracking-widest',
            isDark ? 'text-white' : 'text-black'
          )}>
            {activeFiatCurrency === 'XRP' ? (
              `≈ $${fNumber(exch / (metrics.USD || 1))}`
            ) : (
              `≈ ✕ ${fNumber(exch)}`
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mt-5">
        {[
          {
            label: 'MCAP',
            value: formatValue(convertedMarketCap),
          },
          {
            label: 'VOL 24H',
            value: formatValue(convertedVolume),
          },
          {
            label: 'TVL',
            value: formatValue(convertedTvl),
          },
          {
            label: 'HOLDERS',
            value: formatValue(holders || 0),
            noSymbol: true
          }
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'flex flex-col items-center justify-center py-2.5 rounded-xl border transition-[opacity,transform,background-color,border-color] duration-200',
              isDark
                ? 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]'
                : 'bg-gray-50/50 border-black/[0.03] hover:bg-gray-100/50 hover:border-black/[0.06]'
            )}
          >
            <div className={cn('text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-40', isDark ? 'text-white' : 'text-black')}>
              {stat.label}
            </div>
            <div className={cn('text-[13px] font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              {stat.noSymbol ? '' : currencySymbols[activeFiatCurrency]}
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Time Intervals */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {priceChanges.map((item) => (
          <div
            key={item.label}
            className={cn(
              'flex flex-col items-center justify-center py-1.5 rounded-lg border transition-[opacity,transform,background-color,border-color] duration-200',
              isDark
                ? 'bg-white/[0.015] border-white/[0.02] hover:bg-white/[0.03]'
                : 'bg-white border-black/[0.02] hover:bg-gray-50 shadow-sm shadow-black/[0.01]'
            )}
          >
            <span className={cn('text-[9px] uppercase font-bold opacity-40 mb-0.5 tracking-wider', isDark ? 'text-white' : 'text-black')}>
              {item.label}
            </span>
            <span
              className={cn(
                'text-[11px] font-black',
                item.value == null
                  ? isDark ? 'text-white/20' : 'text-gray-300'
                  : item.value >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {formatPct(item.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Row 4: 24h Range */}
      {range24h && (
        <div
          className={cn(
            'mt-4 pt-4 border-t',
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold mb-2 uppercase tracking-wide">
            <span className="text-red-400 flex items-center gap-1">
              <span className="opacity-50 font-bold">LOW</span>
              {currencySymbols[activeFiatCurrency]}
              {(() => {
                const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
                const v = activeFiatCurrency === 'XRP' ? range24h.min : range24h.min / rate;
                const p = formatPrice(v);
                return p?.compact ? <>0.0<sub>{p.zeros}</sub>{p.significant}</> : p;
              })()}
            </span>
            <span className="opacity-40 font-black">24H RANGE</span>
            <span className="text-green-500 flex items-center gap-1 text-right">
              {currencySymbols[activeFiatCurrency]}
              {(() => {
                const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
                const v = activeFiatCurrency === 'XRP' ? range24h.max : range24h.max / rate;
                const p = formatPrice(v);
                return p?.compact ? <>0.0<sub>{p.zeros}</sub>{p.significant}</> : p;
              })()}
              <span className="opacity-50 font-bold">HIGH</span>
            </span>
          </div>
          <div className={cn(
            'h-1.5 w-full rounded-full overflow-hidden relative',
            isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
          )}>
            <div
              className="absolute inset-y-0 bg-yellow-500/20 w-full"
            />
            <div
              className="absolute top-0 bottom-0 bg-blue-500 transition-[width] duration-1000 ease-out"
              style={{
                left: '0%',
                width: `${range24h.percent}%`,
                filter: 'brightness(1.2) saturate(1.2)'
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"
              style={{ left: `calc(${range24h.percent}% - 2px)` }}
            />
          </div>
        </div>
      )}
      {/* Row 5: Actions */}
      <div
        className={cn(
          'grid grid-cols-2 gap-1 sm:gap-1.5 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t',
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}
      >
        {/* Get Verified Button - prominent placement */}
        {currentVerified !== 1 && (
          <button
            onClick={() => setShowVerifyModal(true)}
            className={cn(
              'col-span-2 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-[opacity,transform,background-color,border-color] duration-300 relative overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              currentVerified === 0
                ? isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/50'
                  : 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-400'
                : isDark
                  ? 'bg-purple-600 text-white hover:bg-purple-500 border border-purple-500/50'
                  : 'bg-purple-500 text-white hover:bg-purple-600 border border-purple-400'
            )}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles size={13} strokeWidth={2.5} />
            <span>{currentVerified === 0 ? 'Get Verified' : 'Upgrade Verification'}</span>
          </button>
        )}

        <div className="col-span-2 grid grid-cols-4 sm:flex gap-1 sm:gap-1.5 [&>*]:min-w-0">
          {/* Trustline button - only for non-XRP/MPT tokens when logged in */}
          {accountProfile?.account && CURRENCY_ISSUERS?.XRP_MD5 !== md5 && !isMPT && (
            <div className="sm:flex-1">
              <button
                onClick={handleSetTrust}
                title={isRemove ? 'Remove trustline to free 0.2 XRP reserve' : 'Set trustline to hold this token'}
                aria-label={isRemove ? 'Remove trustline' : 'Set trustline'}
                className={cn(
                  "group/trust w-full h-6 sm:h-7 px-1.5 sm:px-2.5 flex items-center justify-center gap-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]",
                  isRemove
                    ? isDark
                      ? "bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400"
                      : "bg-green-50 border border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                    : isDark
                      ? "bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-blue-500/15 hover:border-blue-500/30 hover:text-blue-400"
                      : "bg-gray-50 border border-black/[0.04] text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                )}
              >
                {isRemove ? (
                  <>
                    <Check size={11} className="group-hover/trust:hidden" />
                    <X size={11} className="hidden group-hover/trust:block" />
                    <span className="hidden sm:inline group-hover/trust:hidden">Trusted</span>
                    <span className="hidden group-hover/trust:sm:inline">Remove</span>
                  </>
                ) : (
                  <>
                    <Link2 size={11} />
                    <span className="hidden sm:inline">Trust</span>
                  </>
                )}
              </button>
            </div>
          )}
          <div className="sm:flex-1">
            <ApiButton
              token={token}
              className={cn(
                "w-full h-6 max-sm:h-6 sm:h-7 flex items-center justify-center gap-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] duration-200",
                isDark ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-100"
              )}
            />
          </div>
          <div className="sm:flex-1">
            <Watch
              token={token}
              className={cn(
                "w-full h-6 sm:h-7 flex items-center justify-center gap-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] duration-200",
                isDark ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-100"
              )}
            />
          </div>
          <TweetPromoteModal
            token={token}
            tweetCount={tweetCount}
            onCountChange={setTweetCount}
            open={showPromoteModal}
            onOpenChange={setShowPromoteModal}
            wrapperClassName="sm:flex-1"
            className={cn(
              "w-full h-6 sm:h-7 flex items-center justify-center gap-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] duration-200",
              isDark ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 hover:text-white/80" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            )}
          />
          <div className="sm:flex-1">
            <button
              onClick={() => setShowBoostModal(true)}
              title="Boost trending position"
              className={cn(
                "w-full h-6 sm:h-7 flex items-center justify-center gap-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]",
                isDark ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 hover:text-white/80" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              )}
            >
              <Zap size={11} />
              Boost
            </button>
          </div>
          {accountProfile?.admin && (
            <button
              onClick={() => setEditToken(token)}
              className={cn(
                'px-1.5 h-6 sm:h-7 rounded-md border text-[8px] font-bold uppercase tracking-wide transition-[opacity,transform,background-color,border-color] flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                isDark
                  ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10'
                  : 'border-amber-200 text-amber-600 hover:bg-amber-50 shadow-sm'
              )}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Technical Info Modal */}
      {
        showInfo && (
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
              isDark ? 'bg-black/70' : 'bg-white/60'
            )}
            onClick={() => setShowInfo(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Token details"
              className={cn(
                'w-full max-w-md rounded-2xl border-[1.5px] max-h-[85dvh] overflow-hidden',
                isDark
                  ? 'bg-black/80 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/50'
                  : 'bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-2xl shadow-gray-300/30'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-3 border-b',
                  isDark ? 'border-white/[0.06]' : 'border-gray-100'
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-widest',
                      isDark ? 'text-[#3f96fe]/70' : 'text-cyan-600'
                    )}
                  >
                    Token Details
                  </span>
                  <div
                    className="flex-1 h-[14px]"
                    style={{
                      backgroundImage: isDark
                        ? 'radial-gradient(circle, rgba(63,150,254,0.25) 1px, transparent 1px)'
                        : 'radial-gradient(circle, rgba(0,180,220,0.3) 1px, transparent 1px)',
                      backgroundSize: '8px 5px'
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  aria-label="Close token details"
                  className={cn(
                    'p-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    isDark ? 'hover:bg-white/[0.06] text-white/55' : 'hover:bg-gray-100 text-gray-400'
                  )}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-100px)]">
                {/* Token Info */}
                <div className="p-3 space-y-1">
                  {[
                    { label: 'Issuer', value: issuer },
                    ...(isMPT
                      ? [{ label: 'MPT Issuance ID', value: mptIssuanceID }]
                      : [{ label: 'Currency', value: currency }]),
                    ...(AMM ? [{ label: 'AMM', value: AMM }] : []),
                    ...(creator ? [{ label: 'Creator', value: creator }] : []),
                    { label: 'MD5', value: md5 }
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigator.clipboard.writeText(item.value);
                        setCopiedField(item.label);
                        setTimeout(() => setCopiedField(null), 1200);
                      }}
                      aria-label={`Copy ${item.label}`}
                      className={cn(
                        'group w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] w-14 flex-shrink-0',
                          isDark ? 'text-white/55' : 'text-gray-400'
                        )}
                      >
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[11px] truncate flex-1',
                          isDark ? 'text-white/70' : 'text-gray-600'
                        )}
                      >
                        {item.value}
                      </span>
                      <span
                        className={cn(
                          'flex-shrink-0',
                          copiedField === item.label
                            ? 'text-green-500'
                            : isDark
                              ? 'text-white/20 group-hover:text-white/55'
                              : 'text-gray-300 group-hover:text-gray-400'
                        )}
                      >
                        {copiedField === item.label ? <Check size={12} /> : <Copy size={12} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Dust Confirmation Modal */}
      {
        dustConfirm && (
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md max-sm:h-dvh',
              isDark ? 'bg-black/70' : 'bg-white/60'
            )}
            onClick={() => setDustConfirm(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={dustConfirm === 'dex' ? 'Sell dust on DEX confirmation' : 'Burn tokens confirmation'}
              className={cn(
                'w-full max-w-sm rounded-2xl border-[1.5px] p-5',
                isDark ? 'bg-black/90 border-white/10' : 'bg-white border-gray-200'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn('text-[15px] font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                {dustConfirm === 'dex' ? 'Sell Dust on DEX?' : 'Burn by Sending to Issuer?'}
              </div>
              <p className={cn('text-[12px] mb-4', isDark ? 'text-white/50' : 'text-gray-500')}>
                {dustConfirm === 'dex'
                  ? 'This will create a sell order on the DEX to clear your tiny balance.'
                  : 'DEX sell failed. Send tokens back to issuer to burn them?'}
              </p>
              <div className={cn('rounded-lg p-2.5 mb-4', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                <span className={cn('font-mono text-[13px]', isDark ? 'text-white/70' : 'text-gray-700')}>
                  {new Decimal(trustlineBalance).toFixed(15).replace(/0+$/, '').replace(/\.$/, '')} {name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDustConfirm(null)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeDustClear(dustConfirm)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    dustConfirm === 'dex'
                      ? 'bg-[#137DFE] text-white hover:bg-[#137DFE]/90'
                      : 'bg-[#F6AF01] text-black hover:bg-[#F6AF01]/90'
                  )}
                >
                  {dustConfirm === 'dex' ? 'Sell on DEX' : 'Burn Tokens'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}

      {/* Verify Badge Modal */}
      {showVerifyModal && (
        <VerifyBadgeModal
          token={{ ...token, verified: currentVerified }}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={(newTier) => {
            setCurrentVerified(newTier);
            setShowVerifyModal(false);
          }}
        />
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <BoostModal
          token={token}
          onClose={() => setShowBoostModal(false)}
          onSuccess={() => setShowBoostModal(false)}
        />
      )}
    </div >
  );
});

TokenSummary.displayName = 'TokenSummary';
export default TokenSummary;
