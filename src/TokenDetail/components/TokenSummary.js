import React, { useState, useContext, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/AppContext';
import { fNumber, checkExpiration, getHashIcon } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';
import { TrendingUp, Sparkles, ExternalLink, Star, Copy, Check, Loader2 } from 'lucide-react';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import axios from 'axios';
import { TokenShareModal as Share } from 'src/components/ShareButtons';
import Watch from './Watch';
import EditTokenDialog from 'src/components/EditTokenDialog';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: '✕'
};

const CURRENCY_ISSUERS = { XRP_MD5: 'XRP' };

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
  const s = "w-3.5 h-3.5";
  switch (origin) {
    case 'FirstLedger': return <ExternalLink className={cn(s, "text-[#013CFE]")} />;
    case 'XPMarket': return <Sparkles className={cn(s, "text-[#6D1FEE]")} />;
    case 'LedgerMeme': return <span className="text-xs">😂</span>;
    case 'Horizon': return <Star className={cn(s, "text-[#f97316]")} />;
    case 'aigent.run': return <img src="/static/aigentrun.gif" alt="Aigent.Run" className="w-3.5 h-3.5 object-contain" />;
    case 'Magnetic X': return <img src="/static/magneticx-logo.webp" alt="Magnetic X" className="w-3.5 h-3.5 object-contain" />;
    case 'xrp.fun': return <TrendingUp className={cn(s, "text-[#B72136]")} />;
    default: return <Sparkles className={cn(s, isDark ? "text-white/40" : "text-gray-400")} />;
  }
};

const TokenSummary = memo(({ token }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, accountProfile, sync, themeName, setOpenWalletModal } = useContext(AppContext);
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
  const [editToken, setEditToken] = useState(null);
  const [trustStatus, setTrustStatus] = useState(null); // 'loading' | 'success' | 'error' | {message}
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      const walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
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
      setDebugInfo({ wallet_type: accountProfile.wallet_type, account: accountProfile.account, walletKeyId, seed: seed || 'N/A' });
    };
    loadDebugInfo();
  }, [accountProfile]);

  const { id, name, exch, pro7d, pro24h, pro5m, pro1h, maxMin24h, usd, vol24hxrp, marketcap, expiration, user, md5, currency, issuer, verified, holders, tvl, origin, creator } = token;

  // Trustline handler
  const handleSetTrust = async () => {
    const showStatus = (msg, duration = 2500) => {
      if (!mountedRef.current) return;
      setTrustStatus(msg);
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setTrustStatus(null);
        }
      }, duration);
    };

    if (!accountProfile?.account) {
      setOpenWalletModal(true);
      return;
    }
    if (accountProfile.wallet_type !== 'device' && accountProfile.wallet_type !== 'oauth') {
      showStatus('Unsupported wallet');
      return;
    }
    setTrustStatus('loading');
    try {
      const { Wallet } = await import('xrpl');
      const CryptoJS = (await import('crypto-js')).default;

      const entropyString = `passkey-wallet-${accountProfile.deviceKeyId}-${accountProfile.accountIndex}-`;
      const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${accountProfile.deviceKeyId}`, {
        keySize: 256/32,
        iterations: 100000
      }).toString();
      const deviceWallet = new Wallet(seedHash.substring(0, 64));

      const tx = {
        Account: accountProfile.account,
        TransactionType: 'TrustSet',
        LimitAmount: {
          issuer,
          currency,
          value: isRemove ? '0' : '1000000000'
        },
        Flags: 0x00020000
      };

      // REST-based autofill
      const [seqRes, feeRes] = await Promise.all([
        axios.get(`https://api.xrpl.to/api/submit/account/${accountProfile.account}/sequence`),
        axios.get('https://api.xrpl.to/api/submit/fee')
      ]);
      const prepared = {
        ...tx,
        Sequence: seqRes.data.sequence,
        Fee: feeRes.data.base_fee,
        LastLedgerSequence: seqRes.data.ledger_index + 20
      };

      const signed = deviceWallet.sign(prepared);
      const result = await axios.post('https://api.xrpl.to/api/submit', { tx_blob: signed.tx_blob });

      if (result.data.engine_result === 'tesSUCCESS') {
        setIsRemove(!isRemove);
        showStatus(isRemove ? 'Removed!' : 'Trustline set!');
      } else {
        showStatus('Failed: ' + result.data.engine_result);
      }
    } catch (err) {
      console.error('Trustline error:', err);
      if (err.response?.status === 404) {
        showStatus('Account not activated - need XRP');
      } else {
        showStatus(err.message?.slice(0, 30) || 'Error');
      }
    }
  };

  // Price change animation
  useEffect(() => {
    if (prevPrice !== null && exch !== null && exch !== prevPrice) {
      const curr = parseFloat(exch), prev = parseFloat(prevPrice);
      if (!isNaN(curr) && !isNaN(prev)) {
        setPriceColor(curr > prev ? '#22c55e' : '#ef4444');
        const t = setTimeout(() => setPriceColor(null), 1500);
        return () => clearTimeout(t);
      }
    }
    setPrevPrice(exch);
  }, [exch, prevPrice]);

  const priceChanges = useMemo(() => [
    { value: pro5m, label: '5m' },
    { value: pro1h, label: '1h' },
    { value: pro24h, label: '24h' },
    { value: pro7d, label: '7d' }
  ], [pro5m, pro1h, pro24h, pro7d]);

  const range24h = useMemo(() => {
    if (pro24h !== null && pro24h !== undefined) {
      const currentPrice = exch || 1;
      const variation = Math.abs(pro24h) / 100;
      const min = currentPrice * (1 - variation);
      const max = currentPrice * (1 + variation);
      const delta = max - min;
      let percent = delta > 0 ? Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100)) : 50;
      return { min, max, percent };
    }
    if (!maxMin24h || !Array.isArray(maxMin24h) || maxMin24h.length < 2) return null;
    const min = Math.min(maxMin24h[0], maxMin24h[1]);
    const max = Math.max(maxMin24h[0], maxMin24h[1]);
    const delta = max - min;
    const currentPrice = exch || usd;
    let percent = delta > 0 && currentPrice ? Math.max(0, Math.min(100, ((currentPrice - min) / delta) * 100)) : 50;
    return { min, max, percent };
  }, [maxMin24h, exch, usd, pro24h]);

  const formatValue = (v) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 999500) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 999.5) return `${(v / 1e3).toFixed(1)}K`;
    return fNumber(v);
  };

  const formatPct = useCallback((v) => v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, []);

  const convertedMarketCap = marketcap && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
    ? new Decimal(marketcap).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber() : marketcap || 0;
  const convertedVolume = vol24hxrp && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
    ? new Decimal(vol24hxrp).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber() : vol24hxrp || 0;
  const convertedTvl = tvl && (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null))
    ? new Decimal(tvl).div(metrics[activeFiatCurrency] || metrics.CNY || 1).toNumber() : tvl || 0;

  const tokenImageUrl = `https://s1.xrpl.to/token/${md5}`;
  const fallbackImageUrl = issuer ? getHashIcon(issuer) : '/static/account_logo.webp';
  const handleGoogleLensSearch = () => window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(tokenImageUrl)}`, '_blank');
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

    axios.get(`${BASE_URL}/account/lines/${accountProfile?.account}`, { signal: controller.signal })
      .then((res) => {
        if (res.status === 200 && res.data?.lines && mountedRef.current) {
          const tl = res.data.lines.find((t) => (t.LowLimit.issuer === issuer || t.HighLimit.issuer === issuer) && t.LowLimit.currency === currency);
          setIsRemove(!!tl);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          // Silent fail for trustline check
        }
      });

    return () => controller.abort();
  }, [accountProfile, sync, issuer, currency]);

  const getPriceDisplay = () => {
    const symbol = currencySymbols[activeFiatCurrency];
    const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
    const price = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
    if (!price || price === 0) return { symbol, price: '0', isCompact: false };

    if (price < 0.01) {
      const str = price.toFixed(15);
      const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
      if (zeros >= 4) {
        const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
        return { symbol, zeros, significant: significant.slice(0, 4), isCompact: true };
      }
      return { symbol, price: price.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''), isCompact: false };
    } else if (price < 1) {
      return { symbol, price: price.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''), isCompact: false };
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
    <div className={cn("rounded-xl border-[1.5px] p-4", isDark ? "border-[rgba(59,130,246,0.12)]" : "border-gray-200")}>
      {/* Row 1: Token Info + Price */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Token Image + Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative group cursor-pointer flex-shrink-0" onClick={handleGoogleLensSearch}>
            <Image src={tokenImageUrl} alt={name} width={44} height={44} priority unoptimized
              className="rounded-xl object-cover border-2 border-primary/30"
              onError={(e) => { e.currentTarget.src = fallbackImageUrl; }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[17px] font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{name}</span>
              {verified && <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600")}>Verified</span>}
              {id && <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-600")}>#{id}</span>}
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]", isDark ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-600")}>
                <OriginIcon origin={origin || 'XRPL'} isDark={isDark} />{origin || 'XRPL'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("text-[10px] truncate", isDark ? "text-white/40" : "text-gray-400")}>{user || name}</span>
              {issuer && (
                <button onClick={copyIssuer} className={cn("flex items-center gap-0.5 text-[9px] font-mono", isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                  {copied ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                  {issuer.slice(0, 4)}...{issuer.slice(-4)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Price + Change */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={cn("text-2xl font-bold tracking-tight", priceColor ? "" : isDark ? "text-white" : "text-gray-900")} style={priceColor ? { color: priceColor } : undefined}>
            {priceDisplay.isCompact ? <>{priceDisplay.symbol}0.0<sub className="text-[0.5em]">{priceDisplay.zeros}</sub>{priceDisplay.significant}</> : <>{priceDisplay.symbol}{priceDisplay.price}</>}
          </span>
          <span className={cn("text-[11px] font-medium", mainChange >= 0 ? "text-green-500" : "text-red-500")}>
            {formatPct(mainChange)}
          </span>
        </div>
      </div>

      {/* Row 2: Stats Grid */}
      <div className={cn("grid grid-cols-4 gap-3 mt-4 pt-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
        {[
          { label: 'MCAP', value: formatValue(convertedMarketCap), color: 'text-green-500' },
          { label: 'VOL 24H', value: formatValue(convertedVolume), color: 'text-red-500' },
          { label: 'TVL', value: formatValue(convertedTvl), color: 'text-blue-500' },
          { label: 'HOLDERS', value: formatValue(holders || 0), color: 'text-orange-500', noSymbol: true }
        ].map((stat) => (
          <div key={stat.label} className={cn("text-center py-2 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
            <div className={cn("text-[10px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-500")}>{stat.label}</div>
            <div className={cn("text-[14px] font-semibold", stat.color)}>{stat.noSymbol ? '' : currencySymbols[activeFiatCurrency]}{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Price Changes */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        {priceChanges.map((item) => (
          <div key={item.label} className={cn("text-center py-2 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
            <span className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>{item.label}</span>
            <span className={cn("text-[13px] font-semibold ml-1.5", item.value >= 0 ? "text-green-500" : "text-red-500")}>{formatPct(item.value)}</span>
          </div>
        ))}
      </div>

      {/* Row 4: 24h Range */}
      {range24h && (
        <div className={cn("flex items-center gap-3 mt-4 pt-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
          <span className={cn("text-[10px] uppercase tracking-wide flex-shrink-0", isDark ? "text-white/40" : "text-gray-500")}>24H</span>
          <span className="text-[10px] text-green-500 flex-shrink-0">
            {currencySymbols[activeFiatCurrency]}
            {(() => { const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1; const v = activeFiatCurrency === 'XRP' ? range24h.min : range24h.min / rate; const p = formatPrice(v); return p?.compact ? <>0.0<sub className="text-[8px]">{p.zeros}</sub>{p.significant}</> : p; })()}
          </span>
          <div className="flex-1 relative py-2">
            <div className={cn("h-2 rounded-full", isDark ? "bg-white/10" : "bg-gray-200")}>
              <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-gradient-to-r from-green-500/40 via-yellow-500/30 to-red-500/40" />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `clamp(0px, calc(${range24h.percent}% - 5px), calc(100% - 10px))` }}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full ring-2", isDark ? "bg-white ring-white/30" : "bg-primary ring-primary/30")} />
            </div>
          </div>
          <span className="text-[10px] text-red-500 flex-shrink-0">
            {currencySymbols[activeFiatCurrency]}
            {(() => { const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1; const v = activeFiatCurrency === 'XRP' ? range24h.max : range24h.max / rate; const p = formatPrice(v); return p?.compact ? <>0.0<sub className="text-[8px]">{p.zeros}</sub>{p.significant}</> : p; })()}
          </span>
        </div>
      )}

      {/* Row 5: Actions */}
      <div className={cn("flex items-center justify-between gap-3 mt-4 pt-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
        <div className="flex items-center gap-1.5 relative">
          {trustStatus && trustStatus !== 'loading' && (
            <div className="absolute -top-8 left-0 px-2 py-1 rounded text-[10px] whitespace-nowrap bg-black/90 text-white z-50">
              {trustStatus}
            </div>
          )}
          <button
            onClick={handleSetTrust}
            disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5 || trustStatus === 'loading'}
            className={cn(
              "px-4 py-2 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5",
              isRemove
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-500 hover:bg-green-500/20",
              (CURRENCY_ISSUERS?.XRP_MD5 === md5 || trustStatus === 'loading') && "opacity-40 cursor-not-allowed"
            )}
          >
            {trustStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : null}
            {isRemove ? 'Untrust' : 'Trust'}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Share token={token} />
          <Watch token={token} />
          {accountProfile?.admin && (
            <button
              onClick={() => setEditToken(token)}
              className={cn(
                "px-2 py-1 rounded-lg border-[1.5px] text-[10px] font-medium transition-all",
                isDark ? "border-amber-500/30 text-amber-500 hover:bg-amber-500/10" : "border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              )}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {debugInfo && (
        <div className={cn("mt-2 p-2 rounded-lg border font-mono text-[9px]", isDark ? "border-yellow-500/30 bg-yellow-500/10" : "border-yellow-200 bg-yellow-50")}>
          <div className="font-medium mb-1 text-yellow-600 text-[10px]">Debug:</div>
          <div className="space-y-0.5">
            <div>wallet_type: <span className="text-blue-400">{debugInfo.wallet_type || 'undefined'}</span></div>
            <div>account: <span className="opacity-70">{debugInfo.account || 'undefined'}</span></div>
            <div>walletKeyId: <span className={debugInfo.walletKeyId ? "text-green-400" : "text-red-400"}>{debugInfo.walletKeyId || 'undefined'}</span></div>
            <div>seed: <span className="text-green-400 break-all">{debugInfo.seed}</span></div>
          </div>
        </div>
      )}

      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}
    </div>
  );
});

TokenSummary.displayName = 'TokenSummary';
export default TokenSummary;
