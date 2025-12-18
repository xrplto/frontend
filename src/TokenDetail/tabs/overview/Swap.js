import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { ArrowUpDown, RefreshCw, EyeOff, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { ConnectWallet } from 'src/components/Wallet';
import { selectMetrics } from 'src/redux/statusSlice';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const XRP_TOKEN = { currency: 'XRP', issuer: 'XRPL', md5: '84e5efeb89c4eae8f68188982dc290d8', name: 'XRP' };

// Module-level cache to prevent duplicate fetches in StrictMode
const fetchInFlight = new Map();
import Decimal from 'decimal.js-light';
import { fNumber } from 'src/utils/formatters';

import { configureMemos } from 'src/utils/parseUtils';
import Image from 'next/image';
import { PuffLoader } from '../../../components/Spinners';

// Lazy load XRPL dependencies for device authentication
let Wallet, CryptoJS;

const loadXRPLDependencies = async () => {
  if (!Wallet) {
    const xrpl = await import('xrpl');
    Wallet = xrpl.Wallet;
  }
  if (!CryptoJS) {
    CryptoJS = await import('crypto-js');
  }
};

// REST-based autofill and submit helpers
const autofillTransaction = async (tx, address) => {
  const [seqRes, feeRes] = await Promise.all([
    axios.get(`https://api.xrpl.to/api/submit/account/${address}/sequence`),
    axios.get('https://api.xrpl.to/api/submit/fee')
  ]);
  return {
    ...tx,
    Sequence: seqRes.data.sequence,
    Fee: feeRes.data.base_fee,
    LastLedgerSequence: seqRes.data.ledger_index + 20
  };
};

const submitTransaction = async (tx_blob) => {
  const res = await axios.post('https://api.xrpl.to/api/submit', { tx_blob });
  return res.data;
};

// Device authentication wallet helpers
const generateSecureDeterministicWallet = (credentialId, accountIndex, userEntropy = '') => {
  const entropyString = `passkey-wallet-${credentialId}-${accountIndex}-${userEntropy}`;
  const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${credentialId}`, {
    keySize: 256/32,
    iterations: 100000
  }).toString();
  const privateKeyHex = seedHash.substring(0, 64);
  return new Wallet(privateKeyHex);
};

const getDeviceWallet = (accountProfile) => {
  if (accountProfile?.wallet_type === 'device' && accountProfile?.deviceKeyId && typeof accountProfile?.accountIndex === 'number') {
    return generateSecureDeterministicWallet(accountProfile.deviceKeyId, accountProfile.accountIndex);
  }
  return null;
};

const alpha = (color, opacity) => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color.replace(')', `, ${opacity})`);
};

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  70% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.95);
    opacity: 1;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'column'};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  gap: ${props => {
    if (typeof props.spacing === 'number') return `${props.spacing * 8}px`;
    return props.gap || '0';
  }};
  width: ${props => props.width || 'auto'};
  flex-wrap: ${props => props.flexWrap || 'nowrap'};
  ${props => props.sx && Object.entries(props.sx).map(([key, value]) => {
    if (key === 'mb') return `margin-bottom: ${typeof value === 'number' ? value * 8 : value}px;`;
    if (key === 'mt') return `margin-top: ${typeof value === 'number' ? value * 8 : value}px;`;
    if (key === 'px') return `padding-left: ${typeof value === 'number' ? value * 8 : value}px; padding-right: ${typeof value === 'number' ? value * 8 : value}px;`;
    if (key === 'py') return `padding-top: ${typeof value === 'number' ? value * 8 : value}px; padding-bottom: ${typeof value === 'number' ? value * 8 : value}px;`;
    return '';
  }).join(' ')}
`;

const Box = styled.div`
  display: ${props => props.display || 'block'};
  flex-direction: ${props => props.flexDirection || 'row'};
  flex: ${props => props.flex || 'initial'};
  gap: ${props => props.gap || '0'};
  width: ${props => props.width || 'auto'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  align-items: ${props => props.alignItems || 'stretch'};
  ${props => props.sx && Object.entries(props.sx).map(([key, value]) => {
    if (key === 'mb') return `margin-bottom: ${typeof value === 'number' ? value * 8 : value}px;`;
    if (key === 'mt') return `margin-top: ${typeof value === 'number' ? value * 8 : value}px;`;
    if (key === 'px') {
      if (typeof value === 'object') {
        return `
          padding-left: ${value.xs * 8}px;
          padding-right: ${value.xs * 8}px;
          @media (min-width: 600px) {
            padding-left: ${value.sm * 8}px;
            padding-right: ${value.sm * 8}px;
          }
        `;
      }
      return `padding-left: ${typeof value === 'number' ? value * 8 : value}px; padding-right: ${typeof value === 'number' ? value * 8 : value}px;`;
    }
    if (key === 'py') return `padding-top: ${typeof value === 'number' ? value * 8 : value}px; padding-bottom: ${typeof value === 'number' ? value * 8 : value}px;`;
    return '';
  }).join(' ')}
`;

const Typography = styled.span`
  font-size: ${props => {
    if (props.variant === 'h6') return '13px';
    if (props.variant === 'subtitle1') return '14px';
    if (props.variant === 'body2') return '12px';
    if (props.variant === 'caption') return '11px';
    return '12px';
  }};
  font-weight: ${props => props.fontWeight || 400};
  line-height: ${props => props.lineHeight || 'normal'};
  color: ${props => {
    if (props.color === 'textSecondary') return props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    if (props.color === 'primary') return '#3b82f6';
    if (props.color === 'error') return '#ef4444';
    if (props.color === 'warning.main') return '#f59e0b';
    if (props.color === 'text.secondary') return props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    return props.isDark ? 'rgba(255,255,255,0.9)' : '#212B36';
  }};
  ${props => props.sx && Object.entries(props.sx).map(([key, value]) => {
    if (key === 'fontSize') {
      if (typeof value === 'object') {
        return `
          font-size: ${value.xs};
          @media (min-width: 600px) {
            font-size: ${value.sm};
          }
        `;
      }
      return `font-size: ${value};`;
    }
    if (key === 'color') return `color: ${value};`;
    if (key === 'display') return `display: ${value};`;
    if (key === 'mt') return `margin-top: ${typeof value === 'number' ? value * 8 : value}px;`;
    return '';
  }).join(' ')}
`;

const Button = styled.button`
  padding: ${props => {
    if (props.size === 'small') return '3px 6px';
    if (props.sx?.px || props.sx?.py) {
      const px = props.sx.px;
      const py = props.sx.py;
      if (typeof px === 'object' && typeof py === 'object') {
        return `${py.xs * 8}px ${px.xs * 8}px`;
      }
      return `${(py || 1) * 8}px ${(px || 2) * 8}px`;
    }
    return '6px 12px';
  }};
  font-size: ${props => {
    if (props.sx?.fontSize) {
      if (typeof props.sx.fontSize === 'object') {
        return props.sx.fontSize.xs;
      }
      return props.sx.fontSize;
    }
    if (props.size === 'small') return '11px';
    return '12px';
  }};
  min-width: ${props => props.sx?.minWidth || 'auto'};
  height: ${props => {
    if (props.sx?.height) {
      if (typeof props.sx.height === 'object') {
        return props.sx.height.xs;
      }
      return props.sx.height;
    }
    return 'auto';
  }};
  border-radius: 6px;
  text-transform: ${props => props.sx?.textTransform || 'none'};
  font-weight: 400;
  border: 1px solid ${props => {
    if (props.variant === 'outlined') return props.sx?.borderColor || (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
    return 'transparent';
  }};
  background: ${props => {
    if (props.variant === 'outlined') return props.sx?.backgroundColor || 'transparent';
    if (props.variant === 'text') return 'transparent';
    return '#3b82f6';
  }};
  color: ${props => {
    if (props.variant === 'outlined' || props.variant === 'text') {
      if (props.sx?.color === 'text.secondary') return props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      return props.sx?.color || '#3b82f6';
    }
    return '#FFFFFF';
  }};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.4 : 1};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  &:hover {
    background: ${props => {
      if (props.disabled) return props.variant === 'outlined' ? 'transparent' : '#3b82f6';
      if (props.variant === 'outlined' || props.variant === 'text') return 'rgba(59,130,246,0.05)';
      return '#2563eb';
    }};
    border-color: ${props => {
      if (props.disabled) return props.variant === 'outlined' ? (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent';
      if (props.variant === 'outlined' || props.variant === 'text') return 'rgba(59,130,246,0.4)';
      return 'transparent';
    }};
  }
  @media (min-width: 600px) {
    font-size: ${props => {
      if (props.sx?.fontSize && typeof props.sx.fontSize === 'object') {
        return props.sx.fontSize.sm;
      }
      return null;
    }};
    height: ${props => {
      if (props.sx?.height && typeof props.sx.height === 'object') {
        return props.sx.height.sm;
      }
      return null;
    }};
    padding: ${props => {
      if (props.sx?.px && props.sx?.py && typeof props.sx.px === 'object') {
        return `${props.sx.py.sm * 8}px ${props.sx.px.sm * 8}px`;
      }
      return null;
    }};
  }
`;

const Input = styled.input`
  width: ${props => props.fullWidth ? '100%' : props.sx?.width || '100%'};
  padding: ${props => props.sx?.input?.padding || '8px'};
  border: ${props => props.sx?.input?.border || 'none'};
  font-size: ${props => {
    if (props.sx?.input?.fontSize) {
      if (typeof props.sx.input.fontSize === 'object') {
        return props.sx.input.fontSize.xs;
      }
      return props.sx.input.fontSize;
    }
    return '14px';
  }};
  text-align: ${props => props.sx?.input?.textAlign || 'left'};
  appearance: ${props => props.sx?.input?.appearance || 'auto'};
  font-weight: ${props => props.sx?.input?.fontWeight || 400};
  background: ${props => props.sx?.backgroundColor || 'transparent'};
  border-radius: ${props => props.sx?.borderRadius || '0'};
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
  outline: none;
  &::placeholder {
    color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  }
  @media (max-width: 600px) {
    font-size: 16px;
    padding: 10px;
  }
  @media (min-width: 600px) {
    font-size: ${props => {
      if (props.sx?.input?.fontSize && typeof props.sx.input.fontSize === 'object') {
        return props.sx.input.fontSize.sm;
      }
      return null;
    }};
  }
`;

const IconButton = styled.button`
  padding: ${props => {
    if (props.size === 'small') return '6px';
    if (props.sx?.padding) {
      if (typeof props.sx.padding === 'object') {
        return `${props.sx.padding.xs}`;
      }
      return props.sx.padding;
    }
    return '8px';
  }};
  width: ${props => {
    if (props.sx?.width && typeof props.sx.width === 'object') {
      return props.sx.width.xs;
    }
    return props.sx?.width || 'auto';
  }};
  height: ${props => {
    if (props.sx?.height && typeof props.sx.height === 'object') {
      return props.sx.height.xs;
    }
    return props.sx?.height || 'auto';
  }};
  border: none;
  border-radius: 50%;
  background: ${props => props.sx?.backgroundColor || 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  transition: all 0.15s ease;
  &:hover {
    background: ${props => props.sx?.['&:hover']?.backgroundColor || (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')};
    color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};
  }
  @media (min-width: 600px) {
    padding: ${props => {
      if (props.sx?.padding && typeof props.sx.padding === 'object') {
        return props.sx.padding.sm;
      }
      return null;
    }};
    width: ${props => {
      if (props.sx?.width && typeof props.sx.width === 'object') {
        return props.sx.width.sm;
      }
      return null;
    }};
    height: ${props => {
      if (props.sx?.height && typeof props.sx.height === 'object') {
        return props.sx.height.sm;
      }
      return null;
    }};
  }
`;

const Alert = styled.div`
  padding: ${props => props.sx?.py ? `${props.sx.py * 8}px 10px` : '6px 10px'};
  border-radius: 8px;
  border: 1px solid ${props => {
    if (props.severity === 'error') return 'rgba(239, 68, 68, 0.15)';
    if (props.severity === 'warning') return 'rgba(245, 158, 11, 0.15)';
    return props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  }};
  background: ${props => {
    if (props.severity === 'error') return 'rgba(239, 68, 68, 0.04)';
    if (props.severity === 'warning') return 'rgba(245, 158, 11, 0.04)';
    return props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  }};
  margin-top: ${props => props.sx?.mt ? `${props.sx.mt * 8}px` : '0'};
`;

const Tabs = styled.div`
  display: flex;
  width: fit-content;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
  border: none;
  @media (max-width: 600px) {
    padding: 3px;
    gap: 2px;
  }
`;

const Tab = styled.button`
  padding: 6px 14px;
  font-size: 12px;
  text-transform: none;
  border: none;
  border-radius: 6px;
  background: ${props => props.isActive ? (props.isDark ? 'rgba(255,255,255,0.95)' : '#fff') : 'transparent'};
  color: ${props => props.isActive ? (props.isDark ? '#111' : '#333') : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  cursor: pointer;
  font-weight: ${props => props.isActive ? 500 : 400};
  transition: all 0.15s ease;
  box-shadow: ${props => props.isActive ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'};
  &:hover {
    background: ${props => props.isActive ? (props.isDark ? '#fff' : '#fff') : (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')};
    color: ${props => props.isActive ? (props.isDark ? '#111' : '#333') : (props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')};
  }
  @media (max-width: 600px) {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 6px;
  }
`;

const Select = styled.select`
  padding: ${props => {
    if (props.sx?.['& .MuiSelect-select']?.py === 0) return '2px 6px';
    return '4px 8px';
  }};
  font-size: ${props => props.sx?.fontSize || props.sx?.['& .MuiSelect-select']?.fontSize || '11px'};
  height: ${props => props.sx?.height || 'auto'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-radius: 6px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.03)' : '#fff'};
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : '#212B36'};
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  }
  &:focus {
    border-color: rgba(59,130,246,0.4);
  }
`;

const MenuItem = styled.option`
  padding: 4px 8px;
  font-size: 11px;
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
          whiteSpace: 'nowrap',
          zIndex: 1000,
          marginBottom: '4px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const CurrencyContent = styled.div`
  box-sizing: border-box;
  margin: 4px 0;
  display: flex;
  flex-direction: row;
  padding: 12px 14px;
  border-radius: 10px;
  align-items: center;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'};
  width: 100%;
  justify-content: space-between;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  transition: all 0.15s ease;
  &:focus-within {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.5)'};
    background: ${props => props.isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)'};
  }
  @media (max-width: 600px) {
    padding: 14px 16px;
    margin: 5px 0;
    border-radius: 10px;
  }
`;

const InputContent = styled.div`
  box-sizing: border-box;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const OverviewWrapper = styled.div`
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  border-radius: 12px;
  display: flex;
  padding: 14px;
  width: 100%;
  min-width: 0;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  @media (max-width: 600px) {
    border-radius: 12px;
    padding: 14px;
  }
`;

const ConverterFrame = styled.div`
  flex-direction: column;
  overflow: hidden;
  position: relative;
  display: flex;
  width: 100%;
`;

const AmountRows = styled.div`
  position: relative;
`;

const ToggleContent = styled.div`
  cursor: pointer;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: ${props => props.isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
  border-radius: 50%;
  padding: 8px;
  z-index: 1;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
  transition: all 0.15s ease;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.4)'};
    background: ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)'};
    svg {
      color: #3b82f6 !important;
    }
  }
`;

const ExchangeButton = styled(Button)`
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #3b82f6;
  color: #ffffff;
  font-weight: 500;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  text-transform: none;
  margin: 0;
  letter-spacing: 0;
  transition: all 0.15s ease;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
    color: ${props => props.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'};
    border: none;
  }

  @media (max-width: 600px) {
    padding: 14px 16px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const TokenImage = styled(Image)`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
  }
`;

const SummaryBox = styled.div`
  padding: 10px 12px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'};
  border-radius: 8px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  margin-top: 8px;
  margin-bottom: 4px;
  @media (max-width: 600px) {
    padding: 12px 14px;
    border-radius: 10px;
    margin-top: 10px;
  }
`;

// RLUSD token for XRP orderbook display (Ripple's official stablecoin)
const RLUSD_TOKEN = {
  currency: '524C555344000000000000000000000000000000',
  issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  name: 'RLUSD',
  md5: '0dd550278b74cb6690fdae351e8e0df3'
};

const Swap = ({ token, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {

  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  // Special handling for XRP token page - show RLUSD/XRP orderbook instead
  // Since XRP is the native asset, it can't have an orderbook against itself
  const isXRPTokenPage = token?.currency === 'XRP';
  const effectiveToken = isXRPTokenPage ? RLUSD_TOKEN : token;

  const [pair, setPair] = useState({
    curr1: XRP_TOKEN,
    curr2: effectiveToken
  });

  const curr1 = pair.curr1;
  const curr2 = pair.curr2;

  const BASE_URL = 'https://api.xrpl.to/api';
  const QR_BLUR = '/static/blurqr.webp';

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const { accountProfile, themeName, setLoading, sync, setSync, openSnackbar, activeFiatCurrency } =
    useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [revert, setRevert] = useState(false);

  const [token1, setToken1] = useState(curr1);
  const [token2, setToken2] = useState(effectiveToken);

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

  const [trustlines, setTrustlines] = useState([]);
  const [hasTrustline1, setHasTrustline1] = useState(true);
  const [hasTrustline2, setHasTrustline2] = useState(true);
  const [transactionType, setTransactionType] = useState('Payment');

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

  const [showOrderbook, setShowOrderbook] = useState(false);
  const [orderBookPos, setOrderBookPos] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const asksContainerRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Swap quote state
  const [swapQuoteApi, setSwapQuoteApi] = useState(null);
  const [quoteRequiresTrustline, setQuoteRequiresTrustline] = useState(null); // null or { currency, issuer, limit }
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteAbortRef = useRef(null);

  // Persist slippage & txFee
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('swap_slippage', slippage.toString());
  }, [slippage]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('swap_txfee', txFee);
  }, [txFee]);

  // Floating orderbook drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - orderBookPos.x,
      y: e.clientY - orderBookPos.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      setOrderBookPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      const walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
        (accountProfile.provider && accountProfile.provider_id ? `${accountProfile.provider}_${accountProfile.provider_id}` : null);
      let seed = accountProfile.seed || null;
      if (!seed && (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }
      setDebugInfo({ wallet_type: accountProfile.wallet_type, account: accountProfile.account, walletKeyId, seed: seed || 'N/A' });
    };
    loadDebugInfo();
  }, [accountProfile]);

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
    } catch (e) {}

    return currency;
  };

  const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;

  let isSufficientBalance = false;
  let errMsg = '';

  if (isLoggedIn) {
    errMsg = '';
    isSufficientBalance = false;

    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, token1?.name);
      errMsg = `No trustline for ${displayName}`;
    } else if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, token2?.name);
      errMsg = `No trustline for ${displayName}`;
    } else {
      try {
        const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();
        const accountValue = new Decimal(accountPairBalance.curr2.value).toNumber();

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
  } else {
    errMsg = 'Connect your wallet!';
    isSufficientBalance = false;
  }

  const canPlaceOrder = isLoggedIn && isSufficientBalance;

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  // Scroll asks to bottom when orderbook opens or limit price changes
  useEffect(() => {
    if (showOrderbook && asksContainerRef.current) {
      asksContainerRef.current.scrollTop = asksContainerRef.current.scrollHeight;
    }
  }, [showOrderbook, asks, limitPrice]);

  // Fetch swap quote from API (works with or without login)
  useEffect(() => {
    if (orderType !== 'market') return;
    if (!amount2 || parseFloat(amount2) <= 0 || !token2?.currency) {
      setSwapQuoteApi(null);
      setQuoteRequiresTrustline(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (quoteAbortRef.current) quoteAbortRef.current.abort();
      quoteAbortRef.current = new AbortController();

      setQuoteLoading(true);
      try {
        const destAmount = token2.currency === 'XRP'
          ? { currency: 'XRP', value: amount2 }
          : { currency: token2.currency, issuer: token2.issuer, value: amount2 };

        const quoteAccount = accountProfile?.account || 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe';

        const res = await axios.post(`${BASE_URL}/dex/quote`, {
          source_account: quoteAccount,
          destination_amount: destAmount,
          source_currencies: token1?.currency === 'XRP'
            ? [{ currency: 'XRP' }]
            : [{ currency: token1.currency, issuer: token1.issuer }],
          slippage: slippage / 100
        }, { signal: quoteAbortRef.current.signal });

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
  }, [amount2, token1, token2, accountProfile?.account, slippage, orderType]);

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
    const bestPrice = revert ? (bids[0]?.price || 0) : (asks[0]?.price || 0);
    const effectivePrice = outputAmt > 0 ? inputAmt / outputAmt : 0;
    const impactPct = bestPrice > 0 ? ((effectivePrice - bestPrice) / bestPrice) * 100 : 0;
    const ammFeeXrp = ammFill > 0 && bestPrice > 0 ? (ammFill * bestPrice * 0.006) : 0;

    return {
      slippage_tolerance: `${slippage}%`,
      minimum_received: minReceived.toFixed(6),
      from_orderbook: orderbookFill > 0 ? orderbookFill.toFixed(6) : '0',
      from_amm: ammFill > 0.000001 ? ammFill.toFixed(6) : '0',
      price_impact: Math.abs(impactPct) > 0.01 ? {
        percent: `${impactPct.toFixed(2)}%`,
        xrp: `${(inputAmt * Math.abs(impactPct) / 100).toFixed(4)} XRP`
      } : null,
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
    const cacheKey = 'swap-rlusd';

    async function fetchRLUSD() {
      if (fetchInFlight.has(cacheKey)) {
        try {
          const token = await fetchInFlight.get(cacheKey);
          if (mounted && token) applyRLUSD(token);
        } catch {}
        return;
      }

      const promise = axios.get(`${BASE_URL}/token/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000`).then(r => r.data?.token);
      fetchInFlight.set(cacheKey, promise);

      try {
        const token = await promise;
        if (mounted && token) applyRLUSD(token);
        fetchInFlight.delete(cacheKey);
      } catch (err) {
        fetchInFlight.delete(cacheKey);
        console.error('RLUSD fetch error:', err);
      }
    }

    function applyRLUSD(rlusdToken) {
      setToken2({
        ...rlusdToken,
        currency: rlusdToken.currency || 'USD',
        issuer: rlusdToken.issuer || 'rMxWgaM9YkNkWwpTqUCBChs6zNTpYPY6NT'
      });
      setPair(prev => ({
        ...prev,
        curr2: {
          ...rlusdToken,
          currency: rlusdToken.currency || 'USD',
          issuer: rlusdToken.issuer || 'rMxWgaM9YkNkWwpTqUCBChs6zNTpYPY6NT'
        }
      }));
    }

    fetchRLUSD();

    return () => { mounted = false; };
  }, [isXRPTokenPage]);

  // Fetch orderbook from API - token (token2) as base, XRP (token1) as quote
  // Use md5 as dependency to avoid re-fetching when token object reference changes
  const token1Md5 = token1?.md5;
  const token2Md5 = token2?.md5;

  useEffect(() => {
    if (!token1Md5 || !token2Md5) return;
    let mounted = true;

    const pairKey = `swap-ob-${token1Md5}-${token2Md5}`;

    async function fetchOrderbook(isUpdate = false) {
      if (!mounted) return;

      const params = new URLSearchParams({
        base_currency: token2.currency,
        quote_currency: token1.currency,
        limit: '60'
      });
      if (token2.currency !== 'XRP' && token2.issuer) params.append('base_issuer', token2.issuer);
      if (token1.currency !== 'XRP' && token1.issuer) params.append('quote_issuer', token1.issuer);

      // Reuse in-flight request (StrictMode protection) - only for initial load
      if (!isUpdate && fetchInFlight.has(pairKey)) {
        try {
          const data = await fetchInFlight.get(pairKey);
          if (mounted && data) processOrderbookData(data);
        } catch {}
        return;
      }

      const fetchPromise = axios.get(`${BASE_URL}/orderbook?${params}`).then(r => r.data);
      if (!isUpdate) fetchInFlight.set(pairKey, fetchPromise);

      try {
        const data = await fetchPromise;
        if (mounted && data?.success) processOrderbookData(data);
        fetchInFlight.delete(pairKey);
      } catch (err) {
        fetchInFlight.delete(pairKey);
        console.error('Orderbook fetch error:', err);
      }
    }

    function processOrderbookData(data) {
      const parsedBids = (data.bids || []).map(o => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }));
      const parsedAsks = (data.asks || []).map(o => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }));
      let bidSum = 0, askSum = 0;
      parsedBids.forEach(b => { bidSum += b.amount; b.sumAmount = bidSum; });
      parsedAsks.forEach(a => { askSum += a.amount; a.sumAmount = askSum; });
      setBids(parsedBids.slice(0, 30));
      setAsks(parsedAsks.slice(0, 30));
    }

    fetchOrderbook();
    const timer = setInterval(() => fetchOrderbook(true), 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
      fetchInFlight.delete(pairKey);
    };
  }, [token1Md5, token2Md5]);

  useEffect(() => {
    if (!onOrderBookData) return;
    const data = {
      pair: {
        curr1: { ...curr1, name: curr1.name || curr1.currency },
        curr2: { ...curr2, name: curr2.name || curr2.currency }
      },
      asks,
      bids,
      limitPrice: orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : null,
      isBuyOrder: !!revert,
      onAskClick: (e, idx) => {
        if (asks && asks[idx]) {
          setLimitPrice(asks[idx].price.toString());
          setOrderType('limit');
        }
      },
      onBidClick: (e, idx) => {
        if (bids && bids[idx]) {
          setLimitPrice(bids[idx].price.toString());
          setOrderType('limit');
        }
      }
    };
    onOrderBookData(data);
  }, [onOrderBookData, curr1, curr2, asks, bids, orderType, limitPrice, revert]);

  const isPanelOpen =
    (onOrderBookToggle ? !!orderBookOpen : !!showOrderbook) && orderType === 'limit';

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
    if (revert && bestAsk != null) {
      const pct = ((lp - Number(bestAsk)) / Number(bestAsk)) * 100;
      if (pct > THRESHOLD) return { kind: 'buy', pct, ref: Number(bestAsk) };
    }
    if (!revert && bestBid != null) {
      const pct = ((Number(bestBid) - lp) / Number(bestBid)) * 100;
      if (pct > THRESHOLD) return { kind: 'sell', pct, ref: Number(bestBid) };
    }
    return null;
  }, [limitPrice, bestAsk, bestBid, revert]);

  useEffect(() => {
    if (onOrderBookToggle) return;
    const root = typeof document !== 'undefined' ? document.getElementById('__next') : null;
    if (!root) return;

    const calcPanelWidth = () => {
      if (typeof window === 'undefined') return 0;
      const w = window.innerWidth || 0;
      if (w >= 1536) return 320;
      if (w >= 1200) return 300;
      if (w >= 900) return 280;
      return 0;
    };

    const applyShift = () => {
      const width = calcPanelWidth();
      if (width <= 0) return removeShift();
      const prev = root.style.paddingRight;
      if (!root.hasAttribute('data-prev-pr-ob') && (!prev || prev === '')) {
        root.setAttribute('data-prev-pr-ob', prev);
        root.style.paddingRight = `${width}px`;
      }
      root.classList.add('orderbook-shift');
    };

    const removeShift = () => {
      const prev = root.getAttribute('data-prev-pr-ob');
      if (prev !== null) root.style.paddingRight = prev;
      else root.style.removeProperty('padding-right');
      root.removeAttribute('data-prev-pr-ob');
      root.classList.remove('orderbook-shift');
    };

    if (isPanelOpen) applyShift();
    else removeShift();

    return removeShift;
  }, [orderType, orderBookOpen, onOrderBookToggle, showOrderbook]);

  useEffect(() => {
    let mounted = true;

    async function getAccountInfo() {
      if (!accountProfile || !accountProfile.account) return;
      if (!curr1 || !curr2) return;

      const account = accountProfile.account;

      try {
        const balanceRes = await axios.get(
          `${BASE_URL}/account/info/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`
        );
        if (!mounted) return;

        if (balanceRes.status === 200 && balanceRes.data) {
          setAccountPairBalance(balanceRes.data.pair);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Balance fetch error:', err);
        }
      }

      const fetchAllTrustlines = async () => {
        try {
          let allTrustlines = [];
          let currentPage = 0;
          let totalTrustlines = 0;

          const firstResponse = await axios.get(
            `${BASE_URL}/account/lines/${account}?page=${currentPage}&limit=50`
          );
          if (!mounted) return [];

          if (firstResponse.status === 200 && firstResponse.data) {
            allTrustlines = firstResponse.data.lines || [];
            totalTrustlines = firstResponse.data.total || 0;

            if (totalTrustlines > 50) {
              const totalPages = Math.ceil(totalTrustlines / 50);
              const additionalRequests = [];

              for (let page = 1; page < totalPages; page++) {
                additionalRequests.push(
                  axios.get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=50`)
                );
              }

              const additionalResponses = await Promise.all(additionalRequests);

              additionalResponses.forEach((response, index) => {
                if (response.status === 200 && response.data.lines) {
                  allTrustlines = allTrustlines.concat(response.data.lines);
                }
              });
            }

            return allTrustlines;
          }

          return [];
        } catch (error) {
          return [];
        }
      };

      fetchAllTrustlines()
        .then((allTrustlines) => {
          setTrustlines(allTrustlines);

          const normalizeCurrency = (currency) => {
            if (!currency) return '';
            if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
              return currency.replace(/00+$/, '').toUpperCase();
            }
            return currency.toUpperCase();
          };

          const currenciesMatch = (curr1, curr2) => {
            if (!curr1 || !curr2) return false;

            if (curr1 === curr2) return true;

            const norm1 = normalizeCurrency(curr1);
            const norm2 = normalizeCurrency(curr2);
            if (norm1 === norm2) return true;

            try {
              const convertHexToAscii = (hex) => {
                if (hex.length === 40 && /^[0-9A-Fa-f]+$/.test(hex)) {
                  const cleanHex = hex.replace(/00+$/, '');
                  let ascii = '';
                  for (let i = 0; i < cleanHex.length; i += 2) {
                    const byte = parseInt(cleanHex.substr(i, 2), 16);
                    if (byte > 0) ascii += String.fromCharCode(byte);
                  }
                  return ascii.toLowerCase();
                }
                return hex.toLowerCase();
              };

              const ascii1 = convertHexToAscii(curr1);
              const ascii2 = convertHexToAscii(curr2);
              if (ascii1 === ascii2) return true;
            } catch (e) {}

            return false;
          };

          const issuersMatch = (line, expectedIssuer) => {
            const lineIssuers = [
              line.account,
              line.issuer,
              line._token1,
              line._token2,
              line.Balance?.issuer,
              line.HighLimit?.issuer,
              line.LowLimit?.issuer
            ].filter(Boolean);

            return lineIssuers.some((issuer) => issuer === expectedIssuer);
          };

          const hasCurr1Trustline =
            curr1.currency === 'XRP' ||
            allTrustlines.some((line) => {
              const lineCurrencies = [
                line.Balance?.currency,
                line.currency,
                line._currency,
                line.HighLimit?.currency,
                line.LowLimit?.currency
              ].filter(Boolean);

              const currencyMatch = lineCurrencies.some((lineCurrency) =>
                currenciesMatch(lineCurrency, curr1.currency)
              );

              if (!currencyMatch) return false;

              const issuerMatch = issuersMatch(line, curr1.issuer);
              const isStandardCurrency = ['USD', 'EUR', 'BTC', 'ETH'].includes(curr1.currency);

              return currencyMatch && (issuerMatch || isStandardCurrency);
            });

          const hasCurr2Trustline =
            curr2.currency === 'XRP' ||
            allTrustlines.some((line) => {
              const lineCurrencies = [
                line.Balance?.currency,
                line.currency,
                line._currency,
                line.HighLimit?.currency,
                line.LowLimit?.currency
              ].filter(Boolean);

              const currencyMatch = lineCurrencies.some((lineCurrency) =>
                currenciesMatch(lineCurrency, curr2.currency)
              );

              if (!currencyMatch) return false;

              const issuerMatch = issuersMatch(line, curr2.issuer);
              const isStandardCurrency = ['USD', 'EUR', 'BTC', 'ETH'].includes(curr2.currency);

              return currencyMatch && (issuerMatch || isStandardCurrency);
            });

          setHasTrustline1(hasCurr1Trustline);
          setHasTrustline2(hasCurr2Trustline);
        })
        .catch((err) => {
          console.error('Trustline fetch error:', err);
        });
    }

    getAccountInfo();

    return () => { mounted = false; };
  }, [accountProfile, curr1, curr2, sync, isSwapped]);

  useEffect(() => {
    if (!token1Md5 || !token2Md5) return;
    let mounted = true;

    const pairKey = `pr-${token1Md5}-${token2Md5}`;

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
      if (fetchInFlight.has(pairKey)) {
        try {
          const data = await fetchInFlight.get(pairKey);
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
        } catch {
          applyFallbackRates();
        }
        return;
      }

      setLoadingPrice(true);
      const promise = axios.get(`${BASE_URL}/rates?md51=${token1Md5}&md52=${token2Md5}`).then(r => r.data);
      fetchInFlight.set(pairKey, promise);

      try {
        const data = await promise;
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
        fetchInFlight.delete(pairKey);
      } catch (err) {
        fetchInFlight.delete(pairKey);
        if (mounted) applyFallbackRates();
      } finally {
        if (mounted) setLoadingPrice(false);
      }
    }

    getTokenPrice();

    return () => { mounted = false; fetchInFlight.delete(pairKey); };
  }, [token1Md5, token2Md5, token1, token2]);

  useEffect(() => {
    const pair = {
      curr1: revert ? token2 : token1,
      curr2: revert ? token1 : token2
    };
    setPair(pair);
  }, [revert, token1, token2]);

  // Legacy Xaman polling code removed - feature disabled

  const onOfferCreateXumm = async () => {
    openSnackbar('Xaman no longer supported', 'info');
    return;
    // Function disabled
  };

  const onDisconnectXumm = async (uuid) => {
    return;
    setLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/offer/logout/${uuid}`);
      if (res.status === 200) {
        setUuid(null);
      }
    } catch (err) {}
    setLoading(false);
  };

  const calcQuantity = (amount, active) => {
    try {
      const amt = new Decimal(amount || 0).toNumber();
      if (amt === 0) return '';

      if (amt > 0) {
      }

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


        return new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
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

        return new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
      }
    } catch (e) {
      return '';
    }
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handlePlaceOrder = (e) => {
    if (isLoggedIn && !hasTrustline1 && curr1.currency !== 'XRP') {
      onCreateTrustline(curr1);
      return;
    }
    if (isLoggedIn && !hasTrustline2 && curr2.currency !== 'XRP') {
      onCreateTrustline(curr2);
      return;
    }

    const fAmount = Number(amount1);
    const fValue = Number(amount2);
    if (fAmount > 0 && fValue > 0) {
      if (orderType === 'limit' && !limitPrice) {
        openSnackbar('Please enter a limit price!', 'error');
        return;
      }
      openSnackbar('Device authentication required', 'info');
    } else {
      openSnackbar('Invalid values!', 'error');
    }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value === '.') value = '0.';
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

    if (isLoggedIn && !hasTrustline1 && curr1.currency !== 'XRP') {
      const missingToken = getCurrencyDisplayName(curr1.currency, token1?.name);
      return `Set Trustline for ${missingToken}`;
    }
    if (isLoggedIn && !hasTrustline2 && curr2.currency !== 'XRP') {
      const missingToken = getCurrencyDisplayName(curr2.currency, token2?.name);
      return `Set Trustline for ${missingToken}`;
    }

    if (!amount1 || !amount2) return 'Enter an Amount';
    else if (orderType === 'limit' && !limitPrice) return 'Enter Limit Price';
    else if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    else return orderType === 'limit' ? 'Place Limit Order' : 'Exchange';
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

  const onCreateTrustline = async (currency) => {
    if (!accountProfile || !accountProfile.account) return;

    try {
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      const Flags = 0x00020000;
      let LimitAmount = {};
      LimitAmount.issuer = currency.issuer;
      LimitAmount.currency = currency.currency;
      LimitAmount.value = '1000000000';

      if (wallet_type === 'device') {
        try {
          await loadXRPLDependencies();
          const deviceWallet = getDeviceWallet(accountProfile);

          if (!deviceWallet) {
            openSnackbar('Device wallet not available', 'error');
            return;
          }

          dispatch(updateProcess(1));
          setTransactionType('TrustSet');

          const trustSetTransaction = {
            Account: accountProfile.account,
            TransactionType: 'TrustSet',
            LimitAmount,
            Flags
          };

          const preparedTx = await autofillTransaction(trustSetTransaction, accountProfile.account);
          const signedTx = deviceWallet.sign(preparedTx);
          const result = await submitTransaction(signedTx.tx_blob);

          if (result.engine_result === 'tesSUCCESS') {
            dispatch(updateProcess(2));
            dispatch(updateTxHash(result.hash));
            setTimeout(() => {
              setSync(sync + 1);
              dispatch(updateProcess(0));
            }, 1500);
            openSnackbar('Trustline created successfully!', 'success');
          } else {
            openSnackbar('Transaction failed: ' + result.engine_result, 'error');
            dispatch(updateProcess(0));
          }
        } catch (error) {
          console.error('Device wallet trustline error:', error);
          openSnackbar('Failed to create trustline: ' + error.message, 'error');
          dispatch(updateProcess(0));
        }
      } else {
        openSnackbar('Device authentication required', 'error');
      }
    } catch (err) {
      dispatch(updateProcess(0));
      openSnackbar(
        `Failed to create trustline: ${
          err.response?.data?.message || err.message || 'Unknown error'
        }`,
        'error'
      );
    }
    setLoading(false);
  };

  return (
    <Stack alignItems="stretch" width="100%" sx={{ px: { xs: 0, sm: 0 } }}>
      <OverviewWrapper isDark={isDark}>
        {/* XRP page notice - show that we're displaying RLUSD/XRP orderbook */}
        {isXRPTokenPage && (
          <Box sx={{ mb: 1.5, p: 1, borderRadius: '8px', background: isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)', border: `1px solid ${isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)'}` }}>
            <Typography variant="caption" isDark={isDark} sx={{ fontSize: '11px', opacity: 0.8 }}>
              Showing <span style={{ fontWeight: 500, color: '#4285f4' }}>RLUSD/XRP</span> orderbook. XRP is the native asset and cannot have an orderbook against itself.
            </Typography>
          </Box>
        )}
        <Box sx={{ mb: 1 }}>
          <Tabs
            sx={{
              minHeight: '32px',
              '& .MuiTab-root': {
                minHeight: '32px',
                fontSize: '14px',
                py: 0.5,
                textTransform: 'none'
              }
            }}
            isDark={isDark}
          >
            <Tab
              isActive={orderType === 'market'}
              onClick={() => {
                setOrderType('market');
                setShowOrderbook(false);
              }}
              isDark={isDark}
              sx={{
                '& .MuiTab-root': {
                  minHeight: '32px',
                  fontSize: '14px',
                  py: 0.5,
                  textTransform: 'none'
                }
              }}
            >
              Market
            </Tab>
            <Tab
              isActive={orderType === 'limit'}
              onClick={() => setOrderType('limit')}
              isDark={isDark}
              sx={{
                '& .MuiTab-root': {
                  minHeight: '32px',
                  fontSize: '14px',
                  py: 0.5,
                  textTransform: 'none'
                }
              }}
            >
              Limit
            </Tab>
          </Tabs>
        </Box>

        <ConverterFrame>
          <AmountRows>
            <CurrencyContent isDark={isDark}>
              <Box display="flex" flexDirection="column" flex="1" gap="3px">
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}
                >
                  You pay
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TokenImage
                    src={`https://s1.xrpl.to/token/${curr1.md5}`}
                    width={32}
                    height={32}
                    alt={`${curr1.name} token icon`}
                    unoptimized={true}
                    onError={(event) => (event.target.src = '/static/alt.webp')}
                  />
                  <Typography variant="subtitle1" isDark={isDark} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {curr1.name}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, opacity: 0.6 }}
                >
                  {curr1.user}
                </Typography>
              </Box>
              <InputContent isDark={isDark}>
                {isLoggedIn && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                    sx={{ mb: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      isDark={isDark}
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Balance{' '}
                      <Typography
                        variant="caption"
                        color="primary"
                        isDark={isDark}
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      >
                        {accountPairBalance?.curr1.value
                          ? new Decimal(accountPairBalance.curr1.value).toFixed(6).replace(/\.?0+$/, '')
                          : '0'}
                      </Typography>
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      {[0.25, 0.5, 0.75].map((p) => (
                        <Button
                          key={p}
                          isDark={isDark}
                          sx={{
                            px: { xs: 1, sm: 0.5 },
                            py: 0,
                            minWidth: 0,
                            fontSize: { xs: '0.75rem', sm: '0.75rem' },
                            height: { xs: '28px', sm: '20px' }
                          }}
                          disabled={!accountPairBalance?.curr1?.value}
                          onClick={() => onFillPercent(p)}
                        >
                          {Math.round(p * 100)}%
                        </Button>
                      ))}
                      <Button
                        isDark={isDark}
                        sx={{
                          px: { xs: 1, sm: 0.5 },
                          py: 0,
                          minWidth: 0,
                          fontSize: { xs: '0.75rem', sm: '0.75rem' },
                          height: { xs: '28px', sm: '20px' }
                        }}
                        disabled={!accountPairBalance?.curr1?.value}
                        onClick={onFillMax}
                      >
                        MAX
                      </Button>
                    </Stack>
                  </Stack>
                )}
                <Input
                  placeholder="0"
                  autoComplete="new-password"
                  isDark={isDark}
                  value={amount1}
                  onChange={handleChangeAmount1}
                  sx={{
                    width: '100%',
                    input: {
                      autoComplete: 'off',
                      padding: '0px',
                      border: 'none',
                      fontSize: { xs: '14px', sm: '16px' },
                      textAlign: 'end',
                      appearance: 'none',
                      fontWeight: 400
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  {curr1IsXRP
                    ? `~${fNumber(tokenPrice1)} XRP`
                    : `~${currencySymbols[activeFiatCurrency]} ${fNumber(tokenPrice1)}`}
                </Typography>
              </InputContent>
            </CurrencyContent>

            <CurrencyContent isDark={isDark}>
              <Box display="flex" flexDirection="column" flex="1" gap="3px">
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}
                >
                  You receive
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TokenImage
                    src={`https://s1.xrpl.to/token/${curr2.md5}`}
                    width={32}
                    height={32}
                    alt={`${curr2.name} token icon`}
                    unoptimized={true}
                    onError={(event) => (event.target.src = '/static/alt.webp')}
                  />
                  <Typography variant="subtitle1" isDark={isDark} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {curr2.name}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, opacity: 0.6 }}
                >
                  {curr2.user}
                </Typography>
              </Box>
              <InputContent isDark={isDark}>
                {isLoggedIn && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                    sx={{ mb: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      isDark={isDark}
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Balance{' '}
                      <Typography
                        variant="caption"
                        color="primary"
                        isDark={isDark}
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      >
                        {accountPairBalance?.curr2.value
                          ? new Decimal(accountPairBalance.curr2.value).toFixed(6).replace(/\.?0+$/, '')
                          : '0'}
                      </Typography>
                    </Typography>
                  </Stack>
                )}
                <Input
                  placeholder="0"
                  autoComplete="new-password"
                  isDark={isDark}
                  value={amount2}
                  onChange={handleChangeAmount2}
                  sx={{
                    width: '100%',
                    input: {
                      autoComplete: 'off',
                      padding: '0px',
                      border: 'none',
                      fontSize: { xs: '14px', sm: '16px' },
                      textAlign: 'end',
                      appearance: 'none',
                      fontWeight: 400
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  isDark={isDark}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  {curr2IsXRP
                    ? `~${fNumber(tokenPrice2)} XRP`
                    : `~${currencySymbols[activeFiatCurrency]} ${fNumber(tokenPrice2)}`}
                </Typography>
              </InputContent>
            </CurrencyContent>

            <ToggleContent isDark={isDark}>
              <IconButton
                size="small"
                onClick={onRevertExchange}
                isDark={isDark}
                sx={{
                  backgroundColor: 'transparent',
                  padding: { xs: '4px', sm: '3px' },
                  width: { xs: '32px', sm: '28px' },
                  height: { xs: '32px', sm: '28px' },
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                <ArrowUpDown
                  size={18}
                  style={{
                    color: isDark ? '#FFFFFF' : '#212B36',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              </IconButton>
            </ToggleContent>
          </AmountRows>

          {/* Settings Modal */}
          {showSettingsModal && (
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            >
              <div
                onClick={e => e.stopPropagation()}
                className={`w-[320px] rounded-xl border-[1.5px] p-5 ${isDark ? 'bg-[#0a0f1a]/95 backdrop-blur-xl border-primary/20' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</span>
                  <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                    <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                  </button>
                </div>

                {/* Max Slippage Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Max Slippage</span>
                    <div className="flex-1 h-px" style={{ backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`, backgroundSize: '6px 1px' }} />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSlippage(preset)}
                        className={`flex-1 h-9 text-[13px] font-normal rounded-lg border-[1.5px] transition-colors ${
                          slippage === preset
                            ? 'bg-primary text-white border-primary'
                            : isDark ? 'border-white/10 text-white/60 hover:border-primary/50' : 'border-gray-200 text-gray-600 hover:border-primary/50'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <div className={`flex items-center justify-center h-9 px-3 min-w-[56px] rounded-lg border-[1.5px] ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={slippage}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 25)) {
                            setSlippage(val === '' ? '' : parseFloat(val) || val);
                          }
                        }}
                        className={`w-5 bg-transparent border-none outline-none text-[13px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
                      />
                      <span className={`text-[12px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>%</span>
                    </div>
                  </div>
                  {Number(slippage) >= 4 && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-amber-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[11px] text-amber-500">High slippage may cause front-running</span>
                    </div>
                  )}
                </div>

                {/* Network Fee Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Network Fee</span>
                    <span className={`text-[10px] ${isDark ? 'text-white/25' : 'text-gray-400'}`}>(drops)</span>
                    <div className="flex-1 h-px" style={{ backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`, backgroundSize: '6px 1px' }} />
                  </div>
                  <div className="flex gap-2">
                    {[12, 15, 20, 50].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTxFee(String(val))}
                        className={`flex-1 h-9 text-[13px] font-normal rounded-lg border-[1.5px] transition-colors ${
                          txFee === String(val)
                            ? 'bg-primary text-white border-primary'
                            : isDark ? 'border-white/10 text-white/60 hover:border-primary/50' : 'border-gray-200 text-gray-600 hover:border-primary/50'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <div className={`flex items-center h-9 px-3 min-w-[60px] rounded-lg border-[1.5px] ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={txFee}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setTxFee(val);
                        }}
                        className={`w-8 bg-transparent border-none outline-none text-[13px] font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
                      />
                    </div>
                  </div>
                  <p className={`text-[10px] mt-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Higher fees = priority during congestion</p>
                  {parseInt(txFee) >= 50 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[11px] text-amber-500">Only needed during extreme congestion</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 rounded-lg bg-primary text-white text-[14px] font-medium border-none cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Slippage control - Only for market orders */}
          {orderType === 'market' && (
            <Box sx={{ px: 1.5, py: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <button onClick={() => setShowSettingsModal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                }}>
                  <Settings size={14} />
                  <span style={{ fontSize: 12 }}>Slippage {slippage}%</span>
                </button>
                <Typography variant="caption" isDark={isDark} sx={{ fontSize: '12px', color: 'text.secondary' }}>
                  Impact {swapQuoteCalc?.price_impact?.percent ? parseFloat(swapQuoteCalc.price_impact.percent.replace('%', '')).toFixed(2) : '—'}%
                </Typography>
              </Stack>

              {/* Quote Summary */}
              {swapQuoteCalc && (
                <Box sx={{ mt: 1, p: 1, borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <Stack spacing={0.25}>
                    {/* Rate */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="textSecondary" isDark={isDark} sx={{ fontSize: '10px' }}>
                        Rate{swapQuoteCalc.ammFallback && <span style={{ color: '#f59e0b' }}> ~est</span>}{quoteLoading && <span style={{ opacity: 0.5 }}> •••</span>}
                      </Typography>
                      <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px', fontFamily: 'monospace' }}>
                        1 {token2?.name || token2?.currency} = {(() => {
                          // Calculate rate as source/destination (XRP per token)
                          const srcVal = parseFloat(swapQuoteCalc.source_amount?.value || amount1);
                          const dstVal = parseFloat(swapQuoteCalc.destination_amount?.value || amount2);
                          const rate = dstVal > 0 && srcVal > 0 ? srcVal / dstVal : 0;
                          if (!rate || rate === 0) return '—';
                          if (rate >= 1000000) return fNumber(rate);
                          if (rate >= 1) return rate.toFixed(4);
                          if (rate >= 0.0001) return rate.toFixed(8);
                          return rate.toExponential(4);
                        })()} {token1?.name || token1?.currency}
                      </Typography>
                    </Stack>
                    {/* Min Received */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="textSecondary" isDark={isDark} sx={{ fontSize: '10px' }}>
                        Min received
                      </Typography>
                      <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px', fontFamily: 'monospace' }}>
                        {fNumber(swapQuoteCalc.minimum_received)} {token2?.name || token2?.currency}
                      </Typography>
                    </Stack>
                    {/* Route & Fee combined */}
                    {(() => {
                      const obVal = parseFloat(swapQuoteCalc.from_orderbook) || 0;
                      const ammVal = parseFloat(swapQuoteCalc.from_amm) || 0;
                      const feeStr = swapQuoteCalc.amm_pool_fee;
                      const feePct = swapQuoteCalc.amm_trading_fee_bps ? (swapQuoteCalc.amm_trading_fee_bps / 1000).toFixed(2) : null;
                      if (obVal === 0 && ammVal === 0 && !feeStr) return null;

                      return (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" color="textSecondary" isDark={isDark} sx={{ fontSize: '10px' }}>
                            Route
                          </Typography>
                          <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px', fontFamily: 'monospace' }}>
                            {obVal > 0 && ammVal > 0 ? (
                              <span style={{ color: '#22c55e' }}>DEX+AMM</span>
                            ) : obVal > 0 ? (
                              <span style={{ color: '#22c55e' }}>DEX</span>
                            ) : ammVal > 0 ? (
                              <span style={{ color: '#3b82f6' }}>AMM</span>
                            ) : null}
                            {feeStr && <span style={{ opacity: 0.6 }}> · {feePct}% fee</span>}
                          </Typography>
                        </Stack>
                      );
                    })()}
                  </Stack>
                  {/* Trustline Warning */}
                  {quoteRequiresTrustline && (
                    <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px', color: '#f59e0b', mt: 0.5, display: 'block' }}>
                      Trustline required for {getCurrencyDisplayName(quoteRequiresTrustline.currency, token2?.name)}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Limit Order Settings */}
          {orderType === 'limit' && (
            <Box sx={{ px: 0.5, py: 0.25 }}>
              <Stack spacing={0.25}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary" isDark={isDark} sx={{ fontSize: '10px' }}>
                    Limit Price ({curr2.name} per {curr1.name})
                  </Typography>
                  <Stack direction="row" spacing={0.25} alignItems="center">
                    <Button
                      size="small"
                      variant="text"
                      disabled={!limitPrice && !(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid = bestBid != null && bestAsk != null ? (Number(bestBid) + Number(bestAsk)) / 2 : null;
                        const base = Number(limitPrice || mid || 0);
                        if (!base) return;
                        setLimitPrice(new Decimal(base).mul(0.99).toFixed(6));
                      }}
                      isDark={isDark}
                      sx={{ textTransform: 'none', fontSize: '10px', minHeight: '16px', px: 0.5, py: 0 }}
                    >
                      -1%
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      disabled={!(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid = bestBid != null && bestAsk != null ? (Number(bestBid) + Number(bestAsk)) / 2 : null;
                        if (mid == null) return;
                        setLimitPrice(String(new Decimal(mid).toFixed(6)));
                      }}
                      isDark={isDark}
                      sx={{ textTransform: 'none', fontSize: '10px', minHeight: '16px', px: 0.5, py: 0 }}
                    >
                      Mid
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      disabled={!limitPrice && !(bestBid != null && bestAsk != null)}
                      onClick={() => {
                        const mid = bestBid != null && bestAsk != null ? (Number(bestBid) + Number(bestAsk)) / 2 : null;
                        const base = Number(limitPrice || mid || 0);
                        if (!base) return;
                        setLimitPrice(new Decimal(base).mul(1.01).toFixed(6));
                      }}
                      isDark={isDark}
                      sx={{ textTransform: 'none', fontSize: '10px', minHeight: '16px', px: 0.5, py: 0 }}
                    >
                      +1%
                    </Button>
                  </Stack>
                </Stack>
                <Input
                  placeholder="0.00"
                  fullWidth
                  isDark={isDark}
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
                  sx={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    input: {
                      fontSize: '13px',
                      fontWeight: 400
                    }
                  }}
                />
                {/* Live Market Prices - More Prominent Display */}
                {bestBid != null && bestAsk != null && (
                  <Box sx={{
                    mt: 0.5,
                    p: 0.75,
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      {/* Bid Price */}
                      <Stack
                        direction="column"
                        alignItems="center"
                        spacing={0}
                        sx={{ cursor: 'pointer', flex: 1 }}
                        onClick={() => bids && bids[0] && setLimitPrice(String(bids[0].price))}
                      >
                        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>
                          Best Bid
                        </Typography>
                        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '12px', fontWeight: 500, color: '#22c55e', fontFamily: 'monospace' }}>
                          {bestBid < 0.0001 ? bestBid.toFixed(8) : fNumber(bestBid)}
                        </Typography>
                      </Stack>

                      {/* Spread */}
                      <Stack direction="column" alignItems="center" spacing={0} sx={{ flex: 1 }}>
                        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>
                          Spread
                        </Typography>
                        <Typography variant="caption" isDark={isDark} sx={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: spreadPct != null && spreadPct > 2 ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)')
                        }}>
                          {spreadPct != null ? `${spreadPct.toFixed(2)}%` : '—'}
                        </Typography>
                      </Stack>

                      {/* Ask Price */}
                      <Stack
                        direction="column"
                        alignItems="center"
                        spacing={0}
                        sx={{ cursor: 'pointer', flex: 1 }}
                        onClick={() => asks && asks[0] && setLimitPrice(String(asks[0].price))}
                      >
                        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>
                          Best Ask
                        </Typography>
                        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '12px', fontWeight: 500, color: '#ef4444', fontFamily: 'monospace' }}>
                          {bestAsk < 0.0001 ? bestAsk.toFixed(8) : fNumber(bestAsk)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                )}
                {orderType === 'limit' && limitPrice && Number(limitPrice) <= 0 && (
                  <Typography variant="caption" color="error" isDark={isDark} sx={{ fontSize: '10px' }}>
                    Enter a valid limit price greater than 0
                  </Typography>
                )}
                {orderType === 'limit' && limitPrice && (() => {
                    const lp = Number(limitPrice);
                    if (!lp || !isFinite(lp)) return null;

                    // Check if order would instantly fill
                    const willFillBuy = revert && bestAsk != null && lp >= Number(bestAsk);
                    const willFillSell = !revert && bestBid != null && lp <= Number(bestBid);

                    if (willFillBuy || willFillSell) {
                      const pct = willFillBuy
                        ? ((lp - Number(bestAsk)) / Number(bestAsk)) * 100
                        : ((Number(bestBid) - lp) / Number(bestBid)) * 100;
                      return (
                        <Alert severity="error" sx={{ mt: 0.25, py: 0.25 }}>
                          <Typography
                            variant="caption"
                            isDark={isDark}
                            sx={{ fontSize: '10px', fontWeight: 400, color: '#ef4444' }}
                          >
                            Instant fill! {pct > 0 ? `${pct.toFixed(1)}% ${willFillBuy ? 'above ask' : 'below bid'}` : 'At market price'}
                          </Typography>
                        </Alert>
                      );
                    }

                    // Show warning if price deviates from market
                    const refPrice = revert ? Number(bestAsk) : Number(bestBid);
                    if (refPrice && refPrice > 0) {
                      const pctDiff = revert
                        ? ((lp - refPrice) / refPrice) * 100
                        : ((refPrice - lp) / refPrice) * 100;
                      if (Math.abs(pctDiff) > 1) {
                        const direction = pctDiff > 0 ? 'above' : 'below';
                        const color = pctDiff > 50 ? '#ef4444' : pctDiff > 10 ? '#f59e0b' : '#3b82f6';
                        return (
                          <Typography
                            variant="caption"
                            isDark={isDark}
                            sx={{ fontSize: '10px', color }}
                          >
                            {Math.abs(pctDiff).toFixed(1)}% {direction} market
                          </Typography>
                        );
                      }
                    }
                    return null;
                  })()}

                {/* Order Expiration - Segmented Control */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                }}>
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
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        border: 'none',
                        background: 'transparent',
                        color: orderExpiry === exp.value ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        position: 'relative',
                        transition: 'color 0.15s'
                      }}
                    >
                      {exp.label}
                      {orderExpiry === exp.value && (
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '16px',
                          height: '2px',
                          borderRadius: '1px',
                          background: '#4285f4'
                        }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Show Order Book Toggle */}
                <button
                  onClick={() => setShowOrderbook(!showOrderbook)}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${showOrderbook ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                    background: showOrderbook ? 'rgba(66,133,244,0.1)' : 'transparent',
                    color: showOrderbook ? '#4285f4' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                >
                  {showOrderbook ? 'Hide' : 'Show'} Order Book
                </button>

              </Stack>
            </Box>
          )}


          {/* Order Summary */}
          {orderType === 'limit' && amount1 && amount2 && limitPrice && (
            <SummaryBox isDark={isDark}>
              <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px' }}>
                <span style={{ fontWeight: 500 }}>{revert ? 'Buy' : 'Sell'}</span> {amount1} {curr1.name} @ {limitPrice} = {new Decimal(amount1 || 0).mul(limitPrice || 0).toFixed(6)} {curr2.name}
                {orderExpiry !== 'never' && <span style={{ opacity: 0.6 }}> · {expiryHours}h</span>}
              </Typography>
            </SummaryBox>
          )}

          {/* Connect Wallet - inside the swap card when not connected */}
          {!accountProfile?.account && (
            <Box sx={{ mt: 1 }}>
              <ConnectWallet
                text="Connect Wallet"
                py={{ xs: 1, sm: 0.75 }}
                fontSize={{ xs: '12px', sm: '12px' }}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 400,
                  width: '100%'
                }}
              />
            </Box>
          )}

          {/* Debug Panel */}
          {debugInfo && (
            <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, border: `1px solid ${isDark ? 'rgba(234,179,8,0.3)' : '#fef3c7'}`, background: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8', fontFamily: 'monospace', fontSize: 9 }}>
              <div style={{ fontWeight: 500, marginBottom: 4, color: '#ca8a04', fontSize: 10 }}>Debug:</div>
              <div>wallet_type: <span style={{ color: '#3b82f6' }}>{debugInfo.wallet_type || 'undefined'}</span></div>
              <div>account: <span style={{ opacity: 0.7 }}>{debugInfo.account || 'undefined'}</span></div>
              <div>walletKeyId: <span style={{ color: debugInfo.walletKeyId ? '#22c55e' : '#ef4444' }}>{debugInfo.walletKeyId || 'undefined'}</span></div>
              <div>seed: <span style={{ color: '#22c55e', wordBreak: 'break-all' }}>{debugInfo.seed}</span></div>
            </div>
          )}

          {/* Exchange/Trustline Button - inside the swap card when connected */}
          {accountProfile?.account && (
            <Box sx={{ mt: 1 }}>
              <ExchangeButton
                variant="outlined"
                onClick={handlePlaceOrder}
                isDark={isDark}
                disabled={
                  isProcessing === 1 ||
                  !isLoggedIn ||
                  (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                }
              >
                {handleMsg()}
              </ExchangeButton>
              {isLoggedIn && errMsg && !errMsg.toLowerCase().includes('trustline') && (
                <Alert severity="error" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px' }}>
                    {errMsg}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </ConverterFrame>
      </OverviewWrapper>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, mb: 0.25, width: '100%' }}>
        <PuffLoader color={isDark ? '#22c55e' : '#3b82f6'} size={12} />
        <Typography variant="caption" isDark={isDark} sx={{ fontSize: '10px', opacity: 0.7 }}>
          1 {curr1.name} = {(() => {
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
              rate = token1IsXRP && !token2IsXRP ? tokenExch2 : !token1IsXRP && token2IsXRP ? 1 / tokenExch1 : tokenExch2 / tokenExch1;
            } else {
              rate = token1IsXRP && !token2IsXRP ? 1 / tokenExch2 : !token1IsXRP && token2IsXRP ? tokenExch1 : tokenExch1 / tokenExch2;
            }
            if (!isFinite(rate) || isNaN(rate)) return '--';
            return rate.toFixed(6);
          })()} {curr2.name}
        </Typography>
      </Stack>

      {/* Floating Order Book Panel */}
      {showOrderbook && (
        <div
          style={{
            position: 'fixed',
            left: orderBookPos.x,
            top: orderBookPos.y,
            zIndex: 9999,
            width: 320,
            borderRadius: 8,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
            background: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            className={cn(
              "px-3 py-2 border-b text-[12px] font-mono flex items-center justify-between cursor-move",
              isDark ? "border-primary/20 bg-white/[0.03]" : "border-primary/15 bg-gray-50"
            )}
          >
            <span className={cn("uppercase tracking-wide", isDark ? "text-primary/70" : "text-primary/70")}>Order Book</span>
            <button
              onClick={() => setShowOrderbook(false)}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded hover:bg-white/10",
                isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <X size={14} />
            </button>
          </div>
          {asks.length === 0 && bids.length === 0 ? (
            <div className={cn("p-8 text-center text-[12px] font-mono", isDark ? "text-primary/40" : "text-primary/40")}>
              No orderbook data available
            </div>
          ) : (
            <>
              <div className="flex text-[10px] font-mono px-2 py-1.5 border-b" style={{ borderColor: isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.08)' }}>
                <span className={cn("flex-1", isDark ? "text-primary/40" : "text-primary/40")}>Price</span>
                <span className={cn("flex-1 text-right", isDark ? "text-primary/40" : "text-primary/40")}>{curr1?.name || 'Token'}</span>
                <span className={cn("flex-1 text-right", isDark ? "text-primary/40" : "text-primary/40")}>Total</span>
              </div>
              {/* Asks */}
              <div ref={asksContainerRef} className="max-h-[280px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {(() => {
                  const visibleAsks = asks.slice(0, 30);
                  const maxAmount = Math.max(...visibleAsks.map(a => a.amount || 0), 1);
                  const userPrice = parseFloat(limitPrice) || 0;
                  const reversedAsks = [...visibleAsks].reverse();
                  const bestAsk = asks[0]?.price || Infinity;

                  const rows = [];

                  reversedAsks.forEach((ask, idx) => {
                    rows.push(
                      <div
                        key={`ask-${idx}`}
                        onClick={() => setLimitPrice(ask.price.toString())}
                        className={cn(
                          "flex px-2 py-1 text-[11px] font-mono cursor-pointer hover:bg-red-500/15 relative",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        <div
                          className="absolute inset-y-0 right-0 bg-red-500/15 pointer-events-none"
                          style={{ width: `${(ask.amount / maxAmount) * 100}%` }}
                        />
                        <span className="flex-1 text-red-400 relative z-[1]">{ask.price?.toFixed(6)}</span>
                        <span className="flex-1 text-right relative z-[1]">{fNumber(ask.amount)}</span>
                        <span className={cn("flex-1 text-right relative z-[1]", isDark ? "text-white/40" : "text-gray-400")}>{fNumber(ask.total)}</span>
                      </div>
                    );
                  });

                  // Add user order at bottom of asks if price is above best ask
                  if (userPrice > 0 && userPrice >= bestAsk) {
                    const willFill = userPrice >= bestAsk;
                    rows.push(
                      <div
                        key="user-order-ask"
                        className={cn(
                          "flex px-2 py-1 text-[11px] font-mono relative border-y",
                          willFill ? "bg-red-500/30 border-red-500/50" : "bg-primary/20 border-primary/50"
                        )}
                      >
                        <span className={cn("flex-1 relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{userPrice.toFixed(6)}</span>
                        <span className={cn("flex-1 text-right relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{willFill ? 'INSTANT FILL' : 'Your Order'}</span>
                        <span className={cn("flex-1 text-right relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{revert ? 'SELL' : 'BUY'}</span>
                      </div>
                    );
                  }
                  return rows;
                })()}
              </div>
              {/* Spread + User Order if in spread */}
              {(() => {
                const userPrice = parseFloat(limitPrice) || 0;
                const bestBid = bids[0]?.price || 0;
                const bestAsk = asks[0]?.price || Infinity;
                const inSpread = userPrice > 0 && userPrice > bestBid && userPrice < bestAsk;
                return (
                  <>
                    {inSpread && (
                      <div className="flex px-2 py-1 text-[11px] font-mono bg-primary/20 border-y border-primary/50">
                        <span className="flex-1 text-primary">{userPrice.toFixed(6)}</span>
                        <span className="flex-1 text-right text-primary">Your Order</span>
                        <span className="flex-1 text-right text-primary">{revert ? 'SELL' : 'BUY'}</span>
                      </div>
                    )}
                    <div className={cn(
                      "px-2 py-2 text-[11px] font-mono border-y flex justify-between items-center",
                      isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50"
                    )}>
                      <span className="text-green-400">{bids[0]?.price?.toFixed(6) || '—'}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px]",
                        isDark ? "bg-white/10" : "bg-gray-200"
                      )}>
                        {asks[0] && bids[0] ? ((asks[0].price - bids[0].price) / asks[0].price * 100).toFixed(2) : '0.00'}%
                      </span>
                      <span className="text-red-400">{asks[0]?.price?.toFixed(6) || '—'}</span>
                    </div>
                  </>
                );
              })()}
              {/* Bids */}
              <div className="max-h-[280px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {(() => {
                  const visibleBids = bids.slice(0, 30);
                  const maxAmount = Math.max(...visibleBids.map(b => b.amount || 0), 1);
                  const userPrice = parseFloat(limitPrice) || 0;

                  // Find where user's order would land in bids (for sell orders)
                  let userOrderInserted = false;
                  const rows = [];

                  const bestBidPrice = bids[0]?.price || 0;

                  visibleBids.forEach((bid, idx) => {
                    // Insert user order row if price is between this bid and previous
                    if (!userOrderInserted && userPrice > 0 && userPrice <= bid.price) {
                      const willFill = userPrice <= bestBidPrice;
                      rows.push(
                        <div
                          key="user-order-bid"
                          className={cn(
                            "flex px-2 py-1 text-[11px] font-mono relative border-y",
                            willFill ? "bg-red-500/30 border-red-500/50" : "bg-primary/20 border-primary/50"
                          )}
                        >
                          <span className={cn("flex-1 relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{userPrice.toFixed(6)}</span>
                          <span className={cn("flex-1 text-right relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{willFill ? 'INSTANT FILL' : 'Your Order'}</span>
                          <span className={cn("flex-1 text-right relative z-[1]", willFill ? "text-red-400" : "text-primary")}>{revert ? 'SELL' : 'BUY'}</span>
                        </div>
                      );
                      userOrderInserted = true;
                    }
                    rows.push(
                      <div
                        key={`bid-${idx}`}
                        onClick={() => setLimitPrice(bid.price.toString())}
                        className={cn(
                          "flex px-2 py-1 text-[11px] font-mono cursor-pointer hover:bg-green-500/15 relative",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-green-500/15 pointer-events-none"
                          style={{ width: `${(bid.amount / maxAmount) * 100}%` }}
                        />
                        <span className="flex-1 text-green-400 relative z-[1]">{bid.price?.toFixed(6)}</span>
                        <span className="flex-1 text-right relative z-[1]">{fNumber(bid.amount)}</span>
                        <span className={cn("flex-1 text-right relative z-[1]", isDark ? "text-white/40" : "text-gray-400")}>{fNumber(bid.total)}</span>
                      </div>
                    );
                  });

                  // If user price is below all bids, add at end
                  if (!userOrderInserted && userPrice > 0 && userPrice < (visibleBids[visibleBids.length - 1]?.price || Infinity)) {
                    rows.push(
                      <div
                        key="user-order-bid"
                        className={cn(
                          "flex px-2 py-1 text-[11px] font-mono relative",
                          "bg-primary/20 border-y border-primary/50"
                        )}
                      >
                        <span className="flex-1 text-primary relative z-[1]">{userPrice.toFixed(6)}</span>
                        <span className="flex-1 text-right text-primary relative z-[1]">Your Order</span>
                        <span className="flex-1 text-right text-primary relative z-[1]">{revert ? 'SELL' : 'BUY'}</span>
                      </div>
                    );
                  }
                  return rows;
                })()}
              </div>
            </>
          )}
        </div>
      )}

    </Stack>
  );
};

export default Swap;
