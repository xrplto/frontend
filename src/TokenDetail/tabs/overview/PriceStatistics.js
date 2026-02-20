import { apiFetch, getWalletAuthHeaders } from 'src/utils/api';
import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  AlertTriangle,
  Copy,
  Twitter,
  Send,
  MessageCircle,
  Globe,
  Github,
  TrendingUp,
  Link as LinkIcon,
  Layers,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Droplet,
  Flame,
  ArrowLeftRight,
  BarChart2,
  X,
  Link2,
  Settings,
  FileText,
  ChevronDown,
  Tag,
  Trash2
} from 'lucide-react';
import api from 'src/utils/api';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumber, fDate } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';
import { WalletContext, AppContext } from 'src/context/AppContext';
import VerificationBadge, { VerificationLabel } from 'src/components/VerificationBadge';

// Shared mobile hook to avoid duplicate listeners
const useIsMobile = (breakpoint = 600) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
};

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: '✕'
};

// Price formatter - returns object for compact notation or string
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

// Render price with compact notation support
const PriceDisplay = ({ price, symbol = '' }) => {
  const formatted = formatPrice(price);
  if (formatted?.compact) {
    return (
      <>
        {symbol}0.0<sub style={{ fontSize: '0.6em' }}>{formatted.zeros}</sub>
        {formatted.significant}
      </>
    );
  }
  return (
    <>
      {symbol}
      {formatted}
    </>
  );
};

// ----------------------------------------------------------------------

export default function PriceStatistics({ token, isDark = false, linkedCollections = [] }) {
  const router = useRouter();
  const metrics = useSelector(selectMetrics);
  const { accountProfile } = useContext(WalletContext);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const isMobile = useIsMobile();
  const [openScamWarning, setOpenScamWarning] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [showAllExchanges, setShowAllExchanges] = useState(false);

  const {
    name,
    amount,
    exch,
    vol24hxrp,
    marketcap,
    dom,
    issuer,
    creator,
    creatorTokenCount,
    tags,
    social,
    origin,
    trustlines,
    uniqueTraders24h,
    uniqueBuyers24h,
    uniqueSellers24h,
    vol24htx,
    buy24hxrp,
    sell24hxrp,
    buy24htx,
    sell24htx,
    buyTxns24h,
    sellTxns24h,
    txns24h,
    deposit24hxrp,
    deposit24htx,
    withdraw24hxrp,
    withdraw24htx,
    lpBurnedPercent,
    lpBurnedAmount,
    lpHolderCount,
    lpBurnedHolders,
    creatorHoldingPercent,
    date,
    dateon,
    creatorLastAction
  } = token;

  // Use creatorTokenCount and creatorExchange from token
  const creatorTokens = creatorTokenCount || 0;
  const creatorExchange = token.creatorExchange || null;

  // Format creator last action time
  const formatLastActionTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  };

  // Fetch creator activity when expanded
  const [hasWarning, setHasWarning] = useState(false);
  const [signals, setSignals] = useState([]);
  const [creatorStats, setCreatorStats] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [filterLoading, setFilterLoading] = useState(false);
  const [noTokenActivity, setNoTokenActivity] = useState(false);

  // AI Review state
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const aiAbortRef = useRef(null);

  // Token flow state
  const [tokenFlow, setTokenFlow] = useState(null);
  const [flowExpanded, setFlowExpanded] = useState(false);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const flowAbortRef = useRef(null);

  // Creator label state
  const [creatorLabel, setCreatorLabel] = useState(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [labelSaving, setLabelSaving] = useState(false);

  // Fetch creator label from logged-in user's labels
  useEffect(() => {
    if (!accountLogin || !creator) {
      setCreatorLabel(null);
      return;
    }
    api
      .get(`https://api.xrpl.to/api/user/${accountLogin}/labels`)
      .then((res) => {
        const labels = res.data?.labels || [];
        const found = labels.find((l) => l.wallet === creator);
        setCreatorLabel(found?.label || null);
      })
      .catch(() => setCreatorLabel(null));
  }, [accountLogin, creator]);

  const handleSaveCreatorLabel = async () => {
    if (!accountLogin || !labelInput.trim()) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      if (creatorLabel) {
        await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${creator}`, { headers: authHeaders });
      }
      const res = await api.post(`https://api.xrpl.to/api/user/${accountLogin}/labels`, {
        wallet: creator,
        label: labelInput.trim()
      }, { headers: authHeaders });
      setCreatorLabel(res.data?.label || labelInput.trim());
      setEditingLabel(false);
      setLabelInput('');
    } catch (e) {
      console.error('Failed to save label:', e);
    }
    setLabelSaving(false);
  };

  const handleDeleteCreatorLabel = async () => {
    if (!accountLogin || !creatorLabel) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${creator}`, { headers: authHeaders });
      setCreatorLabel(null);
      setEditingLabel(false);
      setLabelInput('');
    } catch (e) {
      console.error('Failed to delete label:', e);
    }
    setLabelSaving(false);
  };

  // Fetch AI review immediately
  useEffect(() => {
    if (!token.md5) return;

    if (aiAbortRef.current) aiAbortRef.current.abort();
    aiAbortRef.current = new AbortController();

    setAiLoading(true);
    const aiUrl = `https://api.xrpl.to/v1/token/review/${token.md5}`;
    apiFetch(aiUrl, { signal: aiAbortRef.current.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.score !== undefined) {
          setAiReview(data);
        }
        setAiLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.error('[PriceStats] AI review error:', e.message);
          setAiLoading(false);
        }
      });

    return () => aiAbortRef.current?.abort();
  }, [token.md5]);

  // Fetch token flow data
  useEffect(() => {
    if (!token.md5 || !creator) return;

    if (flowAbortRef.current) flowAbortRef.current.abort();
    flowAbortRef.current = new AbortController();

    const flowUrl = `https://api.xrpl.to/v1/token/flow/${token.md5}`;
    apiFetch(flowUrl, { signal: flowAbortRef.current.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.summary) {
          const edges = data.graph?.edges || [];
          const edgeMap = new Map(edges.map((e) => [e.to, e]));
          const recipients = (data.graph?.nodes || [])
            .filter((n) => n.type !== 'creator' && n.type !== 'issuer')
            .map((n) => {
              const edge = edgeMap.get(n.id);
              return {
                address: n.id,
                label: n.label,
                received: n.received,
                soldXrp: n.soldXrp || 0,
                boughtXrp: n.boughtXrp || 0,
                sells: n.sells || 0,
                buys: n.buys || 0,
                hash: edge?.hashes?.[0],
                relation: n.relation,
                from: n.from,
                type: n.type,
                action: n.action,
                transfersOut: n.transfersOut || 0,
                exchangeDeposits: n.exchangeDeposits || 0,
                exchangeCount: n.exchangeCount || 0,
                exchangeKeys: n.exchangeKeys || []
              };
            });
          setTokenFlow({ ...data.summary, recipients, linkedAddresses: data.linkedAddresses || [], exchangeBreakdown: data.exchangeBreakdown || [] });
        }
      })
      .catch(() => { });

    return () => flowAbortRef.current?.abort();
  }, [token.md5, creator]);

  // Ref for activity fetch abort controller
  const activityAbortRef = useRef(null);

  const fetchActivity = async (filter, signal) => {
    if (!creator) return;
    setFilterLoading(true);
    setNoTokenActivity(false);

    try {
      let url = `https://api.xrpl.to/v1/creator-activity/${creator}?limit=12`;
      if (filter === 'swaps') url += '&side=sell,buy';
      else if (filter === 'transfers') url += '&side=transfer_out,receive,other_send,other_receive,send';
      else if (filter === 'checks')
        url += '&side=check_incoming,check_create,check_receive,check_send,check_cancel';
      else if (filter === 'lp') url += '&side=deposit,withdraw,amm_create';

      // Parallel fetch for 'all' filter (creators + tx fallback)
      const fetches = [fetch(url, { signal }).then((r) => r.json())];
      if (filter === 'all') {
        fetches.push(
          apiFetch(`https://api.xrpl.to/v1/tx/${creator}?limit=12`, { signal }).then((r) => r.json())
        );
      }

      const [data, txData] = await Promise.all(fetches);
      if (signal?.aborted) return;

      if (data?.events?.length > 0) {
        setTransactions(data.events);
        setHasWarning(data.signals?.length > 0 || data.warning || false);
        setSignals(data.signals || []);
        setCreatorStats(data.stats || null);
      } else if (filter === 'all' && txData?.success && txData?.transactions) {
        // Use pre-fetched tx fallback
        setNoTokenActivity(true);
        const mapped = txData.transactions.map((t) => {
          const tx = t.tx_json || t.tx || {};
          const meta = t.meta || {};
          const amt = meta.delivered_amount || meta.DeliveredAmount || tx.Amount;
          const isXrp = typeof amt === 'string';
          const isOutgoing = tx.Account === creator;
          return {
            hash: tx.hash || t.hash,
            type: tx.TransactionType,
            side: tx.TransactionType === 'Payment' ? (isOutgoing ? 'send' : 'receive') : null,
            result: meta.TransactionResult || 'tesSUCCESS',
            time: tx.date ? (tx.date + 946684800) * 1000 : Date.now(),
            ledger: tx.ledger_index || tx.inLedger,
            tokenAmount: !isXrp && amt?.value ? parseFloat(amt.value) : 0,
            xrpAmount: isXrp ? parseInt(amt) / 1e6 : 0,
            currency:
              !isXrp && amt?.currency
                ? amt.currency.length > 3
                  ? Buffer.from(amt.currency, 'hex').toString().replace(/\0/g, '').trim()
                  : amt.currency
                : 'XRP',
            destination: tx.Destination
          };
        });
        setTransactions(mapped);
        const day = 24 * 60 * 60 * 1000;
        setHasWarning(mapped.some((t) => t.result !== 'tesSUCCESS' && Date.now() - t.time < day));
      } else {
        setTransactions([]);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setTransactions([]);
      }
    } finally {
      if (!signal?.aborted) {
        setFilterLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!activityOpen || !creator) return;

    // Abort previous fetch
    if (activityAbortRef.current) {
      activityAbortRef.current.abort();
    }
    activityAbortRef.current = new AbortController();

    setTransactions([]);
    fetchActivity(activityFilter, activityAbortRef.current.signal);

    return () => {
      if (activityAbortRef.current) {
        activityAbortRef.current.abort();
      }
    };
  }, [activityOpen, creator, activityFilter]);

  const voldivmarket = useMemo(
    () =>
      marketcap > 0 && vol24hxrp != null
        ? new Decimal(vol24hxrp || 0).div(marketcap || 1).toNumber()
        : 0,
    [marketcap, vol24hxrp]
  );

  // Memoized enhanced tags array
  const enhancedTags = useMemo(() => {
    const baseTags = tags || [];
    const originMap = {
      FirstLedger: 'FirstLedger',
      XPMarket: 'XPMarket',
      LedgerMeme: 'LedgerMeme',
      Horizon: 'Horizon',
      'aigent.run': 'aigent.run',
      'Magnetic X': 'Magnetic X',
      'xrp.fun': 'xrp.fun'
    };
    const originTag = originMap[origin] || null;
    if (originTag && !baseTags.includes(originTag)) {
      return [originTag, ...baseTags];
    }
    return baseTags;
  }, [tags, origin]);

  const hasScamTag = useMemo(
    () => enhancedTags.some((tag) => tag.toLowerCase() === 'scam'),
    [enhancedTags]
  );

  useEffect(() => {
    if (hasScamTag) {
      setOpenScamWarning(true);
    }
  }, [hasScamTag]);

  // Memoize copy handler
  const handleCopyIssuer = useCallback(() => {
    navigator.clipboard.writeText(issuer).then(() => {
      openSnackbar('Copied!', 'success');
    });
  }, [issuer, openSnackbar]);

  const handleCopyCreator = useCallback(() => {
    navigator.clipboard.writeText(creator).then(() => {
      openSnackbar('Copied!', 'success');
    });
  }, [creator, openSnackbar]);

  // Memoize toggle handler
  const toggleActivity = useCallback(() => setActivityOpen((prev) => !prev), []);

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border transition-[opacity,transform,background-color,border-color] duration-200 overflow-hidden w-full mb-[4px]',
          isDark
            ? 'border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm'
            : 'border-black/[0.06] bg-white/50 backdrop-blur-sm shadow-sm'
        )}
      >
        {/* Scam Warning Dialog */}
        {openScamWarning && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] flex items-center justify-center z-[1000] max-sm:h-dvh">
            <div className={cn('rounded-[14px] border p-0 max-w-[400px] w-[90%] mx-auto', isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10')} onClick={(e) => e.stopPropagation()}>
              <div className="text-center p-[24px]">
                <AlertTriangle
                  size={28}
                  color="#ef4444"
                  strokeWidth={1.5}
                  className="mb-[12px]"
                />
                <span
                  className="text-[#ef4444] font-bold mb-[10px] text-[16px] tracking-[-0.01em] uppercase"
                >
                  Scam Warning
                </span>
                <span
                  className={cn('mb-[20px] text-[13px] leading-[1.5]', isDark ? 'text-white/60' : 'text-black/60')}
                >
                  This token has been flagged as a potential scam. Please exercise extreme caution.
                </span>
                <button className="py-[10px] px-6 text-[13px] font-medium rounded-[10px] border border-red-500/20 cursor-pointer bg-red-500/[0.08] text-red-500 transition-[opacity,transform,background-color,border-color] duration-150 hover:bg-red-500/[0.12] hover:border-red-500/30" onClick={() => setOpenScamWarning(false)}>
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div
          className={cn(
            'px-[14px] py-[12px] border-b transition-[background-color,border-color]',
            isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.04]'
          )}
        >
          <div className="flex flex-row items-center gap-[8px]">
            <div
              className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-[0.1em]',
                isDark ? 'text-white/60' : 'text-black/60'
              )}
            >
              Token Statistics
            </span>
          </div>
        </div>

        {/* Safety Score */}
        {(aiReview || aiLoading) && (
          <div
            className={cn(
              'm-2 px-3 py-2.5 rounded-xl border transition-[opacity,transform,background-color,border-color] duration-300 relative overflow-hidden',
              isDark 
                ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                : 'bg-black/[0.015] border-black/[0.05] hover:bg-black/[0.025] shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
            )}
          >
            {aiLoading ? (
              <div className="flex flex-row items-center gap-[12px] py-[4px]">
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 bg-violet-500/10 blur-sm rounded-full" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-500/80">
                  AI Security Audit in progress...
                </span>
              </div>
            ) : (
              aiReview &&
              (() => {
                const score = aiReview.score;
                const color =
                  score <= 2
                    ? '#10b981'
                    : score <= 4
                      ? '#84cc16'
                      : score <= 6
                        ? '#f59e0b'
                        : '#ef4444';
                
                const label =
                  aiReview.riskLevel ||
                  (score <= 2 ? 'Low' : score <= 4 ? 'Moderate' : score <= 6 ? 'Elevated' : 'High');
                const Icon = score <= 2 ? ShieldCheck : score <= 6 ? ShieldAlert : AlertTriangle;

                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={15} color={color} strokeWidth={2.5} />
                        <span className="text-[11px] font-bold" style={{ color }}>{label} Risk</span>
                        <div className="flex items-center gap-2 ml-1">
                          {aiReview.riskCount > 0 && (
                            <span className="text-[10px] font-bold text-red-400">{aiReview.riskCount} risks</span>
                          )}
                          {aiReview.positiveCount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-500/80">{aiReview.positiveCount} passes</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[15px] font-black tracking-tighter leading-none" style={{ color }}>{score}<span className="text-[9px] font-bold opacity-30 ml-0.5">/10</span></span>
                    </div>

                    <div className="relative h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-[width] duration-1000 ease-out rounded-full"
                        style={{
                          width: `${score * 10}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                          boxShadow: `0 0 8px ${color}40`
                        }}
                      />
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        <table className="w-full" size="small">
          <tbody>
            {/* ========== MARKET METRICS GROUP ========== */}
            <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <span
                  className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                >
                  FDV Market Cap
                </span>
              </td>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <div className="flex flex-row items-center justify-end gap-[6px]">
                  <span
                    className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {currencySymbols[activeFiatCurrency]}
                    {fNumber(
                      amount *
                      (exch /
                        (metrics[activeFiatCurrency] ||
                          (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ||
                          1))
                    )}
                  </span>
                </div>
              </td>
            </tr>

            <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <span
                  className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                >
                  Volume Dominance
                </span>
              </td>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <span
                  className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {(dom || 0).toFixed(4)}%
                </span>
              </td>
            </tr>

            {amount > 0 && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Supply
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fNumber(amount)}
                  </span>
                </td>
              </tr>
            )}

            {(txns24h > 0 || vol24htx > 0) && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Trades (24h)
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fNumber(txns24h || vol24htx)}
                  </span>
                </td>
              </tr>
            )}

            {uniqueTraders24h > 0 && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Unique Traders (24h)
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fNumber(uniqueTraders24h)}
                  </span>
                </td>
              </tr>
            )}

            {/* ========== BUY/SELL METRICS GROUP ========== */}
            {(buy24hxrp > 0 || sell24hxrp > 0) && (
              <tr>
                <td colSpan={2} className="p-[16px_12px_8px]">
                  <span
                    className={cn('text-[10px] font-[800] uppercase tracking-[0.1em]', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    24h Trading
                  </span>
                </td>
              </tr>
            )}

            {/* Buy/Sell Ratio Visual Bar */}
            {(buy24hxrp > 0 || sell24hxrp > 0) &&
              (() => {
                const total = (buy24hxrp || 0) + (sell24hxrp || 0);
                const buyRaw = total > 0 ? ((buy24hxrp || 0) / total) * 100 : 0;
                const sellRaw = total > 0 ? ((sell24hxrp || 0) / total) * 100 : 0;
                const buyPct = buy24hxrp > 0 ? Math.max(buyRaw, 2) : 0;
                const sellPct = sell24hxrp > 0 ? Math.max(sellRaw, 2) : 0;
                const formatPct = (val) => (val > 0 && val < 1 ? '<1' : val.toFixed(0));
                return (
                  <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                    <td colSpan={2} className="border-b-0 align-middle p-[8px_12px_10px]">
                      <div className="flex flex-row items-center gap-[10px]">
                        <div className="flex flex-col min-w-[40px]">
                          <span className="text-[10px] font-black text-emerald-500 leading-none">{formatPct(buyRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Buy</span>
                        </div>
                        <div className="flex-1 relative">
                          <div className={cn('h-[6px] rounded-[4px] overflow-hidden flex', isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]')}>
                            <div className="transition-[width] duration-1000 ease-out" style={{ width: `${buyPct}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                            <div className="transition-[width] duration-1000 ease-out" style={{ width: `${sellPct}%`, background: 'linear-gradient(90deg, #f43f5e, #e11d48)' }} />
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-full bg-white/20 dark:bg-black/20" />
                        </div>
                        <div className="flex flex-col min-w-[40px] text-right">
                          <span className="text-[10px] font-black text-rose-500 leading-none">{formatPct(sellRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Sell</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })()}

            {/* Buys (24h) Row */}
            <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <span
                  className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                >
                  Buys (24h)
                </span>
              </td>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <div className="flex flex-col items-end gap-[4px]">
                  <span className="font-bold text-[#10b981] text-[13px] font-mono">
                    {fNumber(buy24hxrp || 0)} <span className="text-[10px] opacity-60">XRP</span>
                  </span>
                  <div className="flex items-center gap-[12px]">
                    <span className={cn('text-[11px] font-semibold', isDark ? 'text-white/60' : 'text-black/60')}>
                      {fNumber(uniqueBuyers24h || 0)} <span className="text-[9px] font-bold opacity-40 uppercase">users</span>
                    </span>
                    <span className={cn('text-[10px] font-medium', isDark ? 'text-white/55' : 'text-black/30')}>
                      {fNumber(buyTxns24h || buy24htx || 0)} <span className="text-[8px] opacity-60 uppercase">txns</span>
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            {/* Sells (24h) Row */}
            <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <span
                  className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                >
                  Sells (24h)
                </span>
              </td>
              <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                <div className="flex flex-col items-end gap-[4px]">
                  <span className="font-bold text-[#f43f5e] text-[13px] font-mono">
                    {fNumber(sell24hxrp || 0)} <span className="text-[10px] opacity-60">XRP</span>
                  </span>
                  <div className="flex items-center gap-[12px]">
                    <span className={cn('text-[11px] font-semibold', isDark ? 'text-white/60' : 'text-black/60')}>
                      {fNumber(uniqueSellers24h || 0)} <span className="text-[9px] font-bold opacity-40 uppercase">users</span>
                    </span>
                    <span className={cn('text-[10px] font-medium', isDark ? 'text-white/55' : 'text-black/30')}>
                      {fNumber(sellTxns24h || sell24htx || 0)} <span className="text-[8px] opacity-60 uppercase">txns</span>
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            {/* ========== AMM LIQUIDITY GROUP ========== */}
            {(deposit24hxrp > 0 || withdraw24hxrp > 0) && (
              <tr>
                <td colSpan={2} className="p-[16px_12px_8px]">
                  <span
                    className={cn('text-[10px] font-[800] uppercase tracking-[0.1em]', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    AMM Liquidity Flow
                  </span>
                </td>
              </tr>
            )}

            {/* AMM Flow Visual Bar */}
            {(deposit24hxrp > 0 || withdraw24hxrp > 0) &&
              (() => {
                const depositAbs = Math.abs(deposit24hxrp || 0);
                const withdrawAbs = Math.abs(withdraw24hxrp || 0);
                const total = depositAbs + withdrawAbs;
                const inRaw = total > 0 ? (depositAbs / total) * 100 : 0;
                const outRaw = total > 0 ? (withdrawAbs / total) * 100 : 0;
                const inPct = depositAbs > 0 ? Math.max(inRaw, 2) : 0;
                const outPct = withdrawAbs > 0 ? Math.max(outRaw, 2) : 0;
                const formatPct = (val) => (val > 0 && val < 1 ? '<1' : val.toFixed(0));
                return (
                  <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                    <td colSpan={2} className="border-b-0 align-middle p-[8px_12px_10px]">
                      <div className="flex flex-row items-center gap-[10px]">
                        <div className="flex flex-col min-w-[40px]">
                          <span className="text-[10px] font-black text-emerald-500 leading-none">{formatPct(inRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">In</span>
                        </div>
                        <div className={cn('flex-1 h-[6px] rounded-[4px] overflow-hidden flex', isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]')}>
                          <div className="transition-[width] duration-1000 ease-out" style={{ width: `${inPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                          <div className="transition-[width] duration-1000 ease-out" style={{ width: `${outPct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                        </div>
                        <div className="flex flex-col min-w-[40px] text-right">
                          <span className="text-[10px] font-black text-amber-500 leading-none">{formatPct(outRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Out</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })()}

            {/* AMM Deposits (24h) Row */}
            {deposit24hxrp ? (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    AMM Deposits
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-col items-end gap-[4px]">
                    <span className="font-bold text-[#10b981] text-[13px] font-mono">
                      {fNumber(deposit24hxrp)} <span className="text-[10px] opacity-60">XRP</span>
                    </span>
                    {deposit24htx ? (
                      <span className={cn('text-[10px] font-medium', isDark ? 'text-white/55' : 'text-black/30')}>
                        {fNumber(deposit24htx)} <span className="text-[8px] opacity-60 uppercase">txns</span>
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}

            {/* AMM Withdrawals (24h) Row */}
            {withdraw24hxrp ? (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    AMM Withdrawals
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-col items-end gap-[4px]">
                    <span className="font-bold text-[#f59e0b] text-[13px] font-mono">
                      {fNumber(Math.abs(withdraw24hxrp))} <span className="text-[10px] opacity-60">XRP</span>
                    </span>
                    {withdraw24htx ? (
                      <span className={cn('text-[10px] font-medium', isDark ? 'text-white/55' : 'text-black/30')}>
                        {fNumber(withdraw24htx)} <span className="text-[8px] opacity-60 uppercase">txns</span>
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}

            {/* LP Burned Row - Compact */}
            {(lpBurnedPercent != null || lpHolderCount > 0) && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    LP Status
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-col items-end gap-[6px]">
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="text-[13px] font-bold font-mono"
                        style={{
                          color:
                            (lpBurnedPercent || 0) >= 80
                              ? '#10b981'
                              : (lpBurnedPercent || 0) >= 20
                                ? '#f59e0b'
                                : '#f43f5e'
                        }}
                      >
                        {(lpBurnedPercent || 0).toFixed(2)}%
                      </span>
                      <span className={cn('text-[10px] font-bold uppercase', isDark ? 'text-white/55' : 'text-black/30')}>
                        Burned
                      </span>
                    </div>
                    <div className="w-full flex items-center gap-[10px]">
                      <div
                        className={cn('flex-1 h-[5px] rounded-full overflow-hidden', isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]')}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(lpBurnedPercent || 0, 100)}%`,
                            background:
                              (lpBurnedPercent || 0) >= 80
                                ? 'linear-gradient(90deg, #059669, #10b981)'
                                : (lpBurnedPercent || 0) >= 20
                                  ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                  : 'linear-gradient(90deg, #e11d48, #f43f5e)'
                          }}
                        />
                      </div>
                      <span className={cn('text-[10px] font-semibold whitespace-nowrap font-mono', isDark ? 'text-white/60' : 'text-black/60')}>
                        {lpBurnedHolders || 0} <span className={cn('text-[9px] font-normal', isDark ? 'text-white/55' : 'text-black/25')}>of {lpHolderCount || 0} holders</span>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Holding Row */}
            {creatorHoldingPercent != null && creator && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Creator Holding
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-col items-end gap-[6px]">
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="text-[13px] font-bold font-mono"
                        style={{
                          color:
                            creatorHoldingPercent <= 5
                              ? '#10b981'
                              : creatorHoldingPercent <= 20
                                ? '#f59e0b'
                                : '#f43f5e'
                        }}
                      >
                        {creatorHoldingPercent.toFixed(2)}%
                      </span>
                      <span className={cn('text-[10px] font-bold uppercase', isDark ? 'text-white/55' : 'text-black/30')}>
                        of supply
                      </span>
                      {exch > 0 && amount > 0 && (
                        <span className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-black/35')}>
                          ≈ ✕{fNumber((creatorHoldingPercent / 100) * amount * exch)}
                        </span>
                      )}
                    </div>
                    <div className="w-full flex items-center">
                      <div
                        className={cn('flex-1 h-[5px] rounded-full overflow-hidden', isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]')}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(creatorHoldingPercent, 100)}%`,
                            background:
                              creatorHoldingPercent <= 5
                                ? 'linear-gradient(90deg, #059669, #10b981)'
                                : creatorHoldingPercent <= 20
                                  ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                  : 'linear-gradient(90deg, #e11d48, #f43f5e)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* ========== TOKEN INFO GROUP ========== */}
            {(date || dateon || creator || issuer) && (
              <tr>
                <td colSpan={2} className="p-[16px_12px_8px]">
                  <span
                    className={cn('text-[10px] font-[800] uppercase tracking-[0.1em]', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Transparency & Origin
                  </span>
                </td>
              </tr>
            )}

            {/* Created Date Row */}
            {date || dateon ? (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Created
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-medium text-[13px]', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                  >
                    {fDate(date || dateon)}
                  </span>
                </td>
              </tr>
            ) : null}

            {/* Issuer Row */}
            {issuer && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Issuer
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-row items-center justify-end gap-[6px]">
                    <a
                      href={`/address/${issuer}`}
                      className="inline-flex items-center rounded-lg font-normal px-[10px] h-[28px] overflow-hidden transition-[opacity,transform,background-color,border-color] duration-200 no-underline"
                      style={{
                        padding: '2px 10px',
                        fontSize: '11px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        maxWidth: isMobile ? '110px' : '180px'
                      }}
                    >
                      <span
                        className={cn('font-medium text-[11px] overflow-hidden text-ellipsis whitespace-nowrap font-mono', isDark ? 'text-white/70' : 'text-black/[0.65]')}
                      >
                        {issuer.slice(0, 12)}...
                      </span>
                    </a>
                    <button
                      title="Copy issuer address"
                      onClick={handleCopyIssuer}
                      className={cn(
                        'flex items-center justify-center w-[26px] h-[26px] rounded-lg border transition-[opacity,transform,background-color,border-color] duration-150 cursor-pointer',
                        isDark
                          ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]'
                          : 'bg-black/[0.03] border-black/[0.05] hover:bg-black/[0.06]'
                      )}
                    >
                      <Copy size={13} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Row */}
            {creator && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Creator
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-row items-center justify-end gap-[6px]">
                    <div
                        title="Click to view activity"
                        onClick={toggleActivity}
                        className="inline-flex items-center rounded-lg font-normal cursor-pointer px-[10px] h-[28px] overflow-hidden transition-[opacity,transform,background-color,border-color] duration-200"
                        style={{
                          padding: '2px 10px',
                          fontSize: '11px',
                          background: activityOpen ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                          border: `1px solid ${activityOpen ? (isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          maxWidth: isMobile ? '110px' : '180px'
                        }}
                      >
                        {creatorLabel ? (
                          <span
                            className="font-bold text-[11px] overflow-hidden text-ellipsis whitespace-nowrap text-[#6366f1] tracking-[-0.01em]"
                          >
                            {creatorLabel}
                          </span>
                        ) : (
                          <span
                            className={cn('font-medium text-[11px] overflow-hidden text-ellipsis whitespace-nowrap font-mono', isDark ? 'text-white/70' : 'text-black/[0.65]')}
                          >
                            {creator.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    
                    <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.04] p-0.5 rounded-lg border border-black/[0.05] dark:border-white/[0.08]">
                      <button
                          title="Copy address"
                          onClick={handleCopyCreator}
                          className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[4px] w-[26px] h-[26px] rounded-[6px]"
                        >
                          <Copy
                            size={13}
                            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                          />
                        </button>
                      <button
                          title="Message creator"
                          onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: creator, tokenMd5: token.md5 } }))}
                          className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[4px] w-[26px] h-[26px] rounded-[6px]"
                        >
                          <MessageCircle
                            size={13}
                            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                          />
                        </button>
                      {accountLogin && !editingLabel && (
                          <button
                            title={creatorLabel ? 'Edit label' : 'Add label'}
                            onClick={() => {
                              setEditingLabel(true);
                              setLabelInput(creatorLabel || '');
                            }}
                            className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[4px] w-[26px] h-[26px] rounded-[6px]"
                            style={{ background: creatorLabel ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                          >
                            <Tag size={13} color={creatorLabel ? '#6366f1' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                          </button>
                      )}
                    </div>

                    {editingLabel && (
                      <div className="flex items-center gap-1.5 p-1 bg-violet-500/5 rounded-lg border border-violet-500/10">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          placeholder="Label..."
                          className="px-2 py-1 text-[11px] font-bold rounded-md bg-white/5 border border-white/5 outline-none w-20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCreatorLabel();
                            if (e.key === 'Escape') {
                              setEditingLabel(false);
                              setLabelInput('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveCreatorLabel}
                          disabled={labelSaving || !labelInput.trim()}
                          className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer rounded-lg p-[4px] bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <CheckCircle size={12} color="#10b981" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLabel(false);
                            setLabelInput('');
                          }}
                          className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer rounded-lg p-[4px] bg-black/5 dark:bg-white/5"
                        >
                          <X size={12} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Label Row */}
            {creator && creatorLabel && !editingLabel && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span
                    className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                  >
                    Your Label
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div
                    className="inline-flex items-center rounded-lg font-normal px-[10px] rounded-[8px] h-[26px] bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]"
                    style={{ padding: '2px 10px', fontSize: '11px' }}
                  >
                    <span
                      className="font-bold text-[11px] text-[#6366f1]"
                    >
                      {creatorLabel}
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Last Action */}
            {creator && creatorLastAction && (
              <>
                <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                  <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                    <span
                      className={cn('font-normal whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                      style={{ fontSize: isMobile ? '11px' : '13px' }}
                    >
                      {isMobile ? 'Last Act' : 'Creator Last Act'}
                    </span>
                  </td>
                  <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                      <a
                        href={`/tx/${creatorLastAction.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                        title={`${creatorLastAction.type} - ${creatorLastAction.result}\nClick to view tx`}
                      >
                        <div
                          className="flex flex-row items-center justify-end"
                          style={{ gap: isMobile ? '4px' : '8px' }}
                        >
                          <span
                            className="font-bold uppercase tracking-[0.02em]"
                            style={{
                              color:
                                creatorLastAction.side === 'buy'
                                  ? '#10b981'
                                  : creatorLastAction.side === 'sell'
                                    ? '#f43f5e'
                                    : creatorLastAction.side === 'transfer_out'
                                      ? '#f59e0b'
                                      : '#8b5cf6',
                              fontSize: isMobile ? '10px' : '11px'
                            }}
                          >
                            {(() => {
                              const side = creatorLastAction.side || creatorLastAction.type || '';
                              const labels = {
                                transfer_out: 'Sent',
                                receive: 'Recv',
                                deposit: 'LP+',
                                withdraw: 'LP-',
                                amm_create: 'LP*',
                                check_create: 'Check',
                                check_receive: 'Cash',
                                check_send: 'Check-',
                                check_cancel: 'Cancel'
                              };
                              return labels[side] || side.replace(/^other_/, '').replace(/_/g, ' ');
                            })()}
                          </span>
                          <span
                            className={cn('font-semibold font-mono', isDark ? 'text-white/80' : 'text-black/80')}
                            style={{
                              fontSize: isMobile ? '10px' : '12px'
                            }}
                          >
                            {creatorLastAction.amountType === 'token' && creatorLastAction.token > 0
                              ? `${fNumber(creatorLastAction.token)} ${name}`
                              : creatorLastAction.xrp > 0
                                ? `${fNumber(creatorLastAction.xrp)} XRP`
                                : null}
                          </span>
                          <div className="text-[10px] font-bold opacity-30 tracking-tighter uppercase ml-1" suppressHydrationWarning>
                            {formatLastActionTime(creatorLastAction.time)}
                          </div>
                        </div>
                      </a>
                  </td>
                </tr>
                {/* Creator Sell Warning */}
                {creatorLastAction.side === 'sell' && (
                  <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                    <td colSpan={2} className="border-b-0 align-middle" style={{ padding: isMobile ? '2px 8px 6px' : '4px 12px 8px' }}>
                      <div
                        className="flex flex-row items-center bg-red-500/[0.08] rounded-[8px] border border-red-500/[0.15]"
                        style={{
                          gap: isMobile ? '5px' : '8px',
                          padding: isMobile ? '5px 8px' : '8px 12px'
                        }}
                      >
                        <AlertTriangle size={isMobile ? 12 : 14} color="#ef4444" strokeWidth={1.5} />
                        <span className="text-[#ef4444] font-medium" style={{ fontSize: isMobile ? '9px' : '11px' }} suppressHydrationWarning>
                          {isMobile ? 'Sold' : 'Creator sold'}{' '}
                          {creatorLastAction.xrp != null && creatorLastAction.xrp > 0
                            ? `${fNumber(creatorLastAction.xrp)} XRP`
                            : creatorLastAction.amountType === 'token' && creatorLastAction.token > 0
                              ? `${fNumber(creatorLastAction.token)} ${name}`
                              : 'tokens'}{' '}
                          {formatLastActionTime(creatorLastAction.time)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}

            {/* Creator Token Count - Compact Row */}
            {creator && creatorTokens > 0 && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div>
                    <span
                      className={cn('font-normal text-[13px] whitespace-nowrap', isDark ? 'text-white/60' : 'text-black/60')}
                    >
                      {creatorTokens >= 10
                        ? 'Serial launcher'
                        : creatorTokens >= 5
                          ? 'Multiple tokens'
                          : creatorTokens >= 2
                            ? 'Other tokens'
                            : 'First token'}
                    </span>
                  </div>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex flex-row items-center justify-end gap-[6px]">
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        color:
                          creatorTokens >= 10
                            ? '#ef4444'
                            : creatorTokens >= 5
                              ? '#f59e0b'
                              : creatorTokens >= 2
                                ? '#3b82f6'
                                : '#10b981'
                      }}
                    >
                      {creatorTokens}
                    </span>
                    {creatorTokens >= 2 && (
                      <div
                        className="inline-flex items-center rounded-lg font-normal h-[18px] rounded-[4px] text-[8px] font-semibold px-[5px] uppercase"
                        style={{
                          padding: '2px 5px', fontSize: '8px',
                          background:
                            creatorTokens >= 10
                              ? 'rgba(239,68,68,0.1)'
                              : creatorTokens >= 5
                                ? 'rgba(245,158,11,0.08)'
                                : 'rgba(59,130,246,0.06)',
                          border: `1px solid ${creatorTokens >= 10 ? 'rgba(239,68,68,0.2)' : creatorTokens >= 5 ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.12)'}`,
                          color:
                            creatorTokens >= 10
                              ? '#ef4444'
                              : creatorTokens >= 5
                                ? '#f59e0b'
                                : '#3b82f6'
                        }}
                      >
                        {creatorTokens >= 10
                          ? 'HIGH RISK'
                          : creatorTokens >= 5
                            ? 'CAUTION'
                            : `${creatorTokens} MORE`}
                      </div>
                    )}
                    {creatorExchange && (
                      <div
                        className="inline-flex items-center rounded-lg font-normal h-[18px] rounded-[4px] bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)] text-[#10b981] text-[8px] font-semibold px-[5px]"
                        style={{ padding: '2px 5px', fontSize: '8px' }}
                      >
                        {creatorExchange}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Activity - Inline */}
            {creator && activityOpen && (
              <tr className={cn('transition-[background] duration-150', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}>
                <td colSpan={2} className="border-b-0 align-middle" style={{ padding: '4px 10px 8px' }}>
                  <div
                    className={cn(
                      'rounded-[8px] p-[6px] sm:p-[10px]',
                      isDark
                        ? 'bg-white/[0.02] border border-white/[0.06]'
                        : 'bg-black/[0.02] border border-black/[0.05]'
                    )}
                  >
                    {/* Filter Tabs */}
                    <div className="flex flex-row gap-[3px] sm:gap-[4px] mb-[6px] sm:mb-[8px]">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'swaps', label: 'Swaps', color: '#3b82f6' },
                        { key: 'transfers', label: 'Transfers', color: '#9C27B0' },
                        { key: 'checks', label: 'Checks', color: '#f59e0b' },
                        { key: 'lp', label: 'LP', color: '#22c55e' }
                      ].map((f) => (
                        <span
                          key={f.key}
                          onClick={() => setActivityFilter(f.key)}
                          className="flex-1 sm:flex-none text-center sm:text-left px-[2px] sm:px-[12px] py-[4px] sm:py-[5px] text-[9px] sm:text-[11px] rounded-[6px] cursor-pointer transition-[opacity,transform,background-color,border-color] duration-150 ease-out"
                          style={{
                            fontWeight: activityFilter === f.key ? 500 : 400,
                            background:
                              activityFilter === f.key
                                ? f.color
                                  ? `${f.color}15`
                                  : isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.06)'
                                : 'transparent',
                            color:
                              activityFilter === f.key
                                ? f.color || (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)')
                                : isDark
                                  ? 'rgba(255,255,255,0.45)'
                                  : 'rgba(0,0,0,0.45)',
                            border: `1px solid ${activityFilter === f.key ? (f.color ? `${f.color}25` : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent'}`
                          }}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>

                    {/* Stats Summary */}
                    {creatorStats && (
                      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-[4px] sm:gap-[10px] mb-[6px] sm:mb-[8px]">
                        {creatorStats.buy?.count > 0 && (
                          <span
                            className="text-[10px] text-[#22c55e]"
                          >
                            {creatorStats.buy.count} buys · {fNumber(creatorStats.buy.xrp)} XRP
                          </span>
                        )}
                        {creatorStats.sell?.count > 0 && (
                          <span
                            className="text-[10px] text-[#ef4444]"
                          >
                            {creatorStats.sell.count} sells · {fNumber(creatorStats.sell.xrp)} XRP
                          </span>
                        )}
                        {creatorStats.transfer_out?.count > 0 && (
                          <span
                            className="text-[10px] text-[#9C27B0]"
                          >
                            {creatorStats.transfer_out.count} transfers
                          </span>
                        )}
                        {creatorStats.sellBuyRatio !== undefined && creatorStats.sellBuyRatio > 0 && (
                          <span
                            className={cn('text-[10px]', isDark ? 'text-white/60' : 'text-black/60')}
                          >
                            Sell ratio: {(creatorStats.sellBuyRatio * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Warning Banner */}
                    {hasWarning && signals.length > 0 && (
                      <div className="flex flex-row items-center gap-[6px] mb-[8px] px-[10px] py-[6px] bg-red-500/[0.08] rounded-[6px] border border-red-500/[0.15]">
                        <AlertTriangle size={14} color="#ef4444" strokeWidth={1.5} />
                        <div className="flex flex-col flex-1">
                          <span
                            className="text-[#ef4444] text-[11px] font-medium"
                          >
                            {signals.map((s) => s.msg).join(' · ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* No token activity notice */}
                    {noTokenActivity && transactions.length > 0 && (
                      <div
                        style={{ gap: '6px' }}
                        className={cn('flex flex-row items-center mb-[6px] px-[8px] py-[5px] rounded-[6px] border border-blue-500/[0.12]', isDark ? 'bg-blue-500/[0.08]' : 'bg-blue-500/[0.04]')}
                      >
                        <span className="text-[#3b82f6] text-[10px]">
                          No token trades found — showing general account activity
                        </span>
                      </div>
                    )}

                    {/* Loading / Empty / List */}
                    {loadingTx || filterLoading ? (
                      <span
                        className={cn('text-[11px] py-[8px]', isDark ? 'text-white/60' : 'text-black/40')}
                      >
                        Loading...
                      </span>
                    ) : transactions.length === 0 ? (
                      <span
                        className={cn('text-[11px] py-[8px]', isDark ? 'text-white/60' : 'text-black/40')}
                      >
                        No activity found
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        {transactions.map((event, i) => {
                          const {
                            side,
                            tokenAmount,
                            xrpAmount,
                            result,
                            time,
                            hash,
                            ledger,
                            type,
                            currency,
                            destination,
                            name
                          } = event;
                          const tokenName = name || currency;
                          const isFailed = result && result !== 'tesSUCCESS';

                          const sideConfig = {
                            sell: { label: 'SELL', mLabel: 'SELL', color: '#ef4444', Icon: ArrowUpRight },
                            buy: { label: 'BUY', mLabel: 'BUY', color: '#22c55e', Icon: ArrowDownLeft },
                            deposit: { label: 'DEPOSIT', mLabel: 'DEP', color: '#22c55e', Icon: Droplet },
                            withdraw: { label: 'WITHDRAW', mLabel: 'WDR', color: '#f59e0b', Icon: Flame },
                            receive: { label: 'RECEIVE', mLabel: 'RECV', color: '#22c55e', Icon: ArrowDownLeft },
                            send: { label: 'SEND', mLabel: 'SEND', color: '#f59e0b', Icon: ArrowUpRight },
                            other_send: { label: 'SEND', mLabel: 'SEND', color: '#f59e0b', Icon: ArrowUpRight },
                            other_receive: { label: 'RECEIVE', mLabel: 'RECV', color: '#22c55e', Icon: ArrowDownLeft },
                            transfer_out: { label: 'TRANSFER', mLabel: 'XFER', color: '#9C27B0', Icon: ArrowLeftRight },
                            clawback: { label: 'CLAWBACK', mLabel: 'CLAW', color: '#ef4444', Icon: AlertTriangle },
                            amm_create: { label: 'AMM CREATE', mLabel: 'AMM+', color: '#22c55e', Icon: Droplet },
                            check_create: { label: 'CHECK', mLabel: 'CHK', color: '#3b82f6', Icon: FileText },
                            check_incoming: { label: 'CHECK IN', mLabel: 'CHK IN', color: '#22c55e', Icon: ArrowDownLeft },
                            check_receive: { label: 'CASHED', mLabel: 'CASH', color: '#22c55e', Icon: ArrowDownLeft },
                            check_send: { label: 'CHECK OUT', mLabel: 'CHK OUT', color: '#ef4444', Icon: ArrowUpRight },
                            check_cancel: { label: 'CANCELLED', mLabel: 'CNCL', color: '#6b7280', Icon: X }
                          };
                          const typeConfig = {
                            Payment: { label: 'TRANSFER', mLabel: 'XFER', color: '#9C27B0', Icon: ArrowLeftRight },
                            AMMDeposit: { label: 'AMM ADD', mLabel: 'AMM+', color: '#22c55e', Icon: Droplet },
                            AMMWithdraw: { label: 'AMM EXIT', mLabel: 'AMM-', color: '#f59e0b', Icon: Flame },
                            OfferCreate: { label: 'OFFER', mLabel: 'OFFR', color: '#3b82f6', Icon: BarChart2 },
                            OfferCancel: { label: 'CANCEL', mLabel: 'CNCL', color: '#9C27B0', Icon: X },
                            TrustSet: { label: 'TRUST', mLabel: 'TRST', color: '#3b82f6', Icon: Link2 },
                            AccountSet: { label: 'SETTINGS', mLabel: 'SET', color: '#6b7280', Icon: Settings },
                            Clawback: { label: 'CLAWBACK', mLabel: 'CLAW', color: '#ef4444', Icon: AlertTriangle }
                          };
                          const cfg = sideConfig[side] ||
                            sideConfig[side?.toLowerCase()] ||
                            typeConfig[type] || {
                            label: type?.slice(0, 8) || 'TX',
                            mLabel: type?.slice(0, 4) || 'TX',
                            color: '#9C27B0',
                            Icon: null
                          };
                          const displayColor = isFailed ? '#ef4444' : cfg.color;

                          const diffMs = time ? Date.now() - time : 0;
                          const mins = Math.floor(diffMs / 60000);
                          const hours = Math.floor(diffMs / 3600000);
                          const days = Math.floor(diffMs / 86400000);
                          const timeAgo =
                            days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : mins > 0 ? `${mins}m` : 'now';

                          const hasToken = tokenAmount > 0;
                          const hasXrp = xrpAmount > 0.001;
                          const displayCurrency = tokenName || currency || '';

                          return (
                            <a
                              key={hash || i}
                              href={`/tx/${hash}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="no-underline"
                            >
                              <div
                                className="flex flex-row items-center py-[3px] sm:py-[5px] cursor-pointer gap-[4px] sm:gap-[8px]"
                                style={{
                                  borderBottom:
                                    i < transactions.length - 1
                                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                                      : 'none',
                                  opacity: isFailed ? 0.5 : 1
                                }}
                              >
                                {cfg.Icon && (
                                  <cfg.Icon size={isMobile ? 11 : 13} className="shrink-0" style={{ color: displayColor }} />
                                )}
                                <span
                                  className="text-[9px] sm:text-[10px] font-semibold w-[38px] sm:w-[65px] shrink-0"
                                  style={{ color: displayColor }}
                                >
                                  {isMobile ? cfg.mLabel : cfg.label}
                                  {isFailed && ' ✕'}
                                </span>
                                <span
                                  className="flex-1 text-[10px] sm:text-[11px] font-medium overflow-hidden text-ellipsis whitespace-nowrap font-mono min-w-0"
                                  style={{
                                    color: hasToken
                                      ? isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'
                                      : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                                  }}
                                >
                                  {hasToken ? (
                                    <>
                                      {fNumber(tokenAmount)} {displayCurrency}
                                      {(side === 'check_receive' || side === 'check_incoming') &&
                                        amount > 0 &&
                                        tokenAmount > 0 && (
                                          <span
                                            className="ml-[4px] sm:ml-[6px] px-[4px] sm:px-[5px] py-[1px] rounded-[4px] text-[8px] sm:text-[9px] font-semibold"
                                            style={{
                                              background:
                                                (tokenAmount / amount) * 100 >= 6
                                                  ? 'rgba(239,68,68,0.15)'
                                                  : 'rgba(245,158,11,0.12)',
                                              color:
                                                (tokenAmount / amount) * 100 >= 6 ? '#ef4444' : '#f59e0b'
                                            }}
                                          >
                                            {((tokenAmount / amount) * 100).toFixed(
                                              (tokenAmount / amount) * 100 < 0.01 ? 4 : 2
                                            )}
                                            %
                                          </span>
                                        )}
                                    </>
                                  ) : (
                                    '—'
                                  )}
                                </span>
                                <span
                                  className="text-right text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap font-mono"
                                  style={{
                                    color: hasXrp
                                      ? '#22c55e'
                                      : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                                    fontWeight: hasXrp ? 500 : 400
                                  }}
                                >
                                  {hasXrp ? `${fNumber(xrpAmount)} XRP` : '—'}
                                </span>
                                <span
                                  className={cn('hidden sm:inline w-[70px] text-right text-[9px] shrink-0 font-mono', isDark ? 'text-white/55' : 'text-black/30')}
                                  suppressHydrationWarning
                                >
                                  {hash?.slice(0, 6)} · {timeAgo}
                                </span>
                                <span
                                  className={cn('sm:hidden text-right text-[8px] shrink-0 font-mono', isDark ? 'text-white/55' : 'text-black/30')}
                                  suppressHydrationWarning
                                >
                                  {timeAgo}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Creator Token Flow - Compact Row */}
            {creator && tokenFlow && (tokenFlow.totalTransferred || tokenFlow.totalSoldXrp > 0) && (
              <tr
                onClick={() => setFlowModalOpen(true)}
                className={cn('transition-[background] duration-150 cursor-pointer border-l-[3px] border-l-[#8b5cf6]', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]')}
                style={{
                  background: isDark ? 'linear-gradient(90deg, rgba(139,92,246,0.06), transparent)' : 'linear-gradient(90deg, rgba(139,92,246,0.04), transparent)'
                }}
              >
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <span className="font-bold text-[13px] text-violet-500 tracking-tight">
                    Flow Analysis
                  </span>
                </td>
                <td className="border-b-0 align-middle first-of-type:w-[45%] last-of-type:w-[55%] last-of-type:text-right p-[6px_10px]">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-bold border border-violet-500/20">
                        {tokenFlow.recipientCount || 0} Wallets
                      </span>
                      {tokenFlow.netFlowXrp != null && tokenFlow.netFlowXrp !== 0 && (
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                          tokenFlow.netFlowXrp > 0 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                          {tokenFlow.netFlowXrp > 0 ? '+' : '-'}{fNumber(Math.abs(tokenFlow.netFlowXrp))} <span className="text-[8px] opacity-70 uppercase">XRP</span>
                        </span>
                      )}
                    </div>
                    <ChevronDown size={14} className="opacity-30 -rotate-90" />
                  </div>
                </td>
              </tr>
            )}

            {/* Token Flow Modal */}
            {flowModalOpen && tokenFlow && createPortal(
              <div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] flex items-center justify-center z-[1000] max-sm:h-dvh" onClick={() => setFlowModalOpen(false)}>
                <div className={cn('rounded-[14px] border p-0 mx-auto max-w-[720px] w-[95%] max-h-[85dvh] flex flex-col rounded-[16px] overflow-hidden', isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10')} onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className={cn(
                    'px-[20px] py-[14px] flex items-center justify-between shrink-0',
                    isDark ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.06]'
                  )}>
                    <div className="flex flex-row items-center gap-[10px]">
                      <ArrowLeftRight size={18} color="#8b5cf6" strokeWidth={2} />
                      <span className={cn('text-[15px] font-semibold tracking-[-0.01em]', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                        Token Flow
                      </span>
                    </div>
                    <button onClick={() => setFlowModalOpen(false)} className={cn('inline-flex items-center justify-center border-none bg-transparent cursor-pointer p-[6px] rounded-[8px] border', isDark ? 'border-white/[0.08]' : 'border-black/[0.06]')}>
                      <X size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.3) transparent' }}>

                  {/* Summary Stats Grid */}
                  <div
                    className="gap-[10px] p-[16px] grid"
                    style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}
                  >
                    {[
                      { label: 'Distribution', value: `${tokenFlow.recipientCount || 0} Wallets`, sub: 'Total Recipients', color: '#8b5cf6', icon: <Layers size={14}/> },
                      { label: 'CEX Outflow', value: `${fNumber(tokenFlow.totalToExchanges || 0)} XRP`, sub: 'Sent to Exchanges', color: '#f59e0b', icon: <ArrowUpRight size={14}/> },
                      { label: 'Net Flow', value: `${fNumber(Math.abs(tokenFlow.netFlowXrp || 0))} XRP`, sub: tokenFlow.netFlowXrp > 0 ? 'Total Profit' : 'Total Loss', color: tokenFlow.netFlowXrp > 0 ? '#22c55e' : '#ef4444', icon: <BarChart2 size={14}/> },
                      { label: 'Current Hold', value: `${tokenFlow.holdingCount || 0} Wallets`, sub: 'Still holding tokens', color: '#3b82f6', icon: <Droplet size={14}/> }
                    ].map((s, i) => (
                      <div key={i} className={cn(
                        'p-[12px] rounded-[12px] flex flex-col gap-[2px]',
                        isDark
                          ? 'bg-white/[0.03] border border-white/[0.06]'
                          : 'bg-black/[0.02] border border-black/[0.04]'
                      )}>
                        <div className="flex items-center gap-[6px] mb-[4px]">
                          <span className="flex" style={{ color: s.color }}>{s.icon}</span>
                          <span className={cn('text-[9px] font-semibold uppercase tracking-[0.05em]', isDark ? 'text-white/60' : 'text-black/40')}>{s.label}</span>
                        </div>
                        <span className={cn('text-[15px] font-bold font-mono', isDark ? 'text-white' : 'text-[#1a1a1a]')}>{s.value}</span>
                        <span className={cn('text-[9px]', isDark ? 'text-white/55' : 'text-black/[0.35]')}>{s.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Exchange Deposits */}
                  {tokenFlow.exchangeBreakdown?.length > 0 && (() => {
                    const grouped = new Map();
                    tokenFlow.exchangeBreakdown.forEach(ex => {
                      const addr = ex.exchange || 'unknown';
                      const prev = grouped.get(addr) || { address: addr, name: ex.exchangeName, xrp: 0, depositors: new Set() };
                      prev.xrp += ex.xrp || 0;
                      (ex.addresses || []).forEach(a => prev.depositors.add(a));
                      if (!prev.name && ex.exchangeName) prev.name = ex.exchangeName;
                      grouped.set(addr, prev);
                    });
                    const exchanges = [...grouped.values()].sort((a, b) => b.xrp - a.xrp);
                    const displayedExchanges = showAllExchanges ? exchanges : exchanges.slice(0, 5);
                    
                    return (
                      <div className="mx-[16px] mb-[16px]">
                        <div className="flex items-center justify-between mb-[8px]">
                          <div className="flex items-center gap-[6px]">
                            <ArrowUpRight size={14} color="#f59e0b" strokeWidth={2} />
                            <span className={cn('text-[11px] font-semibold uppercase tracking-[0.02em]', isDark ? 'text-white/60' : 'text-black/60')}>CEX Deposits Breakdown</span>
                          </div>
                          {exchanges.length > 5 && (
                            <button
                              onClick={() => setShowAllExchanges(!showAllExchanges)}
                              className="bg-transparent border-none text-[#3b82f6] text-[10px] font-semibold cursor-pointer px-[4px] py-[2px]"
                            >
                              {showAllExchanges ? 'Show Less' : `+${exchanges.length - 5} More`}
                            </button>
                          )}
                        </div>
                        <div className={cn('rounded-[12px] overflow-hidden', isDark ? 'border border-white/[0.06] bg-white/[0.01]' : 'border border-black/[0.04] bg-black/[0.01]')}>
                          {displayedExchanges.map((ex, i) => {
                            const pct = tokenFlow.totalToExchanges > 0 ? (ex.xrp / tokenFlow.totalToExchanges) * 100 : 0;
                            return (
                              <div key={ex.address} className="flex items-center gap-[10px] px-[12px] py-[8px]" style={{
                                borderTop: i > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` : 'none'
                              }}>
                                <a href={`/address/${ex.address}`} target="_blank"
                                  className={cn('text-[11px] no-underline overflow-hidden text-ellipsis whitespace-nowrap w-[100px] font-mono', isDark ? 'text-white/80' : 'text-black/70')}
                                >
                                  {ex.name || ex.address.slice(0, 10)}
                                </a>
                                <div className={cn('flex-1 h-[6px] rounded-[3px] overflow-hidden', isDark ? 'bg-white/[0.05]' : 'bg-black/[0.04]')}>
                                  <div className="h-full bg-[#f59e0b] rounded-[3px]" style={{ width: `${Math.max(pct, 2)}%` }} />
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <span className="text-[11px] font-bold text-[#f59e0b] font-mono">
                                    {fNumber(ex.xrp)} XRP
                                  </span>
                                  <div className={cn('text-[9px]', isDark ? 'text-white/55' : 'text-black/[0.35]')}>
                                    {ex.depositors.size} wallets
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Linked Wallets */}
                  {tokenFlow.linkedAddresses?.length > 0 && (() => {
                    const linkedColors = ['#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#eab308', '#06b6d4'];
                    return (
                      <div className="mx-[16px] mb-[20px]">
                        <div className="flex items-center gap-[6px] mb-[8px]">
                          <Link2 size={14} color="#ef4444" strokeWidth={2} />
                          <span className={cn('text-[11px] font-semibold uppercase tracking-[0.02em]', isDark ? 'text-white/60' : 'text-black/60')}>Linked Wallets (Same CEX Tag)</span>
                        </div>
                        <div className="flex flex-col gap-[8px]">
                          {tokenFlow.linkedAddresses.map((group, i) => {
                            const color = linkedColors[i % linkedColors.length];
                            const keyParts = (group.exchangeKey || '').split(':');
                            const exAddr = keyParts[0] || '';
                            const exTag = keyParts[1] || '';
                            return (
                              <div key={i} className="p-[12px] rounded-[12px] flex items-center gap-[12px]" style={{
                                border: `1px solid ${color}25`,
                                background: `${color}08`
                              }}>
                                <div className="w-[4px] h-[32px] rounded-[2px] shrink-0" style={{ background: color }} />
                                <div className="flex-1">
                                  <div className="flex flex-wrap gap-[4px] mb-[6px]">
                                    {(group.addresses || []).map(addr => (
                                      <a key={addr} href={`/address/${addr}`} target="_blank"
                                        className={cn('text-[10px] no-underline px-[8px] py-[2px] rounded-[4px] font-mono', isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]')}
                                        style={{ color, border: `1px solid ${color}20` }}
                                      >
                                        {addr.slice(0, 10)}
                                      </a>
                                    ))}
                                  </div>
                                  <div className={cn('text-[9px] font-medium font-mono', isDark ? 'text-white/60' : 'text-black/[0.45]')}>
                                    Tag: {exTag} · CEX: {exAddr.slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recipient Table */}
                    {tokenFlow.recipients?.length > 0 && (
                      <>
                        {/* Enhanced Table Header */}
                        <div
                          className={cn('grid px-[16px] py-[10px] sticky top-0 z-[1]', isDark ? 'bg-white/[0.03] border-y border-white/[0.08]' : 'bg-black/[0.02] border-y border-black/[0.06]')}
                          style={{ gridTemplateColumns: isMobile ? 'minmax(0,1fr) 60px 80px' : 'minmax(0,1fr) 70px 100px 100px 100px 100px' }}
                        >
                          <span className={cn('text-[9px] font-bold uppercase tracking-[0.05em]', isDark ? 'text-white/60' : 'text-black/40')}>Recipient Wallet</span>
                          <span className={cn('text-[9px] font-bold uppercase tracking-[0.05em] text-center', isDark ? 'text-white/60' : 'text-black/40')}>Source</span>
                          {!isMobile && (
                            <>
                              <span className="text-[9px] font-bold text-[#8b5cf6] uppercase tracking-[0.05em] text-right">Allocated</span>
                              <span className="text-[9px] font-bold text-[#22c55e] uppercase tracking-[0.05em] text-right">Bought</span>
                              <span className="text-[9px] font-bold text-[#ef4444] uppercase tracking-[0.05em] text-right">Sold</span>
                            </>
                          )}
                          <span className={cn('text-[9px] font-bold uppercase tracking-[0.05em] text-right', isDark ? 'text-white/60' : 'text-black/40')}>Realized PnL</span>
                        </div>
                        {/* Enhanced Table Rows */}
                        {(() => {
                          const linkedColors = ['#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#eab308', '#06b6d4'];
                          const addressColorMap = {};
                          (tokenFlow.linkedAddresses || []).forEach((group, i) => {
                            const color = linkedColors[i % linkedColors.length];
                            (group.addresses || []).forEach(addr => { addressColorMap[addr] = color; });
                          });
                          return tokenFlow.recipients.map((r, idx, arr) => {
                            const netPnl = (r.soldXrp || 0) - (r.boughtXrp || 0);
                            const isIndirect = r.relation === 'indirect' || r.type === 'level2';
                            const actionLabels = { sold: 'Sold', holding: 'Holding', transferred: 'Moved' };
                            const actionColors = { sold: '#ef4444', holding: '#22c55e', transferred: '#f59e0b' };
                            const actionColor = actionColors[r.action] || '#8b5cf6';
                            const fromAddr = r.from || '';
                            const isDirect = r.relation === 'direct' || fromAddr === creator;
                            const linkedColor = addressColorMap[r.address];
                            return (
                              <div
                                key={r.address}
                                className="grid items-center transition-[background] duration-100 ease-out"
                                style={{
                                  gridTemplateColumns: isMobile ? 'minmax(0,1fr) 60px 80px' : 'minmax(0,1fr) 70px 100px 100px 100px 100px',
                                  padding: isMobile ? '8px 16px' : '6px 16px',
                                  borderBottom: idx < arr.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` : 'none',
                                  background: isIndirect
                                    ? (isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.02)')
                                    : 'transparent'
                                }}
                              >
                                {/* Wallet cell */}
                                <div className="flex items-center gap-[8px] min-w-0">
                                  <div className="relative shrink-0">
                                    <div
                                      className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center"
                                      style={{
                                        background: linkedColor ? `${linkedColor}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                        border: `1px solid ${linkedColor ? `${linkedColor}30` : 'transparent'}`
                                      }}
                                    >
                                      <span className="text-[10px] font-bold" style={{ color: linkedColor || (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') }}>{idx + 1}</span>
                                    </div>
                                    {linkedColor && <div className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] rounded-full" style={{ background: linkedColor, border: `2px solid ${isDark ? '#0a0a0a' : '#fff'}` }} />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-[5px] mb-[2px]">
                                      <a
                                        href={`/address/${r.address}`}
                                        target="_blank"
                                        className={cn('text-[11px] font-semibold no-underline font-mono', isDark ? 'text-white/90' : 'text-black/[0.85]')}
                                      >
                                        {isMobile ? r.address.slice(0, 8) : r.address.slice(0, 12)}
                                      </a>
                                      {r.address === creator && (
                                        <span className="text-[8px] px-[4px] py-[1px] rounded-[4px] bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] font-bold uppercase">DEV</span>
                                      )}
                                      {r.exchangeDeposits > 0 && (
                                        <ArrowUpRight size={10} color="#f59e0b" strokeWidth={3} />
                                      )}
                                    </div>
                                    <div className="flex gap-[6px]">
                                      {r.action && (
                                        <span className="text-[8px] font-bold uppercase tracking-[0.02em]" style={{ color: actionColor }}>
                                          {actionLabels[r.action] || r.action}
                                        </span>
                                      )}
                                      {isMobile && (
                                        <span className={cn('text-[8px] font-mono', isDark ? 'text-white/55' : 'text-black/40')}>
                                          Rec: {fNumber(r.received)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Source */}
                                <div className="flex flex-col items-center">
                                  {isDirect ? (
                                    <div className="flex items-center gap-[3px]">
                                      <div className="w-[4px] h-[4px] rounded-full bg-[#8b5cf6]" />
                                      <span className="text-[9px] font-bold text-[#8b5cf6] uppercase">Direct</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-[3px]">
                                      <ArrowLeftRight size={10} color="#f59e0b" />
                                      <span className="text-[9px] font-semibold text-[#f59e0b] font-mono">{fromAddr.slice(0, 4)}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Allocated (desktop) */}
                                {!isMobile && (
                                  <span className="text-[11px] text-[#8b5cf6] font-semibold text-right font-mono">
                                    {r.received > 0 ? fNumber(r.received) : '—'}
                                  </span>
                                )}
                                {/* Bought (desktop) */}
                                {!isMobile && (
                                  <span className="text-[11px] text-right font-mono" style={{ color: r.boughtXrp > 0 ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}>
                                    {r.boughtXrp > 0 ? fNumber(r.boughtXrp) : '—'}
                                  </span>
                                )}
                                {/* Sold (desktop) */}
                                {!isMobile && (
                                  <span className="text-[11px] text-right font-mono" style={{ color: r.soldXrp > 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}>
                                    {r.soldXrp > 0 ? fNumber(r.soldXrp) : '—'}
                                  </span>
                                )}
                                {/* Realized PnL */}
                                <div className="text-right">
                                  <span
                                    className="text-[11px] font-bold font-mono"
                                    style={{
                                      color: netPnl > 0 ? '#22c55e' : netPnl < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                                    }}
                                  >
                                    {netPnl !== 0 ? `${netPnl > 0 ? '+' : '-'}${fNumber(Math.abs(netPnl))}` : '0'}
                                  </span>
                                  <div className={cn('text-[8px] uppercase font-semibold', isDark ? 'text-white/20' : 'text-black/25')}>XRP</div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </>
                    )}
                    {/* Empty state */}
                    {(!tokenFlow.recipients || tokenFlow.recipients.length === 0) && (
                      <div className={cn('px-[20px] py-[32px] text-center text-[12px]', isDark ? 'text-white/55' : 'text-black/25')}>
                        No recipient data available
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </tbody>
        </table>
      </div>

      {/* Linked NFT Collections */}
      {linkedCollections?.length > 0 && (
        <div
          className={cn(
            'rounded-[12px] bg-transparent w-full mb-[4px] overflow-hidden border-[1.5px]',
            isDark ? 'border-white/10' : 'border-black/[0.06]'
          )}
        >
          <div
            className={cn(
              'p-[8px_10px_6px]',
              isDark ? 'bg-white/[0.015]' : 'bg-black/[0.01]'
            )}
          >
            <div className="flex flex-row items-center gap-[8px]">
              <Layers size={12} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
              <span
                className={cn('text-[12px] font-semibold tracking-[-0.01em]', isDark ? 'text-white/[0.85]' : 'text-[rgba(33,43,54,0.85)]')}
              >
                NFT Collections
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            {linkedCollections.map((col, idx) => {
              const v = typeof col.verified === 'number' ? col.verified : (col.verified === true || col.verified === 'yes' ? 4 : 0);
              const colName = typeof col.name === 'object' ? col.name?.collection_name || '' : col.name || '';

              return (
                <div
                  key={col.id}
                  onClick={() => router.push(`/nfts/${col.slug}`)}
                  className={cn(
                    'flex items-center gap-[10px] px-[10px] py-[8px] cursor-pointer transition-[background-color,border-color] duration-150 group',
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]',
                    idx < linkedCollections.length - 1 && (isDark ? 'border-b border-white/[0.05]' : 'border-b border-black/[0.04]')
                  )}
                >
                  {/* Collection Image */}
                  <div className="relative shrink-0">
                    <img
                      src={`https://s1.xrpl.to/nft-collection/${col.logoImage || col.id}`}
                      alt={colName}
                      className={cn(
                        'w-[36px] h-[36px] rounded-[6px] object-cover border',
                        isDark ? 'border-white/10' : 'border-black/[0.08]'
                      )}
                      onError={(e) => (e.target.src = '/static/alt.webp')}
                    />
                    <VerificationBadge verified={v} size="sm" isDark={isDark} />
                  </div>

                  {/* Name + Badge + Item Count */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[5px]">
                      <span
                        className={cn(
                          'text-[12px] font-semibold truncate',
                          isDark ? 'text-white' : 'text-[#1a1a1a]'
                        )}
                      >
                        {colName}
                      </span>
                      <VerificationLabel verified={v} isDark={isDark} />
                    </div>
                    <span className={cn('text-[10px]', isDark ? 'text-white/[0.35]' : 'text-black/[0.35]')}>
                      {fNumber(col.items || 0)} items
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-[12px] shrink-0">
                    <div className="text-right">
                      <div className={cn('text-[9px] uppercase leading-none mb-[2px]', isDark ? 'text-white/60' : 'text-black/60')}>
                        Floor
                      </div>
                      <div className="text-[11px] font-semibold text-[#22c55e] whitespace-nowrap leading-tight">
                        ✕{fNumber(col.floor?.amount || col.floor || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-[9px] uppercase leading-none mb-[2px]', isDark ? 'text-white/60' : 'text-black/60')}>
                        Vol
                      </div>
                      <div className={cn('text-[11px] font-semibold whitespace-nowrap leading-tight', isDark ? 'text-white/90' : 'text-black/[0.85]')}>
                        ✕{fNumber(col.volume || col.totalVol24h || 0)}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className={cn(
                        'transition-[opacity,transform,background-color,border-color] duration-150 shrink-0',
                        isDark
                          ? 'text-white/20 group-hover:text-white/60 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]'
                          : 'text-black/15 group-hover:text-black/60 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]'
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

PriceStatistics.propTypes = {
  token: PropTypes.object.isRequired
};

// Helper function to normalize tags for URL slugs
function normalizeTag(tag) {
  if (tag && tag.length > 0) {
    const tag1 = tag.split(' ').join('-'); // Replace space
    const tag2 = tag1.replace(/&/g, 'and'); // Replace &
    const tag3 = tag2.toLowerCase(); // Make lowercase
    const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
    return final;
  }
  return '';
}

// Helper function to get full URLs for social platforms
const getFullUrl = (platform, handle) => {
  if (!handle) return '#';
  if (handle.startsWith('http')) return handle;
  switch (platform) {
    case 'twitter':
    case 'x':
      return `https://x.com/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'discord':
      return `https://discord.gg/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'reddit':
      return `https://www.reddit.com/user/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/company/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'medium':
      return `https://medium.com/@${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'twitch':
      return `https://www.twitch.tv/${handle}`;
    case 'website':
      return `https://${handle}`;
    default:
      return handle;
  }
};

// Compact social links component for header integration
export const CompactSocialLinks = memo(
  ({ social, toggleLinksDrawer, size = 'small', isDark = false, fullWidth = false }) => {
    const isMobile = useIsMobile();

    const socialEntries = useMemo(
      () => (social ? Object.entries(social).filter(([, value]) => value) : []),
      [social]
    );

    if (socialEntries.length === 0) return null;

    const getIcon = (platform) => {
      const iconSize = isMobile ? 14 : 14;
      const color = '#4285f4';
      switch (platform) {
        case 'twitter':
        case 'x':
          return <X size={iconSize} color={color} />;
        case 'telegram':
          return <Send size={iconSize} color={color} />;
        case 'discord':
          return <MessageCircle size={iconSize} color={color} />;
        case 'website':
          return <Globe size={iconSize} color={color} />;
        case 'github':
          return <Github size={iconSize} color={color} />;
        case 'reddit':
          return <TrendingUp size={iconSize} color={color} />;
        default:
          return <LinkIcon size={iconSize} color={color} />;
      }
    };

    const getPlatformLabel = (platform) => {
      switch (platform) {
        case 'twitter':
        case 'x':
          return 'X';
        case 'telegram':
          return 'Telegram';
        case 'discord':
          return 'Discord';
        case 'website':
          return 'Website';
        case 'github':
          return 'GitHub';
        case 'reddit':
          return 'Reddit';
        case 'facebook':
          return 'Facebook';
        case 'linkedin':
          return 'LinkedIn';
        case 'instagram':
          return 'Instagram';
        case 'youtube':
          return 'YouTube';
        case 'medium':
          return 'Medium';
        case 'tiktok':
          return 'TikTok';
        case 'twitch':
          return 'Twitch';
        default:
          return platform.charAt(0).toUpperCase() + platform.slice(1);
      }
    };

    // Compact mode with text labels - horizontal row that wraps
    if (fullWidth) {
      return (
        <div className="flex flex-row gap-2 flex-wrap">
          {socialEntries.map(([platform, url]) => (
            <a
              key={platform}
              href={getFullUrl(platform, url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] px-[10px] py-[6px] rounded-[8px] no-underline bg-[rgba(66,133,244,0.08)] border-[1.5px] border-[rgba(66,133,244,0.15)]"
            >
              {getIcon(platform)}
              <span
                className="text-[11px] font-medium text-[#4285f4]"
              >
                {getPlatformLabel(platform)}
              </span>
            </a>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-row items-center gap-[6px]">
        {socialEntries.map(([platform, url]) => (
            <a
              key={platform}
              title={getPlatformLabel(platform)}
              href={getFullUrl(platform, url)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'w-[28px] h-[28px] rounded-[6px] flex items-center justify-center no-underline border',
                isDark
                  ? 'bg-white/[0.03] border-white/[0.06]'
                  : 'bg-black/[0.025] border-black/[0.05]'
              )}
            >
              {getIcon(platform)}
            </a>
        ))}
      </div>
    );
  }
);

// Compact tags component for inline integration
export const CompactTags = memo(
  ({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
    if (!enhancedTags || enhancedTags.length === 0) return null;

    return (
      <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-wrap">
        {enhancedTags.slice(0, maxTags).map((tag) => (
          <a
            key={tag}
            href={`/view/${normalizeTag(tag)}`}
            className={cn(
              'inline-flex items-center gap-[3px] sm:gap-[4px] px-[5px] sm:px-[6px] py-[2px] sm:py-[3px] rounded-[4px] no-underline text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2px] border',
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-white/[0.55]'
                : 'bg-black/[0.025] border-black/[0.05] text-black/60'
            )}
            rel="noreferrer noopener nofollow"
          >
            {tag === 'aigent.run' && (
              <img src="/static/aigentrun.gif" alt="" className="w-[9px] h-[9px] sm:w-[10px] sm:h-[10px]" />
            )}
            {tag}
          </a>
        ))}
        {enhancedTags.length > maxTags && (
          <span
            className={cn(
              'px-[5px] sm:px-[6px] py-[2px] sm:py-[3px] rounded-[4px] text-[9px] sm:text-[10px] font-medium border',
              isDark
                ? 'bg-white/[0.03] border-white/[0.06] text-white/60'
                : 'bg-black/[0.025] border-black/[0.05] text-black/[0.35]',
              toggleTagsDrawer ? 'cursor-pointer' : 'cursor-default'
            )}
            onClick={() => toggleTagsDrawer && toggleTagsDrawer(true)}
          >
            +{enhancedTags.length - maxTags}
          </span>
        )}
      </div>
    );
  }
);

// Combined component for easy usage
export const CompactSocialAndTags = memo(
  ({
    social,
    enhancedTags,
    toggleLinksDrawer,
    toggleTagsDrawer,
    maxTags = 3,
    socialSize = 'small',
    isDark = false
  }) => (
    <div className="flex flex-row items-center gap-[8px] flex-wrap">
      <CompactTags
        enhancedTags={enhancedTags}
        toggleTagsDrawer={toggleTagsDrawer}
        maxTags={maxTags}
        isDark={isDark}
      />
      <CompactSocialLinks
        social={social}
        toggleLinksDrawer={toggleLinksDrawer}
        size={socialSize}
        isDark={isDark}
      />
    </div>
  )
);
