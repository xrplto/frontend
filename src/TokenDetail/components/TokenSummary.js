import React, { useState, useContext, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/context/AppContext';
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
  Unlink2
} from 'lucide-react';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { TokenShareModal as Share } from 'src/components/ShareButtons';
import Watch from './Watch';
import EditTokenDialog from 'src/components/EditTokenDialog';
import { ApiButton } from 'src/components/ApiEndpointsModal';

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
      return <Sparkles className={cn(s, isDark ? 'text-white/40' : 'text-gray-400')} />;
  }
};

const TokenSummary = memo(({ token }) => {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, accountProfile, sync, themeName, setOpenWalletModal } =
    useContext(AppContext);
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

  useEffect(() => {
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
  const [debugInfo, setDebugInfo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) {
        setDebugInfo(null);
        return;
      }
      let walletKeyId =
        accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
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
      // Handle device wallets
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
    metadata
  } = token;

  const isMPT = tokenType === 'mpt';

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
    if (accountProfile.wallet_type !== 'device' && accountProfile.wallet_type !== 'oauth') {
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
      const [seqRes, feeRes] = await Promise.all([
        axios.get(`https://api.xrpl.to/v1/submit/account/${accountProfile.account}/sequence`),
        axios.get('https://api.xrpl.to/v1/submit/fee')
      ]);

      const prepared = {
        ...tx,
        Sequence: seqRes.data.sequence,
        Fee: feeRes.data.base_fee,
        LastLedgerSequence: seqRes.data.ledger_index + 20
      };

      toast.loading(`${action} trustline...`, { id: toastId, description: 'Signing transaction' });
      const signed = wallet.sign(prepared);

      toast.loading(`${action} trustline...`, { id: toastId, description: 'Submitting to XRPL' });
      const result = await axios.post('https://api.xrpl.to/v1/submit', { tx_blob: signed.tx_blob });

      if (result.data.engine_result === 'tesSUCCESS') {
        setIsRemove(!isRemove);
        if (isRemove) setTrustlineBalance(0);
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
      const { Wallet, Client } = await import('xrpl');
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
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      if (method === 'dex') {
        const offerTx = {
          TransactionType: 'OfferCreate',
          Account: accountProfile.account,
          SourceTag: 161803,
          TakerGets: '1',
          TakerPays: { currency, issuer, value: new Decimal(trustlineBalance).toFixed(15) },
          Flags: 655360
        };
        const preparedOffer = await client.autofill(offerTx);
        const signedOffer = wallet.sign(preparedOffer);
        const offerResult = await client.submitAndWait(signedOffer.tx_blob);
        await client.disconnect();

        if (offerResult.result.meta.TransactionResult === 'tesSUCCESS') {
          setIsRemove(false);
          setTrustlineBalance(0);
          toast.success('Dust sold on DEX!', { id: toastId, description: `Tx: ${offerResult.result.hash.slice(0, 8)}...` });
        } else {
          toast.error('DEX sell failed', { id: toastId, description: offerResult.result.meta.TransactionResult });
          setDustConfirm('issuer'); // Prompt for issuer burn
        }
      } else {
        const issuerInfo = await client.request({ command: 'account_info', account: issuer });
        const needsTag = issuerInfo.result.account_flags?.requireDestinationTag;
        const tx = {
          TransactionType: 'Payment',
          Account: accountProfile.account,
          Destination: issuer,
          SourceTag: 161803,
          Amount: { currency, issuer, value: new Decimal(trustlineBalance).toFixed(15) },
          Flags: 131072
        };
        if (needsTag) tx.DestinationTag = 0;
        const prepared = await client.autofill(tx);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        await client.disconnect();

        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          setIsRemove(false);
          setTrustlineBalance(0);
          toast.success('Dust burned!', { id: toastId, description: `Tx: ${result.result.hash.slice(0, 8)}...` });
        } else {
          toast.error('Burn failed', { id: toastId, description: result.result.meta.TransactionResult });
        }
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
    if (!maxMin24h || !Array.isArray(maxMin24h) || maxMin24h.length < 2) return null;
    const min = Math.min(maxMin24h[0], maxMin24h[1]);
    const max = Math.max(maxMin24h[0], maxMin24h[1]);
    const delta = max - min;
    const currentPrice = exch || usd;
    let percent =
      delta > 0 && currentPrice
        ? Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100))
        : 50;
    return { min, max, percent };
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

  const tokenImageUrl = `https://s1.xrpl.to/token/${md5}`;
  const fallbackImageUrl = issuer ? getHashIcon(issuer) : '/static/account_logo.webp';
  const handleGoogleLensSearch = () =>
    window.open(
      `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(tokenImageUrl)}`,
      '_blank'
    );
  const isExpired = checkExpiration(expiration);

  const copyIssuer = () => {
    navigator.clipboard.writeText(issuer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Check existing trustline
  useEffect(() => {
    if (!accountProfile) return;

    const controller = new AbortController();

    axios
      .get(`${BASE_URL}/account/trustlines/${accountProfile?.account}?limit=400`, {
        signal: controller.signal,
        timeout: 5000
      })
      .then((res) => {
        if (res.status === 200 && res.data?.result === 'success' && mountedRef.current) {
          const lines = res.data.lines || [];
          const tl = lines.find((line) => {
            const lineIssuers = [line.account, line.issuer, line.Balance?.issuer].filter(Boolean);
            const lineCurrencies = [line.currency, line._currency, line.Balance?.currency].filter(
              Boolean
            );
            return lineIssuers.includes(issuer) && lineCurrencies.includes(currency);
          });
          setIsRemove(!!tl);
          setTrustlineBalance(tl ? Math.abs(parseFloat(tl.balance || tl.Balance?.value || 0)) : 0);
        }
      })
      .catch(() => {
        // Silently handle errors (abort, timeout, network)
      });

    return () => controller.abort();
  }, [accountProfile, sync, issuer, currency]);

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
        'rounded-xl border-[1.5px] p-3',
        isDark ? 'border-white/10 bg-transparent' : 'border-black/[0.06] bg-transparent'
      )}
    >
      {/* Row 1: Token Info + Price */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Token Image + Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={handleGoogleLensSearch}
          >
            <Image
              src={tokenImageUrl}
              alt={name}
              width={44}
              height={44}
              priority
              unoptimized
              className={cn(
                'w-11 h-11 rounded-xl object-cover border',
                isDark ? 'border-white/10' : 'border-black/[0.08]'
              )}
              onError={(e) => {
                e.currentTarget.src = fallbackImageUrl;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  'text-[17px] font-semibold truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                {name}
              </span>
              {verified >= 1 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-normal',
                    isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                  )}
                >
                  Verified
                </span>
              )}
              {id && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-normal',
                    isDark ? 'bg-white/[0.06] text-white/50' : 'bg-black/[0.04] text-gray-500'
                  )}
                >
                  #{id}
                </span>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-normal',
                  isDark ? 'bg-white/[0.04] text-white/50' : 'bg-black/[0.03] text-gray-500'
                )}
              >
                <OriginIcon origin={origin || 'XRPL'} isDark={isDark} />
                {origin || 'XRPL'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn('text-[10px] truncate', isDark ? 'text-white/40' : 'text-gray-400')}
              >
                {user || name}
              </span>
              {issuer && (
                <button
                  onClick={copyIssuer}
                  className={cn(
                    'flex items-center gap-0.5 text-[9px] font-mono',
                    isDark
                      ? 'text-white/30 hover:text-white/50'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {copied ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                  {issuer.slice(0, 4)}...{issuer.slice(-4)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Price + Change */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className={cn(
              'text-2xl font-bold tracking-tight',
              priceColor ? '' : isDark ? 'text-white' : 'text-gray-900'
            )}
            style={priceColor ? { color: priceColor } : undefined}
          >
            {priceDisplay.isCompact ? (
              <>
                {priceDisplay.symbol}0.0<sub className="text-[0.5em]">{priceDisplay.zeros}</sub>
                {priceDisplay.significant}
              </>
            ) : (
              <>
                {priceDisplay.symbol}
                {priceDisplay.price}
              </>
            )}
          </span>
          <span
            className={cn(
              'text-[11px] font-medium',
              mainChange >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {formatPct(mainChange)}
          </span>
        </div>
      </div>

      {/* Row 2: Stats Grid */}
      <div
        className={cn(
          'grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t',
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}
      >
        {[
          {
            label: 'MCAP',
            value: formatValue(convertedMarketCap),
            color: isDark ? 'text-white/90' : 'text-gray-800'
          },
          {
            label: 'VOL 24H',
            value: formatValue(convertedVolume),
            color: isDark ? 'text-white/90' : 'text-gray-800'
          },
          {
            label: 'TVL',
            value: formatValue(convertedTvl),
            color: isDark ? 'text-white/90' : 'text-gray-800'
          },
          {
            label: 'HOLDERS',
            value: formatValue(holders || 0),
            color: isDark ? 'text-white/90' : 'text-gray-800',
            noSymbol: true
          }
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'text-center py-1.5 px-1 rounded-lg',
              isDark ? 'bg-white/[0.025]' : 'bg-black/[0.02]'
            )}
          >
            <div
              className={cn(
                'text-[9px] uppercase tracking-wide mb-1',
                isDark ? 'text-white/35' : 'text-gray-400'
              )}
            >
              {stat.label}
            </div>
            <div className={cn('text-[13px] font-medium', stat.color)}>
              {stat.noSymbol ? '' : currencySymbols[activeFiatCurrency]}
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Price Changes */}
      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
        {priceChanges.map((item) => (
          <div
            key={item.label}
            className={cn(
              'text-center py-1.5 px-1 rounded-lg',
              isDark ? 'bg-white/[0.025]' : 'bg-black/[0.02]'
            )}
          >
            <div
              className={cn(
                'text-[9px] uppercase tracking-wide mb-1',
                isDark ? 'text-white/35' : 'text-gray-400'
              )}
            >
              {item.label}
            </div>
            <div
              className={cn(
                'text-[12px] font-medium',
                item.value == null
                  ? isDark
                    ? 'text-white/50'
                    : 'text-gray-500'
                  : item.value >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
              )}
            >
              {formatPct(item.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Row 4: 24h Range */}
      {range24h && (
        <div
          className={cn(
            'flex items-center gap-2.5 mt-2 pt-2 border-t',
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          )}
        >
          <span
            className={cn(
              'text-[9px] uppercase tracking-wide flex-shrink-0',
              isDark ? 'text-white/35' : 'text-gray-400'
            )}
          >
            24H
          </span>
          <span className="text-[10px] text-green-500/80 flex-shrink-0">
            {currencySymbols[activeFiatCurrency]}
            {(() => {
              const rate =
                metrics[activeFiatCurrency] ||
                (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ||
                1;
              const v = activeFiatCurrency === 'XRP' ? range24h.min : range24h.min / rate;
              const p = formatPrice(v);
              return p?.compact ? (
                <>
                  0.0<sub className="text-[8px]">{p.zeros}</sub>
                  {p.significant}
                </>
              ) : (
                p
              );
            })()}
          </span>
          <div className="flex-1 relative py-1.5">
            <div
              className={cn('h-1.5 rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]')}
            >
              <div
                className={cn(
                  'absolute inset-x-0 top-1.5 h-1.5 rounded-full',
                  isDark
                    ? 'bg-gradient-to-r from-green-500/20 via-white/10 to-red-500/20'
                    : 'bg-gradient-to-r from-green-500/15 via-gray-200 to-red-500/15'
                )}
              />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `clamp(0px, calc(${range24h.percent}% - 4px), calc(100% - 8px))` }}
            >
              <div className={cn('w-2 h-2 rounded-full', isDark ? 'bg-white/90' : 'bg-gray-700')} />
            </div>
          </div>
          <span className="text-[10px] text-red-500/80 flex-shrink-0">
            {currencySymbols[activeFiatCurrency]}
            {(() => {
              const rate =
                metrics[activeFiatCurrency] ||
                (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ||
                1;
              const v = activeFiatCurrency === 'XRP' ? range24h.max : range24h.max / rate;
              const p = formatPrice(v);
              return p?.compact ? (
                <>
                  0.0<sub className="text-[8px]">{p.zeros}</sub>
                  {p.significant}
                </>
              ) : (
                p
              );
            })()}
          </span>
        </div>
      )}

      {/* Row 5: Actions */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 mt-2 pt-2 border-t',
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSetTrust}
            disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5 || isMPT}
            title={isMPT ? 'MPT tokens do not require trustlines' : undefined}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border',
              isRemove
                ? isDark
                  ? 'text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30'
                  : 'text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300'
                : isDark
                  ? 'text-green-400 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/30'
                  : 'text-green-500 border-green-200 hover:bg-green-50 hover:border-green-300',
              (CURRENCY_ISSUERS?.XRP_MD5 === md5 || isMPT) && 'opacity-40 cursor-not-allowed'
            )}
          >
            {isRemove ? (
              <Unlink2 size={13} />
            ) : (
              <Link2 size={13} />
            )}
            {isRemove ? 'Untrust' : 'Trust'}
          </button>
          <ApiButton token={token} />
        </div>
        <div className="flex items-center gap-1">
          <Watch token={token} />
          <Share token={token} />
          {accountProfile?.admin && (
            <button
              onClick={() => setEditToken(token)}
              className={cn(
                'px-2 py-1 rounded-lg border text-[10px] font-normal transition-all',
                isDark
                  ? 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                  : 'border-amber-200 text-amber-600 hover:bg-amber-50'
              )}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {debugInfo && (
        <div
          className={cn(
            'mt-2 p-2 rounded-lg border font-mono text-[9px]',
            isDark
              ? 'border-yellow-500/20 bg-yellow-500/[0.06]'
              : 'border-yellow-200 bg-yellow-50/50'
          )}
        >
          <div
            className={cn(
              'font-medium mb-1 text-[10px]',
              isDark ? 'text-yellow-400/80' : 'text-yellow-600'
            )}
          >
            Debug:
          </div>
          <div className="space-y-0.5">
            <div className={isDark ? 'text-white/50' : 'text-gray-600'}>
              wallet_type:{' '}
              <span className="text-blue-400">{debugInfo.wallet_type || 'undefined'}</span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-600'}>
              account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-600'}>
              walletKeyId:{' '}
              <span className={debugInfo.walletKeyId ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.walletKeyId || 'undefined'}
              </span>
            </div>
            <div className={isDark ? 'text-white/50' : 'text-gray-600'}>
              seed: <span className="text-green-400 break-all">{debugInfo.seed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Info Modal */}
      {showInfo && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md',
            isDark ? 'bg-black/70' : 'bg-white/60'
          )}
          onClick={() => setShowInfo(false)}
        >
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border-[1.5px] max-h-[85vh] overflow-hidden',
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
                    backgroundSize: '8px 5px',
                    WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                    maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                  }}
                />
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className={cn(
                  'p-1 rounded-md',
                  isDark ? 'hover:bg-white/[0.06] text-white/40' : 'hover:bg-gray-100 text-gray-400'
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
                    className={cn(
                      'group w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left',
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] w-14 flex-shrink-0',
                        isDark ? 'text-white/40' : 'text-gray-400'
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
                            ? 'text-white/20 group-hover:text-white/40'
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
      )}

      {/* Dust Confirmation Modal */}
      {dustConfirm && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md',
            isDark ? 'bg-black/70' : 'bg-white/60'
          )}
          onClick={() => setDustConfirm(null)}
        >
          <div
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
                  'flex-1 py-2 rounded-lg text-[12px] font-medium',
                  isDark ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => executeDustClear(dustConfirm)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[12px] font-medium',
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
      )}

      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}
    </div>
  );
});

TokenSummary.displayName = 'TokenSummary';
export default TokenSummary;
