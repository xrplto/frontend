import React, { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/AppContext';
import { fNumber, checkExpiration, getHashIcon } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';
import { Search, Link as LinkIconLucide, Unlink, TrendingUp, TrendingDown, Sparkles, ExternalLink, Star, Clock, Settings, Copy, Check, Loader2 } from 'lucide-react';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { parseAmount, normalizeCurrencyCode } from 'src/utils/parseUtils';
import Share from './Share';
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

// Price formatter
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice)) return '0';
  if (numPrice === 0) return '0';
  if (numPrice < 0.0001) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return `0.0(${zeros})${significant.slice(0, 4)}`;
    }
    return numPrice.toFixed(8);
  }
  if (numPrice < 1) return numPrice.toFixed(4);
  if (numPrice < 100) return numPrice.toFixed(4).replace(/\.?0+$/, '').replace(/(\.\d)$/, '$10');
  if (numPrice < 1000) return numPrice.toFixed(2);
  if (numPrice < 1000000) return numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Tooltip
const Tooltip = ({ title, children, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("relative inline-flex", className)} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && title && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 text-white rounded text-[10px] whitespace-nowrap z-50">
          {title}
        </div>
      )}
    </div>
  );
};

// Icon Button
const IconBtn = ({ onClick, disabled, children, className, title, isDark, active }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-7 h-7 rounded-lg border-[1.5px] flex items-center justify-center transition-all",
        isDark ? "border-white/10 hover:border-primary hover:bg-primary/10" : "border-gray-200 hover:border-primary hover:bg-primary/5",
        active && "border-primary bg-primary/10",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  </Tooltip>
);

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

const TokenSummary = memo(({ token, onCreatorTxToggle, creatorTxOpen, latestCreatorTx: propLatestCreatorTx, setLatestCreatorTx }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, accountProfile, sync, themeName, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const [fetchedCreatorTx, setFetchedCreatorTx] = useState(null);

  const { id, name, exch, pro7d, pro24h, pro5m, pro1h, maxMin24h, usd, vol24hxrp, marketcap, expiration, user, md5, currency, issuer, verified, holders, tvl, origin, creator } = token;

  // Trustline handler
  const handleSetTrust = async () => {
    const showStatus = (msg, duration = 2500) => {
      setTrustStatus(msg);
      setTimeout(() => setTrustStatus(null), duration);
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
      const { Client, Wallet } = await import('xrpl');
      const CryptoJS = (await import('crypto-js')).default;

      const entropyString = `passkey-wallet-${accountProfile.deviceKeyId}-${accountProfile.accountIndex}-`;
      const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${accountProfile.deviceKeyId}`, {
        keySize: 256/32,
        iterations: 100000
      }).toString();
      const deviceWallet = new Wallet(seedHash.substring(0, 64));

      const client = new Client('wss://s1.ripple.com');
      await client.connect();

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

      const prepared = await client.autofill(tx);
      const signed = deviceWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      await client.disconnect();

      if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
        setIsRemove(!isRemove);
        showStatus(isRemove ? 'Removed!' : 'Trustline set!');
      } else {
        showStatus('Failed: ' + result.result?.meta?.TransactionResult);
      }
    } catch (err) {
      console.error('Trustline error:', err);
      showStatus(err.message?.slice(0, 30) || 'Error');
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
    axios.get(`${BASE_URL}/account/lines/${accountProfile?.account}`).then((res) => {
      if (res.status === 200 && res.data?.lines) {
        const tl = res.data.lines.find((t) => (t.LowLimit.issuer === issuer || t.HighLimit.issuer === issuer) && t.LowLimit.currency === currency);
        setIsRemove(!!tl);
      }
    }).catch(() => {});
  }, [accountProfile, sync, issuer, currency]);

  // Creator tx
  useEffect(() => {
    if (!creator || propLatestCreatorTx) return;
    (async () => {
      try {
        const { Client } = await import('xrpl');
        const client = new Client('wss://s1.ripple.com', { connectionTimeout: 10000 });
        await client.connect();
        const response = await client.request({ command: 'account_tx', account: creator, ledger_index_min: -1, ledger_index_max: -1, limit: 5, forward: false });
        await client.disconnect();
        if (response?.result?.transactions?.length > 0) {
          for (const txData of response.result.transactions) {
            const tx = txData.tx_json || txData.tx;
            if (!tx) continue;
            if (tx.TransactionType === 'Payment' && typeof tx.Amount === 'string' && parseInt(tx.Amount) / 1e6 < 1) continue;
            setFetchedCreatorTx({ tx, meta: txData.meta, validated: txData.validated });
            break;
          }
        }
      } catch (err) { console.error('[TokenSummary] Error fetching creator tx:', err); }
    })();
  }, [creator, propLatestCreatorTx]);

  const latestCreatorTx = propLatestCreatorTx || fetchedCreatorTx;

  const formatCreatorTx = useMemo(() => {
    if (!latestCreatorTx?.tx) return null;
    const { tx, meta } = latestCreatorTx;
    const txType = tx.TransactionType;
    if (txType === 'Payment' && typeof tx.Amount === 'string' && parseInt(tx.Amount) / 1e6 < 1) return null;

    let label = txType, amount = '', color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    if (txType === 'Payment') {
      const isSelfPayment = tx.Account === tx.Destination;
      const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount || tx.Amount;
      const parsed = parseAmount(deliveredAmount);
      if (parsed && typeof parsed === 'object') {
        const val = parseFloat(parsed.value);
        if ((parsed.currency === 'XRP' && val < 1) || (parsed.currency !== 'XRP' && val < 0.0001)) return null;
        const curr = parsed.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(parsed.currency);
        amount = `${fNumber(parsed.value)} ${curr}`;
        if (isSelfPayment && tx.SendMax) { label = 'Swap'; color = '#3b82f6'; }
        else if (tx.Destination === creator) { label = 'Received'; color = '#22c55e'; }
        else { label = 'Sent'; color = '#ef4444'; }
      }
    } else if (txType === 'OfferCreate') { label = 'Offer'; color = '#3b82f6'; }
    else if (txType === 'TrustSet') { label = 'Trust'; color = '#147DFE'; }

    const timeAgo = tx.date ? formatDistanceToNow(new Date((tx.date + 946684800) * 1000), { addSuffix: true }).replace(' ago', '') : '';
    return { label, amount, color, timeAgo };
  }, [latestCreatorTx, creator, isDark]);

  const getPriceDisplay = () => {
    const symbol = currencySymbols[activeFiatCurrency];
    const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
    const price = activeFiatCurrency === 'XRP' ? exch : exch / exchRate;
    if (price && price < 0.001) {
      const str = price.toFixed(15);
      const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
      if (zeros >= 4) {
        const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
        return { symbol, zeros, significant: significant.slice(0, 4), isCompact: true };
      }
    }
    return { symbol, price: formatPrice(price), isCompact: false };
  };

  const priceDisplay = getPriceDisplay();
  const mainChange = pro24h ?? pro1h ?? 0;
  const isPositive = mainChange >= 0;

  return (
    <div className={cn("rounded-xl border-[1.5px] px-4 py-2.5", isDark ? "border-white/10" : "border-gray-200")}>
      {/* Main Row */}
      <div className="flex items-center">
        {/* Left: Token Image + Info */}
        <div className="flex items-center gap-3 w-[220px] flex-shrink-0">
          <div className="relative group cursor-pointer" onClick={handleGoogleLensSearch}>
            <Image src={tokenImageUrl} alt={name} width={36} height={36} priority unoptimized
              className="rounded-lg object-cover border border-primary/20"
              onError={(e) => { e.currentTarget.src = fallbackImageUrl; }} />
            {verified && <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center text-[8px] text-white font-medium">✓</div>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{name}</span>
              {id && <span className="px-1 rounded text-[9px] font-medium bg-primary/10 text-primary">#{id}</span>}
              <span className={cn("inline-flex items-center gap-0.5 px-1 rounded text-[9px]", isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500")}>
                <OriginIcon origin={origin || 'XRPL'} isDark={isDark} />{origin || 'XRPL'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn("text-[10px] truncate", isDark ? "text-white/40" : "text-gray-400")}>{user || name}</span>
              {issuer && (
                <button onClick={copyIssuer} className={cn("flex items-center gap-0.5 text-[9px] font-mono", isDark ? "text-white/25 hover:text-white/40" : "text-gray-400")}>
                  {copied ? <Check size={8} className="text-green-500" /> : <Copy size={8} />}
                  {issuer.slice(0, 4)}...{issuer.slice(-4)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="hidden md:grid grid-cols-4 gap-6 flex-1 mx-6">
          {[
            { label: 'Market Cap', value: formatValue(convertedMarketCap), color: 'text-green-500' },
            { label: 'Volume 24h', value: formatValue(convertedVolume), color: 'text-red-500' },
            { label: 'TVL', value: formatValue(convertedTvl), color: 'text-blue-500' },
            { label: 'Holders', value: formatValue(holders || 0), color: 'text-orange-500', noSymbol: true }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</div>
              <div className={cn("text-[13px] font-medium", stat.color)}>{stat.noSymbol ? '' : currencySymbols[activeFiatCurrency]}{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Right: Price + Changes + Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Price */}
          <span className={cn("text-xl font-bold tracking-tight", priceColor ? "" : "text-primary")} style={priceColor ? { color: priceColor } : undefined}>
            {priceDisplay.isCompact ? <>{priceDisplay.symbol}0.0<sub className="text-[0.5em]">{priceDisplay.zeros}</sub>{priceDisplay.significant}</> : <>{priceDisplay.symbol}{priceDisplay.price}</>}
          </span>

          {/* Time Changes: 5m, 1h, 24h, 7d */}
          <div className="hidden sm:flex items-center gap-1">
            {priceChanges.map((item) => (
              <div key={item.label} className={cn("px-1.5 py-0.5 rounded text-[10px]", isDark ? "bg-white/5" : "bg-gray-100")}>
                <span className={isDark ? "text-white/30" : "text-gray-400"}>{item.label} </span>
                <span className={item.value >= 0 ? "text-green-500" : "text-red-500"}>{formatPct(item.value)}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10 relative">
            {trustStatus && trustStatus !== 'loading' && (
              <div className="absolute -top-8 left-0 px-2 py-1 rounded text-[10px] whitespace-nowrap bg-black/90 text-white z-50">
                {trustStatus}
              </div>
            )}
            <IconBtn onClick={handleSetTrust} disabled={CURRENCY_ISSUERS?.XRP_MD5 === md5 || trustStatus === 'loading'} isDark={isDark} title={isRemove ? 'Remove Trustline' : 'Set Trustline'}>
              {trustStatus === 'loading' ? <Loader2 size={14} className="animate-spin text-primary" /> : isRemove ? <Unlink size={14} className="text-red-500" /> : <LinkIconLucide size={14} className="text-green-500" />}
            </IconBtn>
            <Share token={token} />
            <Watch token={token} />
            {creator && <IconBtn onClick={onCreatorTxToggle} isDark={isDark} active={creatorTxOpen} title="Creator Activity"><Clock size={14} className={isDark ? "text-white/70" : "text-gray-600"} /></IconBtn>}
            {accountProfile?.admin && <IconBtn onClick={() => setEditToken(token)} isDark={isDark} title="Admin Edit"><Settings size={14} className="text-amber-500" /></IconBtn>}
          </div>
        </div>
      </div>

      {/* 24h Range */}
      {range24h && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
          <span className={cn("text-[9px] uppercase w-16 flex-shrink-0", isDark ? "text-white/30" : "text-gray-400")}>24h Range</span>
          <span className="text-[10px] text-green-500 w-16 text-right">{currencySymbols[activeFiatCurrency]}{formatPrice(range24h.min)}</span>
          <div className={cn("flex-1 h-1 rounded-full relative mx-2", isDark ? "bg-white/10" : "bg-gray-200")}>
            <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-green-500/40 to-red-500/40" style={{ width: '100%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary shadow-sm" style={{ left: `calc(${range24h.percent}% - 5px)` }} />
          </div>
          <span className="text-[10px] text-red-500 w-16">{currencySymbols[activeFiatCurrency]}{formatPrice(range24h.max)}</span>
        </div>
      )}

      {/* Mobile Stats */}
      <div className="md:hidden grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/5">
        {[
          { label: 'MCap', value: formatValue(convertedMarketCap), color: 'text-green-500' },
          { label: 'Vol', value: formatValue(convertedVolume), color: 'text-red-500' },
          { label: 'TVL', value: formatValue(convertedTvl), color: 'text-blue-500' },
          { label: 'Holders', value: formatValue(holders || 0), color: 'text-orange-500', noSymbol: true }
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={cn("text-[8px] uppercase", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</div>
            <div className={cn("text-[11px] font-medium", stat.color)}>{stat.noSymbol ? '' : currencySymbols[activeFiatCurrency]}{stat.value}</div>
          </div>
        ))}
      </div>

      {editToken && <EditTokenDialog token={editToken} setToken={setEditToken} />}
    </div>
  );
});

TokenSummary.displayName = 'TokenSummary';
export default TokenSummary;
