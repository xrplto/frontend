import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import { useState, useEffect, useContext, useRef } from 'react';
import styled from '@emotion/styled';
import { AlertTriangle, Copy, Twitter, Send, MessageCircle, Globe, Github, TrendingUp, Link as LinkIcon, Layers, CheckCircle } from 'lucide-react';
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
  padding: 10px 12px;
  border-bottom: none;
  vertical-align: middle;
  &:first-of-type {
    width: 48%;
  }
  &:last-of-type {
    width: 52%;
    text-align: right;
  }
`;

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

// ----------------------------------------------------------------------

export default function PriceStatistics({ token, isDark = false }) {
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const [isMobile, setIsMobile] = useState(false);
  const [openScamWarning, setOpenScamWarning] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const [activityFilter, setActivityFilter] = useState('all');
  const [filterLoading, setFilterLoading] = useState(false);
  const [noTokenActivity, setNoTokenActivity] = useState(false);

  // Ref for activity fetch abort controller
  const activityAbortRef = useRef(null);

  const fetchActivity = async (filter, signal) => {
    if (!creator) return;
    setFilterLoading(true);
    setNoTokenActivity(false);

    try {
      // First try creator-activity API (token-specific)
      let url = `https://api.xrpl.to/api/creators/${creator}?limit=12`;
      if (filter === 'sells') url += '&side=sell';
      else if (filter === 'buys') url += '&side=buy';
      else if (filter === 'amm') url += '&type=AMMDeposit,AMMWithdraw';
      else if (filter === 'exits') url += '&side=sell,withdraw';

      const res = await fetch(url, { signal });
      if (signal?.aborted) return;
      const data = await res.json();

      if (data?.events?.length > 0) {
        setTransactions(data.events);
        setHasWarning(data.warning || false);
      } else if (filter === 'all') {
        // Fallback to account_tx for general activity
        setNoTokenActivity(true);
        const txRes = await fetch(`https://api.xrpl.to/api/account_tx/${creator}?limit=12`, { signal });
        if (signal?.aborted) return;
        const txData = await txRes.json();
        if (txData?.result === 'success' && txData?.transactions) {
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
          // Check for failed in last 24h
          const day = 24 * 60 * 60 * 1000;
          setHasWarning(mapped.some(t => t.result !== 'tesSUCCESS' && (Date.now() - t.time) < day));
        } else {
          setTransactions([]);
        }
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

  const voldivmarket =
    marketcap > 0 && vol24hxrp != null
      ? new Decimal(vol24hxrp || 0).div(marketcap || 1).toNumber()
      : 0;

  // Create enhanced tags array that includes origin-based tags (same as UserDesc.js)
  const getOriginTag = (origin) => {
    switch (origin) {
      case 'FirstLedger':
        return 'FirstLedger';
      case 'XPMarket':
        return 'XPMarket';
      case 'LedgerMeme':
        return 'LedgerMeme';
      case 'Horizon':
        return 'Horizon';
      case 'aigent.run':
        return 'aigent.run';
      case 'Magnetic X':
        return 'Magnetic X';
      case 'xrp.fun':
        return 'xrp.fun';
      default:
        return null;
    }
  };

  const enhancedTags = (() => {
    const baseTags = tags || [];
    const originTag = getOriginTag(origin);

    if (originTag && !baseTags.includes(originTag)) {
      return [originTag, ...baseTags];
    }

    return baseTags;
  })();

  const hasScamTag = enhancedTags.some((tag) => tag.toLowerCase() === 'scam');

  useEffect(() => {
    if (hasScamTag) {
      setOpenScamWarning(true);
    }
  }, [hasScamTag]);

  return (
    <Box
      style={{
        borderRadius: '14px',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
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
          padding: '12px 14px 8px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`
        }}
      >
        <Typography
          variant="h6"
          isDark={isDark}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(33,43,54,0.5)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase'
          }}
        >
          Token Stats
        </Typography>
      </Box>

      <StyledTable size="small" style={{ marginTop: '6px' }}>
        <TableBody>
          {/* ========== MARKET METRICS GROUP ========== */}

          {/* Fully Diluted Market Cap Row */}
          <TableRow>
            <ModernTableCell>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                  fontSize: '12px'
                }}
                noWrap
              >
                FDV Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                  fontSize: '13px'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(amount * (exch / (metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1)))}
              </Typography>
            </ModernTableCell>
          </TableRow>

          {/* Market Dominance Row */}
          <TableRow>
            <ModernTableCell>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                  fontSize: '12px'
                }}
                noWrap
              >
                Volume Dominance
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                  fontSize: '13px'
                }}
              >
                {(dom || 0).toFixed(6)}%
              </Typography>
            </ModernTableCell>
          </TableRow>


          {/* ========== SUPPLY & HOLDERS GROUP ========== */}

          {/* Supply Row */}
          {amount ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Supply
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                    fontSize: '13px'
                  }}
                >
                  {fNumber(amount)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}


          {/* ========== 24H TRADING ACTIVITY GROUP ========== */}

          {/* Trades (24h) Row */}
          {(txns24h || vol24htx) ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Trades (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                    fontSize: '13px'
                  }}
                >
                  {fNumber(txns24h || vol24htx)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Unique Traders (24h) Row */}
          {uniqueTraders24h ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Unique Traders (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                    fontSize: '13px'
                  }}
                >
                  {fNumber(uniqueTraders24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* ========== BUY/SELL METRICS GROUP ========== */}


          {/* Buys (24h) Row - Always show */}
          <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Buys (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 500,
                      color: '#10b981',
                      fontSize: '13px'
                    }}
                  >
                    {fNumber(buy24hxrp || 0)} XRP
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{
                      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                      fontSize: '11px'
                    }}
                  >
                    {fNumber(buyTxns24h || buy24htx || 0)} tx
                  </Typography>
                </Stack>
              </ModernTableCell>
            </TableRow>

          {/* Unique Buyers (24h) Row - Always show */}
          <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Unique Buyers (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: '#10b981',
                    fontSize: '13px'
                  }}
                >
                  {fNumber(uniqueBuyers24h || 0)}
                </Typography>
              </ModernTableCell>
            </TableRow>

          {/* Sells (24h) Row - Always show */}
          <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Sells (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 500,
                      color: '#f43f5e',
                      fontSize: '13px'
                    }}
                  >
                    {fNumber(sell24hxrp || 0)} XRP
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{
                      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                      fontSize: '11px'
                    }}
                  >
                    {fNumber(sellTxns24h || sell24htx || 0)} tx
                  </Typography>
                </Stack>
              </ModernTableCell>
            </TableRow>

          {/* Unique Sellers (24h) Row - Always show */}
          <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Unique Sellers (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: '#f43f5e',
                    fontSize: '13px'
                  }}
                >
                  {fNumber(uniqueSellers24h || 0)}
                </Typography>
              </ModernTableCell>
            </TableRow>

          {/* ========== AMM LIQUIDITY GROUP ========== */}

          {/* AMM Deposits (24h) Row */}
          {deposit24hxrp ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  AMM Deposits (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 500,
                      color: '#10b981',
                      fontSize: '13px'
                    }}
                  >
                    {fNumber(deposit24hxrp)} XRP
                  </Typography>
                  {deposit24htx ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                        fontSize: '11px'
                      }}
                    >
                      {fNumber(deposit24htx)} tx
                    </Typography>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* AMM Withdrawals (24h) Row */}
          {withdraw24hxrp ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  AMM Withdrawals (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 500,
                      color: '#f59e0b',
                      fontSize: '13px'
                    }}
                  >
                    {fNumber(withdraw24hxrp)} XRP
                  </Typography>
                  {withdraw24htx ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                        fontSize: '11px'
                      }}
                    >
                      {fNumber(withdraw24htx)} tx
                    </Typography>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* ========== TOKEN INFO GROUP ========== */}

          {/* Created Date Row */}
          {date || dateon ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Created
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 500,
                    color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)",
                    fontSize: '13px'
                  }}
                >
                  {fDate(date || dateon)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Creator Row */}
          {creator && (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                    fontSize: '12px'
                  }}
                  noWrap
                >
                  Creator
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1.25} style={{ minWidth: 0, flex: 1, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                  <Tooltip title="Click to view activity">
                    <Chip
                      size="small"
                      onClick={() => setActivityOpen(!activityOpen)}
                      style={{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        borderRadius: '8px',
                        height: '28px',
                        background: activityOpen ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
                        border: `1px solid ${activityOpen ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.15)'}`,
                        color: '#8b5cf6',
                        fontWeight: 400,
                        minWidth: 0,
                        maxWidth: isMobile ? '100px' : '200px',
                        overflow: 'hidden',
                        flexShrink: 1,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ fontWeight: 500, fontSize: isMobile ? '10px' : '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {creator}
                      </Typography>
                    </Chip>
                  </Tooltip>
                  <Tooltip title="Copy creator address">
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(creator).then(() => {
                          openSnackbar('Copied!', 'success');
                        });
                      }}
                      size="small"
                      style={{
                        padding: '4px',
                        width: isMobile ? '24px' : '26px',
                        height: isMobile ? '24px' : '26px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Copy size={isMobile ? 11 : 13} color="#8b5cf6" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Creator Last Action */}
          {creator && creatorLastAction && (
            <>
              <TableRow>
                <ModernTableCell>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 400,
                      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(33,43,54,0.6)",
                      fontSize: '12px'
                    }}
                    noWrap
                  >
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
              </TableRow>
              {/* Creator Sell Warning */}
              {creatorLastAction.side === 'sell' && (
                <TableRow>
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
                </TableRow>
              )}
            </>
          )}

          {/* Creator Token Count - Full Width Warning Banner */}
          {creator && creatorTokens > 0 && (
            <TableRow>
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
                    border: `1px solid ${
                      creatorTokens >= 10
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
            </TableRow>
          )}

          {/* Creator Activity - Inline */}
          {creator && activityOpen && (
            <TableRow>
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
                      { key: 'exits', label: 'Exits', color: '#ef4444' },
                      { key: 'sells', label: 'Sells' },
                      { key: 'buys', label: 'Buys' },
                      { key: 'amm', label: 'AMM' }
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

                  {/* Warning Banner */}
                  {hasWarning && (
                    <Stack direction="row" alignItems="center" style={{ gap: '8px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <AlertTriangle size={14} color="#ef4444" strokeWidth={1.5} />
                      <Stack style={{ flex: 1 }}>
                        <Typography variant="caption" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 500 }}>Exit Signal Detected</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '10px' }}>Creator has failed transactions in the last 24 hours</Typography>
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
                      {/* Header */}
                      <Stack direction="row" style={{ padding: '0 0 8px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`, marginBottom: '6px' }}>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '9px', fontWeight: 500, width: '70px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '9px', fontWeight: 500, flex: 1, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '9px', fontWeight: 500, width: '70px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>XRP</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: '9px', fontWeight: 500, width: '50px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</Typography>
                      </Stack>

                      {transactions.map((event, i) => {
                        const { side, tokenAmount, xrpAmount, result, time, hash, ledger, type, currency, destination } = event;
                        const isFailed = result && result !== 'tesSUCCESS';

                        // Side-based styling with fallback to type
                        const sideConfig = {
                          sell: { label: 'SELL', color: '#ef4444', icon: '📤' },
                          buy: { label: 'BUY', color: '#22c55e', icon: '📥' },
                          deposit: { label: 'DEPOSIT', color: '#22c55e', icon: '💧' },
                          withdraw: { label: 'WITHDRAW', color: '#f59e0b', icon: '🔥' },
                          receive: { label: 'RECEIVE', color: '#22c55e', icon: '📥' },
                          send: { label: 'SEND', color: '#f59e0b', icon: '📤' },
                          clawback: { label: 'CLAWBACK', color: '#ef4444', icon: '⚠️' },
                          check_create: { label: 'CHECK', color: '#3b82f6', icon: '📝' },
                          check_receive: { label: 'CHECK IN', color: '#22c55e', icon: '📥' },
                          check_send: { label: 'CHECK OUT', color: '#ef4444', icon: '📤' }
                        };
                        const typeConfig = {
                          Payment: { label: 'TRANSFER', color: '#9C27B0', icon: '↔️' },
                          AMMDeposit: { label: 'AMM ADD', color: '#22c55e', icon: '💧' },
                          AMMWithdraw: { label: 'AMM EXIT', color: '#f59e0b', icon: '🔥' },
                          OfferCreate: { label: 'OFFER', color: '#3b82f6', icon: '📊' },
                          OfferCancel: { label: 'CANCEL', color: '#9C27B0', icon: '❌' },
                          TrustSet: { label: 'TRUST', color: '#3b82f6', icon: '🔗' },
                          AccountSet: { label: 'SETTINGS', color: '#6b7280', icon: '⚙️' },
                          Clawback: { label: 'CLAWBACK', color: '#ef4444', icon: '⚠️' }
                        };
                        const cfg = side ? sideConfig[side] : (typeConfig[type] || { label: type?.slice(0,8), color: '#9C27B0', icon: '•' });
                        const displayColor = isFailed ? '#ef4444' : cfg.color;

                        // Time ago
                        const diffMs = time ? Date.now() - time : 0;
                        const mins = Math.floor(diffMs / 60000);
                        const hours = Math.floor(diffMs / 3600000);
                        const days = Math.floor(diffMs / 86400000);
                        const timeAgo = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : 'just now';

                        // Format amounts
                        const hasToken = tokenAmount > 0;
                        const hasXrp = xrpAmount > 0.001;
                        const displayCurrency = currency || 'tokens';

                        return (
                          <Stack
                            key={hash || i}
                            direction="row"
                            alignItems="center"
                            style={{
                              padding: '8px 0',
                              borderBottom: i < transactions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` : 'none',
                              opacity: isFailed ? 0.5 : 1
                            }}
                          >
                            {/* Action */}
                            <Stack direction="row" alignItems="center" style={{ width: '70px', gap: '5px' }}>
                              <Tooltip title={`${type}\n${result}\nLedger: ${ledger}`}>
                                <Link
                                  href={`/tx/${hash}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span style={{ fontSize: '11px' }}>{cfg.icon}</span>
                                  <Typography variant="caption" style={{
                                    color: displayColor,
                                    fontSize: '10px',
                                    fontWeight: 500
                                  }}>{cfg.label}</Typography>
                                </Link>
                              </Tooltip>
                              {isFailed && <span style={{ fontSize: '9px' }}>✕</span>}
                            </Stack>

                            {/* Token Amount */}
                            <Tooltip title={hasToken ? `${fNumber(tokenAmount)} ${displayCurrency}` : ''}>
                              <Typography variant="caption" style={{
                                flex: 1,
                                textAlign: 'right',
                                color: hasToken ? (isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                fontSize: '11px',
                                fontWeight: hasToken ? 500 : 400,
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {hasToken ? `${fNumber(tokenAmount)}` : '—'}
                              </Typography>
                            </Tooltip>

                            {/* XRP Amount */}
                            <Tooltip title={hasXrp ? `${fNumber(xrpAmount)} XRP${destination ? `\nTo: ${destination.slice(0,8)}...` : ''}` : ''}>
                              <Typography variant="caption" style={{
                                width: '70px',
                                textAlign: 'right',
                                color: hasXrp ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                fontSize: '11px',
                                fontWeight: hasXrp ? 500 : 400,
                                fontFamily: 'monospace'
                              }}>
                                {hasXrp ? `${fNumber(xrpAmount)}` : '—'}
                              </Typography>
                            </Tooltip>

                            {/* Time */}
                            <Typography variant="caption" style={{
                              width: '50px',
                              textAlign: 'right',
                              color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                              fontSize: '10px'
                            }}>
                              {timeAgo}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </ModernTableCell>
            </TableRow>
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
export const CompactSocialLinks = ({ social, toggleLinksDrawer, size = 'small', isDark = false, fullWidth = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!social) return null;

  const socialEntries = Object.entries(social).filter(([key, value]) => value);
  if (socialEntries.length === 0) return null;

  const getIcon = (platform) => {
    const iconSize = isMobile ? 14 : 14;
    const color = '#4285f4';
    switch(platform) {
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
    switch(platform) {
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
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {getIcon(platform)}
          </Link>
        </Tooltip>
      ))}
    </Stack>
  );
};

// Compact tags component for inline integration
export const CompactTags = ({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
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
            padding: '5px 10px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            textDecoration: 'none',
            fontSize: '10px',
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            transition: 'all 0.15s ease'
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
            padding: '5px 10px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
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
};

// Combined component for easy usage
export const CompactSocialAndTags = ({
  social,
  enhancedTags,
  toggleLinksDrawer,
  toggleTagsDrawer,
  maxTags = 3,
  socialSize = 'small',
  isDark = false
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
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
  );
};
