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
  background: rgba(0,0,0,0.6);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const DialogPaper = styled.div`
  background: ${props => props.isDark ? '#0a0a0a' : '#ffffff'};
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  padding: 0;
  max-width: 600px;
  width: 100%;
`;
const DialogContent = styled.div`
  padding: 16px;
  text-align: ${props => props.textAlign || 'left'};
`;
const Button = styled.button`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 400;
  border-radius: 12px;
  border: 1.5px solid rgba(244, 67, 54, 0.3);
  cursor: pointer;
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  &:hover {
    background: rgba(244, 67, 54, 0.15);
    border-color: rgba(244, 67, 54, 0.4);
  }
`;

const StyledTable = styled(Table)`
  margin-top: 4px;
  table-layout: fixed;
`;

const ModernTableCell = styled(TableCell)`
  padding: 8px 10px;
  border-bottom: none;
  vertical-align: middle;
  &:first-of-type {
    width: 50%;
  }
  &:last-of-type {
    width: 50%;
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
    dateon
  } = token;

  // Use creatorTokenCount from API directly
  const creatorTokens = creatorTokenCount || 0;

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
      let url = `https://api.xrpl.to/api/creator-activity/${creator}?limit=12`;
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
        borderRadius: '12px',
        background: 'transparent',
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        width: '100%',
        marginBottom: '6px',
        overflow: 'hidden'
      }}
    >
      {/* Scam Warning Dialog */}
      {openScamWarning && (
        <Dialog open>
          <DialogPaper isDark={isDark} onClick={(e) => e.stopPropagation()}>
            <DialogContent style={{ textAlign: 'center', padding: '16px' }}>
              <AlertTriangle size={32} color="#f44336" style={{ marginBottom: '8px' }} />
              <Typography
                variant="h6"
                style={{
                  color: '#f44336',
                  fontWeight: 400,
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}
              >
                Scam Warning
              </Typography>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  marginBottom: '16px'
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
          padding: '8px 10px 4px'
        }}
      >
        <Typography
          variant="h6"
          isDark={isDark}
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          Additional Details
        </Typography>
      </Box>

      <StyledTable size="small" style={{ marginTop: '4px' }}>
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
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
                }}
                noWrap
              >
                Fully Diluted Market Cap
              </Typography>
            </ModernTableCell>
            <ModernTableCell>
              <Typography
                isDark={isDark}
                variant="body2"
                style={{
                  fontWeight: 400,
                  color: '#3b82f6',
                  fontSize: '12px'
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
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                  fontSize: '11px'
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
                  fontWeight: 400,
                  color: '#22c55e',
                  fontSize: '12px'
                }}
              >
                {(dom || 0).toFixed(6)} %
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: '#FF9800',
                    fontSize: '12px'
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: '#F57C00',
                    fontSize: '12px'
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: '#FF9800',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(uniqueTraders24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* ========== BUY/SELL METRICS GROUP ========== */}


          {/* Buys (24h) Row */}
          {buy24hxrp ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Buys (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 400,
                      color: '#22c55e',
                      fontSize: '12px'
                    }}
                  >
                    {fNumber(buy24hxrp)} XRP
                  </Typography>
                  {(buyTxns24h || buy24htx) ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        fontSize: '10px'
                      }}
                    >
                      ({fNumber(buyTxns24h || buy24htx)} tx)
                    </Typography>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Unique Buyers (24h) Row */}
          {uniqueBuyers24h ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: '#22c55e',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(uniqueBuyers24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Sells (24h) Row */}
          {sell24hxrp ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  Sells (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 400,
                      color: '#ef4444',
                      fontSize: '12px'
                    }}
                  >
                    {fNumber(sell24hxrp)} XRP
                  </Typography>
                  {(sellTxns24h || sell24htx) ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        fontSize: '10px'
                      }}
                    >
                      ({fNumber(sellTxns24h || sell24htx)} tx)
                    </Typography>
                  ) : null}
                </Stack>
              </ModernTableCell>
            </TableRow>
          ) : null}

          {/* Unique Sellers (24h) Row */}
          {uniqueSellers24h ? (
            <TableRow>
              <ModernTableCell>
                <Typography
                  isDark={isDark}
                  variant="body2"
                  style={{
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: '#ef4444',
                    fontSize: '12px'
                  }}
                >
                  {fNumber(uniqueSellers24h)}
                </Typography>
              </ModernTableCell>
            </TableRow>
          ) : null}

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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  AMM Deposits (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 400,
                      color: '#22c55e',
                      fontSize: '12px'
                    }}
                  >
                    {fNumber(deposit24hxrp)} XRP
                  </Typography>
                  {deposit24htx ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        fontSize: '10px'
                      }}
                    >
                      ({fNumber(deposit24htx)} tx)
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
                  }}
                  noWrap
                >
                  AMM Withdrawals (24h)
                </Typography>
              </ModernTableCell>
              <ModernTableCell>
                <Stack direction="row" alignItems="center" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                  <Typography
                    isDark={isDark}
                    variant="body2"
                    style={{
                      fontWeight: 400,
                      color: '#f59e0b',
                      fontSize: '12px'
                    }}
                  >
                    {fNumber(withdraw24hxrp)} XRP
                  </Typography>
                  {withdraw24htx ? (
                    <Typography
                      variant="caption"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        fontSize: '10px'
                      }}
                    >
                      ({fNumber(withdraw24htx)} tx)
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                    fontWeight: 400,
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                    fontSize: '12px'
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
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(33,43,54,0.5)",
                    fontSize: '11px'
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
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        borderRadius: '8px',
                        height: '26px',
                        background: activityOpen ? alpha('rgba(156,39,176,1)', 0.15) : alpha('rgba(156,39,176,1)', 0.08),
                        border: `1.5px solid ${activityOpen ? 'rgba(156,39,176,0.4)' : alpha('rgba(156,39,176,1)', 0.15)}`,
                        color: '#9C27B0',
                        fontWeight: 400,
                        minWidth: 0,
                        maxWidth: isMobile ? '100px' : '200px',
                        overflow: 'hidden',
                        flexShrink: 1,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ fontWeight: 400, fontSize: isMobile ? '10px' : '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                        width: isMobile ? '22px' : '24px',
                        height: isMobile ? '22px' : '24px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                        flexShrink: 0
                      }}
                    >
                      <Copy size={isMobile ? 10 : 12} color="#9C27B0" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Creator Token Count - Full Width Warning Banner */}
          {creator && creatorTokens > 0 && (
            <TableRow>
              <ModernTableCell colSpan={2} style={{ padding: '8px 10px' }}>
                <Box
                  style={{
                    borderRadius: '8px',
                    padding: '10px 12px',
                    background: creatorTokens >= 10
                      ? alpha('rgba(239,68,68,1)', 0.1)
                      : creatorTokens >= 5
                      ? alpha('rgba(245,158,11,1)', 0.08)
                      : creatorTokens >= 2
                      ? alpha('rgba(59,130,246,1)', 0.06)
                      : alpha('rgba(34,197,94,1)', 0.06),
                    border: `1.5px solid ${
                      creatorTokens >= 10
                        ? alpha('rgba(239,68,68,1)', 0.3)
                        : creatorTokens >= 5
                        ? alpha('rgba(245,158,11,1)', 0.25)
                        : creatorTokens >= 2
                        ? alpha('rgba(59,130,246,1)', 0.15)
                        : alpha('rgba(34,197,94,1)', 0.15)
                    }`
                  }}
                >
                  <Stack direction="row" alignItems="center" style={{ justifyContent: 'space-between', gap: '12px' }}>
                    {/* Left - Icon + Text */}
                    <Stack direction="row" alignItems="center" style={{ gap: '10px', flex: 1 }}>
                      {creatorTokens >= 5 ? (
                        <AlertTriangle size={18} color={creatorTokens >= 10 ? '#ef4444' : '#f59e0b'} />
                      ) : creatorTokens >= 2 ? (
                        <Layers size={16} color="#3b82f6" />
                      ) : (
                        <CheckCircle size={16} color="#22c55e" />
                      )}
                      <Typography
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                        }}
                      >
                        {creatorTokens >= 10 ? 'Serial launcher' : creatorTokens >= 5 ? 'Multiple tokens' : creatorTokens >= 2 ? 'Has other tokens' : 'First token'}
                      </Typography>
                    </Stack>

                    {/* Right - Count + Badge */}
                    <Stack direction="row" alignItems="center" style={{ gap: '8px' }}>
                      <Typography
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : creatorTokens >= 2 ? '#3b82f6' : '#22c55e'
                        }}
                      >
                        {creatorTokens}
                      </Typography>
                      <Chip
                        size="small"
                        style={{
                          height: '24px',
                          borderRadius: '6px',
                          background: creatorTokens >= 10 ? alpha('rgba(239,68,68,1)', 0.12) : creatorTokens >= 5 ? alpha('rgba(245,158,11,1)', 0.1) : creatorTokens >= 2 ? alpha('rgba(59,130,246,1)', 0.08) : alpha('rgba(34,197,94,1)', 0.08),
                          border: `1.5px solid ${creatorTokens >= 10 ? alpha('rgba(239,68,68,1)', 0.3) : creatorTokens >= 5 ? alpha('rgba(245,158,11,1)', 0.25) : creatorTokens >= 2 ? alpha('rgba(59,130,246,1)', 0.15) : alpha('rgba(34,197,94,1)', 0.15)}`,
                          color: creatorTokens >= 10 ? '#ef4444' : creatorTokens >= 5 ? '#f59e0b' : creatorTokens >= 2 ? '#3b82f6' : '#22c55e',
                          fontSize: '9px',
                          fontWeight: 600,
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {creatorTokens >= 10 ? 'HIGH RISK' : creatorTokens >= 5 ? 'CAUTION' : creatorTokens >= 2 ? 'MODERATE' : 'NEW'}
                      </Chip>
                    </Stack>
                  </Stack>
                </Box>
              </ModernTableCell>
            </TableRow>
          )}

          {/* Creator Activity - Inline */}
          {creator && activityOpen && (
            <TableRow>
              <ModernTableCell colSpan={2} style={{ padding: '8px' }}>
                <Box style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                  padding: '10px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                }}>
                  {/* Filter Tabs */}
                  <Stack direction="row" style={{ gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'exits', label: '🚨 Exits', color: '#ef4444' },
                      { key: 'sells', label: 'Sells' },
                      { key: 'buys', label: 'Buys' },
                      { key: 'amm', label: 'AMM' }
                    ].map(f => (
                      <Typography
                        key={f.key}
                        variant="caption"
                        onClick={() => setActivityFilter(f.key)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: activityFilter === f.key ? 600 : 400,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: activityFilter === f.key
                            ? (f.color ? alpha(f.color, 0.15) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'))
                            : 'transparent',
                          color: activityFilter === f.key
                            ? (f.color || (isDark ? '#fff' : '#000'))
                            : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                          border: `1px solid ${activityFilter === f.key ? (f.color ? alpha(f.color, 0.3) : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')) : 'transparent'}`,
                          transition: 'all 0.15s'
                        }}
                      >
                        {f.label}
                      </Typography>
                    ))}
                  </Stack>

                  {/* Warning Banner */}
                  {hasWarning && (
                    <Stack direction="row" alignItems="center" style={{ gap: '6px', marginBottom: '10px', padding: '8px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <Stack style={{ flex: 1 }}>
                        <Typography variant="caption" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>⚠️ Exit Signal Detected</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: '9px' }}>Creator has failed transactions in the last 24 hours</Typography>
                      </Stack>
                    </Stack>
                  )}

                  {/* No token activity notice */}
                  {noTokenActivity && transactions.length > 0 && (
                    <Stack direction="row" alignItems="center" style={{ gap: '6px', marginBottom: '8px', padding: '6px 8px', background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <Typography variant="caption" style={{ color: '#3b82f6', fontSize: '9px' }}>
                        ℹ️ No token trades found. Showing general account activity.
                      </Typography>
                    </Stack>
                  )}

                  {/* Loading / Empty / List */}
                  {(loadingTx || filterLoading) ? (
                    <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '10px' }}>
                      Loading...
                    </Typography>
                  ) : transactions.length === 0 ? (
                    <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '10px' }}>
                      No activity found
                    </Typography>
                  ) : (
                    <Stack spacing={0}>
                      {/* Header */}
                      <Stack direction="row" style={{ padding: '0 0 6px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, marginBottom: '4px' }}>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '8px', fontWeight: 600, width: '70px', textTransform: 'uppercase' }}>Action</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '8px', fontWeight: 600, flex: 1, textAlign: 'right', textTransform: 'uppercase' }}>Token Amt</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '8px', fontWeight: 600, width: '70px', textAlign: 'right', textTransform: 'uppercase' }}>XRP</Typography>
                        <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '8px', fontWeight: 600, width: '50px', textAlign: 'right', textTransform: 'uppercase' }}>Time</Typography>
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
                              padding: '6px 0',
                              borderBottom: i < transactions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` : 'none',
                              opacity: isFailed ? 0.6 : 1
                            }}
                          >
                            {/* Action */}
                            <Stack direction="row" alignItems="center" style={{ width: '70px', gap: '4px' }}>
                              <Tooltip title={`${type}\n${result}\nLedger: ${ledger}`}>
                                <Link
                                  href={`https://xrpscan.com/tx/${hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                >
                                  <span style={{ fontSize: '10px' }}>{cfg.icon}</span>
                                  <Typography variant="caption" style={{
                                    color: displayColor,
                                    fontSize: '9px',
                                    fontWeight: 600
                                  }}>{cfg.label}</Typography>
                                </Link>
                              </Tooltip>
                              {isFailed && <span style={{ fontSize: '8px' }}>❌</span>}
                            </Stack>

                            {/* Token Amount */}
                            <Tooltip title={hasToken ? `${fNumber(tokenAmount)} ${displayCurrency}` : ''}>
                              <Typography variant="caption" style={{
                                flex: 1,
                                textAlign: 'right',
                                color: hasToken ? (isDark ? '#fff' : '#000') : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
                                fontSize: '11px',
                                fontWeight: hasToken ? 600 : 400,
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {hasToken ? `${fNumber(tokenAmount)}` : '-'}
                              </Typography>
                            </Tooltip>

                            {/* XRP Amount */}
                            <Tooltip title={hasXrp ? `${fNumber(xrpAmount)} XRP${destination ? `\nTo: ${destination.slice(0,8)}...` : ''}` : ''}>
                              <Typography variant="caption" style={{
                                width: '70px',
                                textAlign: 'right',
                                color: hasXrp ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
                                fontSize: '10px',
                                fontWeight: hasXrp ? 500 : 400,
                                fontFamily: 'monospace'
                              }}>
                                {hasXrp ? `${fNumber(xrpAmount)}` : '-'}
                              </Typography>
                            </Tooltip>

                            {/* Time */}
                            <Typography variant="caption" style={{
                              width: '50px',
                              textAlign: 'right',
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                              fontSize: '9px'
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
        <Box
          style={{
            padding: '10px',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
          }}
        >
          <Typography
            isDark={isDark}
            variant="body2"
            style={{
              fontWeight: 500,
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}
          >
            Social & Tags
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            style={{ flexWrap: 'wrap', gap: '6px' }}
          >
            <CompactTags enhancedTags={enhancedTags} maxTags={isMobile ? 4 : 5} />
            <CompactSocialLinks social={social} size="small" fullWidth={true} isDark={isDark} />
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
    <Stack direction="row" spacing={0.75} alignItems="center" style={{ gap: '8px' }}>
      {socialEntries.slice(0, 4).map(([platform, url]) => (
        <Tooltip key={platform} title={`${platform}: ${url}`}>
          <IconButton
            as="a"
            href={getFullUrl(platform, url)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            style={{
              width: '26px',
              height: '26px',
              padding: '4px',
              borderRadius: '8px',
              background: alpha('rgba(66,133,244,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getIcon(platform)}
          </IconButton>
        </Tooltip>
      ))}
      {socialEntries.length > 4 && toggleLinksDrawer && (
        <Tooltip title="View all links">
          <IconButton
            onClick={() => toggleLinksDrawer(true)}
            size="small"
            style={{
              width: '26px',
              height: '26px',
              padding: '4px',
              borderRadius: '8px',
              background: alpha('rgba(156,39,176,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(156,39,176,1)', 0.15)}`,
              color: '#9C27B0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography style={{ fontSize: '11px', fontWeight: 400 }}>
              +{socialEntries.length - 4}
            </Typography>
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

// Compact tags component for inline integration
export const CompactTags = ({ enhancedTags, toggleTagsDrawer, maxTags = 3, isDark = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!enhancedTags || enhancedTags.length === 0) return null;

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      style={{ flexWrap: 'wrap', gap: '8px' }}
    >
      {enhancedTags.slice(0, maxTags).map((tag) => (
        <Link
          key={tag}
          href={`/view/${normalizeTag(tag)}`}
          style={{ display: 'inline-flex', textDecoration: 'none' }}
          rel="noreferrer noopener nofollow"
        >
          <Chip
            size="small"
            style={{
              height: '24px',
              fontSize: '10px',
              borderRadius: '8px',
              paddingLeft: '10px',
              paddingRight: '10px',
              background: alpha('rgba(66,133,244,1)', 0.08),
              border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
              color: '#4285f4',
              fontWeight: 400,
              cursor: 'pointer',
              minHeight: 'auto',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tag === 'aigent.run' ? (
              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img
                  src="/static/aigentrun.gif"
                  alt="Aigent.Run"
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain'
                  }}
                />
                {tag}
              </Box>
            ) : (
              tag
            )}
          </Chip>
        </Link>
      ))}
      {enhancedTags.length > maxTags && toggleTagsDrawer && (
        <Chip
          size="small"
          onClick={() => toggleTagsDrawer(true)}
          style={{
            height: '24px',
            fontSize: '10px',
            borderRadius: '8px',
            paddingLeft: '10px',
            paddingRight: '10px',
            background: alpha('rgba(66,133,244,1)', 0.08),
            border: `1.5px solid ${alpha('rgba(66,133,244,1)', 0.15)}`,
            color: '#4285f4',
            fontWeight: 400,
            cursor: 'pointer',
            minHeight: 'auto'
          }}
        >
          +{enhancedTags.length - maxTags}
        </Chip>
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
