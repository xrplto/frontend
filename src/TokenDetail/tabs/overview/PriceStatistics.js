import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import styled from '@emotion/styled';
import { AlertTriangle, Copy, Twitter, Send, MessageCircle, Globe, Github, TrendingUp, Link as LinkIcon, Layers, CheckCircle, Sparkles, ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownLeft, Droplet, Flame, ArrowLeftRight, BarChart2, X, Link2, Settings, FileText, ChevronDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumber, fDate } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';

// Helper
const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);


// Custom components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'column'};
  align-items: ${props => props.alignItems || 'stretch'};
  gap: ${props => props.spacing ? `${props.spacing * 8}px` : '0'};
  flex-wrap: ${props => props.flexWrap || 'nowrap'};
`;
const Typography = styled.div`
  font-size: ${props =>
    props.variant === 'h6' ? '1.25rem' :
      props.variant === 'body2' ? '0.875rem' :
        props.variant === 'caption' ? '0.75rem' : '1rem'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props => props.color || (props.isDark ? '#FFFFFF' : '#212B36')};
  white-space: ${props => props.noWrap ? 'nowrap' : 'normal'};
`;
const Table = styled.table`
  width: 100%;
  background: transparent;
`;
const TableBody = styled.tbody``;
const TableRow = styled.tr``;
const TableCell = styled.td`
  padding: ${props => props.padding || '4px 6px'};
  border-bottom: none;
  text-align: ${props => props.align || 'left'};
`;
const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.size === 'small' ? '2px 8px' : '4px 12px'};
  border-radius: 8px;
  font-size: ${props => props.fontSize || '11px'};
  font-weight: 400;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
`;
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.size === 'small' ? '4px' : '8px'};
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
        <div style={{
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
        }}>
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
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const DialogPaper = styled.div`
  background: ${props => props.isDark ? '#0a0a0a' : '#ffffff'};
  border-radius: 14px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  padding: 0;
  max-width: 400px;
  width: 90%;
  margin: 0 auto;
`;
const DialogContent = styled.div`
  padding: 16px;
  text-align: ${props => props.textAlign || 'left'};
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
  padding: 8px 14px;
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
    background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'};
  }
`;

const SectionHeader = styled.div`
  padding: 10px 14px 6px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'};
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
    return <>{symbol}0.0<sub style={{ fontSize: '0.6em' }}>{formatted.zeros}</sub>{formatted.significant}</>;
  }
  return <>{symbol}{formatted}</>;
};

// ----------------------------------------------------------------------

export default function PriceStatistics({ token, isDark = false, linkedCollections = [] }) {
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const isMobile = useIsMobile();
  const [openScamWarning, setOpenScamWarning] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

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

  // Fetch AI review immediately
  useEffect(() => {
    if (!token.md5) return;

    if (aiAbortRef.current) aiAbortRef.current.abort();
    aiAbortRef.current = new AbortController();

    setAiLoading(true);
    fetch(`https://api.xrpl.to/api/ai/token/${token.md5}`, { signal: aiAbortRef.current.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.score !== undefined) {
          setAiReview(data);
        }
        setAiLoading(false);
      })
      .catch(e => {
        if (e.name !== 'AbortError') setAiLoading(false);
      });

    return () => aiAbortRef.current?.abort();
  }, [token.md5]);

  // Ref for activity fetch abort controller
  const activityAbortRef = useRef(null);

  const fetchActivity = async (filter, signal) => {
    if (!creator) return;
    setFilterLoading(true);
    setNoTokenActivity(false);

    try {
      let url = `https://api.xrpl.to/api/creators/${creator}?limit=12`;
      if (filter === 'swaps') url += '&side=sell,buy';
      else if (filter === 'transfers') url += '&side=transfer_out,receive';
      else if (filter === 'checks') url += '&side=check_incoming,check_create,check_receive,check_send,check_cancel';
      else if (filter === 'lp') url += '&side=deposit,withdraw,amm_create';

      // Parallel fetch for 'all' filter (creators + tx fallback)
      const fetches = [fetch(url, { signal }).then(r => r.json())];
      if (filter === 'all') {
        fetches.push(fetch(`https://api.xrpl.to/api/tx/${creator}?limit=12`, { signal }).then(r => r.json()));
      }

      const [data, txData] = await Promise.all(fetches);
      if (signal?.aborted) return;

      if (data?.events?.length > 0) {
        setTransactions(data.events);
        setHasWarning(data.signals?.length > 0 || data.warning || false);
        setSignals(data.signals || []);
        setCreatorStats(data.stats || null);
      } else if (filter === 'all' && txData?.result === 'success' && txData?.transactions) {
        // Use pre-fetched tx fallback
        setNoTokenActivity(true);
        const mapped = txData.transactions.map(t => {
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
            currency: !isXrp && amt?.currency ? (amt.currency.length > 3 ? Buffer.from(amt.currency, 'hex').toString().replace(/\0/g, '').trim() : amt.currency) : 'XRP',
            destination: tx.Destination
          };
        });
        setTransactions(mapped);
        const day = 24 * 60 * 60 * 1000;
        setHasWarning(mapped.some(t => t.result !== 'tesSUCCESS' && (Date.now() - t.time) < day));
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

  const voldivmarket = useMemo(() =>
    marketcap > 0 && vol24hxrp != null
      ? new Decimal(vol24hxrp || 0).div(marketcap || 1).toNumber()
      : 0,
    [marketcap, vol24hxrp]
  );

  // Memoized enhanced tags array
  const enhancedTags = useMemo(() => {
    const baseTags = tags || [];
    const originMap = {
      'FirstLedger': 'FirstLedger',
      'XPMarket': 'XPMarket',
      'LedgerMeme': 'LedgerMeme',
      'Horizon': 'Horizon',
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

  const hasScamTag = useMemo(() => enhancedTags.some((tag) => tag.toLowerCase() === 'scam'), [enhancedTags]);

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
  const toggleActivity = useCallback(() => setActivityOpen(prev => !prev), []);

  return (
    <Box
      style={{
        borderRadius: '12px',
        background: 'transparent',
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
        width: '100%',
        marginBottom: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Scam Warning Dialog */}
      {openScamWarning && (
        <Dialog open>
          <DialogPaper isDark={isDark} onClick={(e) => e.stopPropagation()}>
            <DialogContent style={{ textAlign: 'center', padding: '24px' }}>
              <AlertTriangle size={28} color="#ef4444" strokeWidth={1.5} style={{ marginBottom: '12px' }} />
              <Typography
                variant="h6"
                style={{
                  color: '#ef4444',
                  fontWeight: 500,
                  marginBottom: '10px',
                  fontSize: '16px',
                  letterSpacing: '-0.01em'
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
              <Button
                isDark={isDark}
                onClick={() => setOpenScamWarning(false)}
              >
                I Understand
              </Button>
            </DialogContent>
          </DialogPaper>
        </Dialog>
      )}

      {/* Header */}
      <Box
        style={{
          padding: '14px 14px 10px',
          background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'
        }}
      >
        <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22c55e'
          }} />
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
            Token Stats
          </Typography>
        </Stack>
      </Box>

      {/* Safety Score */}
      {(aiReview || aiLoading) && (
        <Box style={{
          margin: '8px 10px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`
        }}>
          {aiLoading ? (
            <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <Typography style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Analyzing...</Typography>
            </Stack>
          ) : aiReview && (() => {
            const score = aiReview.score;
            const color = score <= 2 ? '#22c55e' : score <= 4 ? '#84cc16' : score <= 6 ? '#f59e0b' : '#ef4444';
            const label = aiReview.riskLevel || (score <= 2 ? 'Low' : score <= 4 ? 'Moderate' : score <= 6 ? 'Elevated' : 'High');
            const Icon = score <= 2 ? ShieldCheck : score <= 6 ? ShieldAlert : AlertTriangle;

            return (
              <Stack direction="row" alignItems="center" style={{ gap: '10px' }}>
                <Icon size={15} color={color} strokeWidth={1.5} />
                <Stack direction="row" alignItems="baseline" style={{ gap: '3px' }}>
                  <Typography style={{ fontSize: '15px', fontWeight: 600, color, lineHeight: 1 }}>{score}</Typography>
                  <Typography style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>/10</Typography>
                </Stack>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ width: `${score * 10}%`, height: '100%', background: color }} />
                </div>
                <Typography style={{ fontSize: '10px', fontWeight: 500, color, textTransform: 'uppercase' }}>{label}</Typography>
                {aiReview.riskCount > 0 && (
                  <Typography style={{ fontSize: '10px', color: '#f59e0b' }}>{aiReview.riskCount} risk{aiReview.riskCount !== 1 ? 's' : ''}</Typography>
                )}
                {aiReview.positiveCount > 0 && (
                  <Typography style={{ fontSize: '10px', color: '#22c55e' }}>{aiReview.positiveCount} positive{aiReview.positiveCount !== 1 ? 's' : ''}</Typography>
                )}
              </Stack>
            );
          })()}
        </Box>
      )}

      <StyledTable size="small">
        <TableBody>
          {/* ========== MARKET METRICS GROUP ========== */}
          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                FDV Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                <Typography style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                  {currencySymbols[activeFiatCurrency]}{fNumber(amount * (exch / (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1)))}
                </Typography>
              </Stack>
            </ModernTableCell>
          </TableRowStyled>

          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                Volume Dominance
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Typography style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '13px' }}>
                {(dom || 0).toFixed(4)}%
              </Typography>
            </ModernTableCell>
          </TableRowStyled>

          {amount > 0 && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  Supply
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                  {fNumber(amount)}
                </Typography>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {(txns24h > 0 || vol24htx > 0) && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  Trades (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                  {fNumber(txns24h || vol24htx)}
                </Typography>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {uniqueTraders24h > 0 && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  Unique Traders (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                  {fNumber(uniqueTraders24h)}
                </Typography>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {/* ========== BUY/SELL METRICS GROUP ========== */}
          {(buy24hxrp > 0 || sell24hxrp > 0) && (
            <tr>
              <td colSpan={2} style={{ padding: '14px 14px 6px' }}>
                <Typography style={{ fontSize: '10px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  24h Trading
                </Typography>
              </td>
            </tr>
          )}

          {/* Buy/Sell Ratio Visual Bar */}
          {(buy24hxrp > 0 || sell24hxrp > 0) && (() => {
            const total = (buy24hxrp || 0) + (sell24hxrp || 0);
            const buyRaw = total > 0 ? ((buy24hxrp || 0) / total) * 100 : 0;
            const sellRaw = total > 0 ? ((sell24hxrp || 0) / total) * 100 : 0;
            // Ensure minimum 3% visual width if there's any activity
            const buyPct = buy24hxrp > 0 ? Math.max(buyRaw, 3) : 0;
            const sellPct = sell24hxrp > 0 ? Math.max(sellRaw, 3) : 0;
            // Format: show 1 decimal if < 1%, otherwise whole number
            const formatPct = (val) => val > 0 && val < 1 ? '<1' : val.toFixed(0);
            return (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell colSpan={2} style={{ padding: '6px 12px 10px' }}>
                  <Box style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <Stack direction="row" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <div style={{
                        width: `${buyPct}%`,
                        background: '#10b981',
                        transition: 'width 0.3s ease'
                      }} />
                      <div style={{
                        width: `${sellPct}%`,
                        background: '#f43f5e',
                        transition: 'width 0.3s ease'
                      }} />
                    </Stack>
                    <Stack direction="row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                      <Typography style={{ fontSize: '10px', color: '#10b981', fontWeight: 500 }}>
                        {formatPct(buyRaw)}% Buy
                      </Typography>
                      <Typography style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 500 }}>
                        {formatPct(sellRaw)}% Sell
                      </Typography>
                    </Stack>
                  </Box>
                </ModernTableCell>
              </TableRowStyled>
            );
          })()}

          {/* Buys (24h) Row - Always show */}
          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                Buys (24h)
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <Typography style={{ fontWeight: 500, color: '#10b981', fontSize: '13px' }}>
                  {fNumber(buy24hxrp || 0)} XRP
                </Typography>
                <Typography style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)', fontSize: '11px' }}>
                  {fNumber(buyTxns24h || buy24htx || 0)} tx
                </Typography>
              </Stack>
            </ModernTableCell>
          </TableRowStyled>

          {/* Unique Buyers (24h) Row - Always show */}
          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                Unique Buyers (24h)
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <Typography style={{ fontWeight: 500, color: '#10b981', fontSize: '13px' }}>
                  {fNumber(uniqueBuyers24h || 0)}
                </Typography>
                {(uniqueBuyers24h || 0) > 0 && (uniqueSellers24h || 0) > 0 && (() => {
                  const total = (uniqueBuyers24h || 0) + (uniqueSellers24h || 0);
                  const pct = Math.max(((uniqueBuyers24h || 0) / total) * 100, 15);
                  return (
                    <Box style={{ width: '40px', height: '4px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#10b981' }} />
                    </Box>
                  );
                })()}
              </Stack>
            </ModernTableCell>
          </TableRowStyled>

          {/* Sells (24h) Row - Always show */}
          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                Sells (24h)
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <Typography style={{ fontWeight: 500, color: '#f43f5e', fontSize: '13px' }}>
                  {fNumber(sell24hxrp || 0)} XRP
                </Typography>
                <Typography style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)', fontSize: '11px' }}>
                  {fNumber(sellTxns24h || sell24htx || 0)} tx
                </Typography>
              </Stack>
            </ModernTableCell>
          </TableRowStyled>

          {/* Unique Sellers (24h) Row - Always show */}
          <TableRowStyled isDark={isDark}>
            <ModernTableCell>
              <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                Unique Sellers (24h)
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <Typography style={{ fontWeight: 500, color: '#f43f5e', fontSize: '13px' }}>
                  {fNumber(uniqueSellers24h || 0)}
                </Typography>
                {(uniqueBuyers24h || 0) > 0 && (uniqueSellers24h || 0) > 0 && (() => {
                  const total = (uniqueBuyers24h || 0) + (uniqueSellers24h || 0);
                  const pct = Math.max(((uniqueSellers24h || 0) / total) * 100, 15);
                  return (
                    <Box style={{ width: '40px', height: '4px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f43f5e', marginLeft: 'auto' }} />
                    </Box>
                  );
                })()}
              </Stack>
            </ModernTableCell>
          </TableRowStyled>

          {/* ========== AMM LIQUIDITY GROUP ========== */}
          {(deposit24hxrp > 0 || withdraw24hxrp > 0) && (
            <tr>
              <td colSpan={2} style={{ padding: '14px 14px 6px' }}>
                <Typography style={{ fontSize: '10px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AMM Liquidity
                </Typography>
              </td>
            </tr>
          )}

          {/* AMM Flow Visual Bar */}
          {(deposit24hxrp > 0 || withdraw24hxrp > 0) && (() => {
            const depositAbs = Math.abs(deposit24hxrp || 0);
            const withdrawAbs = Math.abs(withdraw24hxrp || 0);
            const total = depositAbs + withdrawAbs;
            const inRaw = total > 0 ? (depositAbs / total) * 100 : 0;
            const outRaw = total > 0 ? (withdrawAbs / total) * 100 : 0;
            const inPct = depositAbs > 0 ? Math.max(inRaw, 3) : 0;
            const outPct = withdrawAbs > 0 ? Math.max(outRaw, 3) : 0;
            const formatPct = (val) => val > 0 && val < 1 ? '<1' : val.toFixed(0);
            return (
              <TableRowStyled isDark={isDark}>
                <ModernTableCell colSpan={2} style={{ padding: '6px 12px 10px' }}>
                  <Box style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <Stack direction="row" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <div style={{
                        width: `${inPct}%`,
                        background: '#10b981',
                        transition: 'width 0.3s ease'
                      }} />
                      <div style={{
                        width: `${outPct}%`,
                        background: '#f59e0b',
                        transition: 'width 0.3s ease'
                      }} />
                    </Stack>
                    <Stack direction="row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                      <Typography style={{ fontSize: '10px', color: '#10b981', fontWeight: 500 }}>
                        {formatPct(inRaw)}% Deposit
                      </Typography>
                      <Typography style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 500 }}>
                        {formatPct(outRaw)}% Withdraw
                      </Typography>
                    </Stack>
                  </Box>
                </ModernTableCell>
              </TableRowStyled>
            );
          })()}

          {/* AMM Deposits (24h) Row */}
          {deposit24hxrp ? (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  AMM Deposits (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography style={{ fontWeight: 500, color: '#10b981', fontSize: '13px' }}>
                    {fNumber(deposit24hxrp)} XRP
                  </Typography>
                  {deposit24htx ? (
                    <Typography style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)', fontSize: '11px' }}>
                      {fNumber(deposit24htx)} tx
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
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  AMM Withdrawals (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography style={{ fontWeight: 500, color: '#f59e0b', fontSize: '13px' }}>
                    {fNumber(Math.abs(withdraw24hxrp))} XRP
                  </Typography>
                  {withdraw24htx ? (
                    <Typography style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)', fontSize: '11px' }}>
                      {fNumber(withdraw24htx)} tx
                    </Typography>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRowStyled>
          ) : null}

          {/* LP Burned Percentage Row */}
          {(lpBurnedPercent != null || lpHolderCount > 0) && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell colSpan={2} style={{ padding: '8px 14px 12px' }}>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Typography style={{ fontSize: '13px', fontWeight: 400, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
                    LP Burned
                  </Typography>
                  <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                    <Typography style={{ fontSize: '13px', fontWeight: 500, color: (lpBurnedPercent || 0) >= 50 ? '#10b981' : (lpBurnedPercent || 0) >= 20 ? '#f59e0b' : '#f43f5e' }}>
                      {(lpBurnedPercent || 0).toFixed(2)}%
                    </Typography>
                    {lpBurnedHolders > 0 && (
                      <Typography style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}>
                        {lpBurnedHolders} burned
                      </Typography>
                    )}
                    {lpHolderCount > 0 && (
                      <Typography style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}>
                        {lpHolderCount} total
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                <Box style={{ height: '5px', borderRadius: '3px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(lpBurnedPercent || 0, 100)}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: (lpBurnedPercent || 0) >= 50 ? '#10b981' : (lpBurnedPercent || 0) >= 20 ? '#f59e0b' : '#f43f5e'
                  }} />
                </Box>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {/* ========== TOKEN INFO GROUP ========== */}
          {(date || dateon || creator) && (
            <tr>
              <td colSpan={2} style={{ padding: '14px 14px 6px' }}>
                <Typography style={{ fontSize: '10px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Token Info
                </Typography>
              </td>
            </tr>
          )}

          {/* Created Date Row */}
          {date || dateon ? (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  Created
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography style={{ fontWeight: 500, color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)", fontSize: '13px' }}>
                  {fDate(date || dateon)}
                </Typography>
              </ModernTableCell>
            </TableRowStyled>
          ) : null}

          {/* Creator Row */}
          {creator && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell>
                <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Tooltip title="Click to view activity">
                    <Chip
                      size="small"
                      onClick={toggleActivity}
                      style={{
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        borderRadius: '8px',
                        height: '28px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${activityOpen ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                        maxWidth: isMobile ? '110px' : '180px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{
                          fontWeight: 400,
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'
                        }}
                      >
                        {creator}
                      </Typography>
                    </Chip>
                  </Tooltip>
                  <Tooltip title="Copy address">
                    <IconButton
                      onClick={handleCopyCreator}
                      size="small"
                      style={{
                        padding: '4px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        flexShrink: 0
                      }}
                    >
                      <Copy size={13} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {/* Creator Last Action */}
          {creator && creatorLastAction && (
            <>
              <TableRowStyled isDark={isDark}>
                <ModernTableCell>
                  <Typography style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: '13px' }} noWrap>
                    Creator Last Action
                  </Typography>
                </ModernTableCell>
                <ModernTableCell>
                  <Tooltip title={`${creatorLastAction.type} - ${creatorLastAction.result}\nClick to view tx`}>
                    <Link
                      href={`/tx/${creatorLastAction.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                        <Typography
                          variant="body2"
                          style={{
                            fontWeight: 500,
                            color: creatorLastAction.side === 'buy' ? '#10b981' : creatorLastAction.side === 'sell' ? '#f43f5e' : '#8b5cf6',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {creatorLastAction.side || creatorLastAction.type}
                        </Typography>
                        {creatorLastAction.xrp > 0 && (
                          <Typography
                            variant="caption"
                            style={{
                              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                              fontSize: '11px'
                            }}
                          >
                            {fNumber(creatorLastAction.xrp)} XRP
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          style={{
                            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                            fontSize: '10px'
                          }}
                        >
                          {formatLastActionTime(creatorLastAction.time)}
                        </Typography>
                      </Stack>
                    </Link>
                  </Tooltip>
                </ModernTableCell>
              </TableRowStyled>
              {/* Creator Sell Warning */}
              {creatorLastAction.side === 'sell' && (
                <TableRowStyled isDark={isDark}>
                  <ModernTableCell colSpan={2} style={{ padding: '4px 12px 8px' }}>
                    <Stack direction="row" alignItems="center" style={{
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(239,68,68,0.08)',
                      borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.15)'
                    }}>
                      <AlertTriangle size={14} color="#ef4444" strokeWidth={1.5} />
                      <Typography style={{ color: '#ef4444', fontSize: '11px', fontWeight: 500 }}>
                        Creator sold {creatorLastAction.xrp > 0 ? `${fNumber(creatorLastAction.xrp)} XRP` : 'tokens'} {formatLastActionTime(creatorLastAction.time)}
                      </Typography>
                    </Stack>
                  </ModernTableCell>
                </TableRowStyled>
              )}
            </>
          )}

          {/* Creator Token Count - Full Width Warning Banner */}
          {creator && creatorTokens > 0 && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell colSpan={2} style={{ padding: '6px 12px 10px' }}>
                <Box
                  style={{
                    borderRadius: '10px',
                    padding: '12px 14px',
                    background: creatorTokens >= 10
                      ? 'rgba(239,68,68,0.08)'
                      : creatorTokens >= 5
                        ? 'rgba(245,158,11,0.06)'
                        : creatorTokens >= 2
                          ? (isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)')
                          : (isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)'),
                    border: `1px solid ${creatorTokens >= 10
                        ? 'rgba(239,68,68,0.2)'
                        : creatorTokens >= 5
                          ? 'rgba(245,158,11,0.18)'
                          : creatorTokens >= 2
                            ? 'rgba(59,130,246,0.12)'
                            : 'rgba(34,197,94,0.12)'
                      }`
                  }}
                >
                  <Stack direction="row" alignItems="center" style={{ justifyContent: 'space-between', gap: '12px' }}>
                    {/* Left - Icon + Text */}
                    <Stack direction="row" alignItems="center" style={{ gap: '10px', flex: 1 }}>
                      {creatorTokens >= 5 ? (
                        <AlertTriangle size={16} color={creatorTokens >= 10 ? '#ef4444' : '#f59e0b'} strokeWidth={1.5} />
                      ) : creatorTokens >= 2 ? (
                        <Layers size={15} color="#3b82f6" strokeWidth={1.5} />
                      ) : (
                        <CheckCircle size={15} color="#10b981" strokeWidth={1.5} />
                      )}
                      <Typography
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)'
                        }}
                      >
                        {creatorTokens >= 10 ? 'Serial launcher' : creatorTokens >= 5 ? 'Multiple tokens' : creatorTokens >= 2 ? 'Has other tokens' : 'First token'}
                      </Typography>
                    </Stack>

                    {/* Right - Count + Badge + Exchange */}
                    <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                      <Typography
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : creatorTokens >= 2 ? '#3b82f6' : '#10b981'
                        }}
                      >
                        {creatorTokens}
                      </Typography>
                      {creatorTokens >= 2 && (
                        <Chip
                          size="small"
                          style={{
                            height: '22px',
                            borderRadius: '6px',
                            background: creatorTokens >= 10 ? 'rgba(239,68,68,0.1)' : creatorTokens >= 5 ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.06)',
                            border: `1px solid ${creatorTokens >= 10 ? 'rgba(239,68,68,0.2)' : creatorTokens >= 5 ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.12)'}`,
                            color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : '#3b82f6',
                            fontSize: '9px',
                            fontWeight: 600,
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}
                        >
                          {creatorTokens >= 10 ? 'HIGH RISK' : creatorTokens >= 5 ? 'CAUTION' : 'MODERATE'}
                        </Chip>
                      )}
                      {creatorExchange && (
                        <Chip
                          size="small"
                          style={{
                            height: '22px',
                            borderRadius: '6px',
                            background: 'rgba(34,197,94,0.06)',
                            border: '1px solid rgba(34,197,94,0.12)',
                            color: '#10b981',
                            fontSize: '9px',
                            fontWeight: 600,
                            paddingLeft: '8px',
                            paddingRight: '8px'
                          }}
                        >
                          {creatorExchange}
                        </Chip>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </ModernTableCell>
            </TableRowStyled>
          )}

          {/* Creator Activity - Inline */}
          {creator && activityOpen && (
            <TableRowStyled isDark={isDark}>
              <ModernTableCell colSpan={2} style={{ padding: '4px 12px 10px' }}>
                <Box style={{
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '10px',
                  padding: '12px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`
                }}>
                  {/* Filter Tabs */}
                  <Stack direction="row" style={{ gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'swaps', label: 'Swaps', color: '#3b82f6' },
                      { key: 'transfers', label: 'Transfers', color: '#9C27B0' },
                      { key: 'checks', label: 'Checks', color: '#f59e0b' },
                      { key: 'lp', label: 'LP', color: '#22c55e' }
                    ].map(f => (
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
                          background: activityFilter === f.key
                            ? (f.color ? `${f.color}15` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'))
                            : 'transparent',
                          color: activityFilter === f.key
                            ? (f.color || (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'))
                            : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                          border: `1px solid ${activityFilter === f.key ? (f.color ? `${f.color}25` : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')) : 'transparent'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f.label}
                      </Typography>
                    ))}
                  </Stack>

                  {/* Stats Summary */}
                  {creatorStats && (
                    <Stack direction="row" style={{ gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {creatorStats.buy?.count > 0 && (
                        <Typography variant="caption" style={{ fontSize: '10px', color: '#22c55e' }}>
                          {creatorStats.buy.count} buys · {fNumber(creatorStats.buy.xrp)} XRP
                        </Typography>
                      )}
                      {creatorStats.sell?.count > 0 && (
                        <Typography variant="caption" style={{ fontSize: '10px', color: '#ef4444' }}>
                          {creatorStats.sell.count} sells · {fNumber(creatorStats.sell.xrp)} XRP
                        </Typography>
                      )}
                      {creatorStats.transfer_out?.count > 0 && (
                        <Typography variant="caption" style={{ fontSize: '10px', color: '#9C27B0' }}>
                          {creatorStats.transfer_out.count} transfers
                        </Typography>
                      )}
                      {creatorStats.sellBuyRatio !== undefined && creatorStats.sellBuyRatio > 0 && (
                        <Typography variant="caption" style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          Sell ratio: {(creatorStats.sellBuyRatio * 100).toFixed(0)}%
                        </Typography>
                      )}
                    </Stack>
                  )}

                  {/* Warning Banner */}
                  {hasWarning && signals.length > 0 && (
                    <Stack direction="row" alignItems="center" style={{ gap: '8px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <AlertTriangle size={14} color="#ef4444" strokeWidth={1.5} />
                      <Stack style={{ flex: 1 }}>
                        <Typography variant="caption" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 500 }}>
                          {signals.map(s => s.msg).join(' · ')}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}

                  {/* No token activity notice */}
                  {noTokenActivity && transactions.length > 0 && (
                    <Stack direction="row" alignItems="center" style={{ gap: '8px', marginBottom: '10px', padding: '8px 10px', background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.12)' }}>
                      <Typography variant="caption" style={{ color: '#3b82f6', fontSize: '10px' }}>
                        No token trades found — showing general account activity
                      </Typography>
                    </Stack>
                  )}

                  {/* Loading / Empty / List */}
                  {(loadingTx || filterLoading) ? (
                    <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '11px', padding: '8px 0' }}>
                      Loading...
                    </Typography>
                  ) : transactions.length === 0 ? (
                    <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '11px', padding: '8px 0' }}>
                      No activity found
                    </Typography>
                  ) : (
                    <Stack spacing={0}>
                      {transactions.map((event, i) => {
                        const { side, tokenAmount, xrpAmount, result, time, hash, ledger, type, currency, destination, name } = event;
                        const tokenName = name || currency;
                        const isFailed = result && result !== 'tesSUCCESS';

                        // Side-based styling with fallback to type
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
                        const cfg = sideConfig[side] || sideConfig[side?.toLowerCase()] || typeConfig[type] || { label: type?.slice(0, 8) || 'TX', color: '#9C27B0', Icon: null };
                        const displayColor = isFailed ? '#ef4444' : cfg.color;

                        // Time ago - compact
                        const diffMs = time ? Date.now() - time : 0;
                        const mins = Math.floor(diffMs / 60000);
                        const hours = Math.floor(diffMs / 3600000);
                        const days = Math.floor(diffMs / 86400000);
                        const timeAgo = days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : mins > 0 ? `${mins}m` : 'now';

                        // Format amounts
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
                                borderBottom: i < transactions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none',
                                opacity: isFailed ? 0.5 : 1,
                                cursor: 'pointer',
                                gap: '8px'
                              }}
                            >
                              {/* Icon */}
                              {cfg.Icon && <cfg.Icon size={13} style={{ color: displayColor, flexShrink: 0 }} />}

                              {/* Action */}
                              <Typography variant="caption" style={{
                                color: displayColor,
                                fontSize: '10px',
                                fontWeight: 600,
                                width: '65px',
                                flexShrink: 0
                              }}>{cfg.label}{isFailed && ' ✕'}</Typography>

                              {/* Amount + Token */}
                              <Typography variant="caption" style={{
                                flex: 1,
                                color: hasToken ? (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                fontSize: '11px',
                                fontWeight: 500,
                                fontFamily: 'var(--font-mono)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {hasToken ? (
                                  <>
                                    {fNumber(tokenAmount)} {displayCurrency}
                                    {(side === 'check_receive' || side === 'check_incoming') && amount > 0 && tokenAmount > 0 && (
                                      <span style={{
                                        marginLeft: '6px',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        background: ((tokenAmount / amount) * 100) >= 6 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
                                        color: ((tokenAmount / amount) * 100) >= 6 ? '#ef4444' : '#f59e0b'
                                      }}>
                                        {((tokenAmount / amount) * 100).toFixed(((tokenAmount / amount) * 100) < 0.01 ? 4 : 2)}%
                                      </span>
                                    )}
                                  </>
                                ) : '—'}
                              </Typography>

                              {/* XRP Value */}
                              <Typography variant="caption" style={{
                                width: '80px',
                                textAlign: 'right',
                                color: hasXrp ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                                fontSize: '11px',
                                fontWeight: hasXrp ? 500 : 400,
                                fontFamily: 'var(--font-mono)',
                                flexShrink: 0
                              }}>
                                {hasXrp ? `${fNumber(xrpAmount)} XRP` : '—'}
                              </Typography>

                              {/* Hash + Time */}
                              <Typography variant="caption" style={{
                                width: '70px',
                                textAlign: 'right',
                                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                fontSize: '9px',
                                fontFamily: 'var(--font-mono)',
                                flexShrink: 0
                              }}>
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

        </TableBody>
      </StyledTable>

      {/* Social Links & Tags Section */}
      {(social || enhancedTags.length > 0) && (
        <Box style={{ padding: '10px 14px 14px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
          <Stack direction="row" alignItems="center" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <CompactTags enhancedTags={enhancedTags} maxTags={isMobile ? 4 : 6} isDark={isDark} />
            <CompactSocialLinks social={social} size="small" isDark={isDark} />
          </Stack>
        </Box>
      )}

      {/* Linked NFT Collections */}
      {linkedCollections?.length > 0 && (
        <Box style={{ padding: '12px 14px 14px' }}>
          <SectionHeader style={{ padding: 0, marginTop: 0, marginBottom: '10px' }}>
            <Layers size={12} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
            <SectionLabel isDark={isDark}>NFT Collections</SectionLabel>
          </SectionHeader>
          <Stack style={{ gap: '6px' }}>
            {linkedCollections.map((col) => (
              <Link
                key={col.id}
                href={`/nfts/${col.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)';
                }}
              >
                <img
                  src={`https://s1.xrpl.to/nft-collection/${col.logoImage || col.id}`}
                  alt={typeof col.name === 'object' ? col.name?.collection_name || '' : col.name || ''}
                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
                  onError={(e) => (e.target.src = '/static/alt.webp')}
                />
                <Stack style={{ flex: 1, minWidth: 0 }}>
                  <Typography style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof col.name === 'object' ? col.name?.collection_name || '' : col.name || ''}
                  </Typography>
                  <Stack direction="row" style={{ gap: '10px', marginTop: '2px' }}>
                    <Typography style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
                      {fNumber(col.items)} items
                    </Typography>
                    {col.floor?.amount > 0 && (
                      <Typography style={{ fontSize: '11px', color: '#22c55e', fontWeight: 500 }}>
                        ✕{fNumber(col.floor.amount)}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Link>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
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
export const CompactSocialLinks = memo(({ social, toggleLinksDrawer, size = 'small', isDark = false, fullWidth = false }) => {
  const isMobile = useIsMobile();

  const socialEntries = useMemo(() =>
    social ? Object.entries(social).filter(([, value]) => value) : [],
    [social]
  );

  if (socialEntries.length === 0) return null;

  const getIcon = (platform) => {
    const iconSize = isMobile ? 14 : 14;
    const color = '#4285f4';
    switch (platform) {
      case 'twitter':
      case 'x': return <Twitter size={iconSize} color={color} />;
      case 'telegram': return <Send size={iconSize} color={color} />;
      case 'discord': return <MessageCircle size={iconSize} color={color} />;
      case 'website': return <Globe size={iconSize} color={color} />;
      case 'github': return <Github size={iconSize} color={color} />;
      case 'reddit': return <TrendingUp size={iconSize} color={color} />;
      default: return <LinkIcon size={iconSize} color={color} />;
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case 'twitter':
      case 'x': return 'Twitter';
      case 'telegram': return 'Telegram';
      case 'discord': return 'Discord';
      case 'website': return 'Website';
      case 'github': return 'GitHub';
      case 'reddit': return 'Reddit';
      case 'facebook': return 'Facebook';
      case 'linkedin': return 'LinkedIn';
      case 'instagram': return 'Instagram';
      case 'youtube': return 'YouTube';
      case 'medium': return 'Medium';
      case 'tiktok': return 'TikTok';
      case 'twitch': return 'Twitch';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
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
});

// Compact tags component for inline integration
export const CompactTags = memo(({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
  if (!enhancedTags || enhancedTags.length === 0) return null;

  return (
    <Stack direction="row" alignItems="center" style={{ flexWrap: 'wrap', gap: '6px' }}>
      {enhancedTags.slice(0, maxTags).map((tag) => (
        <Link
          key={tag}
          href={`/view/${normalizeTag(tag)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 400,
            color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
          rel="noreferrer noopener nofollow"
        >
          {tag === 'aigent.run' && (
            <img src="/static/aigentrun.gif" alt="" style={{ width: '12px', height: '12px' }} />
          )}
          {tag}
        </Link>
      ))}
      {enhancedTags.length > maxTags && (
        <Typography
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
            fontSize: '11px',
            fontWeight: 400,
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
});

// Combined component for easy usage
export const CompactSocialAndTags = memo(({
  social,
  enhancedTags,
  toggleLinksDrawer,
  toggleTagsDrawer,
  maxTags = 3,
  socialSize = 'small',
  isDark = false
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    style={{ flexWrap: 'wrap', gap: '8px' }}
  >
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
));
