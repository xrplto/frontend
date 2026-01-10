import React, { useState, useEffect, useCallback, useRef, memo, useMemo, useContext, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { MD5 } from 'crypto-js';
import styled from '@emotion/styled';
import axios from 'axios';
import { useSelector } from 'react-redux';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { AppContext } from 'src/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import { ExternalLink, X, Plus, Loader2, Activity, Droplets, Users, PieChart, Wallet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { cn } from 'src/utils/cn';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Spinner = styled(Loader2)`animation: spin 1s linear infinite; @keyframes spin { to { transform: rotate(360deg); } }`;

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
  111: 'Horizon',
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

const getSourceTagName = (sourceTag) => SOURCE_TAGS[sourceTag] || (sourceTag ? 'Source Unknown' : null);

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

// Simple tier icons - text-based for performance
const TIER_CONFIG = [
  { max: 100, label: '🦐', color: '#6b7280' },   // Shrimp
  { max: 500, label: '🐟', color: '#60a5fa' },   // Fish
  { max: 2000, label: '🗡', color: '#3b82f6' },  // Swordfish
  { max: 5000, label: '🦈', color: '#4285f4' },  // Shark
  { max: 20000, label: '🐋', color: '#2563eb' }, // Orca
  { max: Infinity, label: '🐳', color: '#22c55e' } // Whale
];

const TierIcon = ({ xrpValue, isDark }) => {
  const tier = TIER_CONFIG.find(t => xrpValue < t.max) || TIER_CONFIG[5];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '22px',
      height: '22px',
      borderRadius: '4px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)',
      fontSize: '12px'
    }}>{tier.label}</span>
  );
};

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
&lt;100 · 100-500 · 500-2K<br/>
      2K-5K · 5K-20K · 20K+ XRP
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
  border-radius: 6px;
  background: ${props => props.isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)'};
`;

const LiveCircle = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
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
  transition: background 0.15s ease;
  &:hover { background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}; }
  ${props => props.isNew && highlightAnimation(props.isDark)}
  @media (max-width: 640px) {
    padding: 0 4px;
  }
`;

const CardContent = styled.div`
  padding: 8px 0;
  @media (max-width: 640px) {
    padding: 12px 0;
  }
`;

const TradeTypeChip = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.tradetype === 'BUY' ? '#22c55e' : '#ef4444'};
  width: 36px;
  @media (max-width: 640px) {
    font-size: 12px;
    font-weight: 500;
    width: 40px;
  }
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

// Bar cell for showing colored bars behind values
const BarCell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 22px;
    width: ${props => Math.min(100, Math.max(8, props.barWidth || 0))}%;
    background: ${props => props.isCreate
      ? (props.isDark
          ? 'linear-gradient(90deg, rgba(20, 184, 166, 0.10) 0%, rgba(20, 184, 166, 0.18) 100%)'
          : 'linear-gradient(90deg, rgba(20, 184, 166, 0.06) 0%, rgba(20, 184, 166, 0.14) 100%)')
      : props.isLP
        ? (props.isDark
            ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.10) 0%, rgba(139, 92, 246, 0.18) 100%)'
            : 'linear-gradient(90deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.14) 100%)')
        : props.isBuy
          ? (props.isDark
              ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.22) 100%)'
              : 'linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.18) 100%)')
          : (props.isDark
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.22) 100%)'
              : 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.18) 100%)')};
    border-radius: 4px;
    border-left: 2px solid ${props => props.isCreate ? 'rgba(20, 184, 166, 0.5)' : props.isLP ? 'rgba(139, 92, 246, 0.5)' : props.isBuy
      ? (props.isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(34, 197, 94, 0.5)')
      : (props.isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)')};
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  gap: 1px;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'};
  background: transparent;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover:not(:disabled) {
    color: #3b82f6;
  }
  &:disabled { opacity: 0.2; cursor: default; }
`;

const PageInfo = styled.span`
  font-size: 11px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  padding: 0 6px;
  white-space: nowrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const TableHeader = styled.div`
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  & > div {
    font-size: 9px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${props => props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'};
  }
`;

const TableHead = styled.thead``;
const TableBody = styled.tbody``;
const TableRow = styled.tr`
  &:hover {
    background-color: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'};
  }
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
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
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  overflow: auto;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'};
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
  border-radius: 8px;
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
  gap: 8px;
  margin-bottom: 12px;
  @media (max-width: 640px) {
    width: 100%;
    gap: 6px;
  }
`;

const Tab = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid ${props => props.selected ? (props.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  border-radius: 6px;
  color: ${props => props.selected ? (props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)') : (props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
    color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
  }
  @media (max-width: 640px) {
    flex: 1;
    padding: 10px 6px;
    font-size: 10px;
    gap: 4px;
    & svg { width: 18px; height: 18px; }
    & > span { display: ${props => props.selected ? 'inline' : 'none'}; }
  }
`;

const Button = styled.button`
  padding: ${props => props.size === 'small' ? '4px 10px' : '6px 12px'};
  font-size: 11px;
  font-weight: 400;
  border-radius: 6px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.5)'};
    color: ${props => props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'};
  }
`;

const Dialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  box-sizing: border-box;
`;

const DialogPaper = styled.div`
  background: ${props => props.isDark ? '#0a0f16' : '#ffffff'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
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
  padding: 10px 12px;
  font-size: 13px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'};
  color: ${props => props.isDark ? '#fff' : '#1a1a1a'};
  transition: border-color 0.15s ease;
  &:focus { outline: none; border-color: rgba(59,130,246,0.4); }
  &::placeholder { color: ${props => props.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)'}; }
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

// Wallet tier indicator - returns XRP value for TierIcon
const getTradeSizeInfo = (value) => parseFloat(value) || 0;

const formatTradeValue = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue) || numValue === 0) return '0';

  if (Math.abs(numValue) < 0.01) {
    const str = Math.abs(numValue).toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numValue.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }

  if (Math.abs(numValue) < 1) return numValue.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return abbreviateNumber(numValue);
};

const formatXRPAmount = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue)) return '-';
  if (Math.abs(numValue) < 0.01) return numValue.toFixed(4);
  if (Math.abs(numValue) < 1) return numValue.toFixed(4);
  if (Math.abs(numValue) < 100) return numValue.toFixed(2);
  return abbreviateNumber(numValue);
};

const formatPriceValue = (value) => {
  if (value == null || !Number.isFinite(value)) return '-';
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue) || numValue === 0) return '0';

  if (Math.abs(numValue) < 0.01) {
    const str = Math.abs(numValue).toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numValue.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (Math.abs(numValue) < 1) return numValue.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  if (Math.abs(numValue) < 100) return numValue.toFixed(2);
  if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(1)}M`;
  if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(1)}K`;
  return Math.round(numValue).toString();
};

// Render helpers for compact notation
const formatPrice = (value) => {
  const f = formatPriceValue(value);
  if (f?.compact) return <>0.0<sub style={{ fontSize: '0.6em' }}>{f.zeros}</sub>{f.significant}</>;
  return f;
};

const formatTradeDisplay = (value) => {
  const f = formatTradeValue(value);
  if (f?.compact) return <>0.0<sub style={{ fontSize: '0.6em' }}>{f.zeros}</sub>{f.significant}</>;
  return f;
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
  };

  const SubTab = styled.button`
    font-size: 12px;
    font-weight: 500;
    padding: 10px 16px;
    background: ${props => props.selected ? (props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'transparent'};
    border: none;
    border-right: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
    color: ${props => props.selected ? (props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)') : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    &:last-child { border-right: none; }
    &:hover {
      background: ${props => props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
      color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};
    }
    @media (max-width: 640px) {
      padding: 8px 12px;
      font-size: 11px;
    }
  `;

  const OfferCard = styled.div`
    background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
    border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'};
    border-radius: 12px;
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
    border-radius: 8px;
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
    <div
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
      <span style={{ color: "inherit" }}>
        Connect Wallet to View Activity
      </span>
      <span style={{ color: "inherit" }}>
        Your trading history and open offers will appear here
      </span>
    </div>
  );

  const isConnected = !!(accountProfile?.account || accountProfile?.address);

  if (!isConnected) {
    return notConnectedState;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Sub-tabs */}
      <div style={{
        display: 'inline-flex',
        gap: '0',
        padding: '0',
        background: 'transparent',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: '12px',
        marginBottom: '4px',
        overflow: 'hidden'
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
      </div>

      {/* Assets */}
      {activeSubTab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Balance Card */}
          <OfferCard isDark={isDark}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Balance</span>
                <span style={{ fontSize: '22px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeDisplay(mockAssets.balance)} <span style={{ fontSize: '14px', opacity: 0.5 }}>{tokenCurrency}</span>
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Value</span>
                <span style={{ fontSize: '18px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                  {mockAssets.totalValue.toFixed(2)} <span style={{ fontSize: '12px', opacity: 0.5 }}>XRP</span>
                </span>
              </div>
            </div>
          </OfferCard>

          {/* P&L Card */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <OfferCard isDark={isDark}>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Unrealized P&L</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: mockAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                  {mockAssets.pnl >= 0 ? '+' : ''}{mockAssets.pnl.toFixed(2)} XRP
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: mockAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                  ({mockAssets.pnl >= 0 ? '+' : ''}{mockAssets.pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </OfferCard>

            <OfferCard isDark={isDark}>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Avg Buy Price</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(mockAssets.avgBuyPrice)}
                </span>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>XRP</span>
              </div>
            </OfferCard>
          </div>

          {/* Trustline Info */}
          <OfferCard isDark={isDark}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: mockAssets.trustlineSet ? '#22c55e' : '#ef4444' }} />
                <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
                  Trustline {mockAssets.trustlineSet ? 'Active' : 'Not Set'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                Limit: {abbreviateNumber(mockAssets.limitAmount)}
              </span>
            </div>
          </OfferCard>
        </div>
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
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px'
              }}
            >
              <span style={{ color: "inherit" }}>
                No trades yet for this token
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {mockMyTrades.map((trade) => (
                <Card key={trade._id} isDark={isDark}>
                  <CardContent style={{ padding: isMobile ? '10px 0' : '10px 0' }}>
                    {isMobile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TradeTypeChip tradetype={trade.type}>{trade.type}</TradeTypeChip>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            {formatRelativeTime(trade.time)}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatTradeDisplay(trade.amount)} {tokenCurrency}
                        </span>
                        <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                          {formatXRPAmount(trade.total)} XRP
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ flex: '0.8', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          {formatRelativeTime(trade.time)}
                        </span>
                        <div style={{ flex: '0.6' }}>
                          <TradeTypeChip tradetype={trade.type}>{trade.type}</TradeTypeChip>
                        </div>
                        <span style={{ flex: '1', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatTradeDisplay(trade.amount)} <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                        </span>
                        <span style={{ flex: '0.8', fontSize: '12px', fontFamily: 'var(--font-mono)', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatPrice(trade.price)}
                        </span>
                        <span style={{ flex: '0.8', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                          {formatXRPAmount(trade.total)} <span style={{ opacity: 0.5 }}>XRP</span>
                        </span>
                        <span style={{ flex: '0.6', fontSize: '10px', color: '#22c55e', textTransform: 'uppercase' }}>
                          {trade.status}
                        </span>
                        <div style={{ flex: '0.3' }}>
                          <IconButton onClick={() => onTransactionClick && onTransactionClick(trade.hash)} isDark={isDark}>
                            <ExternalLink size={12} />
                          </IconButton>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Open Offers */}
      {activeSubTab === 'offers' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={24} />
            </div>
          ) : openOffers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px'
              }}
            >
              <span style={{ color: "inherit" }}>
                No open offers for this token
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      {/* Left side - Offer details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <TradeTypeChip tradetype={type} style={{ fontSize: '12px', fontWeight: 600 }}>
                          {type}
                        </TradeTypeChip>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                            {formatTradeDisplay(tokenAmount)} <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            @ {formatPrice(price)} XRP
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '16px', borderLeft: `1px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.1)'}` }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                            {formatXRPAmount(total)} <span style={{ opacity: 0.5 }}>XRP</span>
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            Total value
                          </span>
                        </div>
                      </div>

                      {/* Right side - Sequence and actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block' }}>
                            Seq #{offer.seq}
                          </span>
                          {offer.expiration && (
                            <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                              Expires {formatRelativeTime(offer.expiration * 1000)}
                            </span>
                          )}
                        </div>

                        <CancelButton
                          onClick={() => handleCancelOffer(offer.seq)}
                          isDark={isDark}
                        >
                          Cancel
                        </CancelButton>
                      </div>
                    </div>
                  </OfferCard>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {offersTotal > offersLimit && (
            <div className="flex items-center justify-center gap-1 pt-3">
              <button
                onClick={() => setOffersPage(p => Math.max(0, p - 1))}
                disabled={offersPage === 0}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  offersPage === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
                  isDark ? "text-white/50" : "text-gray-500"
                )}
                title="Previous"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={cn("text-[11px] px-2 tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>
                {offersPage + 1}<span style={{ opacity: 0.5 }}>/</span>{Math.ceil(offersTotal / offersLimit)}
              </span>
              <button
                onClick={() => setOffersPage(p => p + 1)}
                disabled={(offersPage + 1) * offersLimit >= offersTotal}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  (offersPage + 1) * offersLimit >= offersTotal ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
                  isDark ? "text-white/50" : "text-gray-500"
                )}
                title="Next"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Info note */}
          <div style={{
            padding: '12px 14px',
            background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)',
            borderRadius: '8px',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
              Open offers are stored on the XRP Ledger. Cancelling an offer requires a transaction fee.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Inline Expandable Trade Details Component
const TradeDetails = ({ trade, account, isDark, onClose }) => {
  const [txData, setTxData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const explainWithAI = async () => {
    if (aiLoading || aiExplanation || !trade?.hash) return;
    setAiLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`https://api.xrpl.to/api/tx-explain/${trade.hash}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setAiExplanation(data);
    } catch (err) {
      setAiExplanation({ summary: { summary: err.name === 'AbortError' ? 'Request timed out. Try viewing the full transaction page.' : 'AI unavailable. View full TX for details.' } });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!trade?.hash) return;
    setLoading(true);
    Promise.all([
      fetch(`https://api.xrpl.to/api/tx/${trade.hash}`).then(r => r.json()).catch(() => null),
      account ? fetch(`https://api.xrpl.to/api/account/info/${account}`).then(r => r.json()).catch(() => null) : Promise.resolve(null)
    ]).then(([tx, profile]) => {
      // Extract nested tx object from API response
      const txObj = tx?.tx_json || tx?.tx || tx;
      const meta = tx?.meta || txObj?.meta;
      setTxData(txObj ? { ...txObj, meta } : null);
      setProfileData(profile);
      setLoading(false);
    });
  }, [trade?.hash, account]);

  const dropsToXrp = (drops) => (Number(drops) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div style={{
      padding: '12px 8px',
      background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(128,128,128,0.1)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      animation: 'expandIn 0.15s ease-out'
    }}>
      <style>{`@keyframes expandIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }`}</style>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}><Spinner size={18} /></div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Trader Info */}
          {account && (
            <div style={{ minWidth: '120px', maxWidth: '180px', overflow: 'hidden' }}>
              <div style={{ fontSize: '9px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Trader</div>
              <a
                href={`/address/${account}`}
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={account}
              >
                {account.slice(0,6)}...{account.slice(-4)}
              </a>
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
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <a
              href={`/tx/${trade.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 500, color: '#fff',
                background: '#3b82f6', border: 'none', borderRadius: '6px',
                padding: '6px 12px', textDecoration: 'none', cursor: 'pointer'
              }}
            >
              <ExternalLink size={12} />
              <span>View Details</span>
            </a>
            <button
              onClick={explainWithAI}
              disabled={aiLoading || aiExplanation}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 500, color: '#fff',
                background: aiExplanation ? (isDark ? '#4b5563' : '#9ca3af') : '#a78bfa',
                border: 'none', borderRadius: '6px',
                padding: '6px 12px', cursor: aiLoading || aiExplanation ? 'default' : 'pointer'
              }}
            >
              {aiLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
              <span>{aiLoading ? 'Loading...' : 'Explain with AI'}</span>
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '4px' }}>
              <X size={14} style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
            </button>
          </div>
        </div>
      )}
      {/* AI Explanation */}
      {aiExplanation && !aiLoading && (() => {
        let summaryText = 'AI analysis complete.';
        let keyPoints = [];
        const raw = aiExplanation.summary?.raw || aiExplanation.summary;
        if (typeof raw === 'string') {
          const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
          if (summaryMatch) summaryText = summaryMatch[1];
          const keyPointsMatch = raw.match(/"keyPoints"\s*:\s*\[([^\]]*)/);
          if (keyPointsMatch) {
            const points = keyPointsMatch[1].match(/"([^"]+)"/g);
            if (points) keyPoints = points.map(p => p.replace(/"/g, ''));
          }
        } else if (typeof raw === 'object' && raw?.summary) {
          summaryText = raw.summary;
          keyPoints = raw.keyPoints || [];
        }
        return (
          <div style={{
            marginTop: '8px', padding: '12px 16px',
            background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.05)',
            borderTop: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'}`
          }}>
            <div style={{ fontSize: '13px', marginBottom: keyPoints.length ? '12px' : 0 }}>
              <span style={{ color: '#a78bfa', fontWeight: 500 }}>{aiExplanation.extracted?.type || 'Trade'}:</span>{' '}
              <span style={{ color: isDark ? '#fff' : '#1a1a1a' }}>{summaryText}</span>
            </div>
            {keyPoints.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: '8px' }}>
                  Key Points
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {keyPoints.map((point, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                      <span style={{ color: '#8b5cf6' }}>•</span>
                      <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}
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

  // Fiat currency conversion
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [pairType, setPairType] = useState('xrp'); // xrp, token, or empty for all
  const [xrpAmount, setXrpAmount] = useState(''); // Filter by minimum XRP amount
  const [historyType, setHistoryType] = useState('all'); // trades, liquidity, all
  const [timeRange, setTimeRange] = useState(''); // 1h, 24h, 7d, 30d, or empty for all
  const [accountFilter, setAccountFilter] = useState('');
  const [liquidityType, setLiquidityType] = useState(''); // deposit, withdraw, create, or empty for all
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const wsRef = useRef(null);
  const wsPingRef = useRef(null);
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
          `https://api.xrpl.to/api/amm?issuer=${token.issuer}&currency=${token.currency}&sortBy=fees`
        );
        const data = await res.json();
        // Sort to ensure main XRP pool appears first
        const pools = data.pools || [];
        pools.sort((a, b) => {
          const aIsMain = (a.asset1?.currency === 'XRP' && a.asset2?.issuer === token?.issuer && a.asset2?.currency === token?.currency) ||
                          (a.asset2?.currency === 'XRP' && a.asset1?.issuer === token?.issuer && a.asset1?.currency === token?.currency);
          const bIsMain = (b.asset1?.currency === 'XRP' && b.asset2?.issuer === token?.issuer && b.asset2?.currency === token?.currency) ||
                          (b.asset2?.currency === 'XRP' && b.asset1?.issuer === token?.issuer && b.asset1?.currency === token?.currency);
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          return 0; // Keep API order (by fees) for non-main pools
        });
        setAmmPools(pools);
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

      // Add liquidityType filter (API handles this server-side)
      if (liquidityType) {
        params.set('liquidityType', liquidityType);
      }

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
        const currentTradeIds = previousTradesRef.current;
        const newTrades = data.hists.filter((trade) => !currentTradeIds.has(trade._id));

        if (newTrades.length > 0 && isRefresh) {
          setNewTradeIds(new Set(newTrades.map((trade) => trade._id)));
          previousTradesRef.current = new Set(data.hists.map((trade) => trade._id));
          setTimeout(() => {
            setNewTradeIds(new Set());
          }, 1000);
        }

        setTrades(data.hists.slice(0, 50));
        setNextCursor(data.nextCursor || null);
        setTotalRecords(data.totalRecords || 0);

        // Determine if we've reached the end of records in the current direction
        const recordsReturned = data.recordsReturned || data.hists.length;

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

  // WebSocket for real-time trade updates (only for page 1 with desc direction, no account filter)
  useEffect(() => {
    let isMounted = true;

    if (!tokenId || currentPage !== 1 || direction !== 'desc' || accountFilter) {
      // Close existing WS if conditions not met
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Close existing WS
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (wsPingRef.current) {
      clearInterval(wsPingRef.current);
      wsPingRef.current = null;
    }

    // Connect immediately
    const wsParams = new URLSearchParams({ limit: String(limit) });
    if (pairType) wsParams.set('pairType', pairType);
    if (historyType !== 'all') wsParams.set('type', historyType);

    const ws = new WebSocket(`wss://api.xrpl.to/ws/history/${tokenId}?${wsParams}`);
    wsRef.current = ws;

    ws.onopen = () => {
      wsPingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      const msg = JSON.parse(event.data);

      // Helper to filter trades based on current filters
      const applyClientFilters = (trades) => {
        return trades.filter(t => {
          // Filter by historyType (trades vs liquidity)
          if (historyType === 'trades' && t.isLiquidity) return false;
          if (historyType === 'liquidity' && !t.isLiquidity) return false;

          // Filter by liquidityType (deposit/withdraw/create)
          if (liquidityType && t.isLiquidity && t.type !== liquidityType) return false;

          // Filter by pairType (xrp vs token pairs)
          if (pairType) {
            const hasXrp = t.paid?.currency === 'XRP' || t.got?.currency === 'XRP';
            if (pairType === 'xrp' && !hasXrp) return false;
            if (pairType === 'token' && hasXrp) return false;
          }

          // Filter by minimum XRP amount
          if (xrpAmount) {
            const minXrp = parseFloat(xrpAmount);
            if (!isNaN(minXrp) && minXrp > 0) {
              const tradeXrp = t.paid?.currency === 'XRP'
                ? parseFloat(t.paid?.value || 0)
                : parseFloat(t.got?.value || 0);
              if (tradeXrp < minXrp) return false;
            }
          }

          return true;
        });
      };

      if (msg.type === 'initial' && msg.trades) {
        // WebSocket doesn't properly filter by type/pairType, so only use initial data when no filters active
        // Let HTTP fetch handle initial data when filters are set
        if (historyType !== 'liquidity' && !pairType) {
          const filteredTrades = applyClientFilters(msg.trades);
          setTrades(filteredTrades.slice(0, 50));
          setLoading(false);
        }
        previousTradesRef.current = new Set(msg.trades.map(t => t._id || t.id));
      } else if (msg.e === 'trades' && msg.trades?.length > 0) {
        const currentIds = previousTradesRef.current;
        const newTrades = msg.trades.filter(t => !currentIds.has(t._id || t.id));
        const filteredNewTrades = applyClientFilters(newTrades);

        if (filteredNewTrades.length > 0) {
          setNewTradeIds(new Set(filteredNewTrades.map(t => t._id || t.id)));
          setTrades(prev => [...filteredNewTrades, ...prev].slice(0, 50));
          filteredNewTrades.forEach(t => currentIds.add(t._id || t.id));
          setTimeout(() => setNewTradeIds(new Set()), 1000);
        }
        // Still track all trade IDs to prevent duplicates later
        newTrades.forEach(t => currentIds.add(t._id || t.id));
      }
    };

    ws.onerror = () => {
      // Silently handle - HTTP fallback already loads data
    };

    ws.onclose = () => {
      if (wsPingRef.current) {
        clearInterval(wsPingRef.current);
        wsPingRef.current = null;
      }
    };

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (wsPingRef.current) {
        clearInterval(wsPingRef.current);
        wsPingRef.current = null;
      }
    };
  }, [tokenId, currentPage, direction, accountFilter, pairType, historyType, liquidityType, xrpAmount, limit]);

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
    const parsedToken = parseFloat(tokenAmount);
    // Return null if token amount is zero or invalid to avoid Infinity
    if (!parsedToken || parsedToken === 0) {
      return null;
    }
    return parseFloat(xrpAmount) / parsedToken;
  }, []);

  // Memoized trade list rendering
  const renderedTrades = useMemo(() => {
    // Helper to get display address for a trade
    const getTradeAddress = (t) => {
      if (!t) return null;

      // For liquidity events, use account field
      if (t.isLiquidity) {
        return t.account || null;
      }

      // For regular trades, prefer taker unless it's the AMM
      let addr = t.taker;

      // If taker is the AMM or missing, use maker instead
      if (!addr || (amm && addr === amm)) {
        addr = t.maker;
      }

      // Final fallback: try account field if exists (some trade types may use it)
      if (!addr) {
        addr = t.account;
      }

      return addr || null;
    };

    // Pre-compute which addresses appear more than once and assign colors
    const addressCounts = {};
    trades.forEach((trade) => {
      const addr = getTradeAddress(trade);
      if (addr) addressCounts[addr] = (addressCounts[addr] || 0) + 1;
    });
    const dotColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const addressColorMap = {};
    let colorIndex = 0;
    Object.keys(addressCounts).forEach((addr) => {
      if (addressCounts[addr] > 1) {
        addressColorMap[addr] = dotColors[colorIndex % dotColors.length];
        colorIndex++;
      }
    });
    const getAddressDotColor = (trade) => {
      const addr = getTradeAddress(trade);
      return addr ? addressColorMap[addr] : null;
    };

    return trades.map((trade, index) => {
      const isLiquidity = trade.isLiquidity;
      const isBuy = trade.paid.currency === 'XRP';
      const xrpAmount = getXRPAmount(trade);
      const price = isLiquidity ? null : calculatePrice(trade);
      const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

      const amountData = isBuy ? trade.got : trade.paid;
      const totalData = isBuy ? trade.paid : trade.got;

      // For liquidity events, show the account; for trades show taker (or maker if taker is AMM)
      const addressToShow = getTradeAddress(trade);
      const dotColor = getAddressDotColor(trade);

      // Simple liquidity label
      const getLiquidityLabel = () => {
        if (trade.type === 'withdraw') return 'Remove';
        if (trade.type === 'create') return 'Create';
        return 'Add';
      };

      // Mobile card layout - compact single row
      if (isMobile) {
        return (
          <Card key={trade._id || trade.id || index} isNew={newTradeIds.has(trade._id || trade.id)} isDark={isDark}>
            <VolumeIndicator volume={volumePercentage} isDark={isDark} />
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                {/* Left: Type + Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '75px' }}>
                  {isLiquidity ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: trade.type === 'withdraw' ? '#f59e0b' : trade.type === 'create' ? '#14b8a6' : '#8b5cf6'
                    }}>
                      {getLiquidityLabel()}
                    </span>
                  ) : (
                    <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>{isBuy ? 'BUY' : 'SELL'}</TradeTypeChip>
                  )}
                  <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    {formatRelativeTime(trade.time)}
                  </span>
                </div>
                {/* Center: Amount → Total with fiat value */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: isDark ? '#fff' : '#1a1a1a' }}>
                    {formatTradeDisplay(amountData.value)} <span style={{ opacity: 0.5, fontSize: '11px' }}>{decodeCurrency(amountData.currency)}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>→</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: isDark ? '#fff' : '#1a1a1a' }}>
                    {formatTradeDisplay(totalData.value)} <span style={{ opacity: 0.5, fontSize: '11px' }}>{decodeCurrency(totalData.currency)}</span>
                    {activeFiatCurrency !== 'XRP' && (
                      <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', marginLeft: '4px' }}>
                        ({SYMBOLS[activeFiatCurrency]}{formatTradeDisplay((xrpAmount > 0 ? xrpAmount : (parseFloat(amountData.value) * (token?.exch || 0))) / exchRate)})
                      </span>
                    )}
                  </span>
                </div>
                {/* Right: Link */}
                <IconButton onClick={() => handleTxClick(trade.hash, addressToShow)} isDark={isDark} style={{ padding: '4px' }}>
                  <ExternalLink size={16} />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Desktop grid layout - matching screenshot design with colored bars
      // Both bars scale based on XRP value for consistent sizing
      const barWidth = Math.min(100, Math.max(15, Math.log10(xrpAmount + 1) * 25));

      return (
        <Card key={trade._id || trade.id || index} isNew={newTradeIds.has(trade._id || trade.id)} isDark={isDark}>
          <CardContent style={{ padding: '4px 0' }}>
            <div
              style={{ display: 'grid', gridTemplateColumns: `70px 50px 90px 1fr 1fr ${activeFiatCurrency !== 'XRP' ? '70px ' : ''}95px 70px 40px`, gap: '8px', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedTradeId(expandedTradeId === (trade._id || trade.id) ? null : (trade._id || trade.id))}
            >
              {/* Time */}
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {formatRelativeTime(trade.time, true)}
              </span>

              {/* Type */}
              {isLiquidity ? (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: trade.type === 'withdraw' ? '#f59e0b' : trade.type === 'create' ? '#14b8a6' : '#8b5cf6'
                }}>
                  {getLiquidityLabel()}
                </span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 500, color: isBuy ? '#22c55e' : '#ef4444' }}>
                  {isBuy ? 'Buy' : 'Sell'}
                </span>
              )}

              {/* Price */}
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: isDark ? '#fff' : '#1a1a1a' }}>
                {isLiquidity ? '-' : formatPrice(price)}
              </span>

              {/* Amount with colored bar */}
              <BarCell barWidth={barWidth} isBuy={isBuy} isLP={isLiquidity} isCreate={trade.type === 'create'} isDark={isDark}>
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeDisplay(amountData.value)} <span style={{ opacity: 0.5, fontSize: '10px' }}>{decodeCurrency(amountData.currency)}</span>
                </span>
              </BarCell>

              {/* Value with colored bar */}
              <BarCell barWidth={barWidth} isBuy={isBuy} isLP={isLiquidity} isCreate={trade.type === 'create'} isDark={isDark}>
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeDisplay(totalData.value)} <span style={{ opacity: 0.5, fontSize: '10px' }}>{decodeCurrency(totalData.currency)}</span>
                </span>
              </BarCell>

              {/* Fiat Value */}
              {activeFiatCurrency !== 'XRP' && (
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {SYMBOLS[activeFiatCurrency]}{formatTradeDisplay((xrpAmount > 0 ? xrpAmount : (parseFloat(amountData.value) * (token?.exch || 0))) / exchRate)}
                </span>
              )}

              {/* Trader Address */}
              <a
                href={`/address/${addressToShow}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  textDecoration: 'none',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '95px'
                }}
                title={addressToShow}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'; }}
              >
                {dotColor && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />}
                {addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : '-'}
              </a>

              {/* Source */}
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getSourceTagName(trade.sourceTag) || (isLiquidity ? 'AMM' : '')}
              </span>

              {/* Animal tier icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TierIcon xrpValue={xrpAmount} isDark={isDark} />
              </div>
            </div>
          </CardContent>
          {/* Inline expanded details */}
          {expandedTradeId === (trade._id || trade.id) && (
            <TradeDetails trade={trade} account={addressToShow} isDark={isDark} onClose={() => setExpandedTradeId(null)} />
          )}
        </Card>
      );
    });
  }, [trades, newTradeIds, amm, calculatePrice, handleTxClick, isMobile, isDark, expandedTradeId, activeFiatCurrency, exchRate]);


  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  const emptyState = (
    <div
      style={{
        textAlign: 'center',
        padding: '24px',
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
      }}
    >
      <span style={{ color: "inherit" }}>
        {historyType === 'liquidity' ? 'No Liquidity Events' : historyType === 'all' ? 'No Activity' : 'No Recent Trades'}
      </span>
      <span style={{ color: "inherit" }}>
        {historyType === 'liquidity' ? 'AMM liquidity events will appear here' : 'Trading activity will appear here when available'}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', flex: 1, position: 'relative', zIndex: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
              onChange={(e) => {
                const newType = e.target.value;
                setHistoryType(newType);
                // Clear liquidityType filter when switching away from liquidity
                if (newType !== 'liquidity') {
                  setLiquidityType('');
                }
              }}
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
            {historyType === 'liquidity' && (
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
      </div>

      {tabValue === 0 && (
        <>
          {/* Desktop header - hidden on mobile */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '70px 50px 90px 1fr 1fr 95px 70px 40px',
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
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Trader</div>
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Source</div>
              <div></div>
            </div>
          )}

          {/* Mobile header with column labels */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: '4px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '65px' }}>
                <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Type</span>
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Amount</span>
              <span style={{ width: '28px' }}></span>
            </div>
          )}

          {trades.length === 0 ? emptyState : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
              {renderedTrades}
            </div>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
              <Pagination isDark={isDark}>
                <PaginationButton onClick={handleFirstPage} disabled={currentPage === 1} isDark={isDark} title="First">
                  <ChevronsLeft size={14} />
                </PaginationButton>
                <PaginationButton onClick={handlePrevPage} disabled={currentPage === 1} isDark={isDark} title="Previous">
                  <ChevronLeft size={14} />
                </PaginationButton>
                <PageInfo isDark={isDark}>
                  {currentPage.toLocaleString()}<span style={{ opacity: 0.5 }}>/</span>{Math.ceil(totalRecords / limit).toLocaleString()}
                </PageInfo>
                <PaginationButton onClick={handleNextPage} disabled={isLastPage} isDark={isDark} title="Next">
                  <ChevronRight size={14} />
                </PaginationButton>
                <PaginationButton onClick={handleLastPage} disabled={isLastPage && direction === 'asc'} isDark={isDark} title="Last">
                  <ChevronsRight size={14} />
                </PaginationButton>
              </Pagination>
            </div>
          )}
        </>
      )}


      {tabValue === 1 && (
        <div>
          {ammLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={20} />
            </div>
          ) : ammPools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', border: `1px dashed ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No pools found</span>
            </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) repeat(6, 1fr) 70px', gap: '16px', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Pool</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fee</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>APY</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fees (7d)</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Vol (7d)</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Liquidity</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Last</span>
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
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) repeat(6, 1fr) 70px', gap: '16px', padding: isMainPool ? '12px 10px 12px 12px' : '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, alignItems: 'center', background: isMainPool ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)') : 'transparent', borderRadius: isMainPool ? '8px' : '0', borderLeft: isMainPool ? '3px solid #3b82f6' : 'none', marginLeft: isMainPool ? '-4px' : '0', marginRight: isMainPool ? '-4px' : '0', marginBottom: isMainPool ? '6px' : '0' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{feePercent}%</span>
                    </div>
                    {/* APY */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', fontWeight: hasApy ? 500 : 400, color: hasApy ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') }}>
                        {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                    {/* Fees */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                        {pool.apy7d?.fees > 0 ? abbreviateNumber(pool.apy7d.fees) : '-'}
                      </span>
                    </div>
                    {/* Volume */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                        {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                      </span>
                    </div>
                    {/* Liquidity */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                        {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                      </span>
                    </div>
                    {/* Action */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                          gap: '4px'
                        }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                </div>
              )}
            </DialogContent>
          </DialogPaper>
        </Dialog>,
        document.body
      )}

    </div>
  );
};

export default memo(TradingHistory);
