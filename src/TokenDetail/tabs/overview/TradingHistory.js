import React, { useState, useEffect, useCallback, useRef, memo, useMemo, Suspense } from 'react';
import { MD5 } from 'crypto-js';
import styled from '@emotion/styled';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { ExternalLink, X, Plus, Fish, Anchor, Ship, Loader2 } from 'lucide-react';

// Custom styled components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.spacing ? `${props.spacing * 8}px` : '0'};
`;
const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: #147DFE;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
const Typography = styled.div`
  font-size: ${props => props.variant === 'h6' ? '14px' : props.variant === 'caption' ? '11px' : '12px'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)') :
    props.color === 'success.main' ? '#22c55e' :
    (props.isDark ? '#fff' : '#1a1a1a')};
`;

// Constants
const getTokenImageUrl = (issuer, currency) => {
  // XRP has a special MD5
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
  }
  // Calculate MD5 for the token
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/token/${md5Hash}`;
};
const SOURCE_TAGS = {
  101102979: 'xrp.cafe',
  10011010: 'Magnetic',
  74920348: 'First Ledger',
  20221212: 'XPMarket',
  69420589: 'Bidds',
  110100111: 'Sologenic',
  80085: 'Zerpaay',
  11782013: 'ANODEX',
  13888813: 'Zerpmon',
  20102305: 'Opulence',
  42697468: 'Bithomp',
  123321: 'BearBull',
  4152544945: 'ArtDept',
  100010010: 'StaticBit',
  80008000: 'Orchestra'
};

const getSourceTagName = (sourceTag) => SOURCE_TAGS[sourceTag] || (sourceTag ? 'Unknown' : null);

const decodeCurrency = (currency) => {
  if (!currency || currency === 'XRP') return currency || 'XRP';
  // Only decode if it's a 40-character hex string (standard currency code format)
  if (currency.length === 40 && /^[0-9A-F]+$/i.test(currency)) {
    try {
      return Buffer.from(currency, 'hex').toString('utf8').replace(/\x00/g, '');
    } catch {
      return currency;
    }
  }
  // Already plain text (e.g., "DROP", "GDROP", "BTC")
  return currency;
};

// Define the highlight animation with softer colors
const highlightAnimation = (isDark) => `
  @keyframes highlight {
    0% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.08)' : 'rgba(20, 125, 254, 0.08)'};
    }
    50% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.04)' : 'rgba(20, 125, 254, 0.04)'};
    }
    100% {
      background-color: transparent;
    }
  }
`;

// Styled components with improved design
const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)'};
`;

const LiveCircle = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
  animation: pulse 2s infinite;
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

const Card = styled.div`
  background: transparent;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  position: relative;
  animation: ${props => props.isNew ? 'highlight 0.8s ease-out' : 'none'};
  &:hover { background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}; }
  ${props => props.isNew && highlightAnimation(props.isDark)}
`;

const CardContent = styled.div`
  padding: 8px 0;
`;

const TradeTypeChip = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.tradetype === 'BUY' ? '#22c55e' : '#ef4444'};
  width: 32px;
`;

const VolumeIndicator = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.volume}%;
  background: ${props => props.isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.03)'};
  transition: width 0.2s;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

const PaginationButton = styled.button`
  color: ${props => props.selected ? '#fff' : (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')};
  background: ${props => props.selected ? '#3b82f6' : 'transparent'};
  border: 1.5px solid ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
  min-width: 28px;
  height: 28px;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f6; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const TableHeader = styled.div`
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  & > div {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  }
`;

const TableHead = styled.thead``;
const TableBody = styled.tbody``;
const TableRow = styled.tr`
  &:hover {
    background-color: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  }
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: ${props => props.size === 'small' ? '13px' : '14px'};
  text-align: ${props => props.align || 'left'};
  font-weight: ${props => props.fontWeight || 400};
  opacity: ${props => props.opacity || 1};
  text-transform: ${props => props.textTransform || 'none'};
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  overflow: auto;
`;

const Link = styled.a`
  text-decoration: none;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  font-size: 11px;
  &:hover { color: #3b82f6; }
`;

const Tooltip = ({ title, children, arrow }) => {
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
          marginBottom: '4px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const IconButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:hover { color: #3b82f6; }
`;

const FormControlLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 400;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'};
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
`;

const Tab = styled.button`
  font-size: 12px;
  font-weight: 400;
  padding: 6px 12px;
  background: ${props => props.selected ? (props.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent'};
  border: 1.5px solid ${props => props.selected ? '#3b82f6' : 'transparent'};
  border-radius: 6px;
  color: ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: ${props => props.isDark ? '#fff' : '#1a1a1a'}; }
`;

const Button = styled.button`
  padding: ${props => props.size === 'small' ? '4px 10px' : '8px 16px'};
  font-size: 11px;
  font-weight: 400;
  border-radius: 6px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : '#374151'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f6; }
`;

const Dialog = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogPaper = styled.div`
  background: #000;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
`;

const DialogTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: 14px;
  font-weight: 500;
  color: #fff;
`;

const DialogContent = styled.div`
  padding: 20px;
  color: #fff;
`;

const TextField = styled.input`
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  &:focus { outline: none; border-color: #3b82f6; }
  &::placeholder { color: rgba(255,255,255,0.3); }
`;

const FormControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Radio = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #3b82f6;
`;

// Helper functions
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 0) {
    return 'now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
};

// Trade size indicator - returns icon and opacity based on XRP value
const getTradeSizeInfo = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return { Icon: Fish, opacity: 0.3 };
  if (xrpValue < 1000) return { Icon: Fish, opacity: 0.5 };
  if (xrpValue < 2500) return { Icon: Fish, opacity: 0.7 };
  if (xrpValue < 5000) return { Icon: Anchor, opacity: 0.8 };
  if (xrpValue < 10000) return { Icon: Ship, opacity: 0.9 };
  return { Icon: Ship, opacity: 1 };
};

const formatTradeValue = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;

  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(4);
  }

  return abbreviateNumber(numValue);
};

const formatPrice = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;

  if (Math.abs(numValue) < 0.000001) {
    return numValue.toFixed(12);
  }

  if (Math.abs(numValue) < 0.00001) {
    return numValue.toFixed(10);
  }

  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 0.01) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(6);
  }

  if (Math.abs(numValue) < 100) {
    return numValue.toFixed(6);
  }

  return numValue.toFixed(4);
};

const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

const getXRPAmount = (trade) => {
  const xrpValue =
    trade.paid.currency === 'XRP'
      ? parseValue(trade.paid.value)
      : trade.got.currency === 'XRP'
        ? parseValue(trade.got.value)
        : 0;
  return xrpValue;
};

const parseValue = (value) => {
  if (typeof value === 'string' && value.includes('e')) {
    return parseFloat(Number(value).toFixed(8));
  }
  return parseFloat(value);
};

const TradingHistory = ({ tokenId, amm, token, pairs, onTransactionClick, isDark = false }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [pairType, setPairType] = useState('xrp'); // xrp, token, or empty for all
  const [xrpAmount, setXrpAmount] = useState(''); // Filter by minimum XRP amount
  const [historyType, setHistoryType] = useState('trades'); // trades, liquidity, all
  const [timeRange, setTimeRange] = useState(''); // 1h, 24h, 7d, 30d, or empty for all
  const [accountFilter, setAccountFilter] = useState('');
  const [liquidityType, setLiquidityType] = useState(''); // deposit, withdraw, create, or empty for all
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const limit = 20;

  // Cursor-based pagination state
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]); // Stack of cursors for back navigation
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first
  const [isLastPage, setIsLastPage] = useState(false); // True when we've reached the end of records

  // AMM Pools state
  const [ammPools, setAmmPools] = useState([]);
  const [ammLoading, setAmmLoading] = useState(false);
  const [addLiquidityDialog, setAddLiquidityDialog] = useState({ open: false, pool: null });
  const [depositAmount1, setDepositAmount1] = useState('');
  const [depositAmount2, setDepositAmount2] = useState('');
  const [depositMode, setDepositMode] = useState('double'); // 'double', 'single1', 'single2'

  const handleTxClick = (hash, tradeAccount) => {
    if (onTransactionClick) {
      onTransactionClick(hash, tradeAccount);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && token && ammPools.length === 0) {
      setAmmLoading(true);
      try {
        const res = await fetch(
          `https://api.xrpl.to/api/amm-pools?issuer=${token.issuer}&currency=${token.currency}&sortBy=fees`
        );
        const data = await res.json();
        setAmmPools(data.pools || []);
      } catch (error) {
        console.error('Error fetching AMM pools:', error);
      } finally {
        setAmmLoading(false);
      }
    }
  };

  const fetchTradingHistory = useCallback(async (useCursor = null, isRefresh = false, useDirection = 'desc') => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    try {
      // Build query params
      const params = new URLSearchParams({
        md5: tokenId,
        limit: String(limit),
        type: historyType,
        direction: useDirection
      });

      // Add cursor for pagination (but not for refresh which should get latest)
      if (useCursor && !isRefresh) {
        params.set('cursor', String(useCursor));
      }

      // Add optional filters
      if (pairType) {
        params.set('pairType', pairType);
      }

      if (xrpAmount && pairType === 'xrp' && historyType === 'trades') {
        params.set('xrpAmount', xrpAmount);
      }

      if (accountFilter) {
        params.set('account', accountFilter);
      }

      // Add time range params
      if (timeRange) {
        const now = Date.now();
        const ranges = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        };
        if (ranges[timeRange]) {
          params.set('startTime', String(now - ranges[timeRange]));
          params.set('endTime', String(now));
        }
      }

      const response = await fetch(`https://api.xrpl.to/api/history?${params}`);
      const data = await response.json();

      if (data.result === 'success') {
        // Client-side filter for liquidity type (API doesn't support this filter)
        let filteredHists = data.hists;
        if (liquidityType && historyType !== 'trades') {
          filteredHists = data.hists.filter(h => h.isLiquidity && h.type === liquidityType);
        }

        const currentTradeIds = previousTradesRef.current;
        const newTrades = filteredHists.filter((trade) => !currentTradeIds.has(trade._id));

        if (newTrades.length > 0 && isRefresh) {
          setNewTradeIds(new Set(newTrades.map((trade) => trade._id)));
          previousTradesRef.current = new Set(data.hists.map((trade) => trade._id));
          setTimeout(() => {
            setNewTradeIds(new Set());
          }, 1000);
        }

        setTrades(filteredHists.slice(0, 50));
        setNextCursor(data.nextCursor || null);
        setTotalRecords(data.totalRecords || 0);

        // Determine if we've reached the end of records in the current direction
        // For direction=asc with no cursor (first request), we're viewing the oldest records
        // which IS the last page - nextCursor in this case points BACK toward page 1
        // Only set isLastPage=false if we're navigating forward and there's more data
        const recordsReturned = data.recordsReturned || filteredHists.length;

        if (useDirection === 'asc' && !useCursor) {
          // First page of asc = last page of records (oldest), this is the end
          setIsLastPage(true);
        } else {
          // Normal pagination - check if there are more records
          const hasMoreRecords = recordsReturned >= limit && data.nextCursor;
          setIsLastPage(!hasMoreRecords);
        }
      }
    } catch (error) {
      console.error('Error fetching trading history:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]);

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setIsLastPage(false);
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]);

  // Auto-refresh interval (only for page 1 with desc direction)
  useEffect(() => {
    if (currentPage !== 1 || direction !== 'desc') return;

    // Sync with ledger updates every 4 seconds
    const intervalId = setInterval(() => {
      fetchTradingHistory(null, true, 'desc');
    }, 4000);

    return () => clearInterval(intervalId);
  }, [fetchTradingHistory, currentPage, direction]);

  // Cursor-based pagination handlers
  const handleNextPage = useCallback(() => {
    if (!nextCursor) return;

    // Save current cursor to history for back navigation
    setCursorHistory(prev => [...prev, cursor]);
    setCursor(nextCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage(prev => prev + 1);
    } else {
      setCurrentPage(prev => prev - 1);
    }

    setLoading(true);
    fetchTradingHistory(nextCursor, false, direction);
  }, [nextCursor, cursor, direction, fetchTradingHistory]);

  const handlePrevPage = useCallback(() => {
    if (cursorHistory.length === 0) return;

    // Pop the last cursor from history
    const newHistory = [...cursorHistory];
    const prevCursor = newHistory.pop();

    setCursorHistory(newHistory);
    setCursor(prevCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage(prev => prev - 1);
    } else {
      setCurrentPage(prev => prev + 1);
    }

    setLoading(true);
    fetchTradingHistory(prevCursor, false, direction);
  }, [cursorHistory, direction, fetchTradingHistory]);

  const handleFirstPage = useCallback(() => {
    if (currentPage === 1 && direction === 'desc') return;

    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
  }, [currentPage, direction, fetchTradingHistory]);

  // Jump back multiple pages at once
  const handleJumpBack = useCallback((steps) => {
    if (steps <= 0 || steps > cursorHistory.length) return;

    const newHistory = [...cursorHistory];
    let targetCursor = null;

    // Pop 'steps' cursors from history
    for (let i = 0; i < steps; i++) {
      targetCursor = newHistory.pop();
    }

    setCursorHistory(newHistory);
    setCursor(targetCursor);

    if (direction === 'desc') {
      setCurrentPage(prev => prev - steps);
    } else {
      setCurrentPage(prev => prev + steps);
    }

    setLoading(true);
    fetchTradingHistory(targetCursor, false, direction);
  }, [cursorHistory, direction, fetchTradingHistory]);

  // Jump to last page (oldest records)
  const handleLastPage = useCallback(() => {
    if (!tokenId || totalRecords <= limit) return;

    const totalPages = Math.ceil(totalRecords / limit);

    // Use direction=asc with no cursor to get oldest records
    // This IS the last page - there are no older records beyond this
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(totalPages);
    setDirection('asc');
    setIsLastPage(true); // We're at the true last page (oldest records)
    setLoading(true);
    fetchTradingHistory(null, false, 'asc');
  }, [tokenId, totalRecords, limit, fetchTradingHistory]);

  const handleAddLiquidity = (pool) => {
    setAddLiquidityDialog({ open: true, pool });
    setDepositAmount1('');
    setDepositAmount2('');
    setDepositMode('double');
  };

  const handleCloseDialog = () => {
    setAddLiquidityDialog({ open: false, pool: null });
  };

  const handleAmount1Change = (value) => {
    setDepositAmount1(value);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount2('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset2Amount / pool.currentLiquidity.asset1Amount;
        setDepositAmount2((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleAmount2Change = (value) => {
    setDepositAmount2(value);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount1('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset1Amount / pool.currentLiquidity.asset2Amount;
        setDepositAmount1((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleSubmitDeposit = () => {
    // TODO: Implement AMM deposit using proper wallet integration
    handleCloseDialog();
  };

  const calculatePrice = useCallback((trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    return parseFloat(xrpAmount) / parseFloat(tokenAmount);
  }, []);

  // Memoized trade list rendering
  const renderedTrades = useMemo(() => {
    return trades.map((trade, index) => {
      const isLiquidity = trade.isLiquidity;
      const isBuy = trade.paid.currency === 'XRP';
      const xrpAmount = getXRPAmount(trade);
      const price = isLiquidity ? null : calculatePrice(trade);
      const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

      const amountData = isBuy ? trade.got : trade.paid;
      const totalData = isBuy ? trade.paid : trade.got;

      // For liquidity events, show the account; for trades show taker (or maker if taker is AMM)
      let addressToShow = isLiquidity ? trade.account : trade.taker;
      if (!isLiquidity && amm && trade.taker === amm) {
        addressToShow = trade.maker;
      }

      // Liquidity type label
      const getLiquidityLabel = (type) => {
        if (type === 'deposit') return 'ADD';
        if (type === 'withdraw') return 'REMOVE';
        if (type === 'create') return 'CREATE';
        return type?.toUpperCase() || 'LIQ';
      };

      return (
        <Card key={trade._id} isNew={newTradeIds.has(trade._id)} isDark={isDark}>
          <VolumeIndicator volume={volumePercentage} isDark={isDark} />
          <CardContent>
            <Box style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.8fr 1.4fr 1.4fr 0.6fr 0.5fr 0.2fr', gap: '4px', alignItems: 'center' }}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', minWidth: '28px', whiteSpace: 'nowrap' }}>
                  {formatRelativeTime(trade.time)}
                </span>
                {isLiquidity ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: trade.type === 'deposit' || trade.type === 'create' ? '#8b5cf6' : '#f59e0b',
                    width: '48px'
                  }}>
                    {getLiquidityLabel(trade.type)}
                  </span>
                ) : (
                  <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>{isBuy ? 'BUY' : 'SELL'}</TradeTypeChip>
                )}
              </Box>

              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                {isLiquidity ? (trade.lpTokens ? `${formatTradeValue(trade.lpTokens)} LP` : '-') : formatPrice(price)}
              </span>

              <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <img src={getTokenImageUrl(amountData.issuer, amountData.currency)} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(amountData.value)} <span style={{ opacity: 0.5 }}>{decodeCurrency(amountData.currency)}</span>
                </span>
              </Box>

              <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <img src={getTokenImageUrl(totalData.issuer, totalData.currency)} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(totalData.value)} <span style={{ opacity: 0.5 }}>{decodeCurrency(totalData.currency)}</span>
                </span>
                {(() => {
                  const val = totalData.currency === 'XRP' ? parseFloat(totalData.value) : xrpAmount;
                  const { Icon, opacity } = getTradeSizeInfo(val);
                  return <Icon size={13} style={{ opacity, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginLeft: '4px' }} />;
                })()}
              </Box>

              <Link href={`/profile/${addressToShow}`} isDark={isDark}>
                {addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : ''}
              </Link>

              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isLiquidity ? 'AMM' : (getSourceTagName(trade.sourceTag) || '')}
              </span>

              <IconButton onClick={() => handleTxClick(trade.hash, addressToShow)} isDark={isDark}>
                <ExternalLink size={12} />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      );
    });
  }, [trades, newTradeIds, amm, calculatePrice, handleTxClick]);


  if (loading) {
    return (
      <Stack spacing={1}>
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size={32} />
        </Box>
      </Stack>
    );
  }

  const emptyState = (
    <Box
      style={{
        textAlign: 'center',
        padding: '24px',
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
      }}
    >
      <Typography variant="h6" color="text.secondary" isDark={isDark} style={{ marginBottom: '8px' }}>
        {historyType === 'liquidity' ? 'No Liquidity Events' : historyType === 'all' ? 'No Activity' : 'No Recent Trades'}
      </Typography>
      <Typography variant="body2" color="text.secondary" isDark={isDark}>
        {historyType === 'liquidity' ? 'AMM liquidity events will appear here' : 'Trading activity will appear here when available'}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={1} style={{ width: '100%' }}>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <Tabs isDark={isDark}>
          <Tab selected={tabValue === 0} onClick={(e) => handleTabChange(e, 0)} isDark={isDark}>Trades</Tab>
          <Tab selected={tabValue === 1} onClick={(e) => handleTabChange(e, 1)} isDark={isDark}>Pools</Tab>
          <Tab selected={tabValue === 2} onClick={(e) => handleTabChange(e, 2)} isDark={isDark}>Traders</Tab>
          <Tab selected={tabValue === 3} onClick={(e) => handleTabChange(e, 3)} isDark={isDark}>Holders</Tab>
        </Tabs>
        {tabValue === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pairType}
              onChange={(e) => setPairType(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${pairType ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (pairType ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (pairType ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: pairType ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Pairs</option>
              <option value="xrp" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>XRP Pairs</option>
              <option value="token" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Token Pairs</option>
            </select>
            <select
              value={historyType}
              onChange={(e) => setHistoryType(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${historyType !== 'trades' ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (historyType !== 'trades' ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (historyType !== 'trades' ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: historyType !== 'trades' ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="trades" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Trades</option>
              <option value="liquidity" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Liquidity</option>
              <option value="all" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All</option>
            </select>
            {historyType !== 'trades' && (
              <select
                value={liquidityType}
                onChange={(e) => setLiquidityType(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: `1px solid ${liquidityType ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                  background: isDark ? (liquidityType ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.8)') : (liquidityType ? 'rgba(139,92,246,0.1)' : '#fff'),
                  color: liquidityType ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  cursor: 'pointer',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Events</option>
                <option value="deposit" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Deposits</option>
                <option value="withdraw" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Withdrawals</option>
                <option value="create" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Pool Creates</option>
              </select>
            )}
            <select
              value={xrpAmount}
              onChange={(e) => setXrpAmount(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${xrpAmount ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (xrpAmount ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (xrpAmount ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: xrpAmount ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Min XRP</option>
              <option value="100" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>100+</option>
              <option value="500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>500+</option>
              <option value="1000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>1k+</option>
              <option value="2500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>2.5k+</option>
              <option value="5000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>5k+</option>
              <option value="10000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>10k+</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${timeRange ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (timeRange ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (timeRange ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: timeRange ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Time</option>
              <option value="1h" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>1h</option>
              <option value="24h" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>24h</option>
              <option value="7d" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>7d</option>
              <option value="30d" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>30d</option>
            </select>
            <input
              type="text"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              placeholder="Filter account..."
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${accountFilter ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (accountFilter ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (accountFilter ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: isDark ? '#fff' : '#1a1a1a',
                outline: 'none',
                width: '120px'
              }}
            />
          </div>
        )}
      </Box>

      {tabValue === 0 && (
        <>
          <TableHeader isDark={isDark}>
            <div style={{ flex: '1.05', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Time
              <LiveIndicator isDark={isDark}>
                <LiveCircle />
                <span style={{ color: '#3b82f6', fontSize: '9px', fontWeight: 500 }}>LIVE</span>
              </LiveIndicator>
            </div>
            <div style={{ flex: '0.8' }}>{historyType === 'liquidity' ? 'LP Tokens' : historyType === 'all' ? 'Price/LP' : 'Price'}</div>
            <div style={{ flex: '1.4' }}>Amount</div>
            <div style={{ flex: '1.4' }}>Total</div>
            <div style={{ flex: '0.6' }}>Account</div>
            <div style={{ flex: '0.5' }}>Source</div>
            <div style={{ flex: '0.2' }}></div>
          </TableHeader>

          {trades.length === 0 ? emptyState : (
            <Stack spacing={0.25}>
              {renderedTrades}
            </Stack>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
              <Pagination isDark={isDark}>
                <PaginationButton onClick={handleFirstPage} disabled={currentPage === 1} isDark={isDark}>≪</PaginationButton>
                <PaginationButton onClick={handlePrevPage} disabled={currentPage === 1} isDark={isDark}>‹</PaginationButton>

                {/* Page number buttons */}
                {(() => {
                  const totalPages = Math.ceil(totalRecords / limit);
                  const buttons = [];

                  // Always show page 1
                  if (currentPage > 3) {
                    buttons.push(
                      <PaginationButton key={1} onClick={handleFirstPage} isDark={isDark}>1</PaginationButton>
                    );
                    if (currentPage > 4) {
                      buttons.push(
                        <span key="dots1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                    }
                  }

                  // Show pages around current page (that we can navigate to via history)
                  for (let i = Math.max(1, currentPage - 2); i <= currentPage; i++) {
                    if (i === currentPage) {
                      buttons.push(
                        <PaginationButton key={i} selected isDark={isDark}>{i}</PaginationButton>
                      );
                    } else if (i >= currentPage - cursorHistory.length) {
                      // Can navigate back to this page via history
                      const stepsBack = currentPage - i;
                      buttons.push(
                        <PaginationButton
                          key={i}
                          onClick={() => handleJumpBack(stepsBack)}
                          isDark={isDark}
                        >
                          {i}
                        </PaginationButton>
                      );
                    }
                  }

                  // Show next page indicator if available and not at the last page
                  // For desc: show higher page numbers (older records)
                  // For asc: show lower page numbers (newer records)
                  const hasMorePages = nextCursor && !isLastPage;

                  if (hasMorePages && direction === 'desc') {
                    buttons.push(
                      <PaginationButton key={currentPage + 1} onClick={handleNextPage} isDark={isDark}>
                        {currentPage + 1}
                      </PaginationButton>
                    );
                    if (totalPages > currentPage + 1) {
                      buttons.push(
                        <span key="dots2" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                      // Show total pages estimate
                      buttons.push(
                        <Tooltip key="total" title={`~${totalPages.toLocaleString()} pages`}>
                          <span style={{
                            fontSize: '11px',
                            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                            padding: '0 6px'
                          }}>
                            {totalPages.toLocaleString()}
                          </span>
                        </Tooltip>
                      );
                    }
                  } else if (hasMorePages && direction === 'asc' && currentPage > 1) {
                    // When viewing from last page (asc), show path back to page 1
                    buttons.push(
                      <PaginationButton key={currentPage - 1} onClick={handleNextPage} isDark={isDark}>
                        {currentPage - 1}
                      </PaginationButton>
                    );
                    if (currentPage > 2) {
                      buttons.push(
                        <span key="dots2" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                      buttons.push(
                        <span key="page1" style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 6px' }}>1</span>
                      );
                    }
                  }

                  return buttons;
                })()}

                <PaginationButton onClick={handleNextPage} disabled={isLastPage} isDark={isDark}>›</PaginationButton>
                <PaginationButton onClick={handleLastPage} disabled={isLastPage && direction === 'asc'} isDark={isDark}>≫</PaginationButton>
              </Pagination>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {totalRecords > 0 ? `${totalRecords.toLocaleString()} records` : ''}
              </span>
            </div>
          )}
        </>
      )}


      {tabValue === 1 && (
        <Box>
          {ammLoading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={20} />
            </Box>
          ) : ammPools.length === 0 ? (
            <Box style={{ textAlign: 'center', padding: '20px', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No pools found</span>
            </Box>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 0.9fr 0.6fr 0.5fr', gap: '8px', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Pool</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fee</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>APY</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fees</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Volume</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Liquidity</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Last Trade</span>
                <span></span>
              </div>
              {/* Rows */}
              {ammPools.map((pool) => {
                const asset1 = pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 = pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const feePercent = pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-';
                const hasApy = pool.apy7d?.apy > 0;
                // Check if this is the main XRP/TOKEN pool
                const isMainPool = (pool.asset1?.currency === 'XRP' && pool.asset2?.issuer === token?.issuer && pool.asset2?.currency === token?.currency) ||
                                   (pool.asset2?.currency === 'XRP' && pool.asset1?.issuer === token?.issuer && pool.asset1?.currency === token?.currency);
                return (
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 0.9fr 0.6fr 0.5fr', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, alignItems: 'center', background: isMainPool ? (isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)') : 'transparent', borderRadius: isMainPool ? '6px' : '0', marginLeft: isMainPool ? '-4px' : '0', marginRight: isMainPool ? '-4px' : '0', paddingLeft: isMainPool ? '4px' : '0', paddingRight: isMainPool ? '4px' : '0' }}>
                    {/* Pool pair */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>{asset1}/{asset2}</span>
                      {isMainPool && (
                        <span style={{ fontSize: '9px', fontWeight: 500, padding: '2px 5px', borderRadius: '4px', background: '#3b82f6', color: '#fff' }}>MAIN</span>
                      )}
                    </div>
                    {/* Fee */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'right' }}>{feePercent}%</span>
                    {/* APY */}
                    <span style={{ fontSize: '11px', fontWeight: hasApy ? 500 : 400, color: hasApy ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'), textAlign: 'right' }}>
                      {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                    </span>
                    {/* Fees */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'right' }}>
                      {pool.apy7d?.fees > 0 ? abbreviateNumber(pool.apy7d.fees) : '-'}
                    </span>
                    {/* Volume */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'right' }}>
                      {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                    </span>
                    {/* Liquidity */}
                    <div style={{ textAlign: 'right' }}>
                      {pool.apy7d?.liquidity > 0 ? (
                        <span style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>{abbreviateNumber(pool.apy7d.liquidity)} <span style={{ opacity: 0.5 }}>XRP</span></span>
                      ) : pool.currentLiquidity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3 }}>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{abbreviateNumber(pool.currentLiquidity.asset1Amount)} {asset1}</span>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{abbreviateNumber(pool.currentLiquidity.asset2Amount)} {asset2}</span>
                        </div>
                      ) : <span style={{ fontSize: '11px', opacity: 0.3 }}>-</span>}
                    </div>
                    {/* Last Trade */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'right' }}>
                      {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                    </span>
                    {/* Action */}
                    <button
                      onClick={() => handleAddLiquidity(pool)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: 'auto'
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Box>
      )}

      {tabValue === 2 && token && <TopTraders token={token} />}

      {tabValue === 3 && token && (
        <Suspense fallback={<Spinner size={32} />}>
          <RichList token={token} amm={amm} />
        </Suspense>
      )}

      {/* Add Liquidity Dialog */}
      <Dialog open={addLiquidityDialog.open} onClick={(e) => e.target === e.currentTarget && handleCloseDialog()}>
        <DialogPaper isDark={isDark} maxWidth="sm">
        <DialogTitle isDark={isDark} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Liquidity
          <IconButton onClick={handleCloseDialog} size="small" isDark={isDark}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent isDark={isDark}>
          {addLiquidityDialog.pool && (
            <Stack spacing={2.5} style={{ marginTop: '8px' }}>
              <Box>
                <Typography variant="body2" isDark={isDark} style={{ marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>
                  Pool: {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}/{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                </Typography>
              </Box>

              <FormControl>
                <Typography variant="body2" isDark={isDark} style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>Deposit Mode</Typography>
                <RadioGroup>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="double" checked={depositMode === 'double'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Double-asset (both tokens, no fee)</span>
                  </FormControlLabel>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="single1" checked={depositMode === 'single1'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset1.currency)} only)</span>
                  </FormControlLabel>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="single2" checked={depositMode === 'single2'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset2.currency)} only)</span>
                  </FormControlLabel>
                </RadioGroup>
              </FormControl>

              {(depositMode === 'double' || depositMode === 'single1') && (
                <div>
                  <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TextField
                      value={depositAmount1}
                      onChange={(e) => handleAmount1Change(e.target.value)}
                      type="number"
                      placeholder="0.00"
                      isDark={isDark}
                    />
                    <span style={{ fontSize: '13px', opacity: 0.7, color: isDark ? '#FFFFFF' : '#212B36' }}>{decodeCurrency(addLiquidityDialog.pool.asset1.currency)}</span>
                  </div>
                </div>
              )}

              {(depositMode === 'double' || depositMode === 'single2') && (
                <div>
                  <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TextField
                      value={depositAmount2}
                      onChange={(e) => handleAmount2Change(e.target.value)}
                      type="number"
                      placeholder="0.00"
                      isDark={isDark}
                    />
                    <span style={{ fontSize: '13px', opacity: 0.7, color: isDark ? '#FFFFFF' : '#212B36' }}>{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitDeposit}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Add Liquidity
              </button>
            </Stack>
          )}
        </DialogContent>
        </DialogPaper>
      </Dialog>
    </Stack>
  );
};

export default memo(TradingHistory);
