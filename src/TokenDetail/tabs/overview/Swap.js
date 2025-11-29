import React, { useContext, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { ArrowUpDown, RefreshCw, EyeOff, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AppContext } from 'src/AppContext';
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
const XRP_TOKEN = { currency: 'XRP', issuer: 'XRPL' };
import Decimal from 'decimal.js-light';
import { fNumber } from 'src/utils/formatters';

import { configureMemos } from 'src/utils/parseUtils';
import Image from 'next/image';
import { PuffLoader } from '../../../components/Spinners';
import TransactionDetailsPanel from 'src/TokenDetail/dialogs/TransactionDetailsPanel';

// Lazy load XRPL dependencies for device authentication
let Client, Wallet, CryptoJS;

const loadXRPLDependencies = async () => {
  if (!Client) {
    const xrpl = await import('xrpl');
    Client = xrpl.Client;
    Wallet = xrpl.Wallet;
  }
  if (!CryptoJS) {
    CryptoJS = await import('crypto-js');
  }
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
    if (props.variant === 'outlined') return props.sx?.borderColor || (props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)');
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
  &:hover {
    background: ${props => {
      if (props.disabled) return props.variant === 'outlined' ? 'transparent' : '#3b82f6';
      if (props.variant === 'outlined' || props.variant === 'text') return 'rgba(59,130,246,0.05)';
      return '#2563eb';
    }};
    border-color: ${props => {
      if (props.disabled) return props.variant === 'outlined' ? (props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : 'transparent';
      if (props.variant === 'outlined' || props.variant === 'text') return '#3b82f6';
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
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  &:hover {
    background: ${props => props.sx?.['&:hover']?.backgroundColor || 'transparent'};
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
    if (props.severity === 'error') return 'rgba(239, 68, 68, 0.2)';
    if (props.severity === 'warning') return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(59, 130, 246, 0.2)';
  }};
  background: ${props => {
    if (props.severity === 'error') return 'rgba(239, 68, 68, 0.05)';
    if (props.severity === 'warning') return 'rgba(245, 158, 11, 0.05)';
    return 'rgba(59, 130, 246, 0.05)';
  }};
  margin-top: ${props => props.sx?.mt ? `${props.sx.mt * 8}px` : '0'};
`;

const Tabs = styled.div`
  display: flex;
  width: fit-content;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(66,133,244,0.05)' : 'rgba(66,133,244,0.03)'};
  border: 1px solid ${props => props.isDark ? 'rgba(66,133,244,0.15)' : 'rgba(66,133,244,0.1)'};
`;

const Tab = styled.button`
  padding: 6px 16px;
  font-size: 13px;
  text-transform: none;
  border: 1px solid transparent;
  border-radius: 6px;
  background: ${props => props.isActive ? '#4285f4' : 'transparent'};
  color: ${props => props.isActive ? '#fff' : (props.isDark ? 'rgba(66,133,244,0.6)' : 'rgba(66,133,244,0.7)')};
  cursor: pointer;
  font-weight: ${props => props.isActive ? 500 : 400};
  transition: all 0.2s;
  &:hover {
    background: ${props => props.isActive ? '#4285f4' : 'rgba(66,133,244,0.1)'};
    border-color: ${props => props.isActive ? 'transparent' : 'rgba(66,133,244,0.2)'};
  }
`;

const Select = styled.select`
  padding: ${props => {
    if (props.sx?.['& .MuiSelect-select']?.py === 0) return '2px 6px';
    return '4px 8px';
  }};
  font-size: ${props => props.sx?.fontSize || props.sx?.['& .MuiSelect-select']?.fontSize || '11px'};
  height: ${props => props.sx?.height || 'auto'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 6px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'};
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : '#212B36'};
  cursor: pointer;
  outline: none;
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
  background: ${props => props.isDark ? 'rgba(66,133,244,0.03)' : 'rgba(66,133,244,0.02)'};
  width: 100%;
  justify-content: space-between;
  border: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)'};
  transition: border-color 0.2s;
  &:focus-within {
    border-color: #4285f4;
  }
  @media (max-width: 600px) {
    padding: 10px 12px;
    margin: 3px 0;
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
  padding: 16px;
  width: 100%;
  background: ${props => props.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)'};
  @media (max-width: 600px) {
    border-radius: 10px;
    padding: 12px;
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
  background: ${props => props.isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.05)'};
  border-radius: 50%;
  padding: 8px;
  z-index: 1;
  border: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.3)' : 'rgba(66,133,244,0.2)'};
  transition: all 0.2s;
  &:hover {
    border-color: #4285f4;
    background: rgba(66,133,244,0.15);
    svg {
      color: #4285f4 !important;
    }
  }
`;

const ExchangeButton = styled(Button)`
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #4285f4;
  color: #ffffff;
  font-weight: 500;
  border: 1.5px solid #4285f4;
  padding: 12px 16px;
  font-size: 14px;
  text-transform: none;
  margin: 0;
  letter-spacing: 0.3px;
  box-shadow: 0 0 20px rgba(66,133,244,0.3);
  transition: all 0.2s;

  &:hover {
    background: #3b78e7;
    border-color: #3b78e7;
    filter: brightness(1.1);
  }

  &:disabled {
    background: ${props => props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
    color: ${props => props.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
    border-color: ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
    box-shadow: none;
  }
`;

const TokenImage = styled(Image)`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  @media (max-width: 600px) {
    width: 24px;
    height: 24px;
  }
`;

const SummaryBox = styled.div`
  padding: 10px 12px;
  background: ${props => props.isDark ? 'rgba(66,133,244,0.05)' : 'rgba(66,133,244,0.03)'};
  border-radius: 8px;
  border: 1px solid ${props => props.isDark ? 'rgba(66,133,244,0.15)' : 'rgba(66,133,244,0.1)'};
  margin-top: 8px;
  margin-bottom: 4px;
`;

const Swap = ({ token, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {

  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [pair, setPair] = useState({
    curr1: XRP_TOKEN,
    curr2: token
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
  const [token2, setToken2] = useState(curr2);

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

  const [slippage, setSlippage] = useState(5);
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('never');
  const [expiryHours, setExpiryHours] = useState(24);

  const [showOrderbook, setShowOrderbook] = useState(false);

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

  // Fetch orderbook from API - token (token2) as base, XRP (token1) as quote
  // This gives prices in XRP per token (e.g., 1.69 XRP per DROP)
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrderbook() {
      if (!token1 || !token2) return;

      try {
        // Base = viewed token (token2), Quote = XRP (token1)
        // Result: price = XRP per token
        const params = new URLSearchParams({
          base_currency: token2.currency,
          quote_currency: token1.currency,
          limit: '60'
        });
        if (token2.currency !== 'XRP' && token2.issuer) params.append('base_issuer', token2.issuer);
        if (token1.currency !== 'XRP' && token1.issuer) params.append('quote_issuer', token1.issuer);

        const res = await axios.get(`${BASE_URL}/orderbook?${params}`, { signal: controller.signal });

        if (res.data?.success) {
          // API returns pre-parsed data with price, amount, total fields
          const parsedBids = (res.data.bids || []).map(o => ({
            price: parseFloat(o.price),
            amount: parseFloat(o.amount),
            total: parseFloat(o.total),
            account: o.account,
            funded: o.funded
          }));

          const parsedAsks = (res.data.asks || []).map(o => ({
            price: parseFloat(o.price),
            amount: parseFloat(o.amount),
            total: parseFloat(o.total),
            account: o.account,
            funded: o.funded
          }));

          // Add cumulative sumAmount
          let bidSum = 0, askSum = 0;
          parsedBids.forEach(b => { bidSum += b.amount; b.sumAmount = bidSum; });
          parsedAsks.forEach(a => { askSum += a.amount; a.sumAmount = askSum; });

          setBids(parsedBids.slice(0, 30));
          setAsks(parsedAsks.slice(0, 30));
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Orderbook fetch error:', err);
        }
      }
    }

    fetchOrderbook();
    const timer = setInterval(fetchOrderbook, 5000);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [token1, token2]);

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
    const controller = new AbortController();

    async function getAccountInfo() {
      if (!accountProfile || !accountProfile.account) return;
      if (!curr1 || !curr2) return;

      const account = accountProfile.account;

      try {
        const balanceRes = await axios.get(
          `${BASE_URL}/account/info/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`,
          { signal: controller.signal }
        );

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
            `${BASE_URL}/account/lines/${account}?page=${currentPage}&limit=50`,
            { signal: controller.signal }
          );

          if (firstResponse.status === 200 && firstResponse.data) {
            allTrustlines = firstResponse.data.lines || [];
            totalTrustlines = firstResponse.data.total || 0;

            if (totalTrustlines > 50) {
              const totalPages = Math.ceil(totalTrustlines / 50);
              const additionalRequests = [];

              for (let page = 1; page < totalPages; page++) {
                additionalRequests.push(
                  axios.get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=50`, {
                    signal: controller.signal
                  })
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
          if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
            console.error('Trustline fetch error:', err);
          }
        });
    }

    getAccountInfo();

    return () => controller.abort();
  }, [accountProfile, curr1, curr2, sync, isSwapped]);

  useEffect(() => {
    const controller = new AbortController();

    async function getTokenPrice() {
      setLoadingPrice(true);
      const md51 = token1.md5;
      const md52 = token2.md5;

      try {
        const res = await axios.get(`${BASE_URL}/pair_rates?md51=${md51}&md52=${md52}`, {
          signal: controller.signal
        });

        if (res.status === 200 && res.data) {
          setTokenExch1(res.data.rate1 || 0);
          setTokenExch2(res.data.rate2 || 0);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Token price fetch error:', err);
        }
      } finally {
        setLoadingPrice(false);
      }
    }

    getTokenPrice();

    return () => controller.abort();
  }, [token1, token2]);

  useEffect(() => {
    const pair = {
      curr1: revert ? token2 : token1,
      curr2: revert ? token1 : token2
    };
    setPair(pair);
  }, [revert, token1, token2]);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        return;
        const res = ret.data.data.response;
        const dispatched_result = res.dispatched_result;

        return dispatched_result;
      } catch (err) {}
    }

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();

        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          setSync(sync + 1);
          openSnackbar('Successfully submitted the swap!', 'success');
          stopInterval(true);
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Transaction signing rejected!', 'error');
          stopInterval(false);
          return;
        }
      }, 1000);
    };

    const stopInterval = (clearAmounts = false) => {
      clearInterval(dispatchTimer);
      if (clearAmounts) {
        setAmount1('');
        setAmount2('');
      }
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        return;
        const res = ret.data.data.response;
        const resolved_at = res.resolved_at;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {}
      isRunning = false;
      counter--;
      if (counter <= 0) {
      }
    }
    if (false) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [uuid]);

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

          const client = new Client('wss://s1.ripple.com');
          await client.connect();

          try {
            const preparedTx = await client.autofill(trustSetTransaction);
            const signedTx = deviceWallet.sign(preparedTx);
            const result = await client.submitAndWait(signedTx.tx_blob);

            if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(result.result?.hash));
              setTimeout(() => {
                setSync(sync + 1);
                dispatch(updateProcess(0));
              }, 1500);
              openSnackbar('Trustline created successfully!', 'success');
            } else {
              openSnackbar('Transaction failed: ' + result.result?.meta?.TransactionResult, 'error');
              dispatch(updateProcess(0));
            }
          } finally {
            await client.disconnect();
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
    <Stack alignItems="center" width="100%" sx={{ px: { xs: 0, sm: 0 } }}>
      <OverviewWrapper isDark={isDark}>
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
                    <Stack direction="row" spacing={0.25}>
                      {[0.25, 0.5, 0.75].map((p) => (
                        <Button
                          key={p}
                          isDark={isDark}
                          sx={{
                            px: { xs: 0.75, sm: 0.5 },
                            py: 0,
                            minWidth: 0,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            height: { xs: '24px', sm: '20px' }
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
                          px: { xs: 0.75, sm: 0.5 },
                          py: 0,
                          minWidth: 0,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          height: { xs: '24px', sm: '20px' }
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

          {/* Slippage control - Only for market orders */}
          {orderType === 'market' && (
            <Box sx={{ px: 1.5, py: 0.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="textSecondary" isDark={isDark} sx={{ fontSize: '11px' }}>
                  Slippage
                </Typography>
                <Stack direction="row" spacing={0.25} alignItems="center">
                  {[1, 3, 5].map((preset) => (
                    <Button
                      key={preset}
                      size="small"
                      variant={slippage === preset ? 'outlined' : 'text'}
                      onClick={() => setSlippage(preset)}
                      isDark={isDark}
                      sx={{
                        minWidth: '22px',
                        height: '18px',
                        fontSize: '11px',
                        px: 0.5,
                        py: 0,
                        color: slippage === preset ? '#4285f4' : 'text.secondary',
                        borderColor: '#4285f4',
                        backgroundColor: slippage === preset ? alpha('#4285f4', 0.04) : 'transparent'
                      }}
                    >
                      {preset}%
                    </Button>
                  ))}
                  <Input
                    value={slippage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 50)) {
                        setSlippage(val === '' ? 0 : parseFloat(val));
                      }
                    }}
                    isDark={isDark}
                    sx={{
                      width: '28px',
                      input: {
                        fontSize: '11px',
                        textAlign: 'center',
                        padding: '1px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                        borderRadius: '4px',
                        height: '14px'
                      }
                    }}
                  />
                  <Typography variant="caption" isDark={isDark} sx={{ fontSize: '11px', color: 'text.secondary' }}>
                    % · Impact {priceImpact}%
                  </Typography>
                </Stack>
              </Stack>
              {Number(slippage) > 5 && (
                <Typography variant="caption" color="warning.main" isDark={isDark} sx={{ display: 'block', mt: 0.25, fontSize: '10px' }}>
                  High slippage = higher risk
                </Typography>
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
                {orderType === 'limit' &&
                  priceWarning &&
                  (() => {
                    const baseMsg =
                      priceWarning.kind === 'buy'
                        ? `Buy ${new Decimal(priceWarning.pct).toFixed(1)}% above ask`
                        : `Sell ${new Decimal(priceWarning.pct).toFixed(1)}% below bid`;
                    const lp = Number(limitPrice);
                    const marketable =
                      priceWarning.kind === 'buy'
                        ? bestAsk != null && lp >= Number(bestAsk)
                        : bestBid != null && lp <= Number(bestBid);
                    if (marketable) {
                      return (
                        <Alert severity="error" sx={{ mt: 0.25, py: 0.25 }}>
                          <Typography
                            variant="caption"
                            isDark={isDark}
                            sx={{ fontSize: '10px', fontWeight: 400, color: '#ef4444' }}
                          >
                            Instant fill! {baseMsg}
                          </Typography>
                        </Alert>
                      );
                    }
                    return (
                      <Typography
                        variant="caption"
                        isDark={isDark}
                        sx={{ fontSize: '10px', color: '#f59e0b' }}
                      >
                        {baseMsg}
                      </Typography>
                    );
                  })()}

                {/* Order Expiration - Grid Style */}
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(66,133,244,0.05)' : 'rgba(66,133,244,0.03)',
                  border: `1px solid ${isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)'}`
                }}>
                  <span style={{
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                    color: isDark ? 'rgba(66,133,244,0.6)' : 'rgba(66,133,244,0.7)'
                  }}>
                    Order Expires In
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { value: 'never', label: 'Never', desc: '∞' },
                      { value: '1h', label: '1 Hour', desc: '1h' },
                      { value: '24h', label: '1 Day', desc: '24h' },
                      { value: '7d', label: '7 Days', desc: '7d' }
                    ].map((exp) => (
                      <button
                        key={exp.value}
                        onClick={() => {
                          setOrderExpiry(exp.value);
                          if (exp.value === '1h') setExpiryHours(1);
                          else if (exp.value === '24h') setExpiryHours(24);
                          else if (exp.value === '7d') setExpiryHours(168);
                        }}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '8px',
                          border: `1px solid ${orderExpiry === exp.value ? '#4285f4' : (isDark ? 'rgba(66,133,244,0.2)' : 'rgba(66,133,244,0.15)')}`,
                          background: orderExpiry === exp.value ? '#4285f4' : 'transparent',
                          color: orderExpiry === exp.value ? '#fff' : (isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.6)'),
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 400 }}>{exp.desc}</span>
                        <span style={{ display: 'block', fontSize: '9px', opacity: orderExpiry === exp.value ? 0.8 : 0.5, marginTop: '2px' }}>{exp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
            let rate;
            if (revert) {
              rate = token1IsXRP && !token2IsXRP ? tokenExch2 : !token1IsXRP && token2IsXRP ? 1 / tokenExch1 : tokenExch2 / tokenExch1;
            } else {
              rate = token1IsXRP && !token2IsXRP ? 1 / tokenExch2 : !token1IsXRP && token2IsXRP ? tokenExch1 : tokenExch1 / tokenExch2;
            }
            return rate.toFixed(6);
          })()} {curr2.name}
        </Typography>
      </Stack>


      {!onOrderBookToggle && (
        <TransactionDetailsPanel
          open={showOrderbook && orderType === 'limit'}
          onClose={() => setShowOrderbook(false)}
          mode="orderbook"
          pair={{
            curr1: { ...curr1, name: curr1.name || curr1.currency },
            curr2: { ...curr2, name: curr2.name || curr2.currency }
          }}
          asks={asks}
          bids={bids}
          limitPrice={orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : null}
          isBuyOrder={!!revert}
          onAskClick={(e, idx) => {
            if (asks && asks[idx]) {
              setLimitPrice(asks[idx].price.toString());
              setOrderType('limit');
            }
          }}
          onBidClick={(e, idx) => {
            if (bids && bids[idx]) {
              setLimitPrice(bids[idx].price.toString());
              setOrderType('limit');
            }
          }}
        />
      )}

    </Stack>
  );
};

export default Swap;
