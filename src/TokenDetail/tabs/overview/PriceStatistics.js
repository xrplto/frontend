import { apiFetch, getWalletAuthHeaders } from 'src/utils/api';
import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
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
import { AppContext } from 'src/context/AppContext';

// Helper
const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

// Custom components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: ${(props) => props.direction || 'column'};
  align-items: ${(props) => props.alignItems || 'stretch'};
  gap: ${(props) => (props.spacing ? `${props.spacing * 8}px` : '0')};
  flex-wrap: ${(props) => props.flexWrap || 'nowrap'};
`;
const Typography = styled.div`
  font-size: ${(props) =>
    props.variant === 'h6'
      ? '1.25rem'
      : props.variant === 'body2'
        ? '0.875rem'
        : props.variant === 'caption'
          ? '0.75rem'
          : '1rem'};
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || (props.isDark ? '#FFFFFF' : '#212B36')};
  white-space: ${(props) => (props.noWrap ? 'nowrap' : 'normal')};
`;
const Table = styled.table`
  width: 100%;
  background: transparent;
`;
const TableBody = styled.tbody``;
const TableRow = styled.tr``;
const TableCell = styled.td`
  padding: ${(props) => props.padding || '4px 6px'};
  border-bottom: none;
  text-align: ${(props) => props.align || 'left'};
`;
const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${(props) => (props.size === 'small' ? '2px 8px' : '4px 12px')};
  border-radius: 8px;
  font-size: ${(props) => props.fontSize || '11px'};
  font-weight: 400;
  cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
`;
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => (props.size === 'small' ? '4px' : '8px')};
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
`;
const Link = styled.a`
  text-decoration: none;
  color: inherit;
  &:hover {
    text-decoration: underline;
  }
`;
const Tooltip = ({ title, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'pre-line',
            zIndex: 1000,
            marginBottom: '4px',
            minWidth: 'max-content'
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};
const Dialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: ${(props) => (props.open ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const DialogPaper = styled.div`
  background: ${(props) => (props.isDark ? '#0a0a0a' : '#ffffff')};
  border-radius: 14px;
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  padding: 0;
  max-width: 400px;
  width: 90%;
  margin: 0 auto;
`;
const DialogContent = styled.div`
  padding: 16px;
  text-align: ${(props) => props.textAlign || 'left'};
`;
const Button = styled.button`
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  cursor: pointer;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  transition: all 0.15s ease;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.3);
  }
`;

const StyledTable = styled(Table)`
  margin-top: 0;
  table-layout: fixed;
`;

const ModernTableCell = styled(TableCell)`
  padding: 6px 10px;
  border-bottom: none;
  vertical-align: middle;
  &:first-of-type {
    width: 45%;
  }
  &:last-of-type {
    width: 55%;
    text-align: right;
  }
`;

const TableRowStyled = styled(TableRow)`
  transition: background 0.15s ease;
  &:hover {
    background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)')};
  }
`;

const SectionHeader = styled.div`
  padding: 6px 10px 2px;
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)')};
`;

const ScrollableBox = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(128,128,128,0.3) transparent;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(128,128,128,0.3);
    border-radius: 4px;
  }
`;

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
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
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
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar, accountProfile } = useContext(AppContext);
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
    const t0 = performance.now();
    console.log('[PriceStats] Fetching AI review:', aiUrl);
    apiFetch(aiUrl, { signal: aiAbortRef.current.signal })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[PriceStats] AI review done in ${(performance.now() - t0).toFixed(0)}ms`);
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
    const t1 = performance.now();
    console.log('[PriceStats] Fetching token flow:', flowUrl);
    apiFetch(flowUrl, { signal: flowAbortRef.current.signal })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[PriceStats] Token flow done in ${(performance.now() - t1).toFixed(0)}ms`);
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
      else if (filter === 'transfers') url += '&side=transfer_out,receive';
      else if (filter === 'checks')
        url += '&side=check_incoming,check_create,check_receive,check_send,check_cancel';
      else if (filter === 'lp') url += '&side=deposit,withdraw,amm_create';

      const t0 = performance.now();
      console.log('[PriceStats] Fetching creator activity:', url);
      // Parallel fetch for 'all' filter (creators + tx fallback)
      const fetches = [fetch(url, { signal }).then((r) => r.json())];
      if (filter === 'all') {
        fetches.push(
          apiFetch(`https://api.xrpl.to/v1/tx/${creator}?limit=12`, { signal }).then((r) => r.json())
        );
      }

      const [data, txData] = await Promise.all(fetches);
      console.log(`[PriceStats] Creator activity done in ${(performance.now() - t0).toFixed(0)}ms`);
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
  const handleCopyCreator = useCallback(() => {
    navigator.clipboard.writeText(creator).then(() => {
      openSnackbar('Copied!', 'success');
    });
  }, [creator, openSnackbar]);

  // Memoize toggle handler
  const toggleActivity = useCallback(() => setActivityOpen((prev) => !prev), []);

  return (
    <>
      <Box
        className={cn(
          'rounded-2xl border transition-all duration-200 overflow-hidden',
          isDark
            ? 'border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm'
            : 'border-black/[0.06] bg-white/50 backdrop-blur-sm shadow-sm'
        )}
        style={{
          width: '100%',
          marginBottom: '4px',
        }}
      >
        {/* Scam Warning Dialog */}
        {openScamWarning && (
          <Dialog open>
            <DialogPaper isDark={isDark} onClick={(e) => e.stopPropagation()}>
              <DialogContent style={{ textAlign: 'center', padding: '24px' }}>
                <AlertTriangle
                  size={28}
                  color="#ef4444"
                  strokeWidth={1.5}
                  style={{ marginBottom: '12px' }}
                />
                <Typography
                  variant="h6"
                  style={{
                    color: '#ef4444',
                    fontWeight: 700,
                    marginBottom: '10px',
                    fontSize: '16px',
                    letterSpacing: '-0.01em',
                    textTransform: 'uppercase'
                  }}
                >
                  Scam Warning
                </Typography>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    marginBottom: '20px',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                >
                  This token has been flagged as a potential scam. Please exercise extreme caution.
                </Typography>
                <Button isDark={isDark} onClick={() => setOpenScamWarning(false)}>
                  I Understand
                </Button>
              </DialogContent>
            </DialogPaper>
          </Dialog>
        )}

        {/* Header */}
        <Box
          className={cn(
            'px-[14px] py-[12px] border-b transition-colors',
            isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.04]'
          )}
        >
          <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
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
          </Stack>
        </Box>

        {/* Safety Score */}
        {(aiReview || aiLoading) && (
          <Box
            className={cn(
              'm-2 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden',
              isDark 
                ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                : 'bg-black/[0.015] border-black/[0.05] hover:bg-black/[0.025] shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
            )}
          >
            {aiLoading ? (
              <Stack direction="row" alignItems="center" style={{ gap: '12px', padding: '4px 0' }}>
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 bg-violet-500/10 blur-sm rounded-full" />
                </div>
                <Typography className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-500/80">
                  AI Security Audit in progress...
                </Typography>
              </Stack>
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
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                        >
                          <Icon size={16} color={color} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.12em] opacity-40 leading-none mb-1">Safety Score</span>
                          <span className="text-[12px] font-bold" style={{ color }}>{label} Risk Profile</span>
                        </div>
                      </div>
                      <div className="flex items-center bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5">
                        <span className="text-[20px] font-black tracking-tighter leading-none" style={{ color }}>{score}</span>
                        <span className="text-[10px] font-bold opacity-30 tracking-widest uppercase ml-1">/ 10</span>
                      </div>
                    </div>

                    <div className="relative h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 ease-out rounded-full"
                        style={{
                          width: `${(10 - score) * 10}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                          boxShadow: `0 0 12px ${color}40`
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-4">
                        {aiReview.riskCount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-red-500/90 uppercase tracking-widest">
                              {aiReview.riskCount} Risks
                            </span>
                          </div>
                        )}
                        {aiReview.positiveCount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500/90 uppercase tracking-widest">
                              {aiReview.positiveCount} Passes
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {aiReview.md5 && (
                        <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                          <Sparkles size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">AI Analysis</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </Box>
        )}

        <StyledTable size="small">
          <TableBody>
            {/* ========== MARKET METRICS GROUP ========== */}
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography
                  style={{
                    fontWeight: 400,
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    fontSize: '13px'
                  }}
                  noWrap
                >
                  FDV Market Cap
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack
                  direction="row"
                  alignItems="center"
                  style={{ justifyContent: 'flex-end', gap: '6px' }}
                >
                  <Typography
                    style={{
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {currencySymbols[activeFiatCurrency]}
                    {fNumber(
                      amount *
                      (exch /
                        (metrics[activeFiatCurrency] ||
                          (activeFiatCurrency === 'CNH' ? metrics.CNY : null) ||
                          1))
                    )}
                  </Typography>
                </Stack>
              </ModernTableCell>
            </TableRowStyled>

            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography
                  style={{
                    fontWeight: 400,
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    fontSize: '13px'
                  }}
                  noWrap
                >
                  Volume Dominance
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  style={{
                    fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                    fontSize: '13px'
                  }}
                >
                  {(dom || 0).toFixed(4)}%
                </Typography>
              </ModernTableCell>
            </TableRowStyled>

            {amount > 0 && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px'
                    }}
                    noWrap
                  >
                    Supply
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fNumber(amount)}
                  </Typography>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {(txns24h > 0 || vol24htx > 0) && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px'
                    }}
                    noWrap
                  >
                    Trades (24h)
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fNumber(txns24h || vol24htx)}
                  </Typography>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {uniqueTraders24h > 0 && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px'
                    }}
                    noWrap
                  >
                    Unique Traders (24h)
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fNumber(uniqueTraders24h)}
                  </Typography>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* ========== BUY/SELL METRICS GROUP ========== */}
            {(buy24hxrp > 0 || sell24hxrp > 0) && (
              <tr>
                <td colSpan={2} style={{ padding: '12px 10px 6px' }}>
                  <Stack direction="row" alignItems="center" style={{ gap: '6px' }}>
                    <div style={{ width: '3px', height: '10px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
                    <Typography
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      24h Trading
                    </Typography>
                  </Stack>
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
                  <TableRowStyled isDark={isDark}>
                    <ModernTableCell colSpan={2} style={{ padding: '8px 12px 10px' }}>
                      <Stack direction="row" alignItems="center" style={{ gap: '10px' }}>
                        <div className="flex flex-col min-w-[40px]">
                          <span className="text-[10px] font-black text-emerald-500 leading-none">{formatPct(buyRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Buy</span>
                        </div>
                        <div className="flex-1 relative">
                          <Box style={{ height: '6px', borderRadius: '4px', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex' }}>
                            <div style={{ width: `${buyPct}%`, background: 'linear-gradient(90deg, #059669, #10b981)', transition: 'width 1s ease-out' }} />
                            <div style={{ width: `${sellPct}%`, background: 'linear-gradient(90deg, #f43f5e, #e11d48)', transition: 'width 1s ease-out' }} />
                          </Box>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-full bg-white/20 dark:bg-black/20" />
                        </div>
                        <div className="flex flex-col min-w-[40px] text-right">
                          <span className="text-[10px] font-black text-rose-500 leading-none">{formatPct(sellRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Sell</span>
                        </div>
                      </Stack>
                    </ModernTableCell>
                  </TableRowStyled>
                );
              })()}

            {/* Buys (24h) Row - Compact with unique buyers inline */}
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography
                  style={{
                    fontWeight: 400,
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  noWrap
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  Buys (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack
                  direction="row"
                  alignItems="center"
                  style={{ justifyContent: 'flex-end', gap: '8px' }}
                >
                  <Typography style={{ fontWeight: 700, color: '#10b981', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                    {fNumber(buy24hxrp || 0)} <span className="text-[10px] opacity-60">XRP</span>
                  </Typography>
                  <div className="h-4 w-[1px] bg-black/5 dark:bg-white/5" />
                  <Stack direction="row" alignItems="center" style={{ gap: '4px' }}>
                    <Typography
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {fNumber(uniqueBuyers24h || 0)} <span className="text-[9px] font-bold opacity-40 uppercase">u</span>
                    </Typography>
                    <Typography
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                        fontSize: '10px',
                        fontWeight: 500
                      }}
                    >
                      {fNumber(buyTxns24h || buy24htx || 0)} <span className="text-[8px] opacity-60 uppercase">tx</span>
                    </Typography>
                  </Stack>
                </Stack>
              </ModernTableCell>
            </TableRowStyled>

            {/* Sells (24h) Row - Compact with unique sellers inline */}
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography
                  style={{
                    fontWeight: 400,
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  noWrap
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                  Sells (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack
                  direction="row"
                  alignItems="center"
                  style={{ justifyContent: 'flex-end', gap: '8px' }}
                >
                  <Typography style={{ fontWeight: 700, color: '#f43f5e', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                    {fNumber(sell24hxrp || 0)} <span className="text-[10px] opacity-60">XRP</span>
                  </Typography>
                  <div className="h-4 w-[1px] bg-black/5 dark:bg-white/5" />
                  <Stack direction="row" alignItems="center" style={{ gap: '4px' }}>
                    <Typography
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {fNumber(uniqueSellers24h || 0)} <span className="text-[9px] font-bold opacity-40 uppercase">u</span>
                    </Typography>
                    <Typography
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                        fontSize: '10px',
                        fontWeight: 500
                      }}
                    >
                      {fNumber(sellTxns24h || sell24htx || 0)} <span className="text-[8px] opacity-60 uppercase">tx</span>
                    </Typography>
                  </Stack>
                </Stack>
              </ModernTableCell>
            </TableRowStyled>

            {/* ========== AMM LIQUIDITY GROUP ========== */}
            {(deposit24hxrp > 0 || withdraw24hxrp > 0) && (
              <tr>
                <td colSpan={2} style={{ padding: '16px 12px 8px' }}>
                  <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                    <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <Droplet size={10} className="text-amber-500" />
                    </div>
                    <Typography
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      AMM Liquidity Flow
                    </Typography>
                  </Stack>
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
                  <TableRowStyled isDark={isDark}>
                    <ModernTableCell colSpan={2} style={{ padding: '8px 12px 10px' }}>
                      <Stack direction="row" alignItems="center" style={{ gap: '10px' }}>
                        <div className="flex flex-col min-w-[40px]">
                          <span className="text-[10px] font-black text-emerald-500 leading-none">{formatPct(inRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">In</span>
                        </div>
                        <Box style={{ flex: 1, height: '6px', borderRadius: '4px', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex' }}>
                          <div style={{ width: `${inPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 1s ease-out' }} />
                          <div style={{ width: `${outPct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', transition: 'width 1s ease-out' }} />
                        </Box>
                        <div className="flex flex-col min-w-[40px] text-right">
                          <span className="text-[10px] font-black text-amber-500 leading-none">{formatPct(outRaw)}%</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Out</span>
                        </div>
                      </Stack>
                    </ModernTableCell>
                  </TableRowStyled>
                );
              })()}

            {/* AMM Deposits (24h) Row */}
            {deposit24hxrp ? (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    noWrap
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    AMM Deposits
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Stack
                    direction="row"
                    alignItems="center"
                    style={{ justifyContent: 'flex-end', gap: '8px' }}
                  >
                    <Typography style={{ fontWeight: 700, color: '#10b981', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                      {fNumber(deposit24hxrp)} <span className="text-[10px] opacity-60">XRP</span>
                    </Typography>
                    {deposit24htx ? (
                      <Typography
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                          fontSize: '10px',
                          fontWeight: 500
                        }}
                      >
                        {fNumber(deposit24htx)} <span className="text-[8px] opacity-60 uppercase">tx</span>
                      </Typography>
                    ) : null}
                  </Stack>
                </ModernTableCell>
              </TableRowStyled>
            ) : null}

            {/* AMM Withdrawals (24h) Row */}
            {withdraw24hxrp ? (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    noWrap
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                    AMM Withdrawals
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Stack
                    direction="row"
                    alignItems="center"
                    style={{ justifyContent: 'flex-end', gap: '8px' }}
                  >
                    <Typography style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                      {fNumber(Math.abs(withdraw24hxrp))} <span className="text-[10px] opacity-60">XRP</span>
                    </Typography>
                    {withdraw24htx ? (
                      <Typography
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                          fontSize: '10px',
                          fontWeight: 500
                        }}
                      >
                        {fNumber(withdraw24htx)} <span className="text-[8px] opacity-60 uppercase">tx</span>
                      </Typography>
                    ) : null}
                  </Stack>
                </ModernTableCell>
              </TableRowStyled>
            ) : null}

            {/* LP Burned Row - Compact */}
            {(lpBurnedPercent != null || lpHolderCount > 0) && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    noWrap
                  >
                    <Flame size={12} className={cn((lpBurnedPercent || 0) >= 50 ? 'text-emerald-500' : 'text-amber-500')} />
                    LP Status
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Stack
                    direction="row"
                    alignItems="center"
                    style={{ justifyContent: 'flex-end', gap: '8px' }}
                  >
                    <Typography
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color:
                          (lpBurnedPercent || 0) >= 80
                            ? '#10b981'
                            : (lpBurnedPercent || 0) >= 20
                              ? '#f59e0b'
                              : '#f43f5e'
                      }}
                    >
                      {(lpBurnedPercent || 0).toFixed(2)}% <span className="text-[10px] opacity-40 font-bold uppercase tracking-tighter">Burned</span>
                    </Typography>
                    <Box
                      style={{
                        width: '40px',
                        height: '6px',
                        borderRadius: '3px',
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        display: 'flex'
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(lpBurnedPercent || 0, 100)}%`,
                          height: '100%',
                          background:
                            (lpBurnedPercent || 0) >= 80
                              ? 'linear-gradient(90deg, #059669, #10b981)'
                              : (lpBurnedPercent || 0) >= 20
                                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                : 'linear-gradient(90deg, #e11d48, #f43f5e)'
                        }}
                      />
                    </Box>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/5">
                      <Typography
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {lpBurnedHolders || 0}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                          textTransform: 'uppercase'
                        }}
                      >
                        / {lpHolderCount || 0}
                      </Typography>
                    </div>
                  </Stack>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* ========== TOKEN INFO GROUP ========== */}
            {(date || dateon || creator) && (
              <tr>
                <td colSpan={2} style={{ padding: '16px 12px 8px' }}>
                  <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                    <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <Link2 size={10} className="text-blue-500" />
                    </div>
                    <Typography
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      Transparency & Origin
                    </Typography>
                  </Stack>
                </td>
              </tr>
            )}

            {/* Created Date Row */}
            {date || dateon ? (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px'
                    }}
                    noWrap
                  >
                    Created
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: '13px'
                    }}
                  >
                    {fDate(date || dateon)}
                  </Typography>
                </ModernTableCell>
              </TableRowStyled>
            ) : null}

            {/* Creator Row */}
            {creator && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    noWrap
                  >
                    <Settings size={12} className="opacity-40" />
                    Creator
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Stack
                    direction="row"
                    alignItems="center"
                    style={{ justifyContent: 'flex-end', gap: '6px' }}
                  >
                    <Tooltip title="Click to view activity">
                      <Chip
                        size="small"
                        onClick={toggleActivity}
                        style={{
                          paddingLeft: '10px',
                          paddingRight: '10px',
                          borderRadius: '8px',
                          height: '28px',
                          background: activityOpen ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                          border: `1px solid ${activityOpen ? (isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          maxWidth: isMobile ? '110px' : '180px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {creatorLabel ? (
                          <Typography
                            variant="caption"
                            style={{
                              fontWeight: 700,
                              fontSize: '11px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#6366f1',
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {creatorLabel}
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            style={{
                              fontWeight: 500,
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'
                            }}
                          >
                            {creator.slice(0, 12)}...
                          </Typography>
                        )}
                      </Chip>
                    </Tooltip>
                    
                    <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.04] p-0.5 rounded-lg border border-black/[0.05] dark:border-white/[0.08]">
                      <Tooltip title="Copy address">
                        <IconButton
                          onClick={handleCopyCreator}
                          size="small"
                          style={{
                            padding: '4px',
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                          }}
                        >
                          <Copy
                            size={13}
                            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Message creator">
                        <IconButton
                          onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: creator, tokenMd5: token.md5 } }))}
                          size="small"
                          style={{
                            padding: '4px',
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                          }}
                        >
                          <MessageCircle
                            size={13}
                            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                          />
                        </IconButton>
                      </Tooltip>
                      {accountLogin && !editingLabel && (
                        <Tooltip title={creatorLabel ? 'Edit label' : 'Add label'}>
                          <IconButton
                            onClick={() => {
                              setEditingLabel(true);
                              setLabelInput(creatorLabel || '');
                            }}
                            size="small"
                            style={{
                              padding: '4px',
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: creatorLabel ? 'rgba(99,102,241,0.1)' : 'transparent',
                            }}
                          >
                            <Tag size={13} color={creatorLabel ? '#6366f1' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                          </IconButton>
                        </Tooltip>
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
                        <IconButton
                          onClick={handleSaveCreatorLabel}
                          disabled={labelSaving || !labelInput.trim()}
                          size="small"
                          className="bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <CheckCircle size={12} color="#10b981" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setEditingLabel(false);
                            setLabelInput('');
                          }}
                          size="small"
                          className="bg-black/5 dark:bg-white/5"
                        >
                          <X size={12} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                        </IconButton>
                      </div>
                    )}
                  </Stack>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* Creator Label Row */}
            {creator && creatorLabel && !editingLabel && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography
                    style={{
                      fontWeight: 400,
                      color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    noWrap
                  >
                    <Tag size={12} className="opacity-40" />
                    Your Label
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Chip
                    size="small"
                    style={{
                      paddingLeft: '10px',
                      paddingRight: '10px',
                      borderRadius: '8px',
                      height: '26px',
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)'
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{
                        fontWeight: 700,
                        fontSize: '11px',
                        color: '#6366f1'
                      }}
                    >
                      {creatorLabel}
                    </Typography>
                  </Chip>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* Creator Last Action */}
            {creator && creatorLastAction && (
              <>
                <TableRowStyled isDark={isDark}>
                  <ModernTableCell>
                    <Typography
                      style={{
                        fontWeight: 400,
                        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                        fontSize: isMobile ? '11px' : '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      noWrap
                    >
                      <BarChart2 size={12} className="opacity-40" />
                      {isMobile ? 'Last Act' : 'Creator Last Act'}
                    </Typography>
                  </ModernTableCell>
                  <ModernTableCell>
                    <Tooltip
                      title={`${creatorLastAction.type} - ${creatorLastAction.result}\nClick to view tx`}
                    >
                      <Link
                        href={`/tx/${creatorLastAction.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          style={{ justifyContent: 'flex-end', gap: isMobile ? '4px' : '8px' }}
                        >
                          <Typography
                            variant="body2"
                            style={{
                              fontWeight: 700,
                              color:
                                creatorLastAction.side === 'buy'
                                  ? '#10b981'
                                  : creatorLastAction.side === 'sell'
                                    ? '#f43f5e'
                                    : creatorLastAction.side === 'transfer_out'
                                      ? '#f59e0b'
                                      : '#8b5cf6',
                              fontSize: isMobile ? '10px' : '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em'
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
                          </Typography>
                          <Typography
                            variant="caption"
                            style={{
                              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                              fontSize: isMobile ? '10px' : '12px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600
                            }}
                          >
                            {creatorLastAction.amountType === 'token' && creatorLastAction.token > 0
                              ? `${fNumber(creatorLastAction.token)} ${name}`
                              : creatorLastAction.xrp > 0
                                ? `${fNumber(creatorLastAction.xrp)} XRP`
                                : null}
                          </Typography>
                          <div className="text-[10px] font-bold opacity-30 tracking-tighter uppercase ml-1">
                            {formatLastActionTime(creatorLastAction.time)}
                          </div>
                        </Stack>
                      </Link>
                    </Tooltip>
                  </ModernTableCell>
                </TableRowStyled>
                {/* Creator Sell Warning */}
                {creatorLastAction.side === 'sell' && (
                  <TableRowStyled isDark={isDark}>
                    <ModernTableCell colSpan={2} style={{ padding: isMobile ? '2px 8px 6px' : '4px 12px 8px' }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        style={{
                          gap: isMobile ? '5px' : '8px',
                          padding: isMobile ? '5px 8px' : '8px 12px',
                          background: 'rgba(239,68,68,0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(239,68,68,0.15)'
                        }}
                      >
                        <AlertTriangle size={isMobile ? 12 : 14} color="#ef4444" strokeWidth={1.5} />
                        <Typography style={{ color: '#ef4444', fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}>
                          {isMobile ? 'Sold' : 'Creator sold'}{' '}
                          {creatorLastAction.xrp != null && creatorLastAction.xrp > 0
                            ? `${fNumber(creatorLastAction.xrp)} XRP`
                            : creatorLastAction.amountType === 'token' && creatorLastAction.token > 0
                              ? `${fNumber(creatorLastAction.token)} ${name}`
                              : 'tokens'}{' '}
                          {formatLastActionTime(creatorLastAction.time)}
                        </Typography>
                      </Stack>
                    </ModernTableCell>
                  </TableRowStyled>
                )}
              </>
            )}

            {/* Creator Token Count - Compact Row */}
            {creator && creatorTokens > 0 && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Stack direction="row" alignItems="center" style={{ gap: '6px' }}>
                    {creatorTokens >= 5 ? (
                      <AlertTriangle
                        size={13}
                        color={creatorTokens >= 10 ? '#ef4444' : '#f59e0b'}
                        strokeWidth={1.5}
                      />
                    ) : creatorTokens >= 2 ? (
                      <Layers size={12} color="#3b82f6" strokeWidth={1.5} />
                    ) : (
                      <CheckCircle size={12} color="#10b981" strokeWidth={1.5} />
                    )}
                    <Typography
                      style={{
                        fontWeight: 400,
                        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)',
                        fontSize: '13px'
                      }}
                      noWrap
                    >
                      {creatorTokens >= 10
                        ? 'Serial launcher'
                        : creatorTokens >= 5
                          ? 'Multiple tokens'
                          : creatorTokens >= 2
                            ? 'Other tokens'
                            : 'First token'}
                    </Typography>
                  </Stack>
                </ModernTableCell>
                <ModernTableCell>
                  <Stack
                    direction="row"
                    alignItems="center"
                    style={{ justifyContent: 'flex-end', gap: '6px' }}
                  >
                    <Typography
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
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
                    </Typography>
                    {creatorTokens >= 2 && (
                      <Chip
                        size="small"
                        style={{
                          height: '18px',
                          borderRadius: '4px',
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
                                : '#3b82f6',
                          fontSize: '8px',
                          fontWeight: 600,
                          paddingLeft: '5px',
                          paddingRight: '5px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {creatorTokens >= 10
                          ? 'HIGH RISK'
                          : creatorTokens >= 5
                            ? 'CAUTION'
                            : `${creatorTokens} MORE`}
                      </Chip>
                    )}
                    {creatorExchange && (
                      <Chip
                        size="small"
                        style={{
                          height: '18px',
                          borderRadius: '4px',
                          background: 'rgba(34,197,94,0.06)',
                          border: '1px solid rgba(34,197,94,0.12)',
                          color: '#10b981',
                          fontSize: '8px',
                          fontWeight: 600,
                          paddingLeft: '5px',
                          paddingRight: '5px'
                        }}
                      >
                        {creatorExchange}
                      </Chip>
                    )}
                  </Stack>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* Creator Activity - Inline */}
            {creator && activityOpen && (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell colSpan={2} style={{ padding: '4px 10px 8px' }}>
                  <Box
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      padding: '10px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`
                    }}
                  >
                    {/* Filter Tabs */}
                    <Stack
                      direction="row"
                      style={{ gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}
                    >
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'swaps', label: 'Swaps', color: '#3b82f6' },
                        { key: 'transfers', label: 'Transfers', color: '#9C27B0' },
                        { key: 'checks', label: 'Checks', color: '#f59e0b' },
                        { key: 'lp', label: 'LP', color: '#22c55e' }
                      ].map((f) => (
                        <Typography
                          key={f.key}
                          variant="caption"
                          onClick={() => setActivityFilter(f.key)}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: activityFilter === f.key ? 500 : 400,
                            borderRadius: '6px',
                            cursor: 'pointer',
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
                            border: `1px solid ${activityFilter === f.key ? (f.color ? `${f.color}25` : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent'}`,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {f.label}
                        </Typography>
                      ))}
                    </Stack>

                    {/* Stats Summary */}
                    {creatorStats && (
                      <Stack
                        direction="row"
                        style={{ gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}
                      >
                        {creatorStats.buy?.count > 0 && (
                          <Typography
                            variant="caption"
                            style={{ fontSize: '10px', color: '#22c55e' }}
                          >
                            {creatorStats.buy.count} buys · {fNumber(creatorStats.buy.xrp)} XRP
                          </Typography>
                        )}
                        {creatorStats.sell?.count > 0 && (
                          <Typography
                            variant="caption"
                            style={{ fontSize: '10px', color: '#ef4444' }}
                          >
                            {creatorStats.sell.count} sells · {fNumber(creatorStats.sell.xrp)} XRP
                          </Typography>
                        )}
                        {creatorStats.transfer_out?.count > 0 && (
                          <Typography
                            variant="caption"
                            style={{ fontSize: '10px', color: '#9C27B0' }}
                          >
                            {creatorStats.transfer_out.count} transfers
                          </Typography>
                        )}
                        {creatorStats.sellBuyRatio !== undefined && creatorStats.sellBuyRatio > 0 && (
                          <Typography
                            variant="caption"
                            style={{
                              fontSize: '10px',
                              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            Sell ratio: {(creatorStats.sellBuyRatio * 100).toFixed(0)}%
                          </Typography>
                        )}
                      </Stack>
                    )}

                    {/* Warning Banner */}
                    {hasWarning && signals.length > 0 && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        style={{
                          gap: '6px',
                          marginBottom: '8px',
                          padding: '6px 10px',
                          background: 'rgba(239,68,68,0.08)',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.15)'
                        }}
                      >
                        <AlertTriangle size={14} color="#ef4444" strokeWidth={1.5} />
                        <Stack style={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            style={{ color: '#ef4444', fontSize: '11px', fontWeight: 500 }}
                          >
                            {signals.map((s) => s.msg).join(' · ')}
                          </Typography>
                        </Stack>
                      </Stack>
                    )}

                    {/* No token activity notice */}
                    {noTokenActivity && transactions.length > 0 && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        style={{
                          gap: '6px',
                          marginBottom: '6px',
                          padding: '5px 8px',
                          background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)',
                          borderRadius: '6px',
                          border: '1px solid rgba(59,130,246,0.12)'
                        }}
                      >
                        <Typography variant="caption" style={{ color: '#3b82f6', fontSize: '10px' }}>
                          No token trades found — showing general account activity
                        </Typography>
                      </Stack>
                    )}

                    {/* Loading / Empty / List */}
                    {loadingTx || filterLoading ? (
                      <Typography
                        variant="caption"
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          fontSize: '11px',
                          padding: '8px 0'
                        }}
                      >
                        Loading...
                      </Typography>
                    ) : transactions.length === 0 ? (
                      <Typography
                        variant="caption"
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          fontSize: '11px',
                          padding: '8px 0'
                        }}
                      >
                        No activity found
                      </Typography>
                    ) : (
                      <Stack spacing={0}>
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
                            sell: { label: 'SELL', color: '#ef4444', Icon: ArrowUpRight },
                            buy: { label: 'BUY', color: '#22c55e', Icon: ArrowDownLeft },
                            deposit: { label: 'DEPOSIT', color: '#22c55e', Icon: Droplet },
                            withdraw: { label: 'WITHDRAW', color: '#f59e0b', Icon: Flame },
                            receive: { label: 'RECEIVE', color: '#22c55e', Icon: ArrowDownLeft },
                            send: { label: 'SEND', color: '#f59e0b', Icon: ArrowUpRight },
                            transfer_out: { label: 'TRANSFER', color: '#9C27B0', Icon: ArrowLeftRight },
                            clawback: { label: 'CLAWBACK', color: '#ef4444', Icon: AlertTriangle },
                            amm_create: { label: 'AMM CREATE', color: '#22c55e', Icon: Droplet },
                            check_create: { label: 'CHECK', color: '#3b82f6', Icon: FileText },
                            check_incoming: { label: 'CHECK IN', color: '#22c55e', Icon: ArrowDownLeft },
                            check_receive: { label: 'CASHED', color: '#22c55e', Icon: ArrowDownLeft },
                            check_send: { label: 'CHECK OUT', color: '#ef4444', Icon: ArrowUpRight },
                            check_cancel: { label: 'CANCELLED', color: '#6b7280', Icon: X }
                          };
                          const typeConfig = {
                            Payment: { label: 'TRANSFER', color: '#9C27B0', Icon: ArrowLeftRight },
                            AMMDeposit: { label: 'AMM ADD', color: '#22c55e', Icon: Droplet },
                            AMMWithdraw: { label: 'AMM EXIT', color: '#f59e0b', Icon: Flame },
                            OfferCreate: { label: 'OFFER', color: '#3b82f6', Icon: BarChart2 },
                            OfferCancel: { label: 'CANCEL', color: '#9C27B0', Icon: X },
                            TrustSet: { label: 'TRUST', color: '#3b82f6', Icon: Link2 },
                            AccountSet: { label: 'SETTINGS', color: '#6b7280', Icon: Settings },
                            Clawback: { label: 'CLAWBACK', color: '#ef4444', Icon: AlertTriangle }
                          };
                          const cfg = sideConfig[side] ||
                            sideConfig[side?.toLowerCase()] ||
                            typeConfig[type] || {
                            label: type?.slice(0, 8) || 'TX',
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
                            <Link
                              key={hash || i}
                              href={`/tx/${hash}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              style={{ textDecoration: 'none' }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                style={{
                                  padding: '5px 0',
                                  borderBottom:
                                    i < transactions.length - 1
                                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
                                      : 'none',
                                  opacity: isFailed ? 0.5 : 1,
                                  cursor: 'pointer',
                                  gap: '8px'
                                }}
                              >
                                {cfg.Icon && (
                                  <cfg.Icon size={13} style={{ color: displayColor, flexShrink: 0 }} />
                                )}
                                <Typography
                                  variant="caption"
                                  style={{
                                    color: displayColor,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    width: '65px',
                                    flexShrink: 0
                                  }}
                                >
                                  {cfg.label}
                                  {isFailed && ' ✕'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  style={{
                                    flex: 1,
                                    color: hasToken
                                      ? isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'
                                      : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    fontFamily: 'var(--font-mono)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {hasToken ? (
                                    <>
                                      {fNumber(tokenAmount)} {displayCurrency}
                                      {(side === 'check_receive' || side === 'check_incoming') &&
                                        amount > 0 &&
                                        tokenAmount > 0 && (
                                          <span
                                            style={{
                                              marginLeft: '6px',
                                              padding: '1px 5px',
                                              borderRadius: '4px',
                                              fontSize: '9px',
                                              fontWeight: 600,
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
                                </Typography>
                                <Typography
                                  variant="caption"
                                  style={{
                                    width: '80px',
                                    textAlign: 'right',
                                    color: hasXrp
                                      ? '#22c55e'
                                      : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                                    fontSize: '11px',
                                    fontWeight: hasXrp ? 500 : 400,
                                    fontFamily: 'var(--font-mono)',
                                    flexShrink: 0
                                  }}
                                >
                                  {hasXrp ? `${fNumber(xrpAmount)} XRP` : '—'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  style={{
                                    width: '70px',
                                    textAlign: 'right',
                                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                    fontSize: '9px',
                                    fontFamily: 'var(--font-mono)',
                                    flexShrink: 0
                                  }}
                                >
                                  {hash?.slice(0, 6)} · {timeAgo}
                                </Typography>
                              </Stack>
                            </Link>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* Creator Token Flow - Compact Row */}
            {creator && tokenFlow && (tokenFlow.totalTransferred || tokenFlow.totalSoldXrp > 0) && (
              <TableRowStyled 
                isDark={isDark} 
                onClick={() => setFlowModalOpen(true)} 
                style={{ 
                  cursor: 'pointer',
                  background: isDark ? 'linear-gradient(90deg, rgba(139,92,246,0.06), transparent)' : 'linear-gradient(90deg, rgba(139,92,246,0.04), transparent)',
                  borderLeft: '3px solid #8b5cf6'
                }}
              >
                <ModernTableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <ArrowLeftRight size={14} color="#8b5cf6" strokeWidth={2.5} />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-400 rounded-full blur-[1px] animate-pulse" />
                    </div>
                    <span className="font-bold text-[13px] text-violet-500 tracking-tight">
                      Flow Analysis
                    </span>
                  </div>
                </ModernTableCell>
                <ModernTableCell>
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
                </ModernTableCell>
              </TableRowStyled>
            )}

            {/* Token Flow Modal */}
            {flowModalOpen && tokenFlow && createPortal(
              <Dialog open onClick={() => setFlowModalOpen(false)}>
                <DialogPaper isDark={isDark} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Modal Header */}
                  <div style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                  }}>
                    <Stack direction="row" alignItems="center" style={{ gap: '10px' }}>
                      <ArrowLeftRight size={18} color="#8b5cf6" strokeWidth={2} />
                      <Typography style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a', letterSpacing: '-0.01em' }}>
                        Token Flow
                      </Typography>
                    </Stack>
                    <IconButton onClick={() => setFlowModalOpen(false)} size="small" style={{ padding: '6px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                      <X size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                    </IconButton>
                  </div>

                  {/* Scrollable Content */}
                  <ScrollableBox style={{ flex: 1, minHeight: 0 }}>

                  {/* Summary Stats Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
                    gap: '10px', 
                    padding: '16px' 
                  }}>
                    {[
                      { label: 'Distribution', value: `${tokenFlow.recipientCount || 0} Wallets`, sub: 'Total Recipients', color: '#8b5cf6', icon: <Layers size={14}/> },
                      { label: 'CEX Outflow', value: `${fNumber(tokenFlow.totalToExchanges || 0)} XRP`, sub: 'Sent to Exchanges', color: '#f59e0b', icon: <ArrowUpRight size={14}/> },
                      { label: 'Net Flow', value: `${fNumber(Math.abs(tokenFlow.netFlowXrp || 0))} XRP`, sub: tokenFlow.netFlowXrp > 0 ? 'Total Profit' : 'Total Loss', color: tokenFlow.netFlowXrp > 0 ? '#22c55e' : '#ef4444', icon: <BarChart2 size={14}/> },
                      { label: 'Current Hold', value: `${tokenFlow.holdingCount || 0} Wallets`, sub: 'Still holding tokens', color: '#3b82f6', icon: <Droplet size={14}/> }
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#fff' : '#1a1a1a', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                        <span style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>{s.sub}</span>
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
                      <div style={{ margin: '0 16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowUpRight size={14} color="#f59e0b" strokeWidth={2} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>CEX Deposits Breakdown</span>
                          </div>
                          {exchanges.length > 5 && (
                            <button 
                              onClick={() => setShowAllExchanges(!showAllExchanges)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#3b82f6', 
                                fontSize: '10px', 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                padding: '2px 4px'
                              }}
                            >
                              {showAllExchanges ? 'Show Less' : `+${exchanges.length - 5} More`}
                            </button>
                          )}
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                          {displayedExchanges.map((ex, i) => {
                            const pct = tokenFlow.totalToExchanges > 0 ? (ex.xrp / tokenFlow.totalToExchanges) * 100 : 0;
                            return (
                              <div key={ex.address} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                borderTop: i > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` : 'none'
                              }}>
                                <Link href={`/address/${ex.address}`} target="_blank" style={{
                                  fontFamily: 'var(--font-mono)', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                                  textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100px'
                                }}>
                                  {ex.name || ex.address.slice(0, 10)}
                                </Link>
                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.max(pct, 2)}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                                    {fNumber(ex.xrp)} XRP
                                  </span>
                                  <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
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
                      <div style={{ margin: '0 16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Link2 size={14} color="#ef4444" strokeWidth={2} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Linked Wallets (Same CEX Tag)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {tokenFlow.linkedAddresses.map((group, i) => {
                            const color = linkedColors[i % linkedColors.length];
                            const keyParts = (group.exchangeKey || '').split(':');
                            const exAddr = keyParts[0] || '';
                            const exTag = keyParts[1] || '';
                            return (
                              <div key={i} style={{
                                padding: '12px',
                                borderRadius: '12px',
                                border: `1px solid ${color}25`,
                                background: `${color}08`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                                    {(group.addresses || []).map(addr => (
                                      <Link key={addr} href={`/address/${addr}`} target="_blank" style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '10px', color, textDecoration: 'none',
                                        padding: '2px 8px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        border: `1px solid ${color}20`
                                      }}>
                                        {addr.slice(0, 10)}
                                      </Link>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
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
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? 'minmax(0,1fr) 60px 80px' : 'minmax(0,1fr) 70px 100px 100px 100px 100px',
                          padding: '10px 16px',
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          position: 'sticky',
                          top: 0,
                          zIndex: 1
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient Wallet</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Source</span>
                          {!isMobile && (
                            <>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Allocated</span>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Bought</span>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Sold</span>
                            </>
                          )}
                          <span style={{ fontSize: '9px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Realized PnL</span>
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
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: isMobile ? 'minmax(0,1fr) 60px 80px' : 'minmax(0,1fr) 70px 100px 100px 100px 100px',
                                  padding: isMobile ? '8px 16px' : '6px 16px',
                                  alignItems: 'center',
                                  borderBottom: idx < arr.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` : 'none',
                                  background: isIndirect
                                    ? (isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.02)')
                                    : 'transparent',
                                  transition: 'background 0.1s ease'
                                }}
                              >
                                {/* Wallet cell */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ 
                                      width: '24px', 
                                      height: '24px', 
                                      borderRadius: '6px', 
                                      background: linkedColor ? `${linkedColor}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: `1px solid ${linkedColor ? `${linkedColor}30` : 'transparent'}`
                                    }}>
                                      <span style={{ fontSize: '10px', color: linkedColor || (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), fontWeight: 700 }}>{idx + 1}</span>
                                    </div>
                                    {linkedColor && <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: linkedColor, border: `2px solid ${isDark ? '#0a0a0a' : '#fff'}` }} />}
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                      <Link
                                        href={`/address/${r.address}`}
                                        target="_blank"
                                        style={{
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                                          textDecoration: 'none'
                                        }}
                                      >
                                        {isMobile ? r.address.slice(0, 8) : r.address.slice(0, 12)}
                                      </Link>
                                      {r.address === creator && (
                                        <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase' }}>DEV</span>
                                      )}
                                      {r.exchangeDeposits > 0 && (
                                        <ArrowUpRight size={10} color="#f59e0b" strokeWidth={3} />
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {r.action && (
                                        <span style={{ fontSize: '8px', color: actionColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                          {actionLabels[r.action] || r.action}
                                        </span>
                                      )}
                                      {isMobile && (
                                        <span style={{ fontSize: '8px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-mono)' }}>
                                          Rec: {fNumber(r.received)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Source */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  {isDirect ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8b5cf6' }} />
                                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Direct</span>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <ArrowLeftRight size={10} color="#f59e0b" />
                                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{fromAddr.slice(0, 4)}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Allocated (desktop) */}
                                {!isMobile && (
                                  <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                    {r.received > 0 ? fNumber(r.received) : '—'}
                                  </span>
                                )}
                                {/* Bought (desktop) */}
                                {!isMobile && (
                                  <span style={{ fontSize: '11px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.boughtXrp > 0 ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}>
                                    {r.boughtXrp > 0 ? fNumber(r.boughtXrp) : '—'}
                                  </span>
                                )}
                                {/* Sold (desktop) */}
                                {!isMobile && (
                                  <span style={{ fontSize: '11px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.soldXrp > 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}>
                                    {r.soldXrp > 0 ? fNumber(r.soldXrp) : '—'}
                                  </span>
                                )}
                                {/* Realized PnL */}
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    color: netPnl > 0 ? '#22c55e' : netPnl < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)'
                                  }}>
                                    {netPnl !== 0 ? `${netPnl > 0 ? '+' : '-'}${fNumber(Math.abs(netPnl))}` : '0'}
                                  </span>
                                  <div style={{ fontSize: '8px', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', textTransform: 'uppercase', fontWeight: 600 }}>XRP</div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </>
                    )}
                    {/* Empty state */}
                    {(!tokenFlow.recipients || tokenFlow.recipients.length === 0) && (
                      <div style={{
                        padding: '32px 20px',
                        textAlign: 'center',
                        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                        fontSize: '12px'
                      }}>
                        No recipient data available
                      </div>
                    )}
                  </ScrollableBox>
                </DialogPaper>
              </Dialog>,
              document.body
            )}
          </TableBody>
        </StyledTable>
      </Box>

      {/* Linked NFT Collections - Separate Section */}
      {linkedCollections?.length > 0 && (
        <Box
          style={{
            borderRadius: '12px',
            background: 'transparent',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
            width: '100%',
            marginBottom: '4px',
            overflow: 'hidden'
          }}
        >
          <Box
            style={{
              padding: '8px 10px 6px',
              background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'
            }}
          >
            <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
              <Layers size={12} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
              <Typography
                variant="h6"
                isDark={isDark}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(33,43,54,0.85)',
                  letterSpacing: '-0.01em'
                }}
              >
                NFT Collections
              </Typography>
            </Stack>
          </Box>
          <StyledTable size="small">
            <TableBody>
              {linkedCollections.map((col) => (
                <TableRowStyled
                  key={col.id}
                  isDark={isDark}
                  onClick={() => window.location.href = `/nfts/${col.slug}`}
                  style={{ cursor: 'pointer' }}
                >
                  <ModernTableCell style={{ width: '40%', padding: '6px 8px' }}>
                    <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                      <img
                        src={`https://s1.xrpl.to/nft-collection/${col.logoImage || col.id}`}
                        alt=""
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          objectFit: 'cover',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                        }}
                        onError={(e) => (e.target.src = '/static/alt.webp')}
                      />
                      <Stack style={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" alignItems="center" style={{ gap: '4px' }}>
                          <Typography
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isDark ? '#fff' : '#1a1a1a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {typeof col.name === 'object' ? col.name?.collection_name || '' : col.name || ''}
                          </Typography>
                          {(() => {
                            const v = col.verified === true || col.verified === 'yes' ? 4 : col.verified;
                            if (!v || v < 1 || v > 4) return null;
                            const colors = {
                              1: { bg: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(239,246,255,1)', fg: isDark ? '#60a5fa' : '#2563eb' },
                              2: { bg: isDark ? 'rgba(168,85,247,0.1)' : 'rgba(250,245,255,1)', fg: isDark ? '#c084fc' : '#9333ea' },
                              3: { bg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(255,251,235,1)', fg: isDark ? '#fbbf24' : '#d97706' },
                              4: { bg: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(240,253,244,1)', fg: isDark ? '#4ade80' : '#16a34a' },
                            };
                            const labels = { 1: 'Official', 2: 'Premium', 3: 'Standard', 4: 'Verified' };
                            return (
                              <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '8px', fontWeight: 500, background: colors[v].bg, color: colors[v].fg, flexShrink: 0 }}>
                                {labels[v]}
                              </span>
                            );
                          })()}
                        </Stack>
                        <Typography
                          style={{
                            fontSize: '9px',
                            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
                          }}
                        >
                          {fNumber(col.items || 0)} items
                        </Typography>
                      </Stack>
                    </Stack>
                  </ModernTableCell>
                  <ModernTableCell style={{ width: '20%', padding: '6px 4px', textAlign: 'center' }}>
                    <Typography style={{ fontSize: '8px', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      Floor
                    </Typography>
                    <Typography style={{ fontSize: '10px', fontWeight: 600, color: '#22c55e', whiteSpace: 'nowrap' }}>
                      ✕{fNumber(col.floor?.amount || col.floor || 0)}
                    </Typography>
                  </ModernTableCell>
                  <ModernTableCell style={{ width: '20%', padding: '6px 4px', textAlign: 'center' }}>
                    <Typography style={{ fontSize: '8px', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      Total Vol
                    </Typography>
                    <Typography style={{ fontSize: '10px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', whiteSpace: 'nowrap' }}>
                      ✕{fNumber(col.volume || col.totalVol24h || 0)}
                    </Typography>
                  </ModernTableCell>
                  <ModernTableCell style={{ width: '20%', padding: '6px 8px 6px 4px', textAlign: 'right' }}>
                    <Typography style={{ fontSize: '8px', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      MCap
                    </Typography>
                    <Typography style={{ fontSize: '10px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', whiteSpace: 'nowrap' }}>
                      ✕{fNumber(col.marketcap || 0)}
                    </Typography>
                  </ModernTableCell>
                </TableRowStyled>
              ))}
            </TableBody>
          </StyledTable>
        </Box>
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
        <Stack direction="row" style={{ flexWrap: 'wrap', gap: '6px' }}>
          {socialEntries.map(([platform, url]) => (
            <Link
              key={platform}
              href={getFullUrl(platform, url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: alpha('rgba(66,133,244,1)', 0.08),
                border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
                textDecoration: 'none'
              }}
            >
              {getIcon(platform)}
              <Typography
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#4285f4'
                }}
              >
                {getPlatformLabel(platform)}
              </Typography>
            </Link>
          ))}
        </Stack>
      );
    }

    return (
      <Stack direction="row" alignItems="center" style={{ gap: '6px' }}>
        {socialEntries.map(([platform, url]) => (
          <Tooltip key={platform} title={getPlatformLabel(platform)}>
            <Link
              href={getFullUrl(platform, url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              {getIcon(platform)}
            </Link>
          </Tooltip>
        ))}
      </Stack>
    );
  }
);

// Compact tags component for inline integration
export const CompactTags = memo(
  ({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
    if (!enhancedTags || enhancedTags.length === 0) return null;

    return (
      <Stack direction="row" alignItems="center" style={{ flexWrap: 'wrap', gap: '4px' }}>
        {enhancedTags.slice(0, maxTags).map((tag) => (
          <Link
            key={tag}
            href={`/view/${normalizeTag(tag)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              borderRadius: '4px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              textDecoration: 'none',
              fontSize: '10px',
              fontWeight: 500,
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.2px'
            }}
            rel="noreferrer noopener nofollow"
          >
            {tag === 'aigent.run' && (
              <img src="/static/aigentrun.gif" alt="" style={{ width: '10px', height: '10px' }} />
            )}
            {tag}
          </Link>
        ))}
        {enhancedTags.length > maxTags && (
          <Typography
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              fontSize: '10px',
              fontWeight: 500,
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
              cursor: toggleTagsDrawer ? 'pointer' : 'default'
            }}
            onClick={() => toggleTagsDrawer && toggleTagsDrawer(true)}
          >
            +{enhancedTags.length - maxTags}
          </Typography>
        )}
      </Stack>
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
    <Stack direction="row" alignItems="center" spacing={1} style={{ flexWrap: 'wrap', gap: '8px' }}>
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
    </Stack>
  )
);
