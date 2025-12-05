import React, { useState, useEffect, useCallback, useRef, memo, useMemo, Suspense, useContext } from 'react';
import { createPortal } from 'react-dom';
import { MD5 } from 'crypto-js';
import styled from '@emotion/styled';
import axios from 'axios';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { AppContext } from 'src/AppContext';
import { ExternalLink, X, Plus, Loader2, Activity, Droplets, Users, PieChart, Wallet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCw } from 'lucide-react';

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

// Wallet tier icons - Industry standard emoji-based (Glassnode classification)
const TierIcon = ({ emoji, size = 14, isDark }) => (
  <span style={{
    fontSize: size - 2,
    lineHeight: 1,
    opacity: 0.9,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size + 4,
    height: size + 4,
    borderRadius: '50%',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  }}>{emoji}</span>
);

const ShrimpIcon = ({ size = 14, isDark }) => <TierIcon emoji="🦐" size={size} isDark={isDark} />;
const FishIcon = ({ size = 14, isDark }) => <TierIcon emoji="🐟" size={size} isDark={isDark} />;
const SwordfishIcon = ({ size = 14, isDark }) => <TierIcon emoji="🐬" size={size} isDark={isDark} />;
const SharkIcon = ({ size = 14, isDark }) => <TierIcon emoji="🦈" size={size} isDark={isDark} />;
const OrcaIcon = ({ size = 14, isDark }) => <TierIcon emoji="🐳" size={size} isDark={isDark} />;
const WhaleIcon = ({ size = 14, isDark }) => <TierIcon emoji="🐋" size={size} isDark={isDark} />;

// Tier tooltip component
const TierHelpIcon = ({ isDark }) => (
  <span style={{ position: 'relative', display: 'inline-flex', marginLeft: '4px', cursor: 'help' }} className="tier-help">
    <span style={{
      fontSize: '9px',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
    }}>?</span>
    <span className="tier-tooltip" style={{
      position: 'absolute',
      bottom: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: isDark ? '#1a1a1a' : '#fff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: '6px',
      padding: '8px 10px',
      fontSize: '10px',
      whiteSpace: 'nowrap',
      opacity: 0,
      visibility: 'hidden',
      transition: 'opacity 0.15s, visibility 0.15s',
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      lineHeight: 1.5,
      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
    }}>
      🦐 &lt;100 · 🐟 100-500 · 🐬 500-2K<br/>
      🦈 2K-5K · 🐳 5K-20K · 🐋 20K+ XRP
    </span>
    <style>{`.tier-help:hover .tier-tooltip { opacity: 1 !important; visibility: visible !important; }`}</style>
  </span>
);

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
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
  position: relative;
  animation: ${props => props.isNew ? 'highlight 0.8s ease-out' : 'none'};
  transition: background 0.15s ease;
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

// Bar cell for showing colored bars behind values (like in the screenshot)
const BarCell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: ${props => Math.min(100, Math.max(8, props.barWidth || 0))}%;
    background: ${props => props.isBuy
      ? (props.isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.2)')
      : (props.isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)')};
    border-radius: 2px;
    transition: width 0.2s ease-out;
  }
  & > span {
    position: relative;
    z-index: 1;
  }
`;

const RefreshIcon = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:hover { color: #3b82f6; }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  @media (max-width: 640px) {
    gap: 3px;
  }
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.selected ? '#fff' : (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')};
  background: ${props => props.selected ? '#3b82f6' : 'transparent'};
  border: 1.5px solid ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)')};
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  min-width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #3b82f6;
    background: rgba(59,130,246,0.08);
  }
  &:disabled { opacity: 0.3; cursor: default; }
  @media (max-width: 640px) {
    min-width: 28px;
    height: 28px;
    font-size: 11px;
    border-radius: 8px;
    & svg { width: 14px; height: 14px; }
  }
`;

const RecordsCount = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  padding: 6px 12px;
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  @media (max-width: 640px) {
    font-size: 10px;
    padding: 4px 8px;
  }
  @media (max-width: 480px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const TableHeader = styled.div`
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'};
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
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'};
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
  border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'};
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
  display: inline-flex;
  gap: 2px;
  padding: 4px;
  background: ${props => props.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)'};
  border: 1px solid ${props => props.isDark ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)'};
  border-radius: 12px;
  margin-bottom: 12px;
  @media (max-width: 640px) {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

const Tab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 14px;
  background: transparent;
  border: 1.5px solid ${props => props.selected ? 'rgba(59,130,246,0.5)' : 'transparent'};
  border-radius: 8px;
  color: ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover {
    color: ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)')};
  }
  @media (max-width: 640px) {
    padding: 5px 6px;
    font-size: 9px;
    gap: 2px;
    letter-spacing: 0;
    & svg { width: 12px; height: 12px; }
  }
`;

const Button = styled.button`
  padding: ${props => props.size === 'small' ? '4px 10px' : '8px 16px'};
  font-size: 11px;
  font-weight: 400;
  border-radius: 6px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.1)'};
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  box-sizing: border-box;
`;

const DialogPaper = styled.div`
  background: ${props => props.isDark ? 'rgba(10,15,26,0.95)' : '#ffffff'};
  backdrop-filter: ${props => props.isDark ? 'blur(20px)' : 'none'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.2)' : 'rgba(0,0,0,0.1)'};
  border-radius: 12px;
  max-width: 420px;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow: auto;
`;

const DialogTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.isDark ? '#fff' : '#1a1a1a'};
`;

const DialogContent = styled.div`
  padding: 0 20px 20px;
  color: ${props => props.isDark ? '#fff' : '#1a1a1a'};
`;

const TextField = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'};
  color: ${props => props.isDark ? '#fff' : '#1a1a1a'};
  &:focus { outline: none; border-color: rgba(66,133,244,0.5); }
  &::placeholder { color: ${props => props.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'}; }
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
const formatRelativeTime = (timestamp, includeAgo = false) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  const ago = includeAgo ? ' ago' : '';

  if (diffInSeconds < 0) {
    return 'now';
  } else if (diffInSeconds < 60) {
    return diffInSeconds === 0 ? 'now' : `${diffInSeconds}s${ago}`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m${ago}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h${ago}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d${ago}`;
  }
};

// Wallet tier indicator - returns animal icon based on XRP value
const getTradeSizeInfo = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 100) return { Icon: ShrimpIcon, opacity: 1 };       // 0 - 100 XRP
  if (xrpValue < 500) return { Icon: FishIcon, opacity: 1 };         // 100 - 500 XRP
  if (xrpValue < 2000) return { Icon: SwordfishIcon, opacity: 1 };   // 500 - 2K XRP
  if (xrpValue < 5000) return { Icon: SharkIcon, opacity: 1 };       // 2K - 5K XRP
  if (xrpValue < 20000) return { Icon: OrcaIcon, opacity: 1 };       // 5K - 20K XRP
  return { Icon: WhaleIcon, opacity: 1 };                            // 20K+ XRP
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

// My Activity Tab Component - Shows user's trading history and open offers
const MyActivityTab = ({ token, isDark, isMobile, onTransactionClick }) => {
  const { accountProfile } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('assets'); // 'assets', 'history', or 'offers'
  const [loading, setLoading] = useState(false);
  const [openOffers, setOpenOffers] = useState([]);
  const [offersTotal, setOffersTotal] = useState(0);
  const [offersPage, setOffersPage] = useState(0);
  const offersLimit = 10;

  // Mock data for user's token assets (TODO: implement assets API)
  const mockAssets = {
    balance: 125000,
    avgBuyPrice: 0.00221,
    currentPrice: 0.00256,
    totalValue: 320.0,
    totalCost: 276.25,
    pnl: 43.75,
    pnlPercent: 15.84,
    trustlineSet: true,
    limitAmount: 1000000000
  };

  // Mock data for user's trading history (TODO: implement trades API)
  const mockMyTrades = [];

  // Fetch open offers from API
  const fetchOpenOffers = useCallback(async () => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account || !token?.md5) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        pair: token.md5,
        page: offersPage.toString(),
        limit: offersLimit.toString()
      });
      const res = await axios.get(
        `https://api.xrpl.to/api/account/offers/${account}?${params}`
      );
      if (res.data?.result === 'success') {
        setOpenOffers(res.data.offers || []);
        setOffersTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  }, [accountProfile, token?.md5, offersPage]);

  useEffect(() => {
    if (activeSubTab === 'offers') {
      fetchOpenOffers();
    }
  }, [activeSubTab, fetchOpenOffers]);

  const handleCancelOffer = (offerId) => {
    // TODO: Implement offer cancellation
    console.log('Cancel offer:', offerId);
  };

  const SubTab = styled.button`
    font-size: 11px;
    font-weight: 500;
    padding: 6px 14px;
    background: transparent;
    border: 1.5px solid ${props => props.selected ? 'rgba(59,130,246,0.5)' : (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
    border-radius: 6px;
    color: ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    &:hover { color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}; }
  `;

  const OfferCard = styled.div`
    background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
    border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'};
    border-radius: 10px;
    padding: 14px;
    &:hover {
      border-color: ${props => props.isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'};
    }
  `;

  const CancelButton = styled.button`
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    background: transparent;
    border: 1.5px solid ${props => props.isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.4)'};
    border-radius: 6px;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      background: rgba(239,68,68,0.1);
      border-color: #ef4444;
    }
  `;

  const tokenCurrency = token ? decodeCurrency(token.currency) : 'TOKEN';

  // Empty state when not connected
  const notConnectedState = (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`,
      }}
    >
      <Wallet size={40} strokeWidth={1.5} style={{ marginBottom: '12px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
      <Typography variant="h6" color="text.secondary" isDark={isDark} style={{ marginBottom: '8px', fontSize: '14px', textAlign: 'center' }}>
        Connect Wallet to View Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" isDark={isDark} style={{ fontSize: '12px', opacity: 0.7, textAlign: 'center' }}>
        Your trading history and open offers will appear here
      </Typography>
    </Box>
  );

  const isConnected = !!(accountProfile?.account || accountProfile?.address);

  if (!isConnected) {
    return notConnectedState;
  }

  return (
    <Stack spacing={1.5}>
      {/* Sub-tabs */}
      <Box style={{
        display: 'inline-flex',
        gap: '2px',
        padding: '4px',
        background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: '10px',
        marginBottom: '4px'
      }}>
        <SubTab
          selected={activeSubTab === 'assets'}
          onClick={() => setActiveSubTab('assets')}
          isDark={isDark}
        >
          Assets
        </SubTab>
        <SubTab
          selected={activeSubTab === 'history'}
          onClick={() => setActiveSubTab('history')}
          isDark={isDark}
        >
          My Trades ({mockMyTrades.length})
        </SubTab>
        <SubTab
          selected={activeSubTab === 'offers'}
          onClick={() => setActiveSubTab('offers')}
          isDark={isDark}
        >
          Open Offers ({offersTotal})
        </SubTab>
      </Box>

      {/* Assets */}
      {activeSubTab === 'assets' && (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Balance Card */}
          <OfferCard isDark={isDark}>
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <Box>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Balance</span>
                <span style={{ fontSize: '22px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(mockAssets.balance)} <span style={{ fontSize: '14px', opacity: 0.5 }}>{tokenCurrency}</span>
                </span>
              </Box>
              <Box style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Value</span>
                <span style={{ fontSize: '18px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                  {mockAssets.totalValue.toFixed(2)} <span style={{ fontSize: '12px', opacity: 0.5 }}>XRP</span>
                </span>
              </Box>
            </Box>
          </OfferCard>

          {/* P&L Card */}
          <Box style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <OfferCard isDark={isDark}>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Unrealized P&L</span>
              <Box style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: mockAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                  {mockAssets.pnl >= 0 ? '+' : ''}{mockAssets.pnl.toFixed(2)} XRP
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: mockAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                  ({mockAssets.pnl >= 0 ? '+' : ''}{mockAssets.pnlPercent.toFixed(2)}%)
                </span>
              </Box>
            </OfferCard>

            <OfferCard isDark={isDark}>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Avg Buy Price</span>
              <Box style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a', fontFamily: 'monospace' }}>
                  {formatPrice(mockAssets.avgBuyPrice)}
                </span>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>XRP</span>
              </Box>
            </OfferCard>
          </Box>

          {/* Trustline Info */}
          <OfferCard isDark={isDark}>
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: mockAssets.trustlineSet ? '#22c55e' : '#ef4444' }} />
                <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
                  Trustline {mockAssets.trustlineSet ? 'Active' : 'Not Set'}
                </span>
              </Box>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                Limit: {abbreviateNumber(mockAssets.limitAmount)}
              </span>
            </Box>
          </OfferCard>
        </Box>
      )}

      {/* My Trading History */}
      {activeSubTab === 'history' && (
        <>
          {/* Header */}
          {!isMobile && (
            <TableHeader isDark={isDark}>
              <div style={{ flex: '0.8' }}>Time</div>
              <div style={{ flex: '0.6' }}>Type</div>
              <div style={{ flex: '1' }}>Amount</div>
              <div style={{ flex: '0.8' }}>Price</div>
              <div style={{ flex: '0.8' }}>Total</div>
              <div style={{ flex: '0.6' }}>Status</div>
              <div style={{ flex: '0.3' }}></div>
            </TableHeader>
          )}

          {mockMyTrades.length === 0 ? (
            <Box
              style={{
                textAlign: 'center',
                padding: '24px',
                border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px'
              }}
            >
              <Typography variant="body2" color="text.secondary" isDark={isDark}>
                No trades yet for this token
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {mockMyTrades.map((trade) => (
                <Card key={trade._id} isDark={isDark}>
                  <CardContent style={{ padding: isMobile ? '10px 0' : '10px 0' }}>
                    {isMobile ? (
                      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TradeTypeChip tradetype={trade.type}>{trade.type}</TradeTypeChip>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            {formatRelativeTime(trade.time)}
                          </span>
                        </Box>
                        <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatTradeValue(trade.amount)} {tokenCurrency}
                        </span>
                        <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                          {trade.total.toFixed(2)} XRP
                        </span>
                      </Box>
                    ) : (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ flex: '0.8', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          {formatRelativeTime(trade.time)}
                        </span>
                        <div style={{ flex: '0.6' }}>
                          <TradeTypeChip tradetype={trade.type}>{trade.type}</TradeTypeChip>
                        </div>
                        <span style={{ flex: '1', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatTradeValue(trade.amount)} <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                        </span>
                        <span style={{ flex: '0.8', fontSize: '12px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatPrice(trade.price)}
                        </span>
                        <span style={{ flex: '0.8', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {trade.total.toFixed(2)} <span style={{ opacity: 0.5 }}>XRP</span>
                        </span>
                        <span style={{ flex: '0.6', fontSize: '10px', color: '#22c55e', textTransform: 'uppercase' }}>
                          {trade.status}
                        </span>
                        <div style={{ flex: '0.3' }}>
                          <IconButton onClick={() => onTransactionClick && onTransactionClick(trade.hash)} isDark={isDark}>
                            <ExternalLink size={12} />
                          </IconButton>
                        </div>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Open Offers */}
      {activeSubTab === 'offers' && (
        <>
          {loading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={24} />
            </Box>
          ) : openOffers.length === 0 ? (
            <Box
              style={{
                textAlign: 'center',
                padding: '24px',
                border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px'
              }}
            >
              <Typography variant="body2" color="text.secondary" isDark={isDark}>
                No open offers for this token
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {openOffers.map((offer) => {
                const isBuy = offer.takerGets?.currency === 'XRP' || offer.takerGets?.value;
                const type = isBuy ? 'BUY' : 'SELL';
                const tokenAmount = isBuy
                  ? parseFloat(offer.takerPays?.value || offer.takerPays || 0)
                  : parseFloat(offer.takerGets?.value || offer.takerGets || 0);
                const xrpAmount = isBuy
                  ? parseFloat(offer.takerGets?.value || offer.takerGets || 0) / 1000000
                  : parseFloat(offer.takerPays?.value || offer.takerPays || 0) / 1000000;
                const price = tokenAmount > 0 ? xrpAmount / tokenAmount : 0;
                const total = xrpAmount;

                return (
                  <OfferCard key={offer.seq || offer._id} isDark={isDark}>
                    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      {/* Left side - Offer details */}
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <TradeTypeChip tradetype={type} style={{ fontSize: '12px', fontWeight: 600 }}>
                          {type}
                        </TradeTypeChip>

                        <Box style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                            {formatTradeValue(tokenAmount)} <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            @ {formatPrice(price)} XRP
                          </span>
                        </Box>

                        <Box style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '16px', borderLeft: `1px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.1)'}` }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                            {total.toFixed(2)} <span style={{ opacity: 0.5 }}>XRP</span>
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            Total value
                          </span>
                        </Box>
                      </Box>

                      {/* Right side - Sequence and actions */}
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Box style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block' }}>
                            Seq #{offer.seq}
                          </span>
                          {offer.expiration && (
                            <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                              Expires {formatRelativeTime(offer.expiration * 1000)}
                            </span>
                          )}
                        </Box>

                        <CancelButton
                          onClick={() => handleCancelOffer(offer.seq)}
                          isDark={isDark}
                        >
                          Cancel
                        </CancelButton>
                      </Box>
                    </Box>
                  </OfferCard>
                );
              })}
            </Stack>
          )}

          {/* Pagination */}
          {offersTotal > offersLimit && (
            <Box style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setOffersPage(p => Math.max(0, p - 1))}
                disabled={offersPage === 0}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  background: 'transparent',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: '6px',
                  color: isDark ? '#fff' : '#1a1a1a',
                  cursor: offersPage === 0 ? 'not-allowed' : 'pointer',
                  opacity: offersPage === 0 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', padding: '6px 8px' }}>
                Page {offersPage + 1} of {Math.ceil(offersTotal / offersLimit)}
              </span>
              <button
                onClick={() => setOffersPage(p => p + 1)}
                disabled={(offersPage + 1) * offersLimit >= offersTotal}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  background: 'transparent',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: '6px',
                  color: isDark ? '#fff' : '#1a1a1a',
                  cursor: (offersPage + 1) * offersLimit >= offersTotal ? 'not-allowed' : 'pointer',
                  opacity: (offersPage + 1) * offersLimit >= offersTotal ? 0.5 : 1
                }}
              >
                Next
              </button>
            </Box>
          )}

          {/* Info note */}
          <Box style={{
            padding: '12px 14px',
            background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)',
            borderRadius: '8px',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
              Open offers are stored on the XRP Ledger. Cancelling an offer requires a transaction fee.
            </span>
          </Box>
        </>
      )}
    </Stack>
  );
};

// Inline Expandable Trade Details Component
const TradeDetails = ({ trade, account, isDark, onClose }) => {
  const [txData, setTxData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trade?.hash) return;
    setLoading(true);
    Promise.all([
      fetch(`https://api.xrpl.to/api/tx/${trade.hash}`).then(r => r.json()).catch(() => null),
      account ? fetch(`https://api.xrpl.to/api/account/info/${account}`).then(r => r.json()).catch(() => null) : Promise.resolve(null)
    ]).then(([tx, profile]) => {
      setTxData(tx);
      setProfileData(profile);
      setLoading(false);
    });
  }, [trade?.hash, account]);

  const dropsToXrp = (drops) => (Number(drops) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div style={{
      padding: '12px 8px',
      background: isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)',
      borderBottom: `1px solid ${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'}`,
      animation: 'expandIn 0.15s ease-out'
    }}>
      <style>{`@keyframes expandIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }`}</style>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}><Spinner size={18} /></div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Trader Info */}
          {account && (
            <div style={{ minWidth: '160px' }}>
              <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Trader</div>
              <a href={`/profile/${account}`} style={{ fontSize: '11px', fontFamily: 'monospace', color: '#3b82f6', textDecoration: 'none' }}>{account.slice(0,6)}...{account.slice(-4)}</a>
              {(profileData?.balance || profileData?.Balance || profileData?.account_data?.Balance) && (
                <div style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  {dropsToXrp(profileData?.balance || profileData?.Balance || profileData?.account_data?.Balance)} XRP
                </div>
              )}
            </div>
          )}
          {/* TX Info */}
          {txData && (
            <>
              <div style={{ minWidth: '100px' }}>
                <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Status</div>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: txData.meta?.TransactionResult === 'tesSUCCESS' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: txData.meta?.TransactionResult === 'tesSUCCESS' ? '#22c55e' : '#ef4444' }}>
                  {txData.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
                </span>
              </div>
              <div style={{ minWidth: '80px' }}>
                <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Fee</div>
                <div style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>{dropsToXrp(txData.Fee)} XRP</div>
              </div>
              <div style={{ minWidth: '80px' }}>
                <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Ledger</div>
                <div style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>#{txData.ledger_index}</div>
              </div>
            </>
          )}
          {/* Memo */}
          {txData?.Memos?.length > 0 && (() => {
            const memo = txData.Memos[0]?.Memo;
            const decodeMemo = (hex) => {
              try {
                let s = '';
                for (let i = 0; i < hex.length; i += 2) {
                  const b = parseInt(hex.substr(i, 2), 16);
                  if (b === 0) break;
                  s += String.fromCharCode(b);
                }
                return s || null;
              } catch { return null; }
            };
            const data = memo?.MemoData ? decodeMemo(memo.MemoData) : null;
            return data ? (
              <div style={{ minWidth: '120px', maxWidth: '200px' }}>
                <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Memo</div>
                <div style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data}</div>
              </div>
            ) : null;
          })()}
          {/* Links */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <a href={`/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>View TX</a>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <X size={14} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TradingHistory = ({ tokenId, amm, token, pairs, onTransactionClick, isDark = false, isMobile: isMobileProp = false }) => {
  // Use internal mobile detection for reliability
  const [isMobileState, setIsMobileState] = useState(isMobileProp);
  useEffect(() => {
    const checkMobile = () => setIsMobileState(window.innerWidth < 960);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const isMobile = isMobileState || isMobileProp;

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [pairType, setPairType] = useState('xrp'); // xrp, token, or empty for all
  const [xrpAmount, setXrpAmount] = useState(''); // Filter by minimum XRP amount
  const [historyType, setHistoryType] = useState('trades'); // trades, liquidity, all
  const [timeRange, setTimeRange] = useState(''); // 1h, 24h, 7d, 30d, or empty for all
  const [accountFilter, setAccountFilter] = useState('');
  const [liquidityType, setLiquidityType] = useState(''); // deposit, withdraw, create, or empty for all
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const limit = isMobile ? 10 : 20;

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

    // Sync with ledger updates every 4 seconds (delay first refresh)
    const intervalId = setInterval(() => {
      fetchTradingHistory(null, true, 'desc');
    }, 4000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, direction]);

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

      // Mobile card layout - compact single row
      if (isMobile) {
        return (
          <Card key={trade._id} isNew={newTradeIds.has(trade._id)} isDark={isDark}>
            <VolumeIndicator volume={volumePercentage} isDark={isDark} />
            <CardContent style={{ padding: '6px 0' }}>
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                {/* Left: Type + Time */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '65px' }}>
                  {isLiquidity ? (
                    <span style={{ fontSize: '10px', fontWeight: 500, color: trade.type === 'deposit' || trade.type === 'create' ? '#8b5cf6' : '#f59e0b' }}>
                      {getLiquidityLabel(trade.type)}
                    </span>
                  ) : (
                    <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>{isBuy ? 'BUY' : 'SELL'}</TradeTypeChip>
                  )}
                  <span style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    {formatRelativeTime(trade.time)}
                  </span>
                </Box>
                {/* Center: Amount → Total with labels */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>
                    {formatTradeValue(amountData.value)} <span style={{ opacity: 0.4, fontSize: '9px' }}>{decodeCurrency(amountData.currency)}</span>
                  </span>
                  <span style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>→</span>
                  <span style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>
                    {formatTradeValue(totalData.value)} <span style={{ opacity: 0.4, fontSize: '9px' }}>{decodeCurrency(totalData.currency)}</span>
                  </span>
                </Box>
                {/* Right: Link */}
                <IconButton onClick={() => handleTxClick(trade.hash, addressToShow)} isDark={isDark} style={{ padding: '2px' }}>
                  <ExternalLink size={12} />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        );
      }

      // Desktop grid layout - matching screenshot design with colored bars
      // Scale bars relative to typical trade sizes for better visualization
      const amountBarWidth = Math.min(100, Math.max(15, Math.log10(parseFloat(amountData.value) + 1) * 20));
      const valueBarWidth = Math.min(100, Math.max(15, Math.log10(xrpAmount + 1) * 25));

      return (
        <Card key={trade._id} isNew={newTradeIds.has(trade._id)} isDark={isDark}>
          <CardContent style={{ padding: '4px 0' }}>
            <Box style={{ display: 'grid', gridTemplateColumns: '70px 50px 90px 1fr 1fr 70px 40px', gap: '8px', alignItems: 'center' }}>
              {/* Time */}
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {formatRelativeTime(trade.time, true)}
              </span>

              {/* Type */}
              {isLiquidity ? (
                <span style={{ fontSize: '12px', fontWeight: 500, color: trade.type === 'deposit' || trade.type === 'create' ? '#8b5cf6' : '#f59e0b' }}>
                  {getLiquidityLabel(trade.type)}
                </span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 500, color: isBuy ? '#22c55e' : '#ef4444' }}>
                  {isBuy ? 'Buy' : 'Sell'}
                </span>
              )}

              {/* Price */}
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                {isLiquidity ? '-' : formatPrice(price)}
              </span>

              {/* Amount with colored bar */}
              <BarCell barWidth={amountBarWidth} isBuy={isBuy} isDark={isDark}>
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(amountData.value)} <span style={{ opacity: 0.5, fontSize: '10px' }}>{decodeCurrency(amountData.currency)}</span>
                </span>
              </BarCell>

              {/* Value with colored bar */}
              <BarCell barWidth={valueBarWidth} isBuy={isBuy} isDark={isDark}>
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(xrpAmount)} <span style={{ opacity: 0.5, fontSize: '10px' }}>{decodeCurrency(totalData.currency)}</span>
                </span>
              </BarCell>

              {/* Source */}
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isLiquidity ? 'AMM' : (getSourceTagName(trade.sourceTag) || '')}
              </span>

              {/* Animal tier icon - toggles inline details */}
              {(() => {
                const { Icon } = getTradeSizeInfo(xrpAmount);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setExpandedTradeId(expandedTradeId === trade._id ? null : trade._id)}>
                    <Icon size={16} isDark={isDark} />
                  </div>
                );
              })()}
            </Box>
          </CardContent>
          {/* Inline expanded details */}
          {expandedTradeId === trade._id && (
            <TradeDetails trade={trade} account={addressToShow} isDark={isDark} onClose={() => setExpandedTradeId(null)} />
          )}
        </Card>
      );
    });
  }, [trades, newTradeIds, amm, calculatePrice, handleTxClick, isMobile, isDark, expandedTradeId]);


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
    <Stack spacing={1} style={{ width: '100%', position: 'relative', zIndex: 0 }}>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <Tabs isDark={isDark}>
          <Tab selected={tabValue === 0} onClick={(e) => handleTabChange(e, 0)} isDark={isDark}><Activity size={14} /><span>Trades</span></Tab>
          <Tab selected={tabValue === 1} onClick={(e) => handleTabChange(e, 1)} isDark={isDark}><Droplets size={14} /><span>Pools</span></Tab>
          <Tab selected={tabValue === 2} onClick={(e) => handleTabChange(e, 2)} isDark={isDark}><Users size={14} /><span>Traders</span></Tab>
          <Tab selected={tabValue === 3} onClick={(e) => handleTabChange(e, 3)} isDark={isDark}><PieChart size={14} /><span>Holders</span></Tab>
          <Tab selected={tabValue === 4} onClick={(e) => handleTabChange(e, 4)} isDark={isDark}><Wallet size={14} /><span>My Activity</span></Tab>
        </Tabs>
        {tabValue === 0 && !isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pairType}
              onChange={(e) => setPairType(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${pairType ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
                border: `1px solid ${historyType !== 'trades' ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
                  border: `1px solid ${liquidityType ? '#8b5cf6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
                border: `1px solid ${xrpAmount ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
                border: `1px solid ${timeRange ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
                border: `1px solid ${accountFilter ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)')}`,
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
          {/* Desktop header - hidden on mobile */}
          {!isMobile && (
            <Box style={{
              display: 'grid',
              gridTemplateColumns: '70px 50px 90px 1fr 1fr 70px 40px',
              gap: '8px',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'}`
            }}>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Time
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Type</div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Price</div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', paddingLeft: '8px' }}>Amount</div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', paddingLeft: '8px' }}>Value</div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center' }}>Source<TierHelpIcon isDark={isDark} /></div>
              <div></div>
            </Box>
          )}

          {/* Mobile header with column labels */}
          {isMobile && (
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: '4px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '65px' }}>
                <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Type</span>
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Amount</span>
              <span style={{ width: '28px' }}></span>
            </Box>
          )}

          {trades.length === 0 ? emptyState : (
            <Stack spacing={0}>
              {renderedTrades}
            </Stack>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <Pagination isDark={isDark}>
                <PaginationButton onClick={handleFirstPage} disabled={currentPage === 1} isDark={isDark}><ChevronsLeft size={16} /></PaginationButton>
                <PaginationButton onClick={handlePrevPage} disabled={currentPage === 1} isDark={isDark}><ChevronLeft size={16} /></PaginationButton>

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

                <PaginationButton onClick={handleNextPage} disabled={isLastPage} isDark={isDark}><ChevronRight size={16} /></PaginationButton>
                <PaginationButton onClick={handleLastPage} disabled={isLastPage && direction === 'asc'} isDark={isDark}><ChevronsRight size={16} /></PaginationButton>
              </Pagination>
              <RecordsCount isDark={isDark}>
                {totalRecords > 0 ? `${totalRecords.toLocaleString()} records` : ''}
              </RecordsCount>
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
            <Box style={{ textAlign: 'center', padding: '20px', border: `1px dashed ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No pools found</span>
            </Box>
          ) : isMobile ? (
            /* Mobile compact pool rows - grid layout for alignment */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Mobile header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 55px 32px', gap: '8px', alignItems: 'center', padding: '6px 0', marginBottom: '4px', borderBottom: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Pool</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'right' }}>APY</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'right' }}>TVL</span>
                <span></span>
              </div>
              {ammPools.map((pool) => {
                const asset1 = pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 = pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const hasApy = pool.apy7d?.apy > 0;
                const isMainPool = (pool.asset1?.currency === 'XRP' && pool.asset2?.issuer === token?.issuer && pool.asset2?.currency === token?.currency) ||
                                   (pool.asset2?.currency === 'XRP' && pool.asset1?.issuer === token?.issuer && pool.asset1?.currency === token?.currency);
                return (
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 55px 32px', gap: '8px', alignItems: 'center', padding: isMainPool ? '10px 8px' : '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, background: isMainPool ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)') : 'transparent', borderLeft: isMainPool ? '3px solid #3b82f6' : 'none', borderRadius: isMainPool ? '6px' : '0', marginBottom: isMainPool ? '4px' : '0' }}>
                    {/* Pool pair */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset1}/{asset2}</span>
                      {isMainPool && <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', flexShrink: 0, letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}>MAIN</span>}
                    </div>
                    {/* APY */}
                    <span style={{ fontSize: '12px', fontWeight: hasApy ? 500 : 400, color: hasApy ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'), textAlign: 'right' }}>
                      {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                    </span>
                    {/* TVL */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'right' }}>
                      {pool.apy7d?.liquidity > 0 ? `${abbreviateNumber(pool.apy7d.liquidity)}` : '-'}
                    </span>
                    {/* Add button */}
                    <button onClick={() => handleAddLiquidity(pool)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 500, borderRadius: '5px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop grid layout */
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
                const isMainPool = (pool.asset1?.currency === 'XRP' && pool.asset2?.issuer === token?.issuer && pool.asset2?.currency === token?.currency) ||
                                   (pool.asset2?.currency === 'XRP' && pool.asset1?.issuer === token?.issuer && pool.asset1?.currency === token?.currency);
                return (
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 0.9fr 0.6fr 0.5fr', gap: '8px', padding: isMainPool ? '12px 10px 12px 12px' : '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, alignItems: 'center', background: isMainPool ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)') : 'transparent', borderRadius: isMainPool ? '8px' : '0', borderLeft: isMainPool ? '3px solid #3b82f6' : 'none', marginLeft: isMainPool ? '-4px' : '0', marginRight: isMainPool ? '-4px' : '0', marginBottom: isMainPool ? '6px' : '0' }}>
                    {/* Pool pair */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>{asset1}/{asset2}</span>
                      {isMainPool && (
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}>MAIN</span>
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

      {tabValue === 4 && (
        <MyActivityTab token={token} isDark={isDark} isMobile={isMobile} onTransactionClick={onTransactionClick} />
      )}

      {/* Add Liquidity Dialog - Using Portal to escape stacking context */}
      {typeof document !== 'undefined' && addLiquidityDialog.open && createPortal(
        <Dialog open={addLiquidityDialog.open} isDark={isDark} onClick={(e) => e.target === e.currentTarget && handleCloseDialog()}>
          <DialogPaper isDark={isDark}>
            <DialogTitle isDark={isDark}>
              Add Liquidity
              <IconButton onClick={handleCloseDialog} isDark={isDark} style={{ padding: '6px' }}>
                <X size={18} />
              </IconButton>
            </DialogTitle>
            <DialogContent isDark={isDark}>
              {addLiquidityDialog.pool && (
                <Stack spacing={2.5}>
                  {/* Pool Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                  }}>
                    <div style={{ display: 'flex' }}>
                      <img src={getTokenImageUrl(addLiquidityDialog.pool.asset1.issuer, addLiquidityDialog.pool.asset1.currency)} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      <img src={getTokenImageUrl(addLiquidityDialog.pool.asset2.issuer, addLiquidityDialog.pool.asset2.currency)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', marginLeft: -8 }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                      {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}/{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                    </span>
                  </div>

                  {/* Deposit Mode */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>Deposit Mode</span>
                      <div style={{ flex: 1, height: '1px', backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`, backgroundSize: '6px 1px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${depositMode === 'double' ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`, background: depositMode === 'double' ? (isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)') : 'transparent' }}>
                        <input type="radio" value="double" checked={depositMode === 'double'} onChange={(e) => setDepositMode(e.target.value)} style={{ accentColor: '#4285f4' }} />
                        <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>Double-asset (both tokens, no fee)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${depositMode === 'single1' ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`, background: depositMode === 'single1' ? (isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)') : 'transparent' }}>
                        <input type="radio" value="single1" checked={depositMode === 'single1'} onChange={(e) => setDepositMode(e.target.value)} style={{ accentColor: '#4285f4' }} />
                        <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset1.currency)} only)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${depositMode === 'single2' ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`, background: depositMode === 'single2' ? (isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)') : 'transparent' }}>
                        <input type="radio" value="single2" checked={depositMode === 'single2'} onChange={(e) => setDepositMode(e.target.value)} style={{ accentColor: '#4285f4' }} />
                        <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset2.currency)} only)</span>
                      </label>
                    </div>
                  </div>

                  {/* Asset 1 Input */}
                  {(depositMode === 'double' || depositMode === 'single1') && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>{decodeCurrency(addLiquidityDialog.pool.asset1.currency)}</span>
                        <div style={{ flex: 1, height: '1px', backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`, backgroundSize: '6px 1px' }} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <TextField
                          value={depositAmount1}
                          onChange={(e) => handleAmount1Change(e.target.value)}
                          type="number"
                          placeholder="0.00"
                          isDark={isDark}
                          style={{ paddingRight: '70px' }}
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                          {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Asset 2 Input */}
                  {(depositMode === 'double' || depositMode === 'single2') && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}</span>
                        <div style={{ flex: 1, height: '1px', backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`, backgroundSize: '6px 1px' }} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <TextField
                          value={depositAmount2}
                          onChange={(e) => handleAmount2Change(e.target.value)}
                          type="number"
                          placeholder="0.00"
                          isDark={isDark}
                          style={{ paddingRight: '70px' }}
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                          {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitDeposit}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 500,
                      width: '100%',
                      background: '#4285f4',
                      color: '#fff',
                      border: '1.5px solid #4285f4',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginTop: '4px',
                      transition: 'background 0.15s, opacity 0.15s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    Add Liquidity
                  </button>
                </Stack>
              )}
            </DialogContent>
          </DialogPaper>
        </Dialog>,
        document.body
      )}

    </Stack>
  );
};

export default memo(TradingHistory);
