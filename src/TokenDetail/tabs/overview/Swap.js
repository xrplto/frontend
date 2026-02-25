import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { ArrowUpDown, RefreshCw, EyeOff, X, ChevronDown, ChevronUp, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppContext, WalletContext, ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { useDispatch, useSelector } from 'react-redux';
import api, { submitTransaction, previewTransaction } from 'src/utils/api';
import { toast } from 'sonner';
import { ConnectWallet } from 'src/components/Wallet';
import { selectMetrics } from 'src/redux/statusSlice';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';

// Constants
const PLATFORM_FEE_ADDRESS = 'rxrpLTomVR5DpqHbro9J36jUAw8Pzsku8';
const PLATFORM_FEE_RATE = 0.0008; // 0.08%

const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: '✕'
};
const XRP_TOKEN = {
  currency: 'XRP',
  issuer: 'XRPL',
  md5: '84e5efeb89c4eae8f68188982dc290d8',
  name: 'XRP'
};

import Decimal from 'decimal.js-light';
import { fNumber } from 'src/utils/formatters';

// Compact price formatter with subscript notation
const formatCompactPrice = (price) => {
  if (!price || !isFinite(price) || price === 0) return '0';
  if (price < 0.01) {
    const str = price.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return (
        <>
          0.0<sub className="text-[0.6em]">{zeros}</sub>
          {significant.slice(0, 4)}
        </>
      );
    }
    return price.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (price < 1) return price.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return fNumber(price);
};

import { configureMemos } from 'src/utils/parseUtils';
import Image from 'next/image';
import { PuffLoader } from '../../../components/Spinners';



const CurrencyContent = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'box-border my-[3px] flex flex-row py-[10px] px-3 rounded-[10px] items-center w-full justify-between border transition-[opacity,transform,background-color,border-color] duration-150',
      'max-sm:py-2 max-sm:px-[10px] max-sm:my-[2px]',
      'focus-within:border-blue-500/40 focus-within:bg-blue-500/[0.03]',
      isDark
        ? 'bg-white/[0.025] border-white/[0.06] focus-within:border-blue-500/40 focus-within:bg-blue-500/[0.05]'
        : 'bg-black/[0.02] border-black/[0.06] focus-within:border-blue-500/50 focus-within:bg-blue-500/[0.03]',
      className
    )}
    {...p}
  >{children}</div>
);

const InputContent = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('box-border m-0 flex flex-col items-end justify-end', isDark ? 'text-white' : 'text-[#212B36]', className)}
    {...p}
  >{children}</div>
);

const OverviewWrapper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex flex-col overflow-hidden box-border relative rounded-2xl p-3 w-full min-w-0 border transition-[opacity,transform,background-color,border-color] duration-200',
      'max-sm:rounded-xl max-sm:p-2',
      isDark ? 'bg-transparent border-white/[0.08]' : 'bg-transparent border-black/[0.06]',
      className
    )}
    {...p}
  >{children}</div>
);

const ConverterFrame = ({ className, children, ...p }) => (
  <div className={cn('flex flex-col overflow-hidden relative w-full', className)} {...p}>{children}</div>
);

const AmountRows = ({ className, children, ...p }) => (
  <div className={cn('relative flex flex-col gap-1', className)} {...p}>{children}</div>
);

const ToggleContent = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'cursor-pointer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[10px] p-0 z-[2] border-[1.5px] overflow-hidden',
      'transition-[opacity,transform,background-color,border-color] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
      'hover:scale-105 hover:border-blue-500/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      '[&:hover_svg]:text-blue-500 [&:hover_svg]:rotate-180',
      isDark
        ? 'bg-[rgba(20,20,25,0.95)] border-white/10 hover:bg-blue-500/[0.12]'
        : 'bg-white border-black/[0.08] hover:bg-blue-500/[0.06]',
      className
    )}
    {...p}
  >{children}</div>
);

const ExchangeButton = ({ isDark, disabled, className, children, ...p }) => (
  <button
    className={cn(
      'w-full relative overflow-hidden rounded-xl bg-blue-500 text-white font-bold border-none py-[14px] px-4 text-sm uppercase tracking-[0.05em] mt-2 transition-[opacity,transform,background-color,border-color] duration-200 shadow-[0_4px_12px_rgba(59,130,246,0.25)] max-sm:py-[10px] max-sm:text-xs max-sm:mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] focus-visible:ring-offset-2',
      'hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(59,130,246,0.35)]',
      'active:translate-y-0',
      disabled && (isDark ? 'bg-white/[0.04] text-white/20 shadow-none hover:bg-white/[0.04] hover:translate-y-0 hover:shadow-none' : 'bg-black/[0.04] text-black/20 shadow-none hover:bg-black/[0.04] hover:translate-y-0 hover:shadow-none'),
      disabled && 'cursor-not-allowed',
      className
    )}
    disabled={disabled}
    {...p}
  >{children}</button>
);

const TokenImage = ({ className, ...p }) => (
  <Image
    className={cn('w-7 h-7 rounded-full object-cover', className)}
    {...p}
  />
);

const SummaryBox = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'py-2 px-[10px] rounded-lg border mt-[6px] mb-[2px]',
      'max-sm:py-[6px] max-sm:px-2 max-sm:rounded-lg max-sm:mt-1',
      isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-black/[0.015] border-black/[0.06]',
      className
    )}
    {...p}
  >{children}</div>
);

// RLUSD token for XRP orderbook display (Ripple's official stablecoin)
const RLUSD_TOKEN = {
  currency: '524C555344000000000000000000000000000000',
  issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  name: 'RLUSD',
  md5: '0dd550278b74cb6690fdae351e8e0df3'
};

const Swap = ({ token, onLimitPriceChange, onOrderTypeChange }) => {
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  // MPT tokens don't support DEX trading yet
  const isMPT = token?.tokenType === 'mpt';

  // Special handling for XRP token page - show RLUSD/XRP orderbook instead
  // Since XRP is the native asset, it can't have an orderbook against itself
  const isXRPTokenPage = token?.currency === 'XRP';
  const effectiveToken = isXRPTokenPage ? RLUSD_TOKEN : token;

  const [revert, setRevert] = useState(false);
  const [token1, setToken1] = useState(XRP_TOKEN);
  const [token2, setToken2] = useState(effectiveToken);

  // Derive curr1/curr2 directly to avoid extra render cycles
  const curr1 = revert ? token2 : token1;
  const curr2 = revert ? token1 : token2;

  const BASE_URL = 'https://api.xrpl.to/v1';
  const QR_BLUR = '/static/blurqr.webp';

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const { accountProfile } = useContext(WalletContext);
  const { setLoading, sync, setSync, activeFiatCurrency, trustlineUpdate, setTrustlineUpdate } =
    useContext(AppContext);
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');

  const [tokenExch1, setTokenExch1] = useState(0);
  const [tokenExch2, setTokenExch2] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);

  const [active, setActive] = useState('AMOUNT');

  const [accountPairBalance, setAccountPairBalance] = useState(null);

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [focusTop, setFocusTop] = useState(false);
  const [focusBottom, setFocusBottom] = useState(false);

  const [hasTrustline1, setHasTrustline1] = useState(token1?.currency === 'XRP');
  const [hasTrustline2, setHasTrustline2] = useState(token2?.currency === 'XRP');

  // Track recent trustline update to skip stale API responses
  const trustlineUpdateRef = useRef(null);
  useEffect(() => {
    if (!trustlineUpdate) return;
    const { issuer, currency, hasTrustline } = trustlineUpdate;
    trustlineUpdateRef.current = { issuer, currency, hasTrustline, ts: Date.now() };
    if (curr1?.issuer === issuer && curr1?.currency === currency) setHasTrustline1(hasTrustline);
    if (curr2?.issuer === issuer && curr2?.currency === currency) setHasTrustline2(hasTrustline);
    setTrustlineUpdate(null);
  }, [trustlineUpdate, curr1, curr2, setTrustlineUpdate]);

  // Check trustlines via API (more reliable than WebSocket for accounts with many trustlines)
  useEffect(() => {
    if (!accountProfile?.account) return;
    const BASE_URL = 'https://api.xrpl.to/v1';

    // Skip API response if we have a recent direct update (within 5s)
    const recentUpdate = trustlineUpdateRef.current;
    const isRecent = recentUpdate && (Date.now() - recentUpdate.ts < 5000);

    // Check curr1 trustline
    if (curr1 && curr1.currency !== 'XRP' && curr1.issuer) {
      api.get(`${BASE_URL}/account/trustline/${accountProfile.account}/${curr1.issuer}/${encodeURIComponent(curr1.currency)}`)
        .then(res => {
          if (res.data?.success) {
            // Skip if recent direct update for this token
            if (isRecent && recentUpdate.issuer === curr1.issuer && recentUpdate.currency === curr1.currency) return;
            setHasTrustline1(res.data.hasTrustline === true);
          }
        })
        .catch(err => console.warn('[Swap] Trustline check curr1 failed:', err.message));
    } else if (curr1?.currency === 'XRP') {
      setHasTrustline1(true);
    }

    // Check curr2 trustline
    if (curr2 && curr2.currency !== 'XRP' && curr2.issuer) {
      api.get(`${BASE_URL}/account/trustline/${accountProfile.account}/${curr2.issuer}/${encodeURIComponent(curr2.currency)}`)
        .then(res => {
          if (res.data?.success) {
            // Skip if recent direct update for this token
            if (isRecent && recentUpdate.issuer === curr2.issuer && recentUpdate.currency === curr2.currency) return;
            setHasTrustline2(res.data.hasTrustline === true);
          }
        })
        .catch(err => console.warn('[Swap] Trustline check curr2 failed:', err.message));
    } else if (curr2?.currency === 'XRP') {
      setHasTrustline2(true);
    }
  }, [accountProfile?.account, curr1?.currency, curr1?.issuer, curr2?.currency, curr2?.issuer, sync]);

  const [slippage, setSlippage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swap_slippage');
      return saved ? parseFloat(saved) : 2;
    }
    return 2;
  });
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('never');
  const [expiryHours, setExpiryHours] = useState(24);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [txFee, setTxFee] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swap_txfee') || '12';
    }
    return '12';
  });

  // Anti-snipe state
  const [antiSnipeInfo, setAntiSnipeInfo] = useState(null); // { sessionId, antiSnipeMode, authWindow, requireAuthRemoved }
  const [antiSnipeAuthorized, setAntiSnipeAuthorized] = useState(false);
  const [authorizingAntiSnipe, setAuthorizingAntiSnipe] = useState(false);

  // Check if token is in active anti-snipe mode
  useEffect(() => {
    const issuer = token?.issuer;
    const currency = token?.currency;
    if (!issuer || !currency || currency === 'XRP') {
      setAntiSnipeInfo(null);
      return;
    }
    let cancelled = false;
    api.get(`${BASE_URL}/launch-token/auth-info/${issuer}/${encodeURIComponent(currency)}`)
      .then(res => {
        if (cancelled) return;
        const d = res.data || res;
        if (d.antiSnipeMode && !d.requireAuthRemoved) {
          setAntiSnipeInfo(d);
        } else {
          setAntiSnipeInfo(null);
        }
      })
      .catch(() => { if (!cancelled) setAntiSnipeInfo(null); });
    return () => { cancelled = true; };
  }, [token?.issuer, token?.currency]);

  // Check if connected wallet is already authorized for anti-snipe
  useEffect(() => {
    const addr = accountProfile?.account || accountProfile?.address;
    if (!antiSnipeInfo?.antiSnipeMode || !addr) {
      setAntiSnipeAuthorized(false);
      return;
    }
    let cancelled = false;
    api.get(`${BASE_URL}/launch-token/check-auth/${token.issuer}/${encodeURIComponent(token.currency)}/${addr}`)
      .then(res => {
        if (cancelled) return;
        const d = res.data || res;
        setAntiSnipeAuthorized(d.authorized === true);
      })
      .catch(() => { if (!cancelled) setAntiSnipeAuthorized(false); });
    return () => { cancelled = true; };
  }, [antiSnipeInfo, accountProfile?.account, accountProfile?.address, token?.issuer, token?.currency]);

  // Swap quote state
  const [swapQuoteApi, setSwapQuoteApi] = useState(null);
  const [quoteRequiresTrustline, setQuoteRequiresTrustline] = useState(null); // null or { currency, issuer, limit }
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteAbortRef = useRef(null);

  // Transaction preview state (simulation results)
  const [txPreview, setTxPreview] = useState(null); // { sending, receiving, priceImpact, actualSlippage, status }
  const [pendingTx, setPendingTx] = useState(null); // Store tx for confirmation

  // Persist slippage & txFee
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('swap_slippage', slippage.toString());
  }, [slippage]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('swap_txfee', txFee);
  }, [txFee]);

  // Notify parent of limit price / order type changes
  useEffect(() => {
    onLimitPriceChange?.(limitPrice ? parseFloat(limitPrice) : null);
  }, [limitPrice, onLimitPriceChange]);
  useEffect(() => {
    onOrderTypeChange?.(orderType);
  }, [orderType, onOrderTypeChange]);

  const amount = revert ? amount2 : amount1;
  const value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;

  let tokenPrice1, tokenPrice2;

  const curr1IsXRP = curr1?.currency === 'XRP';
  const curr2IsXRP = curr2?.currency === 'XRP';
  const token1IsXRP = token1?.currency === 'XRP';
  const token2IsXRP = token2?.currency === 'XRP';

  if (curr1IsXRP) {
    tokenPrice1 = new Decimal(amount1 || 0).toNumber();
  } else {
    let usdRate;
    if (revert) {
      if (token1IsXRP) {
        const xrpValue = new Decimal(amount1 || 0).mul(tokenExch2 || 0);
        tokenPrice1 = xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
      } else {
        usdRate = parseFloat(token2?.usd) || 1;
        tokenPrice1 = new Decimal(amount1 || 0).mul(usdRate).toNumber();
      }
    } else {
      if (token2IsXRP) {
        const xrpValue = new Decimal(amount1 || 0).mul(tokenExch1 || 0);
        tokenPrice1 = xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
      } else {
        usdRate = parseFloat(token1?.usd) || 1;
        tokenPrice1 = new Decimal(amount1 || 0).mul(usdRate).toNumber();
      }
    }
  }

  if (curr2IsXRP) {
    tokenPrice2 = new Decimal(amount2 || 0).toNumber();
  } else {
    let usdRate;
    if (revert) {
      if (token2IsXRP) {
        const xrpValue = new Decimal(amount2 || 0).mul(tokenExch1 || 0);
        tokenPrice2 = xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
      } else {
        usdRate = parseFloat(token1?.usd) || 1;
        tokenPrice2 = new Decimal(amount2 || 0).mul(usdRate).toNumber();
      }
    } else {
      if (token1IsXRP) {
        const xrpValue = new Decimal(amount2 || 0).mul(tokenExch2 || 0);
        tokenPrice2 = xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
      } else {
        usdRate = parseFloat(token2?.usd) || 1;
        tokenPrice2 = new Decimal(amount2 || 0).mul(usdRate).toNumber();
      }
    }
  }

  const inputPrice = revert ? tokenPrice2 : tokenPrice1;
  const outputPrice = revert ? tokenPrice1 : tokenPrice2;
  const priceImpact =
    inputPrice > 0
      ? new Decimal(outputPrice).sub(inputPrice).mul(100).div(inputPrice).toFixed(2)
      : 0;

  const getCurrencyDisplayName = (currency, tokenName) => {
    if (currency === 'XRP') return 'XRP';
    if (currency === 'USD') return 'USD';
    if (currency === 'EUR') return 'EUR';
    if (currency === 'BTC') return 'BTC';
    if (currency === 'ETH') return 'ETH';

    if (tokenName && tokenName !== currency) {
      return tokenName;
    }

    try {
      if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
        const hex = currency.replace(/00+$/, '');
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte > 0) ascii += String.fromCharCode(byte);
        }
        return ascii.toUpperCase() || currency;
      }
    } catch (e) { }

    return currency;
  };

  const isLoggedIn = accountProfile && accountProfile.account;
  const hasBalance = isLoggedIn && accountPairBalance;

  let isSufficientBalance = false;
  let errMsg = '';

  if (!accountProfile?.account) {
    errMsg = 'Connect your wallet!';
    isSufficientBalance = false;
  } else if (!hasBalance) {
    errMsg = '';
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
        const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();

        if (amount1 && amount2) {
          const fAmount1 = new Decimal(amount1 || 0).toNumber();
          const fAmount2 = new Decimal(amount2 || 0).toNumber();

          if (fAmount1 > 0 && fAmount2 > 0) {
            if (accountAmount >= fAmount1) {
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

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  // Fetch swap quote from API (works with or without login)
  // Uses curr1/curr2 which respect the revert state (actual swap direction)
  useEffect(() => {
    if (orderType !== 'market') return;
    if (!amount2 || parseFloat(amount2) <= 0 || !curr2?.currency) {
      setSwapQuoteApi(null);
      setQuoteRequiresTrustline(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (quoteAbortRef.current) quoteAbortRef.current.abort();
      quoteAbortRef.current = new AbortController();

      setQuoteLoading(true);
      try {
        // Use curr2 (destination) which respects revert state
        const destAmount =
          curr2.currency === 'XRP'
            ? { currency: 'XRP', value: amount2 }
            : { currency: curr2.currency, issuer: curr2.issuer, value: amount2 };

        const quoteAccount = accountProfile?.account || 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';

        // Use curr1 (source) which respects revert state
        const res = await api.post(
          `${BASE_URL}/dex/quote`,
          {
            source_account: quoteAccount,
            destination_amount: destAmount,
            source_currencies:
              curr1?.currency === 'XRP'
                ? [{ currency: 'XRP' }]
                : [{ currency: curr1.currency, issuer: curr1.issuer }],
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
  }, [amount2, curr1, curr2, accountProfile?.account, slippage, orderType]);

  // Client-side fallback quote calculation from orderbook
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
      from_orderbook: orderbookFill > 0 ? orderbookFill.toFixed(6) : '0',
      from_amm: ammFill > 0.000001 ? ammFill.toFixed(6) : '0',
      price_impact:
        Math.abs(impactPct) > 0.01
          ? {
            percent: `${impactPct.toFixed(2)}%`,
            xrp: `${((inputAmt * Math.abs(impactPct)) / 100).toFixed(4)} XRP`
          }
          : null,
      amm_pool_fee: ammFeeXrp > 0.000001 ? `${ammFeeXrp.toFixed(4)} XRP` : null,
      execution_rate: (outputAmt / inputAmt).toFixed(6)
    };
  }, [amount1, amount2, asks, bids, slippage, revert]);

  // Show fallback immediately, API quote when ready (non-blocking)
  const swapQuoteCalc = swapQuoteApi || swapQuoteFallback;

  // Fetch RLUSD token info when viewing XRP page
  useEffect(() => {
    if (!isXRPTokenPage) return;
    let mounted = true;

    async function fetchRLUSD() {
      try {
        const res = await api.get(
          `${BASE_URL}/token/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000`
        );
        const token = res.data?.token;
        if (mounted && token) {
          setToken2({
            ...token,
            currency: token.currency || 'USD',
            issuer: token.issuer || 'rMxWgaM9YkNkWwpTqUCBChs6zNTpYPY6NT'
          });
        }
      } catch (err) {
        console.error('RLUSD fetch error:', err);
      }
    }

    fetchRLUSD();

    return () => {
      mounted = false;
    };
  }, [isXRPTokenPage]);

  // Fetch orderbook from API - token (token2) as base, XRP (token1) as quote
  // Use md5 as dependency to avoid re-fetching when token object reference changes
  const token1Md5 = token1?.md5;
  const token2Md5 = token2?.md5;

  // Only fetch orderbook when limit order tab is active
  const shouldFetchOrderbook = orderType === 'limit';

  useEffect(() => {
    if (!shouldFetchOrderbook) return;
    if (!token1Md5 || !token2Md5) return;
    // Ensure tokens have required currency (and issuer for non-XRP)
    if (!token1?.currency || !token2?.currency) return;
    if (token1.currency !== 'XRP' && !token1.issuer) return;
    if (token2.currency !== 'XRP' && !token2.issuer) return;
    let mounted = true;

    async function fetchOrderbook() {
      if (!mounted) return;

      const params = new URLSearchParams({
        base_currency: token2.currency,
        quote_currency: token1.currency,
        limit: '60'
      });
      if (token2.currency !== 'XRP') params.append('base_issuer', token2.issuer);
      if (token1.currency !== 'XRP') params.append('quote_issuer', token1.issuer);

      try {
        const res = await api.get(`${BASE_URL}/orderbook?${params}`);
        const data = res.data;
        if (mounted && data?.success) processOrderbookData(data);
      } catch (err) {
        console.error('Orderbook fetch error:', err);
      }
    }

    function processOrderbookData(data) {
      const parsedBids = (data.bids || []).map((o) => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }));
      const parsedAsks = (data.asks || []).map((o) => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }));
      let bidSum = 0,
        askSum = 0;
      parsedBids.forEach((b) => {
        bidSum += b.amount;
        b.sumAmount = bidSum;
      });
      parsedAsks.forEach((a) => {
        askSum += a.amount;
        a.sumAmount = askSum;
      });
      setBids(parsedBids.slice(0, 30));
      setAsks(parsedAsks.slice(0, 30));
    }

    fetchOrderbook();
    const timer = setInterval(fetchOrderbook, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [token1Md5, token2Md5, shouldFetchOrderbook]);

  const { bestBid, bestAsk, midPrice, spreadPct } = useMemo(() => {
    const bb = bids && bids.length ? Number(bids[0]?.price) : null;
    const ba = asks && asks.length ? Number(asks[0]?.price) : null;
    const mid = bb != null && ba != null ? (bb + ba) / 2 : null;
    const spread = bb != null && ba != null && mid ? ((ba - bb) / mid) * 100 : null;
    return { bestBid: bb, bestAsk: ba, midPrice: mid, spreadPct: spread };
  }, [asks, bids]);

  const priceWarning = useMemo(() => {
    const THRESHOLD = 5;
    const lp = Number(limitPrice);
    if (!lp || !isFinite(lp)) return null;
    // revert=true means SELL (token->XRP), revert=false means BUY (XRP->token)
    // Warn if BUY price is way above best ask
    if (!revert && bestAsk != null) {
      const pct = ((lp - Number(bestAsk)) / Number(bestAsk)) * 100;
      if (pct > THRESHOLD) return { kind: 'buy', pct, ref: Number(bestAsk) };
    }
    // Warn if SELL price is way below best bid
    if (revert && bestBid != null) {
      const pct = ((Number(bestBid) - lp) / Number(bestBid)) * 100;
      if (pct > THRESHOLD) return { kind: 'sell', pct, ref: Number(bestBid) };
    }
    return null;
  }, [limitPrice, bestAsk, bestBid, revert]);

  // WebSocket-based real-time pair balance updates
  useEffect(() => {
    if (!accountProfile?.account || !curr1?.currency || !curr2?.currency) {
      setAccountPairBalance(null);
      return;
    }
    // Ensure non-XRP tokens have issuers
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

    const connect = async () => {
      try {
        const { getSessionWsUrl } = await import('src/utils/wsToken');
        const wsUrl = await getSessionWsUrl('balancePair', account, Object.fromEntries(new URLSearchParams(params)));
        if (!wsUrl) return;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {};
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'initial' || data.e === 'pair') {
              const pair = data.pair;
              setAccountPairBalance(pair);
              // Trustline status is checked via API useEffect (more reliable for accounts with many trustlines)
            }
          } catch (err) {
            console.error('[Pair WS] Parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!unmounted) reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.error('[Pair WS] Session error:', e);
        if (!unmounted) reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    let unmounted = false;
    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [accountProfile?.account, curr1?.currency, curr1?.issuer, curr2?.currency, curr2?.issuer, sync, isSwapped]);

  useEffect(() => {
    if (!token1Md5 || !token2Md5) return;
    let mounted = true;

    // Fallback to token.exch when pair-rates API fails or returns no data
    const applyFallbackRates = () => {
      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';
      if (token1IsXRP && !token2IsXRP && token2?.exch) {
        setTokenExch1(1);
        setTokenExch2(token2.exch);
      } else if (!token1IsXRP && token2IsXRP && token1?.exch) {
        setTokenExch1(token1.exch);
        setTokenExch2(1);
      }
    };

    async function getTokenPrice() {
      setLoadingPrice(true);
      try {
        const res = await api.get(`${BASE_URL}/stats/rates?md51=${token1Md5}&md52=${token2Md5}`);
        const data = res.data;
        if (mounted && data) {
          const r1 = data.rate1 || 0;
          const r2 = data.rate2 || 0;
          if (r1 > 0 || r2 > 0) {
            setTokenExch1(r1);
            setTokenExch2(r2);
          } else {
            applyFallbackRates();
          }
        }
      } catch (err) {
        if (mounted) applyFallbackRates();
      } finally {
        if (mounted) setLoadingPrice(false);
      }
    }

    getTokenPrice();

    return () => {
      mounted = false;
    };
  }, [token1Md5, token2Md5, token1, token2]);

  const calcQuantity = (amount, active) => {
    try {
      const amt = new Decimal(amount || 0).toNumber();
      if (amt === 0) return '';

      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';

      const rate1 = new Decimal(tokenExch1 || 0);
      const rate2 = new Decimal(tokenExch2 || 0);

      if (token1IsXRP || token2IsXRP) {
        if (rate1.eq(0) && rate2.eq(0)) {
          return '';
        }

        let result = 0;

        if (token1IsXRP && !token2IsXRP) {
          const tokenToXrpRate = rate2.toNumber();

          if (!revert) {
            if (active === 'AMOUNT') {
              result = new Decimal(amt).div(tokenToXrpRate).toNumber();
            } else {
              result = new Decimal(amt).mul(tokenToXrpRate).toNumber();
            }
          } else {
            if (active === 'VALUE') {
              result = new Decimal(amt).div(tokenToXrpRate).toNumber();
            } else {
              result = new Decimal(amt).mul(tokenToXrpRate).toNumber();
            }
          }
        } else if (!token1IsXRP && token2IsXRP) {
          const tokenToXrpRate = rate1.toNumber();

          if (!revert) {
            if (active === 'AMOUNT') {
              result = new Decimal(amt).mul(tokenToXrpRate).toNumber();
            } else {
              result = new Decimal(amt).div(tokenToXrpRate).toNumber();
            }
          } else {
            if (active === 'VALUE') {
              result = new Decimal(amt).mul(tokenToXrpRate).toNumber();
            } else {
              result = new Decimal(amt).div(tokenToXrpRate).toNumber();
            }
          }
        } else {
          result = amt;
        }

        const finalResult = new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
        return finalResult;
      } else {
        if (rate1.eq(0) || rate2.eq(0)) {
          return '';
        }

        let result = 0;
        if (active === 'AMOUNT') {
          result = new Decimal(amt).mul(rate1).div(rate2).toNumber();
        } else {
          result = new Decimal(amt).mul(rate2).div(rate1).toNumber();
        }

        const finalResult = new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
        return finalResult;
      }
    } catch (e) {
      console.error('[Swap calcQuantity] error:', e);
      return '';
    }
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handlePlaceOrder = async (e) => {
    if (!accountProfile?.account) {
      toast.error('Please connect wallet');
      return;
    }

    // Handle trustline-only flow (no amounts needed)
    const needsTrustline1 = !hasTrustline1 && curr1.currency !== 'XRP';
    const needsTrustline2 = !hasTrustline2 && curr2.currency !== 'XRP';
    if (needsTrustline1 || needsTrustline2) {
      const target = needsTrustline1 ? curr1 : curr2;
      const toastId = toast.loading('Setting trustline...');
      const success = await onCreateTrustline(target, true);
      if (success) {
        if (needsTrustline1) {
          setHasTrustline1(true);
          trustlineUpdateRef.current = { issuer: curr1.issuer, currency: curr1.currency, hasTrustline: true, ts: Date.now() };
        }
        if (needsTrustline2) {
          setHasTrustline2(true);
          trustlineUpdateRef.current = { issuer: curr2.issuer, currency: curr2.currency, hasTrustline: true, ts: Date.now() };
        }
        toast.success('Trustline set!', { id: toastId });
      } else {
        toast.error('Trustline failed', { id: toastId });
      }
      return;
    }

    // Capture current state immediately to avoid closure issues
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

      let walletData;
      try {
        walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
      } catch (walletErr) {
        toast.error('Wallet not found', { id: toastId, description: 'Could not retrieve wallet credentials' });
        return;
      }

      if (!walletData?.seed) {
        toast.error('Wallet error', { id: toastId, description: 'Could not retrieve credentials' });
        return;
      }

      const seed = walletData.seed.trim();
      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = Wallet.fromSeed(seed, { algorithm });

      // Track if we need to create trustlines (before we create them)
      const needsTrustline1 = !hasTrustline1 && curr1.currency !== 'XRP';
      const needsTrustline2 = !hasTrustline2 && curr2.currency !== 'XRP';

      // Auto-create trustlines if needed
      if (needsTrustline1) {
        toast.loading('Processing swap...', { id: toastId, description: `Setting trustline for ${curr1.name}` });
        const success = await onCreateTrustline(curr1, true);
        if (!success) {
          toast.error('Trustline failed', { id: toastId });
          return;
        }
        setHasTrustline1(true);
        setSync((s) => s + 1); // Trigger TokenSummary to refresh trustline state
      }
      if (needsTrustline2) {
        toast.loading('Processing swap...', { id: toastId, description: `Setting trustline for ${curr2.name}` });
        const success = await onCreateTrustline(curr2, true);
        if (!success) {
          toast.error('Trustline failed', { id: toastId });
          return;
        }
        setHasTrustline2(true);
        setSync((s) => s + 1); // Trigger TokenSummary to refresh trustline state
      }

      // Anti-snipe: authorize trustline before swap if needed
      if (antiSnipeInfo?.antiSnipeMode && !antiSnipeAuthorized) {
        toast.loading('Processing swap...', { id: toastId, description: 'Requesting anti-snipe authorization...' });
        setAuthorizingAntiSnipe(true);
        try {
          const authRes = await api.post(`${BASE_URL}/launch-token/authorize`, {
            sessionId: antiSnipeInfo.sessionId,
            userAddress: accountProfile.account
          });
          const authData = authRes.data || authRes;
          if (!authData.success && authData.error !== 'Already authorized') {
            toast.error('Authorization failed', { id: toastId, description: authData.error || 'Could not authorize' });
            setAuthorizingAntiSnipe(false);
            return;
          }
          // Poll until authorized on-chain (max 15s)
          toast.loading('Processing swap...', { id: toastId, description: 'Waiting for on-chain authorization...' });
          let authorized = authData.error === 'Already authorized';
          for (let i = 0; i < 10 && !authorized; i++) {
            await new Promise(r => setTimeout(r, 1500));
            const checkRes = await api.get(
              `${BASE_URL}/launch-token/check-auth/${token.issuer}/${encodeURIComponent(token.currency)}/${accountProfile.account}`
            );
            const checkData = checkRes.data || checkRes;
            if (checkData.authorized) authorized = true;
          }
          if (!authorized) {
            toast.error('Authorization timeout', { id: toastId, description: 'Try again in a few seconds' });
            setAuthorizingAntiSnipe(false);
            return;
          }
          setAntiSnipeAuthorized(true);
        } catch (err) {
          toast.error('Authorization error', { id: toastId, description: err.message });
          setAuthorizingAntiSnipe(false);
          return;
        }
        setAuthorizingAntiSnipe(false);
      }

      // Check if we created any trustline (which reserves XRP)
      const createdTrustline = needsTrustline1 || needsTrustline2;

      // Recalculate amounts if we created a trustline and are paying XRP
      // Trustline creation reserves ~0.2 XRP, so available balance is now lower
      let adjustedAmount1 = fAmount;
      let adjustedAmount2 = fValue;

      if (curr1.currency === 'XRP' && createdTrustline) {
        try {
          // Use xrpl.to API to get fresh balance
          const balRes = await api.get(`${BASE_URL}/account/balance/${accountProfile.account}`);
          let newXrpAvailable = parseFloat(balRes.data?.spendableDrops || 0) / 1000000;

          // API may be stale - subtract 0.2 XRP per trustline we just created
          const trustlinesCreated = (needsTrustline1 ? 1 : 0) + (needsTrustline2 ? 1 : 0);
          newXrpAvailable = Math.max(0, newXrpAvailable - (trustlinesCreated * 0.2));

          if (newXrpAvailable < fAmount) {
            // Recalculate based on new available balance
            adjustedAmount1 = Math.max(0, newXrpAvailable - 0.000015); // Leave tiny buffer for tx fee (~12 drops)

            if (adjustedAmount1 <= 0) {
              toast.error('Insufficient balance', { id: toastId, description: 'Not enough XRP after trustline reserve' });
              return;
            }

            // Recalculate output amount proportionally
            const ratio = adjustedAmount1 / fAmount;
            adjustedAmount2 = fValue * ratio;

            toast.loading('Processing swap...', { id: toastId, description: `Adjusted to ${adjustedAmount1.toFixed(4)} XRP` });
          }
        } catch (e) {
          console.warn('[Swap] Could not refetch balance after trustline:', e);
        }
      }

      const fAmount1Final = adjustedAmount1;
      const fValue1Final = adjustedAmount2;

      toast.loading('Processing swap...', { id: toastId, description: 'Submitting to XRPL' });

      // Helper to format token value with safe precision (max 15 significant digits)
      const formatTokenValue = (val) => {
        const n = parseFloat(val);
        const result = n >= 1 ? n.toPrecision(15).replace(/\.?0+$/, '') : n.toFixed(Math.min(15, Math.max(6, -Math.floor(Math.log10(n)) + 6)));
        return result;
      };

      if (currentOrderType === 'market') {
        // Use Payment with xrpl client for AMM swap (handles path finding)
        const slippageFactor = slippage / 100;
        let tx;

        if (curr1.currency === 'XRP') {
          // Paying XRP to receive tokens
          const maxXrpDrops = Math.floor(fAmount1Final * (1 + 0.005) * 1000000);
          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final) },
            DeliverMin: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final * (1 - slippageFactor)) },
            SendMax: String(maxXrpDrops),
            Flags: 131072 // tfPartialPayment
          };
        } else if (curr2.currency === 'XRP') {
          // Paying tokens to receive XRP
          // Check if user is selling ALL their tokens (within tiny tolerance for float precision)
          const userBalance = parseFloat(accountPairBalance?.curr1?.value || 0);
          const isSellingAll = Math.abs(userBalance - fAmount1Final) < 0.000001;

          const targetXrpDrops = Math.floor(fValue1Final * 1000000);
          const minXrpDrops = Math.max(Math.floor(fValue1Final * (1 - slippageFactor) * 1000000), 1);

          // If selling all, use exact balance as SendMax (no buffer) to avoid dust
          // Otherwise use 0.5% buffer for partial sells
          const sendMaxValue = isSellingAll ? userBalance : fAmount1Final * 1.005;

          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: String(targetXrpDrops),
            DeliverMin: String(minXrpDrops),
            SendMax: { currency: curr1.currency, issuer: curr1.issuer, value: formatTokenValue(sendMaxValue) },
            Flags: 131072 // tfPartialPayment
          };
        } else {
          // Token to token swap
          tx = {
            TransactionType: 'Payment',
            Account: accountProfile.account,
            SourceTag: 161803,
            Destination: accountProfile.account,
            Amount: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final) },
            DeliverMin: { currency: curr2.currency, issuer: curr2.issuer, value: formatTokenValue(fValue1Final * (1 - slippageFactor)) },
            SendMax: { currency: curr1.currency, issuer: curr1.issuer, value: formatTokenValue(fAmount1Final * 1.005) },
            Flags: 131072 // tfPartialPayment
          };
        }

        // Check trustline limit for receiving token via API
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
          } else {
            // Trustline OK
          }
        }

        // Simulate transaction first to check liquidity and show preview (XLS-69)
        toast.loading('Simulating swap...', { id: toastId });
        try {
          const simResult = await previewTransaction(tx);

          const engineResult = simResult.engine_result;
          const expectedOutput = fValue1Final;
          const actualOutput = simResult.delivered_amount || 0;
          // Only calculate price impact if we have both expected and actual values
          const priceImpact = expectedOutput > 0 && actualOutput > 0
            ? ((expectedOutput - actualOutput) / expectedOutput) * 100
            : null; // null means N/A (tx would fail or no data)

          // Build preview data
          const preview = {
            sending: { amount: fAmount1Final, currency: curr1.currency, name: curr1.name || curr1.currency },
            receiving: { expected: expectedOutput, actual: actualOutput, currency: curr2.currency, name: curr2.name || curr2.currency },
            priceImpact: priceImpact,
            engineResult: engineResult,
            status: engineResult === 'tesSUCCESS' ? 'success' : engineResult?.startsWith('tec') ? 'warning' : 'error'
          };

          // Check for fatal errors - try to find what WOULD work
          if (engineResult === 'tecPATH_PARTIAL' || engineResult === 'tecPATH_DRY') {
            toast.loading('Finding available liquidity...', { id: toastId });

            // Try simulation without DeliverMin to see what's actually available
            let maxAvailable = null;
            let workingAmount = null;
            let workingOutput = null;
            try {
              const noMinTx = { ...tx };
              delete noMinTx.DeliverMin;
              const availableResult = await previewTransaction(noMinTx);

              if (availableResult.engine_result === 'tesSUCCESS' && availableResult.delivered_amount > 0) {
                maxAvailable = availableResult.delivered_amount;

                // Binary search to find max amount that works at user's slippage
                toast.loading('Calculating optimal amount...', { id: toastId });
                let low = 0;
                let high = fAmount1Final;
                let bestAmount = null;
                let bestOutput = null;

                for (let i = 0; i < 6; i++) { // 6 iterations for reasonable precision
                  const mid = (low + high) / 2;

                  // Build test tx with this amount
                  const testTx = { ...tx };
                  const testOutput = mid * (expectedOutput / fAmount1Final); // Proportional expected output
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
                      low = mid; // Can try higher
                    } else {
                      high = mid; // Need to go lower
                    }
                  } catch (e) {
                    high = mid; // Error, go lower
                  }
                }

                workingAmount = bestAmount;
                workingOutput = bestOutput;
              }
            } catch (e) {
              console.warn('[Swap] Could not determine available liquidity:', e.message);
            }

            // Calculate actual slippage if we have data
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

          // Check slippage (only if we have valid price impact data)
          if (priceImpact !== null && priceImpact > slippage) {
            toast.dismiss(toastId);
            setTxPreview({
              ...preview,
              status: 'warning',
              warningMessage: `Price impact (${priceImpact.toFixed(2)}%) exceeds your ${slippage}% slippage tolerance`
            });
            // Store pending tx for user to confirm anyway
            setPendingTx({ tx, deviceWallet, toastId: null, feeAmounts: { fAmt1: fAmount1Final, fAmt2: fValue1Final, c1: curr1, c2: curr2 } });
            return;
          }

          // Show preview for successful simulation
          toast.dismiss(toastId);
          setTxPreview(preview);
          setPendingTx({ tx, deviceWallet, toastId: null, feeAmounts: { fAmt1: fAmount1Final, fAmt2: fValue1Final, c1: curr1, c2: curr2 } });
          return; // Wait for user confirmation

        } catch (simErr) {
          // Simulation not available - continue with submit directly
        }

        // Submit via API (fallback if simulation unavailable)
        toast.loading('Submitting...', { id: toastId });
        const submitResult = await submitTransaction(deviceWallet, tx);
        const txHash = submitResult.hash || submitResult.tx_json?.hash;
        const engineResult = submitResult.engine_result;

        if (engineResult !== 'tesSUCCESS') {
          toast.error('Rejected', { id: toastId, description: engineResult });
          return;
        }

        // Poll for on-chain confirmation
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
        // Use OfferCreate for limit orders (manual submission)
        // CRITICAL: Use limit price to calculate amounts, not market rate!
        const lp = Number(currentLimitPrice);

        let takerGets, takerPays;

        if (currentRevert) {
          // SELL order: user sells token (curr1) for XRP (curr2)
          // TakerGets = token amount, TakerPays = token amount × limitPrice (XRP)
          const tokenAmount = fAmount1Final;
          const xrpAmount = tokenAmount * lp;

          takerGets = { currency: curr1.currency, issuer: curr1.issuer, value: String(tokenAmount) };
          takerPays = String(Math.floor(xrpAmount * 1000000));
        } else {
          // BUY order: user pays XRP (curr1) for token (curr2)
          // TakerGets = token amount × limitPrice (XRP), TakerPays = token amount
          const tokenAmount = fValue1Final; // amount2 is the token amount user wants
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

        // Add Expiration if user selected a time limit (XRPL uses Ripple epoch seconds)
        if (orderExpiry !== 'never' && expiryHours > 0) {
          const RIPPLE_EPOCH = 946684800;
          tx.Expiration = Math.floor(Date.now() / 1000) + (expiryHours * 3600) - RIPPLE_EPOCH;
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
          let attempts = 0;
          const maxAttempts = 15;

          while (!validated && attempts < maxAttempts) {
            attempts++;
            await new Promise(r => setTimeout(r, 500));

            try {
              const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
              if (txRes.data?.validated === true || txRes.data?.meta?.TransactionResult === 'tesSUCCESS') {
                validated = true;
                break;
              }
            } catch (e) {
              // Continue polling
            }
          }

          if (validated) {
            toast.success('Order placed!', { id: toastId, description: `TX: ${txHash.slice(0, 8)}...` });
          } else {
            toast.loading('Order submitted', { id: toastId, description: 'Validation pending...' });
          }

          submitPlatformFee(deviceWallet, fAmount1Final, fValue1Final, curr1, curr2);
          setAmount1('');
          setAmount2('');
          setLimitPrice('');
          setSync((s) => s + 1);
          setIsSwapped((v) => !v);
        } else {
          toast.error('Order failed', { id: toastId, description: result?.data?.engine_result || 'Unknown error' });
        }
      }
    } catch (err) {
      console.error('Swap error:', err);
      toast.error('Swap failed', { id: toastId, description: err.message?.slice(0, 50) });
      dispatch(updateProcess(0));
    }
  };

  // Calculate platform fee in XRP drops and submit silently
  const calcFeeXrpDrops = (fAmt1, fAmt2, c1, c2) => {
    let xrpValue = 0;
    if (c1.currency === 'XRP') xrpValue = fAmt1;
    else if (c2.currency === 'XRP') xrpValue = fAmt2;
    else if (tokenExch1 > 0) xrpValue = fAmt1 * tokenExch1;
    if (xrpValue <= 0) return 0;
    return Math.floor(xrpValue * PLATFORM_FEE_RATE * 1000000);
  };

  const submitPlatformFee = async (deviceWallet, fAmt1, fAmt2, c1, c2) => {
    try {
      const drops = calcFeeXrpDrops(fAmt1, fAmt2, c1, c2);
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

  // Execute confirmed transaction after preview
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

      // Poll for confirmation
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
      console.error('Confirmed swap error:', err);
      toast.error('Swap failed', { id: toastId, description: err.message?.slice(0, 50) });
    }
  };

  const handleCancelPreview = () => {
    setTxPreview(null);
    setPendingTx(null);
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value === '.') value = '0.';
    if (value === '0' && amount1 === '') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive('AMOUNT');

    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const calculatedValue = calcQuantity(value, 'AMOUNT');

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
    setActive('VALUE');

    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const calculatedValue = calcQuantity(value, 'VALUE');

      if (calculatedValue && calculatedValue !== '0') {
        setAmount1(calculatedValue);
      }
    } else if (!value || value === '') {
      setAmount1('');
    }
  };

  const onRevertExchange = () => {
    setRevert(!revert);
    setAmount1('');
    setAmount2('');
  };

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
    if (orderType === 'limit' && !limitPrice) return 'Enter Limit Price';
    if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    return orderType === 'limit' ? 'Place Limit Order' : 'Exchange';
  };

  const onFillMax = () => {
    if (accountPairBalance?.curr1.value > 0) {
      const val = accountPairBalance.curr1.value;
      setAmount1(val);
      const hasValidRates =
        curr1?.currency === 'XRP' || curr2?.currency === 'XRP'
          ? tokenExch1 > 0 || tokenExch2 > 0
          : tokenExch1 > 0 && tokenExch2 > 0;
      if (hasValidRates) {
        const calculatedValue = calcQuantity(val, 'AMOUNT');
        if (calculatedValue && calculatedValue !== '0') setAmount2(calculatedValue);
      }
    }
  };

  const onFillPercent = (pct) => {
    if (!accountPairBalance?.curr1?.value) return;
    const bal = Number(accountPairBalance.curr1.value) || 0;
    if (bal <= 0) return;
    const val = new Decimal(bal).mul(pct).toFixed(6, Decimal.ROUND_DOWN);
    setAmount1(val);
    const hasValidRates =
      curr1?.currency === 'XRP' || curr2?.currency === 'XRP'
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;
    if (hasValidRates) {
      const calculatedValue = calcQuantity(val, 'AMOUNT');
      if (calculatedValue && calculatedValue !== '0') setAmount2(calculatedValue);
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
        let attempts = 0;
        while (attempts < 10) {
          attempts++;
          await new Promise(r => setTimeout(r, 400));
          try {
            const txRes = await api.get(`${BASE_URL}/tx/${txHash}`);
            if (txRes.data?.validated === true || txRes.data?.meta?.TransactionResult === 'tesSUCCESS') break;
          } catch (e) {}
        }

        if (!silent) {
          toast.success('Trustline set!', { description: `TX: ${txHash.slice(0, 8)}...` });
          setSync((s) => s + 1);
          setIsSwapped((v) => !v);
        }
        return true;
      } else {
        if (!silent) toast.error('Trustline failed', { description: result?.data?.engine_result || 'Unknown error' });
        return false;
      }
    } catch (err) {
      console.error('Trustline error:', err);
      if (!silent) toast.error('Trustline failed', { description: err.message?.slice(0, 50) });
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

  return (
    <div className="flex flex-col items-stretch w-full">
      {/* Transaction Preview Modal */}
      {txPreview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-lg max-sm:h-dvh"
          onClick={handleCancelPreview}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'rounded-[20px] p-5 max-w-[360px] w-[92%] border shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
              isDark ? 'bg-[#0d0d0f] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-[10px]">
                {txPreview.status === 'error' && (
                  <div className="w-9 h-9 rounded-[10px] bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                    <X size={20} className="text-[#ef4444]" />
                  </div>
                )}
                {txPreview.status === 'warning' && (
                  <div className="w-9 h-9 rounded-[10px] bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                    <AlertTriangle size={20} className="text-[#f59e0b]" />
                  </div>
                )}
                {txPreview.status === 'success' && (
                  <div className="w-9 h-9 rounded-[10px] bg-[rgba(34,197,94,0.15)] flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#22c55e]" />
                  </div>
                )}
                <span className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-black')}>
                  {txPreview.status === 'error' ? 'Swap Will Fail' : txPreview.status === 'warning' ? 'Review Swap' : 'Confirm Swap'}
                </span>
              </div>
              <button
                onClick={handleCancelPreview}
                aria-label="Close preview"
                className={cn(
                  'border-none rounded-lg cursor-pointer p-[6px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  isDark ? 'bg-white/[0.05] text-white/55' : 'bg-black/[0.05] text-black/40'
                )}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error/Warning Message */}
            {(txPreview.errorMessage || txPreview.warningMessage) && (
              <div className={cn('py-[10px] px-3 rounded-[10px] mb-3', txPreview.errorMessage ? 'bg-[rgba(239,68,68,0.08)]' : 'bg-[rgba(245,158,11,0.08)]')}>
                <span className={cn('text-xs', txPreview.errorMessage ? 'text-[#ef4444]' : 'text-[#f59e0b]')}>
                  {txPreview.errorMessage || txPreview.warningMessage}
                </span>
              </div>
            )}

            {/* Available Liquidity - Compact */}
            {(txPreview.maxAvailable || txPreview.workingAmount) && (
              <div className={cn('p-3 rounded-[10px] mb-3 border', isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]')}>
                {/* Option 1: Increase slippage to get max */}
                {txPreview.maxAvailable && txPreview.actualSlippage && (
                  <div className={cn(txPreview.workingAmount ? 'mb-3 pb-3' : '')} style={{ borderBottom: txPreview.workingAmount ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none' }}>
                    <div className="flex items-center justify-between mb-[6px]">
                      <span className={cn('text-[10px] uppercase tracking-[0.5px]', isDark ? 'text-white/55' : 'text-black/40')}>
                        Option 1: Higher slippage
                      </span>
                      <span className="text-[10px] py-[2px] px-[5px] rounded bg-[rgba(245,158,11,0.12)] text-[#f59e0b]">
                        {txPreview.actualSlippage}% impact
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-black')}>
                        ~{fNumber(txPreview.maxAvailable)} {txPreview.receiving?.name}
                      </span>
                      {parseFloat(txPreview.actualSlippage) <= 50 && (
                        <button
                          onClick={() => {
                            const newSlippage = Math.ceil(parseFloat(txPreview.actualSlippage) + 1);
                            setSlippage(newSlippage);
                            setTxPreview(null);
                            setPendingTx(null);
                            toast.success(`Slippage set to ${newSlippage}%`, { duration: 5000 });
                          }}
                          className={cn('py-[6px] px-[10px] rounded-md border bg-transparent font-medium cursor-pointer text-[10px]', isDark ? 'border-white/10 text-white' : 'border-black/10 text-black')}
                        >
                          Set {Math.ceil(parseFloat(txPreview.actualSlippage) + 1)}%
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Reduce amount to fit slippage */}
                {txPreview.workingAmount && (
                  <div>
                    <div className="flex items-center justify-between mb-[6px]">
                      <span className={cn('text-[10px] uppercase tracking-[0.5px]', isDark ? 'text-white/55' : 'text-black/40')}>
                        Option 2: Keep {slippage}% slippage
                      </span>
                      <span className="text-[10px] py-[2px] px-[5px] rounded bg-[rgba(34,197,94,0.12)] text-[#22c55e]">
                        Guaranteed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#22c55e]">
                          ~{fNumber(txPreview.workingOutput || 0)} {txPreview.receiving?.name}
                        </div>
                        <div className={cn('text-[10px]', isDark ? 'text-white/55' : 'text-black/40')}>
                          for {fNumber(txPreview.workingAmount)} {txPreview.sending?.name}
                        </div>
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
                        className="py-[6px] px-3 rounded-md border-none bg-[#22c55e] text-white font-semibold cursor-pointer text-[10px]"
                      >
                        Use this
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Details */}
            <div className={cn('rounded-[10px] p-3 mb-3', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]')}>
              {/* Sending */}
              <div className="flex justify-between items-center mb-2">
                <span className={cn('text-[11px] uppercase tracking-[0.5px]', isDark ? 'text-white/55' : 'text-black/40')}>Send</span>
                <span className={cn('font-medium text-[13px]', isDark ? 'text-white' : 'text-black')}>
                  {fNumber(txPreview.sending?.amount)} {txPreview.sending?.name}
                </span>
              </div>

              {/* Receiving */}
              <div className="flex justify-between items-center">
                <span className={cn('text-[11px] uppercase tracking-[0.5px]', isDark ? 'text-white/55' : 'text-black/40')}>Receive</span>
                <div className="text-right">
                  {txPreview.receiving?.actual > 0 ? (
                    <span className="text-[#22c55e] font-semibold text-[13px]">
                      {fNumber(txPreview.receiving.actual)} {txPreview.receiving?.name}
                    </span>
                  ) : (
                    <div>
                      <span className="text-[#ef4444] font-medium text-xs italic">
                        Failed
                      </span>
                      <div className={cn('text-[9px] mt-[2px]', isDark ? 'text-white/55' : 'text-black/30')}>
                        Would lose tx fee
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider + Details */}
              {(txPreview.priceImpact !== null && txPreview.priceImpact > 0.01) || txPreview.receiving?.actual > 0 ? (
                <div className={cn('mt-[10px] pt-[10px] border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                  {/* Price Impact */}
                  {txPreview.priceImpact !== null && txPreview.priceImpact > 0.01 && (
                    <div className="flex justify-between mb-1">
                      <span className={cn('text-[11px]', isDark ? 'text-white/55' : 'text-black/40')}>Impact</span>
                      <span className={cn(
                        'font-medium text-[11px]',
                        txPreview.priceImpact > 5 ? 'text-[#ef4444]' : txPreview.priceImpact > 2 ? 'text-[#f59e0b]' : 'text-[#22c55e]'
                      )}>
                        -{txPreview.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {/* Rate */}
                  {txPreview.receiving?.actual > 0 && txPreview.sending?.amount > 0 && (
                    <div className="flex justify-between">
                      <span className={cn('text-[11px]', isDark ? 'text-white/55' : 'text-black/40')}>Rate</span>
                      <span className={cn('text-[11px]', isDark ? 'text-white/60' : 'text-black/60')}>
                        1 {txPreview.receiving?.name} = {fNumber(txPreview.sending.amount / txPreview.receiving.actual)} {txPreview.sending?.name}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Preview Badge */}
            <div className={cn('text-center mb-3 p-1.5 rounded-md', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]')}>
              <span className={cn('text-[10px]', isDark ? 'text-white/55' : 'text-black/40')}>
                Preview · No funds sent yet
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                className={cn(
                  'flex-1 p-3 rounded-[10px] bg-transparent font-medium cursor-pointer text-[13px] border',
                  isDark ? 'border-white/10 text-white' : 'border-black/10 text-black'
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

      <OverviewWrapper isDark={isDark}>
        {/* XRP page notice - show that we're displaying RLUSD/XRP orderbook */}
        {isXRPTokenPage && (
          <div
            className="mb-3 p-2 rounded-lg"
            style={{
              background: isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)',
              border: `1px solid ${isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)'}`
            }}
          >
            <span style={{ fontSize: '11px', opacity: 0.8, color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
              Showing <span className="font-medium text-[#4285f4]">RLUSD/XRP</span>{' '}
              orderbook. XRP is the native asset and cannot have an orderbook against itself.
            </span>
          </div>
        )}
        {/* MPT token notice */}
        {isMPT && (
          <div
            className="mb-3 p-3 rounded-lg"
            style={{
              background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
              border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)'}`
            }}
          >
            <span style={{ fontSize: '11px', opacity: 0.9, color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
              <span className="font-medium text-[#f59e0b]">Multi-Purpose Token (MPT)</span> - DEX trading is not yet available for MPT tokens. MPT is a new token standard on the XRP Ledger.
            </span>
          </div>
        )}
        <div className="mb-1 max-sm:mb-0.5">
          <div className="flex gap-1 sm:gap-2">
            <button
              className={cn(
                'py-[6px] px-3 text-[11px] font-medium tracking-[0.05em] uppercase bg-transparent rounded-md border cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150 sm:py-[10px] sm:px-4 sm:text-xs max-sm:py-[4px] max-sm:px-2',
                orderType === 'market'
                  ? isDark ? 'border-white/20 text-white/90' : 'border-black/20 text-black/80'
                  : isDark ? 'border-white/10 text-white/55' : 'border-black/10 text-black/40',
                isDark ? 'hover:border-white/[0.15] hover:text-white/70' : 'hover:border-black/[0.15] hover:text-black/60'
              )}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
            <button
              className={cn(
                'py-[6px] px-3 text-[11px] font-medium tracking-[0.05em] uppercase bg-transparent rounded-md border cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150 sm:py-[10px] sm:px-4 sm:text-xs max-sm:py-[4px] max-sm:px-2',
                orderType === 'limit'
                  ? isDark ? 'border-white/20 text-white/90' : 'border-black/20 text-black/80'
                  : isDark ? 'border-white/10 text-white/55' : 'border-black/10 text-black/40',
                isDark ? 'hover:border-white/[0.15] hover:text-white/70' : 'hover:border-black/[0.15] hover:text-black/60'
              )}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
          </div>
        </div>

        <ConverterFrame>
          <AmountRows>
            {/* You Pay Section */}
            <CurrencyContent isDark={isDark}>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.5px]',
                    isDark ? 'text-white/55' : 'text-black/40'
                  )}>
                    You pay
                  </span>
                  {isLoggedIn && (
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px]', isDark ? 'text-white/50' : 'text-black/50')}>
                        {accountPairBalance?.curr1.value
                          ? new Decimal(accountPairBalance.curr1.value).toFixed(4).replace(/\.?0+$/, '')
                          : '0'} {curr1.name}
                      </span>
                      <div className="flex gap-0.5">
                        {[0.5, 1].map((p) => (
                          <button
                            key={p}
                            disabled={!accountPairBalance?.curr1?.value}
                            onClick={() => (p === 1 ? onFillMax() : onFillPercent(p))}
                            className={cn(
                              'py-0.5 px-1.5 text-[9px] font-semibold rounded border-none text-[#3b82f6] transition-[opacity,transform,background-color,border-color] duration-150',
                              isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]',
                              accountPairBalance?.curr1?.value ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-30'
                            )}
                          >
                            {p === 1 ? 'MAX' : '50%'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 max-sm:gap-2 mt-1 max-sm:mt-0.5">
                  <div className={cn(
                    'flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer max-sm:py-1 max-sm:px-2',
                    isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'
                  )}>
                    <TokenImage
                      src={`https://s1.xrpl.to/thumb/${curr1.md5}_32`}
                      width={24}
                      height={24}
                      alt={curr1.name}
                      unoptimized={true}
                      onError={(event) => (event.target.src = '/static/alt.webp')}
                    />
                    <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-black')}>
                      {curr1.name}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <input
                      placeholder="0.00"
                      autoComplete="new-password"
                      className={cn('outline-none', isDark ? 'text-white placeholder:text-white/55' : 'text-[#212B36] placeholder:text-black/40')}
                      style={{ width: '100%', padding: '0px', border: 'none', fontSize: '20px', textAlign: 'end', appearance: 'none', fontWeight: 500, background: 'transparent' }}
                      value={amount1}
                      onChange={handleChangeAmount1}
                      onFocus={(e) => { if (window.innerWidth < 640) setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                    />
                    <span className={cn('text-[11px] max-sm:text-[10px]', isDark ? 'text-white/55' : 'text-black/40')}>
                      {curr1IsXRP ? `≈ ${fNumber(tokenPrice1)} XRP` : `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice1)}`}
                    </span>
                  </div>
                </div>
              </div>
            </CurrencyContent>

            {/* You Receive Section */}
            <CurrencyContent isDark={isDark}>
              <div className="flex flex-col flex-1 gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.5px]',
                    isDark ? 'text-white/55' : 'text-black/40'
                  )}>
                    You receive
                  </span>
                  {isLoggedIn && (
                    <span className={cn('text-[10px]', isDark ? 'text-white/50' : 'text-black/50')}>
                      {accountPairBalance?.curr2.value
                        ? new Decimal(accountPairBalance.curr2.value).toFixed(4).replace(/\.?0+$/, '')
                        : '0'} {curr2.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 max-sm:gap-2 mt-1 max-sm:mt-0.5">
                  <div className={cn(
                    'flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer max-sm:py-1 max-sm:px-2',
                    isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'
                  )}>
                    <TokenImage
                      src={`https://s1.xrpl.to/thumb/${curr2.md5}_32`}
                      width={24}
                      height={24}
                      alt={curr2.name}
                      unoptimized={true}
                      onError={(event) => (event.target.src = '/static/alt.webp')}
                    />
                    <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-black')}>
                      {curr2.name}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <input
                      placeholder="0.00"
                      autoComplete="new-password"
                      className={cn('outline-none', isDark ? 'text-white placeholder:text-white/55' : 'text-[#212B36] placeholder:text-black/40')}
                      style={{ width: '100%', padding: '0px', border: 'none', fontSize: '20px', textAlign: 'end', appearance: 'none', fontWeight: 500, background: 'transparent' }}
                      value={amount2}
                      onChange={handleChangeAmount2}
                      onFocus={(e) => { if (window.innerWidth < 640) setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                    />
                    <span className={cn('text-[11px] max-sm:text-[10px]', isDark ? 'text-white/55' : 'text-black/40')}>
                      {curr2IsXRP ? `≈ ${fNumber(tokenPrice2)} XRP` : `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </CurrencyContent>

            <ToggleContent isDark={isDark} onClick={onRevertExchange} role="button" aria-label="Swap currency direction">
              <div className="flex items-center justify-center w-9 h-9 max-sm:w-7 max-sm:h-7">
                <ArrowUpDown
                  size={16}
                  strokeWidth={2.5}
                  className={cn(
                    'transition-[opacity,transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    isDark ? 'text-white/70' : 'text-black/50'
                  )}
                />
              </div>
            </ToggleContent>
          </AmountRows>

          {/* Settings Modal */}
          {showSettingsModal && (
            <div
              className={cn(
                'fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-md max-sm:h-dvh',
                isDark ? 'bg-black/70' : 'bg-white/60'
              )}
              onClick={() => setShowSettingsModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'w-[320px] rounded-2xl border-[1.5px] p-5',
                  isDark
                    ? 'bg-black/80 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/50'
                    : 'bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-2xl shadow-gray-300/30'
                )}
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={cn(
                      'text-[14px] font-medium',
                      isDark ? 'text-white/90' : 'text-gray-900'
                    )}
                  >
                    Settings
                  </span>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    aria-label="Close settings"
                    className={cn(
                      'p-1.5 rounded-lg transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                    )}
                  >
                    <X size={14} className={isDark ? 'text-white/55' : 'text-gray-400'} />
                  </button>
                </div>

                {/* Max Slippage Section */}
                <div className="mb-4">
                  <div className="mb-2.5">
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/55' : 'text-gray-500'}`}
                    >
                      Max Slippage
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 5].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSlippage(preset)}
                        className={cn(
                          'flex-1 h-8 text-[12px] font-medium rounded-md transition-[background-color,border-color]',
                          slippage === preset
                            ? 'bg-primary/15 text-primary'
                            : isDark
                              ? 'bg-white/[0.03] text-white/50 hover:text-white/70'
                              : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {preset}%
                      </button>
                    ))}
                    <div
                      className={cn(
                        'flex items-center justify-center h-8 px-2 min-w-[50px] rounded-md',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                      )}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
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
                        className={cn(
                          'w-5 bg-transparent border-none outline-none text-[12px] font-medium text-center',
                          isDark ? 'text-white/80' : 'text-gray-700'
                        )}
                      />
                      <span
                        className={cn('text-[11px]', isDark ? 'text-white/55' : 'text-gray-400')}
                      >
                        %
                      </span>
                    </div>
                  </div>
                  {Number(slippage) >= 4 && (
                    <div className="flex items-center gap-2 mt-2.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-amber-500">
                        High slippage may cause front-running
                      </span>
                    </div>
                  )}
                </div>

                {/* Network Fee Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/55' : 'text-gray-500'}`}
                    >
                      Network Fee
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-white/55' : 'text-gray-400'}`}>
                      (drops)
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[12, 15, 20, 50].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTxFee(String(val))}
                        className={cn(
                          'flex-1 h-8 text-[12px] font-medium rounded-md transition-[background-color,border-color]',
                          txFee === String(val)
                            ? 'bg-primary/15 text-primary'
                            : isDark
                              ? 'bg-white/[0.03] text-white/50 hover:text-white/70'
                              : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {val}
                      </button>
                    ))}
                    <div
                      className={cn(
                        'flex items-center h-8 px-2 min-w-[52px] rounded-md',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100'
                      )}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={txFee}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setTxFee(val);
                        }}
                        className={cn(
                          'w-8 bg-transparent border-none outline-none text-[12px] font-medium text-center',
                          isDark ? 'text-white/80' : 'text-gray-700'
                        )}
                      />
                    </div>
                  </div>
                  <p
                    className={cn('text-[10px] mt-1.5', isDark ? 'text-white/55' : 'text-gray-400')}
                  >
                    Higher fees = priority during congestion
                  </p>
                  {parseInt(txFee) >= 50 && (
                    <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-amber-500">
                        Only needed during extreme congestion
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 rounded-lg bg-primary text-white text-[13px] font-medium border-none cursor-pointer hover:bg-blue-600 transition-[background-color,border-color] mt-2"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Slippage control - Only for market orders */}
          {orderType === 'market' && (
            <div className="px-1 py-1.5">
              <div className="flex flex-row items-center justify-between">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className={cn(
                    'flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 transition-[background-color,border-color]',
                    isDark
                      ? 'text-white/50 hover:text-white/70'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Settings size={13} />
                  <span className="text-[11px]">Slippage {slippage}%</span>
                </button>
                <span className={cn('text-[11px]', isDark ? 'text-white/55' : 'text-gray-400')}>
                  Impact{' '}
                  {swapQuoteCalc?.price_impact?.percent
                    ? parseFloat(swapQuoteCalc.price_impact.percent.replace('%', '')).toFixed(2)
                    : '—'}
                  %
                </span>
              </div>

              {/* Quote Summary */}
              {swapQuoteCalc && (
                <div
                  className="mt-2 p-2 rounded-md"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    {/* Rate */}
                    <div className="flex flex-row items-center justify-between">
                      <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                        Rate
                        {swapQuoteCalc.ammFallback && (
                          <span className="text-[#f59e0b]"> ~est</span>
                        )}
                        {quoteLoading && <span className="opacity-50"> •••</span>}
                      </span>
                      <span className="font-mono" style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                        1 {token2?.name || token2?.currency} ={' '}
                        {(() => {
                          const srcVal = parseFloat(swapQuoteCalc.source_amount?.value || amount1);
                          const dstVal = parseFloat(
                            swapQuoteCalc.destination_amount?.value || amount2
                          );
                          const rate = dstVal > 0 && srcVal > 0 ? srcVal / dstVal : 0;
                          if (!rate || rate === 0) return '—';
                          return formatCompactPrice(rate);
                        })()}{' '}
                        {token1?.name || token1?.currency}
                      </span>
                    </div>
                    {/* Min Received */}
                    <div className="flex flex-row items-center justify-between">
                      <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                        Min received
                      </span>
                      <span className="font-mono" style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                        {fNumber(swapQuoteCalc.minimum_received)} {token2?.name || token2?.currency}
                      </span>
                    </div>
                    {/* Route & Fee combined */}
                    {(() => {
                      const obVal = parseFloat(swapQuoteCalc.from_orderbook) || 0;
                      const ammVal = parseFloat(swapQuoteCalc.from_amm) || 0;
                      const feeStr = swapQuoteCalc.amm_pool_fee;
                      const feePct = swapQuoteCalc.amm_trading_fee_bps
                        ? (swapQuoteCalc.amm_trading_fee_bps / 1000).toFixed(2)
                        : null;
                      if (obVal === 0 && ammVal === 0 && !feeStr) return null;

                      return (
                        <div className="flex flex-row items-center justify-between">
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            Route
                          </span>
                          <span className="font-mono" style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}
                          >
                            {obVal > 0 && ammVal > 0 ? (
                              <span className="text-[#22c55e]">DEX+AMM</span>
                            ) : obVal > 0 ? (
                              <span className="text-[#22c55e]">DEX</span>
                            ) : ammVal > 0 ? (
                              <span className="text-[#3b82f6]">AMM</span>
                            ) : null}
                            {feeStr && <span className="opacity-60"> · {feePct}% fee</span>}
                          </span>
                        </div>
                      );
                    })()}
                    {/* Platform Fee */}
                    {amount1 && amount2 && (() => {
                      const drops = calcFeeXrpDrops(parseFloat(amount1) || 0, parseFloat(amount2) || 0, curr1, curr2);
                      if (drops < 1) return null;
                      const xrp = drops / 1000000;
                      return (
                        <div className="flex flex-row items-center justify-between">
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            Platform fee (0.08%)
                          </span>
                          <span className="font-mono" style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                            {xrp < 0.01 ? xrp.toFixed(6) : fNumber(xrp)} XRP
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Limit Order Settings */}
          {orderType === 'limit' && (
            <div className="px-1 py-1">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Limit Price
                  </span>
                  <div
                    className="flex flex-row items-center rounded-md p-[2px]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                    }}
                  >
                    <button
                      className={cn('rounded font-semibold inline-flex items-center justify-center cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150', !limitPrice && !(bestBid != null && bestAsk != null) && 'cursor-not-allowed opacity-40', isDark ? 'hover:bg-white/[0.05] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black')}
                      style={{ padding: '0 8px', fontSize: '9px', minHeight: '18px', border: 'none', background: 'transparent', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                      disabled={!limitPrice && !(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid =
                          bestBid != null && bestAsk != null
                            ? (Number(bestBid) + Number(bestAsk)) / 2
                            : null;
                        const base = Number(limitPrice || mid || 0);
                        if (!base) return;
                        setLimitPrice(new Decimal(base).mul(0.99).toFixed(6));
                      }}
                    >
                      -1%
                    </button>
                    <button
                      className={cn('rounded font-semibold inline-flex items-center justify-center cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150 mx-0.5', !(bestBid != null && bestAsk != null) && 'cursor-not-allowed opacity-40', isDark ? 'hover:bg-white/[0.05] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black')}
                      style={{ padding: '0 8px', fontSize: '9px', minHeight: '18px', border: 'none', background: 'transparent', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                      disabled={!(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid =
                          bestBid != null && bestAsk != null
                            ? (Number(bestBid) + Number(bestAsk)) / 2
                            : null;
                        if (mid == null) return;
                        setLimitPrice(String(new Decimal(mid).toFixed(6)));
                      }}
                    >
                      Mid
                    </button>
                    <button
                      className={cn('rounded font-semibold inline-flex items-center justify-center cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150', !limitPrice && !(bestBid != null && bestAsk != null) && 'cursor-not-allowed opacity-40', isDark ? 'hover:bg-white/[0.05] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black')}
                      style={{ padding: '0 8px', fontSize: '9px', minHeight: '18px', border: 'none', background: 'transparent', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                      disabled={!limitPrice && !(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid =
                          bestBid != null && bestAsk != null
                            ? (Number(bestBid) + Number(bestAsk)) / 2
                            : null;
                        const base = Number(limitPrice || mid || 0);
                        if (!base) return;
                        setLimitPrice(new Decimal(base).mul(1.01).toFixed(6));
                      }}
                    >
                      +1%
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    placeholder="0.00"
                    className={cn('outline-none w-full max-sm:text-sm max-sm:p-2 font-mono', isDark ? 'text-white placeholder:text-white/55' : 'text-[#212B36] placeholder:text-black/40')}
                    style={{ padding: '10px 12px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, fontSize: '14px', fontWeight: 600, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: '10px' }}
                    value={limitPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '.') {
                        setLimitPrice('0.');
                        return;
                      }
                      if (!isNaN(Number(val)) || val === '') {
                        setLimitPrice(val);
                      }
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: 500,
                      opacity: 0.5,
                      color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36'
                    }}
                  >
                    {curr2.name}/{curr1.name}
                  </span>
                </div>

                {/* Live Market Prices */}
                {bestBid != null && bestAsk != null && (
                  <div
                    className="p-2 rounded-[10px]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                    }}
                  >
                    <div className="flex flex-row items-center justify-between">
                      {/* Bid Price */}
                      <div
                        className="flex flex-col gap-0.5 cursor-pointer flex-1"
                        onClick={() => bids && bids[0] && setLimitPrice(String(bids[0].price))}
                      >
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                          Bid
                        </span>
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>
                          {formatCompactPrice(bestBid)}
                        </span>
                      </div>

                      {/* Spread */}
                      <div
                        className="flex flex-col gap-0.5 items-center flex-1"
                        style={{ borderLeft: '1px solid rgba(128,128,128,0.1)', borderRight: '1px solid rgba(128,128,128,0.1)' }}
                      >
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                          Spread
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color:
                              spreadPct != null && spreadPct > 2
                                ? '#f59e0b'
                                : isDark
                                  ? 'rgba(255,255,255,0.8)'
                                  : 'rgba(0,0,0,0.8)'
                          }}>
                          {spreadPct != null ? `${spreadPct.toFixed(2)}%` : '—'}
                        </span>
                      </div>

                      {/* Ask Price */}
                      <div
                        className="flex flex-col gap-0.5 items-end cursor-pointer flex-1"
                        onClick={() => asks && asks[0] && setLimitPrice(String(asks[0].price))}
                      >
                        <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.9)' : '#212B36' }}>
                          Ask
                        </span>
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                          {formatCompactPrice(bestAsk)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {orderType === 'limit' && limitPrice && Number(limitPrice) <= 0 && (
                  <span style={{ fontSize: '10px', color: '#ef4444' }}>
                    Enter a valid limit price greater than 0
                  </span>
                )}
                {orderType === 'limit' &&
                  limitPrice &&
                  (() => {
                    const lp = Number(limitPrice);
                    if (!lp || !isFinite(lp)) return null;

                    // Check if order would instantly fill
                    // revert=true means SELL (token->XRP), revert=false means BUY (XRP->token)
                    const willFillBuy = !revert && bestAsk != null && lp >= Number(bestAsk);
                    const willFillSell = revert && bestBid != null && lp <= Number(bestBid);

                    if (willFillBuy || willFillSell) {
                      const pct = willFillBuy
                        ? ((lp - Number(bestAsk)) / Number(bestAsk)) * 100  // BUY above ask
                        : ((Number(bestBid) - lp) / Number(bestBid)) * 100; // SELL below bid
                      return (
                        <div className="rounded-lg" style={{ padding: '2px 10px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)', marginTop: '2px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 400, color: '#ef4444' }}>
                            Instant fill!{' '}
                            {pct > 0
                              ? `${pct.toFixed(1)}% ${willFillBuy ? 'above ask' : 'below bid'}`
                              : 'At market price'}
                          </span>
                        </div>
                      );
                    }

                    // Show warning if price deviates from market
                    // BUY (revert=false) → compare to bestAsk (what sellers want)
                    // SELL (revert=true) → compare to bestBid (what buyers offer)
                    const refPrice = revert ? Number(bestBid) : Number(bestAsk);
                    if (refPrice && refPrice > 0) {
                      const pctDiff = ((lp - refPrice) / refPrice) * 100;
                      if (Math.abs(pctDiff) > 1) {
                        const direction = pctDiff > 0 ? 'above' : 'below';
                        const color =
                          pctDiff > 50 ? '#ef4444' : pctDiff > 10 ? '#f59e0b' : '#3b82f6';
                        return (
                          <span style={{ fontSize: '10px', color }}>
                            {Math.abs(pctDiff).toFixed(1)}% {direction} market
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}

                {/* Order Expiration - Segmented Control */}
                <div className={cn(
                  'mt-3 flex rounded-lg overflow-hidden border',
                  isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-100 border-black/[0.08]'
                )}>
                  {[
                    { value: 'never', label: 'GTC', title: 'Good Til Cancelled' },
                    { value: '1h', label: '1H', title: '1 Hour' },
                    { value: '24h', label: '24H', title: '24 Hours' },
                    { value: '7d', label: '7D', title: '7 Days' }
                  ].map((exp) => (
                    <button
                      key={exp.value}
                      title={exp.title}
                      onClick={() => {
                        setOrderExpiry(exp.value);
                        if (exp.value === '1h') setExpiryHours(1);
                        else if (exp.value === '24h') setExpiryHours(24);
                        else if (exp.value === '7d') setExpiryHours(168);
                      }}
                      className={cn(
                        'flex-1 py-2 border-none bg-transparent cursor-pointer text-[11px] font-medium relative transition-[background-color,border-color] duration-150',
                        orderExpiry === exp.value
                          ? 'text-[#4285f4]'
                          : isDark
                            ? 'text-white/55'
                            : 'text-black/40'
                      )}
                    >
                      {exp.label}
                      {orderExpiry === exp.value && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm bg-[#4285f4]" />
                      )}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* Order Summary */}
          {orderType === 'limit' && amount1 && amount2 && limitPrice && (
            <SummaryBox isDark={isDark}>
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                <span className="font-medium">Sell</span> {amount1}{' '}
                {curr1.name} @ {limitPrice} ={' '}
                {revert
                  ? new Decimal(amount1 || 0).mul(limitPrice || 0).toFixed(6)
                  : new Decimal(amount1 || 0).div(limitPrice || 1).toFixed(6)
                } {curr2.name}
                {orderExpiry !== 'never' && <span className="opacity-60"> · {expiryHours}h</span>}
              </span>
            </SummaryBox>
          )}

          {/* Anti-snipe notice */}
          {antiSnipeInfo?.antiSnipeMode && (
            <div className={cn(
              'rounded-lg px-3 py-2 mt-2 border',
              isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
            )}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                <span className={cn('text-[11px] font-medium', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  Anti-snipe active
                </span>
              </div>
              <p className={cn('text-[10px] mt-0.5', isDark ? 'text-white/50' : 'text-black/50')}>
                {antiSnipeAuthorized
                  ? 'Your wallet is authorized — you can swap.'
                  : 'Authorization required before buying. It will be requested automatically when you swap.'}
                {antiSnipeInfo.authWindow?.remainingSec > 0 && (
                  <span className="ml-1 opacity-70">
                    Window: {Math.ceil(antiSnipeInfo.authWindow.remainingSec / 60)}m left
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Connect Wallet - inside the swap card when not connected */}
          {!accountProfile?.account && (
            <div className="mt-2">
              <ConnectWallet
                text="Connect Wallet"
              />
            </div>
          )}

          {/* Exchange/Trustline Button - inside the swap card when connected */}
          {accountProfile?.account && (
            <div className="mt-2">
              <ExchangeButton
                variant="outlined"
                onClick={handlePlaceOrder}
                isDark={isDark}
                disabled={
                  isProcessing === 1 ||
                  !isLoggedIn
                }
              >
                {handleMsg()}
              </ExchangeButton>
              {isLoggedIn && errMsg && !errMsg.toLowerCase().includes('trustline') && (
                <div className="rounded-lg" style={{ padding: '6px 10px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                    {errMsg}
                  </span>
                </div>
              )}
            </div>
          )}
        </ConverterFrame>
      </OverviewWrapper>

      <div className="flex items-center gap-1.5 mt-1 mb-0.5 px-1 max-sm:mt-0.5">
        <PuffLoader color={isDark ? '#22c55e' : '#3b82f6'} size={10} />
        <span className={cn('text-[10px] font-mono', isDark ? 'text-white/55' : 'text-gray-400')}>
          1 {curr1.name} ={' '}
          {(() => {
            if (amount1 && amount2 && parseFloat(amount1) > 0 && parseFloat(amount2) > 0) {
              return (parseFloat(amount2) / parseFloat(amount1)).toFixed(6);
            }
            const token1IsXRP = token1?.currency === 'XRP';
            const token2IsXRP = token2?.currency === 'XRP';
            // Guard against division by zero
            if ((!token1IsXRP && tokenExch1 <= 0) || (!token2IsXRP && tokenExch2 <= 0)) {
              return '--';
            }
            let rate;
            if (revert) {
              rate =
                token1IsXRP && !token2IsXRP
                  ? tokenExch2
                  : !token1IsXRP && token2IsXRP
                    ? 1 / tokenExch1
                    : tokenExch2 / tokenExch1;
            } else {
              rate =
                token1IsXRP && !token2IsXRP
                  ? 1 / tokenExch2
                  : !token1IsXRP && token2IsXRP
                    ? tokenExch1
                    : tokenExch1 / tokenExch2;
            }
            if (!isFinite(rate) || isNaN(rate)) return '--';
            return rate.toFixed(6);
          })()}{' '}
          {curr2.name}
        </span>
      </div>

    </div>
  );
};

export default Swap;
