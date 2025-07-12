import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { ClipLoader } from 'react-spinners';

// Set Decimal precision immediately after import
Decimal.set({ precision: 50 });
import LoadChart from 'src/components/LoadChart';

// Material UI components (to be gradually replaced with Tailwind)
import {
  alpha,
  styled,
  useTheme,
  Button,
  IconButton,
  Input,
  Stack,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Additional icons for future replacement (lucide-react not installed)

// Iconify
import { Icon } from '@iconify/react';
import exchangeIcon from '@iconify/icons-uil/exchange';
import infoFill from '@iconify/icons-eva/info-fill';
import shareIcon from '@iconify/icons-uil/share-alt';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { isInstalled, submitTransaction, setTrustline } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import ConnectWallet from 'src/components/ConnectWallet';
import QRDialog from 'src/components/QRDialog';
import QueryToken from 'src/components/QueryToken';
import { currencySymbols } from 'src/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { configureMemos } from 'src/utils/parse/OfferChanges';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import OrderBook from 'src/TokenDetail/trade/OrderBook';
// import Dialog from 'src/components/Dialog'; // No longer needed - using side panel instead

// Router
import { useRouter } from 'next/router';

const CurrencyContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 0;
    display: flex;
    flex: 1 1 0%;
    flex-direction: row;
    padding: 16px;
    border-radius: 12px;
    -webkit-box-align: center;
    align-items: center;
    background: ${theme.palette.background.paper};
    border: 1px solid ${alpha(theme.palette.divider, 0.15)};
    transition: all 0.2s ease;
    
    &:hover {
      border-color: ${alpha(theme.palette.primary.main, 0.3)};
      box-shadow: 0 2px 8px ${alpha(theme.palette.primary.main, 0.08)};
    }
    
    &:not(:first-of-type) {
      margin-top: 8px;
    }
    
    @media (max-width: 600px) {
      padding: 12px;
      border-radius: 10px;
    }
    
    @media (min-width: 900px) {
      padding: 20px 24px;
      border-radius: 14px;
    }
`
);

const InputContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 0px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    -webkit-box-align: flex-end;
    align-items: flex-end;
    -webkit-box-pack: flex-end;
    justify-content: flex-end;
    color: rgb(255, 255, 255);
`
);

let border; // webxtor SEO fix
if (typeof theme !== 'undefined' && theme.currency) {
  border = theme.currency.border;
}
const OverviewWrapper = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    box-sizing: border-box;
    border-radius: 16px;
    display: flex;
    background: ${theme.palette.background.paper};
    border: 1px solid ${alpha(theme.palette.divider, 0.12)};
    padding-bottom: 8px;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 4px 16px ${alpha(theme.palette.common.black, 0.04)};

    @media (max-width: 600px) {
        border-radius: 12px;
        margin: 0 8px;
        box-shadow: 0 2px 8px ${alpha(theme.palette.common.black, 0.03)};
    }
    
    @media (min-width: 900px) {
        border-radius: 20px;
        max-width: 700px;
        box-shadow: 0 8px 24px ${alpha(theme.palette.common.black, 0.06)};
    }
`
);

const ConverterFrame = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    position: relative;
    display: flex;
`
);

const ExchangeButton = styled(Button)(
  ({ theme }) => `
    @media (max-width: 600px) {
        margin-left: 8px;
        margin-right: 8px;
    }
    @media (min-width: 900px) {
        padding: 16px 32px;
        border-radius: 10px;
        min-height: 56px;
        font-size: 16px;
    }
    position: relative;
    overflow: hidden;
    padding: 14px 24px;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: ${theme.palette.primary.main};
    
    &:hover {
      background: ${theme.palette.primary.dark};
    }
    
    &:active {
      background: ${theme.palette.primary.dark};
    }
    min-height: 48px;
    background: linear-gradient(45deg, 
      ${theme.palette.primary.main} 0%, 
      ${alpha(theme.palette.primary.main, 0.8)} 25%,
      ${alpha(theme.palette.primary.light, 0.9)} 50%,
      ${alpha(theme.palette.primary.main, 0.8)} 75%,
      ${theme.palette.primary.main} 100%);
    background-size: 200% 200%;
    animation: gradient 5s ease infinite;
    box-shadow: 
      0 0 10px ${alpha(theme.palette.primary.main, 0.5)},
      0 0 20px ${alpha(theme.palette.primary.main, 0.3)},
      0 0 30px ${alpha(theme.palette.primary.main, 0.2)};

    @keyframes gradient {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, ${alpha(
        theme.palette.primary.light,
        0.15
      )} 0%, transparent 70%);
      animation: rotate 4s linear infinite;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    @keyframes rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 
        0 0 15px ${alpha(theme.palette.primary.main, 0.6)},
        0 0 30px ${alpha(theme.palette.primary.main, 0.4)},
        0 0 45px ${alpha(theme.palette.primary.main, 0.3)};
      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
      box-shadow: none;
      &::before {
        display: none;
      }
    }

    & .MuiButton-label {
      color: #fff;
      font-weight: 500;
      z-index: 1;
    }
`
);

const AllowButton = styled(Button)(
  ({ theme }) => `
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    height: 32px;
    text-transform: none;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    background: ${alpha(theme.palette.primary.main, 0.08)};
    color: ${theme.palette.primary.main};
    border: 1px solid ${alpha(theme.palette.primary.main, 0.2)};
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, ${alpha(
        theme.palette.primary.main,
        0.2
      )}, transparent);
      transition: left 0.5s;
    }
    
    &:hover {
      background: ${alpha(theme.palette.primary.main, 0.12)};
      border-color: ${alpha(theme.palette.primary.main, 0.3)};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${alpha(theme.palette.primary.main, 0.15)};
      
      &::before {
        left: 100%;
      }
    }
    
    &:active {
      transform: translateY(0);
      transition: transform 0.1s;
    }
`
);

const ToggleButton = styled(IconButton)(
  ({ theme }) => `
    background-color: ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.8)};
    border: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
    width: 40px;
    height: 40px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      background-color: ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.9)};
      transform: translate(-50%, -50%) rotate(180deg);
    }

    &.switching {
      transform: translate(-50%, -50%) rotate(180deg);
    }
    
    @media (max-width: 600px) {
      width: 32px;
      height: 32px;
    }
    
    @media (min-width: 900px) {
      width: 48px;
      height: 48px;
    }
`
);

const getPriceImpactColor = (impact) => {
  if (impact <= 1) return '#22C55E'; // Green for low impact
  if (impact <= 3) return '#F59E0B'; // Yellow for medium impact
  return '#EF4444'; // Red for high impact
};

const getPriceImpactSeverity = (impact) => {
  if (impact <= 1) return 'Low';
  if (impact <= 3) return 'Medium';
  return 'High';
};

const WalletDisplay = styled('div')(
  ({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    margin-bottom: 20px;
    border-radius: 16px;
    background: linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(
      theme.palette.success.main,
      0.04
    )} 100%);
    border: 1px solid ${alpha(theme.palette.success.main, 0.2)};
    backdrop-filter: blur(10px);
    
    @media (max-width: 600px) {
      margin-left: 10px;
      margin-right: 10px;
      padding: 12px 20px;
      margin-bottom: 16px;
      border-radius: 12px;
    }
    
    @media (min-width: 900px) {
      padding: 20px 32px;
      margin-bottom: 24px;
      border-radius: 20px;
    }
`
);

const WalletInfo = styled('div')(
  ({ theme }) => `
    display: flex;
    align-items: center;
    gap: 12px;
`
);

const WalletIcon = styled('div')(
  ({ theme }) => `
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${alpha(theme.palette.success.main, 0.15)};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.palette.success.main};
`
);

const WalletDetails = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: 2px;
`
);

const WalletAddress = styled(Typography)(
  ({ theme }) => `
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    
    @media (max-width: 600px) {
      font-size: 0.75rem;
    }
`
);

const WalletType = styled(Typography)(
  ({ theme }) => `
    font-size: 0.75rem;
    color: ${theme.palette.success.main};
    font-weight: 500;
    text-transform: capitalize;
`
);

const StatusIndicator = styled('div')(
  ({ theme }) => `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${theme.palette.success.main};
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0.7)};
      }
      70% {
        box-shadow: 0 0 0 4px ${alpha(theme.palette.success.main, 0)};
      }
      100% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0)};
      }
    }
`
);


const ShareButton = styled(Button)(
  ({ theme }) => `
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    height: 32px;
    text-transform: none;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    background: ${alpha(theme.palette.info.main, 0.08)};
    color: ${theme.palette.info.main};
    border: 1px solid ${alpha(theme.palette.info.main, 0.2)};
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, ${alpha(
        theme.palette.info.main,
        0.2
      )}, transparent);
      transition: left 0.5s;
    }
    
    &:hover {
      background: ${alpha(theme.palette.info.main, 0.12)};
      border-color: ${alpha(theme.palette.info.main, 0.3)};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${alpha(theme.palette.info.main, 0.15)};
      
      &::before {
        left: 100%;
      }
    }
    
    &:active {
      transform: translateY(0);
      transition: transform 0.1s;
    }
`
);

export default function Swap({ pair, setPair, revert, setRevert, bids: propsBids, asks: propsAsks }) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;
  const QR_BLUR = '/static/blurqr.webp';
  const router = useRouter();

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const curr1 = pair?.curr1;
  const curr2 = pair?.curr2;

  const { accountProfile, darkMode, setLoading, sync, setSync, openSnackbar, activeFiatCurrency } =
    useContext(AppContext);

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const [token1, setToken1] = useState(curr1);
  const [token2, setToken2] = useState(curr2);

  const [amount1, setAmount1] = useState(''); // XRP
  const [amount2, setAmount2] = useState(''); // Token

  const [tokenExch1, setTokenExch1] = useState(0);
  const [tokenExch2, setTokenExch2] = useState(0);
  const [isSwapped, setSwapped] = useState(false);

  const [active, setActive] = useState('AMOUNT');

  const [accountPairBalance, setAccountPairBalance] = useState(null);

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [focusTop, setFocusTop] = useState(false);
  const [focusBottom, setFocusBottom] = useState(false);

  const [isSwitching, setIsSwitching] = useState(false);
  const [trustlines, setTrustlines] = useState([]);
  const [hasTrustline1, setHasTrustline1] = useState(true);
  const [hasTrustline2, setHasTrustline2] = useState(true);
  const [transactionType, setTransactionType] = useState('');

  // Add slippage state
  const [slippage, setSlippage] = useState(5); // Default 5% slippage
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');

  // Add state for latest sparkline prices
  const [latestPrice1, setLatestPrice1] = useState(null);
  const [latestPrice2, setLatestPrice2] = useState(null);
  
  // Add state for orderbook modal
  const [showOrderbook, setShowOrderbook] = useState(false);
  
  // Use orderbook data from props
  const bids = propsBids || [];
  const asks = propsAsks || [];

  const amount = revert ? amount2 : amount1;
  let value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;
  const curr1IsXRP = curr1?.currency === 'XRP';
  const curr2IsXRP = curr2?.currency === 'XRP';

  const tokenPrice1 = (() => {
    try {
      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';
      const token1IsRLUSD = token1?.currency === 'RLUSD' || token1?.name === 'RLUSD';
      
      if (activeFiatCurrency === 'XRP') {
        // When display currency is XRP, show XRP value
        if (token1IsXRP) {
          // If token1 is already XRP, just return the amount
          return new Decimal(amount1 || 0).toNumber();
        } else if (token2IsXRP && tokenExch1 > 0) {
          // For tokens paired with XRP, tokenExch1 tells us XRP per token
          // So multiply amount1 by tokenExch1 to get XRP value
          return new Decimal(amount1 || 0).mul(tokenExch1).toNumber();
        } else {
          // For non-XRP pairs when displaying in XRP
          return 0;
        }
      } else {
        // For other fiat currencies (USD, EUR, etc.)
        if (token1IsXRP) {
          // If token1 is XRP, convert to selected fiat currency
          return new Decimal(amount1 || 0).div(metrics[activeFiatCurrency] || 1).toNumber();
        } else if (token2IsXRP && token1IsRLUSD) {
          // If token1 is RLUSD and token2 is XRP
          // RLUSD is pegged to USD, so 1 RLUSD = 1 USD
          if (activeFiatCurrency === 'USD') {
            return new Decimal(amount1 || 0).toNumber();
          } else {
            // Convert USD to target currency
            const usdValue = new Decimal(amount1 || 0);
            const usdToXrp = new Decimal(metrics['USD'] || 1);
            const targetToXrp = new Decimal(metrics[activeFiatCurrency] || 1);
            return usdValue.mul(usdToXrp).div(targetToXrp).toNumber();
          }
        } else if (token2IsXRP) {
          // If token1 is a token and token2 is XRP, first convert to XRP using rate1, then to fiat
          const xrpValue = new Decimal(amount1 || 0).mul(tokenExch1 || 0);
          return xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
        } else {
          // For non-XRP pairs, show fiat value
          return new Decimal(tokenExch1 || 0)
            .mul(amount1 || 0)
            .div(metrics[activeFiatCurrency] || 1)
            .toNumber();
        }
      }
    } catch (e) {
      return 0;
    }
  })();
  const tokenPrice2 = (() => {
    try {
      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';
      const token2IsRLUSD = token2?.currency === 'RLUSD' || token2?.name === 'RLUSD';
      
      if (activeFiatCurrency === 'XRP') {
        // When display currency is XRP, show XRP value
        if (token2IsXRP) {
          // If token2 is already XRP, just return the amount
          return new Decimal(amount2 || 0).toNumber();
        } else if (token1IsXRP && tokenExch2 > 0) {
          // For tokens paired with XRP
          // Based on the actual behavior: if we're getting 7.95 when dividing,
          // then tokenExch2 must be ~0.354 (XRP per RLUSD)
          // So we need to multiply: 2.82 RLUSD × 0.354 = ~1 XRP
          const xrpValue = new Decimal(amount2 || 0).mul(tokenExch2).toNumber();
          return xrpValue;
        } else {
          // For non-XRP pairs when displaying in XRP
          return 0;
        }
      } else {
        // For other fiat currencies (USD, EUR, etc.)
        if (token2IsXRP) {
          // If token2 is XRP, convert to selected fiat currency
          // metrics contains XRP price in each currency (e.g., 1 USD = 0.357 XRP)
          // So to get fiat value: XRP amount / (Fiat/XRP rate)
          return new Decimal(amount2 || 0).div(metrics[activeFiatCurrency] || 1).toNumber();
        } else if (token1IsXRP && token2IsRLUSD) {
          // If token2 is RLUSD and token1 is XRP
          // RLUSD is pegged to USD, so 1 RLUSD = 1 USD
          if (activeFiatCurrency === 'USD') {
            // If displaying in USD, just return the RLUSD amount as-is
            return new Decimal(amount2 || 0).toNumber();
          } else {
            // For other currencies, RLUSD = USD, so we need to convert USD to target currency
            // metrics contains XRP price in each currency (e.g., 1 USD = 0.357 XRP)
            // To convert: RLUSD amount * (USD/XRP rate) / (TargetCurrency/XRP rate)
            const usdValue = new Decimal(amount2 || 0); // RLUSD amount = USD value
            const usdToXrp = new Decimal(metrics['USD'] || 1);
            const targetToXrp = new Decimal(metrics[activeFiatCurrency] || 1);
            // USD value * (USD/XRP) / (Target/XRP) = Target value
            return usdValue.mul(usdToXrp).div(targetToXrp).toNumber();
          }
        } else if (token1IsXRP) {
          // For other tokens when token1 is XRP
          // Special handling for RLUSD when displaying in USD
          if (token2IsRLUSD && activeFiatCurrency === 'USD') {
            // RLUSD is pegged 1:1 with USD
            return new Decimal(amount2 || 0).toNumber();
          }
          // For other cases, convert through XRP
          // tokenExch2 tells us XRP per token, so multiply to get XRP value
          const xrpValue = new Decimal(amount2 || 0).mul(tokenExch2 || 0);
          // Then convert XRP to fiat. metrics[currency] contains Fiat/XRP rate
          // So divide XRP by the rate to get fiat value
          return xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
        } else {
          // For non-XRP pairs, show fiat value
          return new Decimal(tokenExch2 || 0)
            .mul(amount2 || 0)
            .div(metrics[activeFiatCurrency] || 1)
            .toNumber();
        }
      }
    } catch (e) {
      return 0;
    }
  })();

  const inputPrice = revert ? tokenPrice2 : tokenPrice1;
  const outputPrice = revert ? tokenPrice1 : tokenPrice2;
  const priceImpact =
    inputPrice > 0
      ? new Decimal(outputPrice)
          .sub(inputPrice)
          .mul(100)
          .div(inputPrice)
          .toDP(2, Decimal.ROUND_DOWN)
          .toNumber()
      : 0;

  // Helper function to convert hex currency code to readable name
  const getCurrencyDisplayName = (currency, tokenName) => {
    if (currency === 'XRP') return 'XRP';
    if (currency === 'USD') return 'USD';
    if (currency === 'EUR') return 'EUR';
    if (currency === 'BTC') return 'BTC';
    if (currency === 'ETH') return 'ETH';

    // If we have a token name, use it
    if (tokenName && tokenName !== currency) {
      return tokenName;
    }

    // Try to convert hex to ASCII for display
    try {
      if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
        const hex = currency.replace(/00+$/, ''); // Remove trailing zeros
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte > 0) ascii += String.fromCharCode(byte);
        }
        return ascii.toUpperCase() || currency;
      }
    } catch (e) {
      // Fall back to original currency code
    }

    return currency;
  };

  const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;

  let isSufficientBalance = false;
  let errMsg = '';

  if (isLoggedIn) {
    errMsg = '';
    isSufficientBalance = false;

    // Check trustlines first
    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, token1?.name);
      errMsg = `No trustline for ${displayName}`;
    } else if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, token2?.name);
      errMsg = `No trustline for ${displayName}`;
    } else {
      // Check balance if trustlines exist
      try {
        const fAmount = parseFloat(amount || 0);
        const fValue = parseFloat(value || 0);
        const accountAmount = parseFloat(accountPairBalance.curr1.value || 0);
        const accountValue = parseFloat(accountPairBalance.curr2.value || 0);

        if (amount1 && amount2) {
          if (fAmount > 0 && fValue > 0) {
            // Check balance against the correct currency based on revert state
            // When revert=false: user spends curr1 (amount1), so check against accountAmount (curr1.value)
            // When revert=true: user spends curr2 (amount2), so check against accountValue (curr2.value)
            const spendingAmount = revert ? parseFloat(amount2 || 0) : parseFloat(amount1 || 0);
            const availableBalance = revert ? accountValue : accountAmount;


            if (availableBalance >= spendingAmount) {
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

  useEffect(() => {
    function getAccountInfo() {
      if (!accountProfile || !accountProfile.account) return;
      if (!curr1 || !curr2) return;

      const account = accountProfile.account;

      // Get account balance info
      axios
        .get(
          `${BASE_URL}/account/info/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setAccountPairBalance(ret.pair);
          }
        })
        .catch((err) => {
        });

      // Check trustlines - implement pagination to fetch all trustlines
      const fetchAllTrustlines = async () => {
        try {
          let allTrustlines = [];
          let currentPage = 0;
          let totalTrustlines = 0;

          // First request to get initial data and total count
          const firstResponse = await axios.get(
            `${BASE_URL}/account/lines/${account}?page=${currentPage}&limit=50`
          );

          if (firstResponse.status === 200 && firstResponse.data) {
            allTrustlines = firstResponse.data.lines || [];
            totalTrustlines = firstResponse.data.total || 0;


            // If total is more than 50, fetch additional pages starting from page 1
            if (totalTrustlines > 50) {
              const totalPages = Math.ceil(totalTrustlines / 50);
              const additionalRequests = [];

              // Create requests for pages 1 through totalPages-1 (since we already have page 0)
              for (let page = 1; page < totalPages; page++) {
                additionalRequests.push(
                  axios.get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=50`)
                );
              }

              // Execute all additional requests in parallel
              const additionalResponses = await Promise.all(additionalRequests);

              // Combine all trustlines from additional pages
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

          // Debug: Log the first trustline to understand the structure
          if (allTrustlines.length > 0) {
          }


          // Helper function to normalize currency codes for comparison
          const normalizeCurrency = (currency) => {
            if (!currency) return '';
            // Remove trailing zeros from hex currency codes
            if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
              return currency.replace(/00+$/, '').toUpperCase();
            }
            return currency.toUpperCase();
          };

          // Helper function to check if two currency codes match
          const currenciesMatch = (curr1, curr2) => {
            if (!curr1 || !curr2) return false;

            // Direct match
            if (curr1 === curr2) return true;

            // Normalized match (for hex codes)
            const norm1 = normalizeCurrency(curr1);
            const norm2 = normalizeCurrency(curr2);
            if (norm1 === norm2) return true;

            // Try converting hex to ASCII and compare
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
            } catch (e) {
              // Ignore conversion errors
            }

            return false;
          };

          // Helper function to check if issuers match
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

          // Check if trustlines exist for curr1 and curr2
          const hasCurr1Trustline =
            curr1.currency === 'XRP' ||
            allTrustlines.some((line) => {
              // Check multiple currency fields
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

              // For currency matches, check if we have a valid trustline
              // For standard currencies like USD, accept any valid trustline
              // For specific tokens, require exact issuer match
              const issuerMatch = issuersMatch(line, curr1.issuer);
              const isStandardCurrency = ['USD', 'EUR', 'BTC', 'ETH'].includes(curr1.currency);

              // Debug specific currency matches

              return currencyMatch && (issuerMatch || isStandardCurrency);
            });

          const hasCurr2Trustline =
            curr2.currency === 'XRP' ||
            allTrustlines.some((line) => {
              // Check multiple currency fields
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

          // Debug: Log all available currencies in trustlines
          const availableCurrencies = allTrustlines.map((line) => ({
            balance: line.Balance?.currency,
            currency: line.currency,
            _currency: line._currency,
            highLimit: line.HighLimit?.currency,
            lowLimit: line.LowLimit?.currency,
            issuer: line._token1 || line._token2
          }));

          // Debug: Check if we can find any SCRAP-like currencies
          const scrapLikeCurrencies = allTrustlines.filter((line) => {
            const currencies = [
              line.Balance?.currency,
              line.currency,
              line._currency,
              line.HighLimit?.currency,
              line.LowLimit?.currency
            ].filter(Boolean);

            return currencies.some((curr) => {
              if (!curr) return false;
              // Check if it contains "scrap" when converted from hex
              try {
                if (curr.length === 40 && /^[0-9A-Fa-f]+$/.test(curr)) {
                  const cleanHex = curr.replace(/00+$/, '');
                  let ascii = '';
                  for (let i = 0; i < cleanHex.length; i += 2) {
                    const byte = parseInt(cleanHex.substr(i, 2), 16);
                    if (byte > 0) ascii += String.fromCharCode(byte);
                  }
                  return ascii.toLowerCase().includes('scrap');
                }
                return curr.toLowerCase().includes('scrap');
              } catch (e) {
                return false;
              }
            });
          });

          if (scrapLikeCurrencies.length > 0) {
          } else {
          }
        })
        .catch((err) => {
        });
    }

    getAccountInfo();
  }, [accountProfile, curr1, curr2, sync, isSwapped]);

  // Add function to fetch latest sparkline price
  const fetchLatestSparklinePrice = async (token, setPriceFunction) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/sparkline/${token.md5}?period=24h&${token.pro24h}`
      );

      if (response.data && response.data.data && response.data.data.prices) {
        const prices = response.data.data.prices;
        if (prices.length > 0) {
          // Get the latest price (last element in the array)
          const latestPrice = prices[prices.length - 1];
          setPriceFunction(latestPrice);
        }
      }
    } catch (error) {
    }
  };

  // Fetch latest sparkline prices when tokens change
  useEffect(() => {
    if (token1 && token1.md5) {
      fetchLatestSparklinePrice(token1, setLatestPrice1);
    }
    if (token2 && token2.md5) {
      fetchLatestSparklinePrice(token2, setLatestPrice2);
    }
  }, [token1, token2]);

  useEffect(() => {
    function getTokenPrice() {
      setLoadingPrice(true);
      const md51 = token1.md5;
      const md52 = token2.md5;

      // Get dynamic exchange rates from API
      axios
        .get(`${BASE_URL}/pair_rates?md51=${md51}&md52=${md52}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            // Use the rates as they come from the API
            setTokenExch1(Number(ret.rate1) || 0);
            setTokenExch2(Number(ret.rate2) || 0);
          }
        })
        .catch((err) => {
        })
        .then(function () {
          // always executed
          setLoadingPrice(false);
        });
    }
    getTokenPrice();
  }, [token1, token2]);

  useEffect(() => {
    // Calculate when token prices change
    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    // For XRP pairs, we only need one rate. For non-XRP pairs, we need both rates.
    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0 // XRP pair: need at least one rate
        : tokenExch1 > 0 && tokenExch2 > 0; // Non-XRP pair: need both rates

    if (hasValidRates) {
      if (active === 'AMOUNT' && amount && amount !== '') {
        const newValue = calcQuantity(amount, active);
        if (newValue && newValue !== value && newValue !== '0') {
          setValue(newValue);
        }
      } else if (active === 'VALUE' && value && value !== '') {
        const newAmount = calcQuantity(value, active);
        if (newAmount && newAmount !== amount && newAmount !== '0') {
          setAmount(newAmount);
        }
      }
    }
  }, [tokenExch1, tokenExch2, revert, active]);

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
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
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
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Transaction signing rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1000);
    };

    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
      setAmount1('');
      setAmount2('');
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
        const resolved_at = res.resolved_at;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {}
      isRunning = false;
      counter--;
      if (counter <= 0) {
        setOpenScanQR(false);
      }
    }
    if (openScanQR) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openScanQR, uuid]);

  const onSwap = async () => {
    try {
      const curr1 = pair.curr1;
      const curr2 = pair.curr2;
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      let transactionData;

      if (orderType === 'limit') {
        // Use OfferCreate for limit orders
        const OfferFlags = {
          tfSell: 524288,
          tfImmediateOrCancel: 262144,
          tfFillOrKill: 131072,
          tfPassive: 65536
        };

        let TakerGets, TakerPays;

        if (revert) {
          // Selling curr2 to get curr1
          TakerGets = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount1.toString()
          };
          TakerPays = {
            currency: curr2.currency,
            issuer: curr2.issuer,
            value: amount2.toString()
          };
        } else {
          // Selling curr1 to get curr2
          TakerGets = {
            currency: curr2.currency,
            issuer: curr2.issuer,
            value: amount2.toString()
          };
          TakerPays = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount1.toString()
          };
        }

        // Convert XRP amounts to drops
        if (TakerGets.currency === 'XRP') {
          TakerGets = new Decimal(TakerGets.value).mul(1000000).toString();
        }
        if (TakerPays.currency === 'XRP') {
          TakerPays = new Decimal(TakerPays.value).mul(1000000).toString();
        }

        transactionData = {
          TransactionType: 'OfferCreate',
          Account,
          TakerGets,
          TakerPays,
          Flags: 0,
          Fee: '12',
          SourceTag: 93339333
        };
      } else {
        // Use Payment transaction for market orders
        const PaymentFlags = {
          tfPartialPayment: 131072,
          tfLimitQuality: 65536,
          tfNoDirectRipple: 1048576
        };

        const Flags = PaymentFlags.tfPartialPayment;

        let Amount, SendMax, DeliverMin;

        SendMax = {
          currency: curr1.currency,
          issuer: curr1.issuer,
          value: amount.toString()
        };
        Amount = {
          currency: curr2.currency,
          issuer: curr2.issuer,
          value: value.toString()
        };

        if (SendMax.currency === 'XRP') {
          SendMax = new Decimal(SendMax.value).mul(1000000).toString();
        }
        if (Amount.currency === 'XRP') {
          Amount = new Decimal(Amount.value).mul(1000000).toString();
        }

        // Calculate slippage amounts
        const slippageDecimal = new Decimal(slippage).div(100);

        // DeliverMin is Amount minus slippage tolerance
        if (typeof Amount === 'object') {
          DeliverMin = {
            currency: Amount.currency,
            issuer: Amount.issuer,
            value: new Decimal(Amount.value).mul(new Decimal(1).sub(slippageDecimal)).toString()
          };
        } else {
          // For XRP amounts (strings)
          DeliverMin = new Decimal(Amount).mul(new Decimal(1).sub(slippageDecimal)).toString();
        }

        transactionData = {
          TransactionType: 'Payment',
          Account,
          Destination: Account,
          Amount,
          DeliverMin,
          SendMax,
          Flags,
          Fee: '12',
          SourceTag: 93339333
        };
      }

      let memoData = `${orderType === 'limit' ? 'Limit' : 'Swap'} via https://xrpl.to`;
      transactionData.Memos = configureMemos('', '', memoData);

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          setTransactionType(orderType === 'limit' ? 'OfferCreate' : 'Payment');
          const body = {
            ...transactionData,
            user_token
          };

          const endpoint = orderType === 'limit' ? `${BASE_URL}/offer/create` : `${BASE_URL}/offer/payment`;
          const res = await axios.post(endpoint, body);

          if (res.status === 200) {
            const uuid = res.data.data.uuid;
            const qrlink = res.data.data.qrUrl;
            const nextlink = res.data.data.next;

            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }

          break;
        case 'gem':
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              dispatch(updateProcess(1));

              await submitTransaction({
                transaction: transactionData
              }).then(({ type, result }) => {
                if (type == 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setTimeout(() => {
                    setSync(sync + 1);
                    dispatch(updateProcess(0));
                  }, 1500);
                  setSwapped(!isSwapped);
                  // Clear amounts after successful swap
                  setAmount1('');
                  setAmount2('');
                } else {
                  dispatch(updateProcess(3));
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;
        case 'crossmark':
          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(transactionData).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(response.data.resp.result?.hash));
              setTimeout(() => {
                setSync(sync + 1);
                dispatch(updateProcess(0));
              }, 1500);
              setSwapped(!isSwapped);
              // Clear amounts after successful swap
              setAmount1('');
              setAmount2('');
            } else {
              dispatch(updateProcess(3));
            }
          });
          break;
      }
    } catch (err) {
      dispatch(updateProcess(0));
    }
    setLoading(false);
  };

  const onDisconnectXumm = async (uuid) => {
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
      const amt = new Decimal(amount || 0);
      if (amt.eq(0)) return '';

      const rate1 = new Decimal(tokenExch1 || 0);
      const rate2 = new Decimal(tokenExch2 || 0);

      // Check if this is an XRP pair based on actual tokens (not curr1/curr2)
      const token1IsXRP = token1?.currency === 'XRP';
      const token2IsXRP = token2?.currency === 'XRP';

      // API rates depend on token order:
      // When token1=XRP, token2=RLUSD: rate1=1, rate2=XRP per RLUSD (e.g., 2.84)
      // When token1=RLUSD, token2=XRP: rate1=XRP per RLUSD (e.g., 2.84), rate2=1
      
      let result = new Decimal(0);
      
      if (token1IsXRP && !token2IsXRP) {
        // XRP -> Token (e.g., XRP -> RLUSD)
        // rate2 = XRP per RLUSD, so divide XRP by rate2 to get RLUSD
        if (active === 'AMOUNT') {
          result = !revert ? amt.div(rate2) : amt.mul(rate2);
        } else {
          result = !revert ? amt.mul(rate2) : amt.div(rate2);
        }
      } else if (!token1IsXRP && token2IsXRP) {
        // Token -> XRP (e.g., RLUSD -> XRP)
        // rate1 = XRP per RLUSD, so multiply RLUSD by rate1 to get XRP
        if (active === 'AMOUNT') {
          result = !revert ? amt.mul(rate1) : amt.div(rate1);
        } else {
          result = !revert ? amt.div(rate1) : amt.mul(rate1);
        }
      } else {
        // Non-XRP pairs
        if (active === 'AMOUNT') {
          result = !revert ? amt.mul(rate1).div(rate2) : amt.mul(rate2).div(rate1);
        } else {
          result = !revert ? amt.mul(rate2).div(rate1) : amt.mul(rate1).div(rate2);
        }
      }
      
      if (result.isNaN() || !result.isFinite()) {
        return '';
      }
      
      return result.toFixed(6, Decimal.ROUND_DOWN);
    } catch (e) {
      return '';
    }
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm(uuid);
  };

  const handlePlaceOrder = (e) => {
    // Check if we need to create trustlines first
    if (isLoggedIn && ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))) {
      const missingCurrency = !hasTrustline1 && curr1.currency !== 'XRP' ? curr1 : curr2;
      onCreateTrustline(missingCurrency);
      return;
    }

    const fAmount1 = Number(amount1);
    const fAmount2 = Number(amount2);

    if (fAmount1 > 0 && fAmount2 > 0) {
      if (orderType === 'limit' && !limitPrice) {
        openSnackbar('Please enter a limit price!', 'error');
        return;
      }
      onSwap();
    } else {
      openSnackbar('Invalid values! Please enter amounts for both currencies.', 'error');
    }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive('AMOUNT'); // Top field is always AMOUNT

    // Calculate using token prices
    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const activeType = revert ? 'VALUE' : 'AMOUNT';
      const calculatedValue = calcQuantity(value, activeType);

      if (calculatedValue && calculatedValue !== '0') {
        setAmount2(calculatedValue);
      }
    } else if (!value || value === '') {
      setAmount2('');
    }
  };

  const handleChangeAmount2 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount2(value);
    setActive('VALUE'); // Bottom field is always VALUE

    // Calculate using token prices
    const curr1IsXRP = curr1?.currency === 'XRP';
    const curr2IsXRP = curr2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      curr1IsXRP || curr2IsXRP
        ? tokenExch1 > 0 || tokenExch2 > 0
        : tokenExch1 > 0 && tokenExch2 > 0;

    if (value && value !== '' && hasValidRates) {
      const activeType = revert ? 'AMOUNT' : 'VALUE';

      const calculatedValue = calcQuantity(value, activeType);

      if (calculatedValue && calculatedValue !== '0') {
        setAmount1(calculatedValue);
      }
    } else if (!value || value === '') {
      setAmount1('');
    }
  };

  const onChangeToken1 = (token) => {
    if (token.md5 !== token2.md5) {
      setToken1(token);
    } else {
      onRevertExchange();
    }
  };

  const onChangeToken2 = (token) => {
    if (token.md5 !== token1.md5) {
      setToken2(token);
    } else {
      onRevertExchange();
    }
  };

  const onRevertExchange = () => {
    setIsSwitching(true);

    // Store current tokens
    const tempToken1 = token1;
    const tempToken2 = token2;

    // Clear amounts immediately when switching
    setAmount1('');
    setAmount2('');

    // Switch the tokens and revert state
    setToken1(tempToken2);
    setToken2(tempToken1);
    setRevert(!revert);

    // Update the pair with switched tokens
    setPair({
      curr1: tempToken2,
      curr2: tempToken1
    });

    // Update URL with switched tokens - only if we're not loading from URL
    if (urlParsed && !isLoadingFromUrl && typeof window !== 'undefined') {
      updateUrl(tempToken2, tempToken1);
    }

    // Complete the switching animation without restoring amounts
    setTimeout(() => {
      setIsSwitching(false);
    }, 200);
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Alt + S to switch
      if (event.altKey && event.key.toLowerCase() === 's') {
        onRevertExchange();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [revert, amount1, amount2]);

  const onFillHalf = () => {
    if (revert) {
      if (accountPairBalance?.curr2.value > 0) setAmount1(accountPairBalance?.curr2.value / 2);
    } else {
      if (accountPairBalance?.curr1.value > 0) setAmount1(accountPairBalance?.curr1.value / 2);
    }
  };

  const onFillMax = () => {
    if (revert) {
      if (accountPairBalance?.curr2.value > 0) setAmount1(accountPairBalance?.curr2.value);
    } else {
      if (accountPairBalance?.curr1.value > 0) setAmount1(accountPairBalance?.curr1.value);
    }
  };

  const handleMsg = () => {
    if (isProcessing == 1) return 'Pending Exchanging';
    
    // Check for missing trustlines
    if (isLoggedIn && ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))) {
      const missingToken = !hasTrustline1 && curr1.currency !== 'XRP' 
        ? getCurrencyDisplayName(curr1.currency, token1?.name)
        : getCurrencyDisplayName(curr2.currency, token2?.name);
      return `Set Trustline for ${missingToken}`;
    }
    
    if (!amount1 || !amount2) return 'Enter an Amount';
    else if (orderType === 'limit' && !limitPrice) return 'Enter Limit Price';
    else if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    else return orderType === 'limit' ? 'Place Limit Order' : 'Exchange';
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getWalletTypeDisplay = (walletType) => {
    switch (walletType) {
      case 'xaman':
        return 'Xaman';
      case 'gem':
        return 'GemWallet';
      case 'crossmark':
        return 'Crossmark';
      default:
        return walletType || 'Unknown';
    }
  };

  const onCreateTrustline = async (currency) => {
    if (!accountProfile || !accountProfile.account) return;

    try {
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      const Flags = 0x00020000; // Standard trustline flag
      let LimitAmount = {};
      LimitAmount.issuer = currency.issuer;
      LimitAmount.currency = currency.currency;
      LimitAmount.value = '1000000000'; // Set a high trust limit

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          setTransactionType('TrustSet'); // Set correct transaction type
          const body = { LimitAmount, Flags, user_token };
          const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

          if (res.status === 200) {
            const uuid = res.data.data.uuid;
            const qrlink = res.data.data.qrUrl;
            const nextlink = res.data.data.next;

            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }
          break;

        case 'gem':
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              const trustSet = {
                flags: Flags,
                limitAmount: LimitAmount
              };

              dispatch(updateProcess(1));
              await setTrustline(trustSet).then(({ type, result }) => {
                if (type == 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setTimeout(() => {
                    setSync(sync + 1);
                  }, 1500);
                } else {
                  dispatch(updateProcess(3));
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;

        case 'crossmark':
          const trustSet = {
            Flags: Flags,
            LimitAmount: LimitAmount
          };

          dispatch(updateProcess(1));
          await sdk.methods
            .signAndSubmitAndWait({
              ...trustSet,
              Account: accountProfile.account,
              TransactionType: 'TrustSet'
            })
            .then(({ response }) => {
              if (response.data.meta.isSuccess) {
                dispatch(updateProcess(2));
                dispatch(updateTxHash(response.data.resp.result?.hash));
                setTimeout(() => {
                  setSync(sync + 1);
                }, 1500);
              } else {
                dispatch(updateProcess(3));
              }
            });
          break;
      }
    } catch (err) {
      dispatch(updateProcess(0));
      enqueueSnackbar(
        `Failed to create trustline: ${
          err.response?.data?.message || err.message || 'Unknown error'
        }`,
        { variant: 'error' }
      );
    }
    setLoading(false);
  };

  // Add URL parsing and token loading state
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [urlParsed, setUrlParsed] = useState(false);

  // Helper function to create URL-friendly currency string
  const createCurrencyUrlString = (token) => {
    if (!token) return '';

    if (token.currency === 'XRP') {
      return 'xrp';
    }

    // For other currencies, use format: CURRENCY-ISSUER
    return `${token.currency}-${token.issuer}`;
  };

  // Helper function to parse currency from URL string
  const parseCurrencyFromUrl = (currencyString) => {
    if (!currencyString) return null;

    if (currencyString.toLowerCase() === 'xrp') {
      return {
        currency: 'XRP',
        issuer: ''
      };
    }

    // Split by last dash to handle currency codes that might contain dashes
    const lastDashIndex = currencyString.lastIndexOf('-');
    if (lastDashIndex === -1) return null;

    const currency = currencyString.substring(0, lastDashIndex);
    const issuer = currencyString.substring(lastDashIndex + 1);

    return {
      currency,
      issuer
    };
  };

  // Function to update URL based on current tokens
  const updateUrl = (token1, token2) => {
    if (!token1 || !token2) return;

    const currency1String = createCurrencyUrlString(token1);
    const currency2String = createCurrencyUrlString(token2);

    if (currency1String && currency2String) {
      const newPath = `/swap/${currency1String}/${currency2String}`;
      // Only update URL if it's different from current path
      // For Next.js dynamic routes, we need to check both pathname and query
      const currentCurrency1 = router.query.currencies?.[0];
      const currentCurrency2 = router.query.currencies?.[1];

      if (currentCurrency1 !== currency1String || currentCurrency2 !== currency2String) {
        router.push(newPath, undefined, { shallow: true });
      }
    }
  };

  // Function to find token by currency and issuer
  const findTokenByCurrencyAndIssuer = async (currency, issuer) => {
    try {
      // For XRP, return a standard XRP token object
      if (currency === 'XRP') {
        return {
          currency: 'XRP',
          issuer: '',
          name: 'XRP',
          md5: '84e5efeb89c4eae8f68188982dc290d8', // Standard XRP md5
          pro24h: 'pro24h'
        };
      }

      // 1. Try main tokens endpoint with currency filter
      try {
        const tokensResponse = await axios.get(`${BASE_URL}/tokens`, {
          params: {
            filter: currency,
            limit: 100,
            start: 0,
            sortBy: 'vol24hxrp',
            sortType: 'desc'
          }
        });

        if (tokensResponse.data && tokensResponse.data.tokens) {
          const foundToken = tokensResponse.data.tokens.find(
            (token) => token.currency === currency && token.issuer === issuer
          );

          if (foundToken) {
            return foundToken;
          }
        }
      } catch (e) {
      }

      // 2. Try xrpnft tokens endpoint (used by CurrencySearchModal)
      try {
        const nftResponse = await axios.get(`${BASE_URL}/xrpnft/tokens`, {
          params: {
            filter: currency
          }
        });

        if (nftResponse.data && nftResponse.data.tokens) {
          const foundToken = nftResponse.data.tokens.find(
            (token) => token.currency === currency && token.issuer === issuer
          );

          if (foundToken) {
            return foundToken;
          }
        }
      } catch (e) {
      }

      // 3. Try direct token lookup by issuer_currency format
      try {
        const directResponse = await axios.get(`${BASE_URL}/token/${issuer}_${currency}`);

        if (directResponse.data && directResponse.data.token) {
          return directResponse.data.token;
        }
      } catch (e) {
      }

      // 4. Fallback - create basic token object
      return {
        currency,
        issuer,
        name: currency,
        md5: `${currency}_${issuer}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        pro24h: 'pro24h'
      };
    } catch (error) {
      // Return a basic token object as final fallback
      return {
        currency,
        issuer,
        name: currency,
        md5: `${currency}_${issuer}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        pro24h: 'pro24h'
      };
    }
  };

  // Function to load tokens from URL parameters
  const loadTokensFromUrl = async () => {
    const currencies = router.query.currencies;
    const currency1 = currencies?.[0];
    const currency2 = currencies?.[1];

    if (!currency1 || !currency2) {
      setUrlParsed(true);
      return;
    }

    setIsLoadingFromUrl(true);

    try {
      const parsedCurrency1 = parseCurrencyFromUrl(currency1);
      const parsedCurrency2 = parseCurrencyFromUrl(currency2);

      if (!parsedCurrency1 || !parsedCurrency2) {
        setUrlParsed(true);
        setIsLoadingFromUrl(false);
        return;
      }

      // Load both tokens
      const [token1Data, token2Data] = await Promise.all([
        findTokenByCurrencyAndIssuer(parsedCurrency1.currency, parsedCurrency1.issuer),
        findTokenByCurrencyAndIssuer(parsedCurrency2.currency, parsedCurrency2.issuer)
      ]);

      if (token1Data && token2Data) {
        // Ensure tokens are different
        if (
          token1Data.currency === token2Data.currency &&
          token1Data.issuer === token2Data.issuer
        ) {
          setUrlParsed(true);
          setIsLoadingFromUrl(false);
          return;
        }

        setToken1(token1Data);
        setToken2(token2Data);

        // Update pair
        setPair({
          curr1: token1Data,
          curr2: token2Data
        });

      }
    } catch (error) {
    }

    setUrlParsed(true);
    setIsLoadingFromUrl(false);
  };

  // Load tokens from URL on component mount
  useEffect(() => {
    if (!urlParsed && router.query.currencies) {
      loadTokensFromUrl();
    }
  }, [router.query.currencies, urlParsed]);

  // Update URL when tokens change (but not during initial URL parsing)
  useEffect(() => {
    // Only update URL when:
    // 1. URL has been parsed (not initial load from URL)
    // 2. Not currently loading from URL (not setting tokens from URL)
    // 3. Both tokens exist
    // 4. We're in a browser environment
    if (urlParsed && !isLoadingFromUrl && token1 && token2 && typeof window !== 'undefined') {
      updateUrl(token1, token2);
    }
  }, [token1, token2, urlParsed, isLoadingFromUrl]);

  // Add function to generate shareable URL
  const getShareableUrl = () => {
    if (!token1 || !token2) return '';

    const currency1String = createCurrencyUrlString(token1);
    const currency2String = createCurrencyUrlString(token2);

    if (currency1String && currency2String) {
      // Use window.location.origin in client-side context
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/swap/${currency1String}/${currency2String}`;
      }
      // Fallback for server-side rendering
      return `/swap/${currency1String}/${currency2String}`;
    }
    return '';
  };

  // Add copy to clipboard function
  const handleShareUrl = async () => {
    try {
      const shareUrl = getShareableUrl();
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        enqueueSnackbar('Swap link copied to clipboard!', { variant: 'success' });
      } else {
        enqueueSnackbar('Unable to generate share link', { variant: 'error' });
      }
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      try {
        const shareUrl = getShareableUrl();
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        enqueueSnackbar('Swap link copied to clipboard!', { variant: 'success' });
      } catch (fallbackErr) {
        enqueueSnackbar('Failed to copy link to clipboard', { variant: 'error' });
      }
    }
  };


  return (
    <Box
      sx={{ 
        width: '100%', 
        maxWidth: showOrderbook ? '1200px' : '800px', 
        margin: '0 auto', 
        px: { xs: 1, sm: 2, md: 3 },
        transition: 'max-width 0.3s ease'
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        alignItems="flex-start"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Stack sx={{ 
          width: '100%', 
          flex: showOrderbook ? '0 0 auto' : '1',
          maxWidth: showOrderbook ? '480px' : '100%',
          transition: 'all 0.3s ease' 
        }}>
        {accountProfile && accountProfile.account && (
          <WalletDisplay>
            <WalletInfo>
              <WalletIcon>
                <AccountBalanceWalletIcon fontSize="small" />
              </WalletIcon>
              <WalletDetails>
                <WalletAddress>{formatAddress(accountProfile.account)}</WalletAddress>
                <WalletType>{getWalletTypeDisplay(accountProfile.wallet_type)}</WalletType>
              </WalletDetails>
            </WalletInfo>
            <StatusIndicator />
          </WalletDisplay>
        )}

        {/* Minimalist Swap Container */}
        <Box 
          sx={{ 
            width: '100%',
            backgroundColor: 'transparent',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.04)}`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.06)}`
            }
          }}
        >
          {/* Header Bar */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              background: alpha(theme.palette.background.paper, 0.02)
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>Swap</Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={handleShareUrl}>
                  <Icon icon={shareIcon} width={18} height={18} />
                </IconButton>
                {isLoggedIn && (
                  <>
                    <Button size="small" variant="text" onClick={onFillHalf} sx={{ minWidth: '40px' }}>50%</Button>
                    <Button size="small" variant="text" onClick={onFillMax} sx={{ minWidth: '40px' }}>Max</Button>
                  </>
                )}
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* First Token with Integrated Sparkline */}
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                border: `1px solid ${focusTop ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.05)}`,
                transition: 'all 0.3s ease',
                backgroundColor: alpha(theme.palette.background.paper, 0.02),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.04),
                  borderColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              {/* Sparkline Background */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '100%',
                  opacity: 0.4,
                  pointerEvents: 'none',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)'
                }}
              >
                <LoadChart
                  url={`${BASE_URL}/sparkline/${revert ? token2.md5 : token1.md5}?period=24h&${revert ? token2.pro24h : token1.pro24h}`}
                  style={{ width: '100%', height: '100%' }}
                  showGradient={false}
                  lineWidth={1.5}
                  animation={false}
                />
              </Box>
              
              {/* Token Content */}
              <Box sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <QueryToken token={token1} onChangeToken={onChangeToken1} />
                  <Input
                    placeholder="0"
                    disableUnderline
                    value={amount1}
                    onChange={handleChangeAmount1}
                    sx={{
                      width: '45%',
                      input: {
                        textAlign: 'right',
                        fontSize: '24px',
                        fontWeight: 700,
                        padding: 0,
                        background: 'transparent',
                        color: theme.palette.text.primary,
                        '&::placeholder': {
                          color: alpha(theme.palette.text.primary, 0.3)
                        }
                      }
                    }}
                    onFocus={() => setFocusTop(true)}
                    onBlur={() => setFocusTop(false)}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {isLoggedIn && `Balance: ${revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tokenPrice1 > 0 && `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice1)}`}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Minimalist Swap Button */}
            <Box sx={{ position: 'relative', height: '24px', my: 2 }}>
              <IconButton
                onClick={onRevertExchange}
                disabled={isSwitching}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    '& svg': {
                      transform: 'rotate(180deg)'
                    }
                  },
                  '& svg': {
                    transition: 'transform 0.3s ease'
                  }
                }}
                title="Switch currencies (Alt + S)"
              >
                <Icon icon={exchangeIcon} width={18} height={18} />
              </IconButton>
            </Box>

            {/* Second Token with Integrated Sparkline */}
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                border: `1px solid ${focusBottom ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.05)}`,
                transition: 'all 0.3s ease',
                backgroundColor: alpha(theme.palette.background.paper, 0.02),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.04),
                  borderColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              {/* Sparkline Background */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '100%',
                  opacity: 0.4,
                  pointerEvents: 'none',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)'
                }}
              >
                <LoadChart
                  url={`${BASE_URL}/sparkline/${revert ? token1.md5 : token2.md5}?period=24h&${revert ? token1.pro24h : token2.pro24h}`}
                  style={{ width: '100%', height: '100%' }}
                  showGradient={false}
                  lineWidth={1.5}
                  animation={false}
                />
              </Box>
              
              {/* Token Content */}
              <Box sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <QueryToken token={token2} onChangeToken={onChangeToken2} />
                  <Input
                    placeholder="0"
                    disableUnderline
                    value={amount1 === '' ? '' : amount2}
                    onChange={handleChangeAmount2}
                    sx={{
                      width: '45%',
                      input: {
                        textAlign: 'right',
                        fontSize: '24px',
                        fontWeight: 700,
                        padding: 0,
                        background: 'transparent',
                        color: theme.palette.text.primary,
                        '&::placeholder': {
                          color: alpha(theme.palette.text.primary, 0.3)
                        }
                      }
                    }}
                    onFocus={() => setFocusBottom(true)}
                    onBlur={() => setFocusBottom(false)}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {isLoggedIn && `Balance: ${revert ? accountPairBalance?.curr1.value : accountPairBalance?.curr2.value}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tokenPrice2 > 0 && `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice2)}`}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Order Type Toggle */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Button
                  size="small"
                  variant={orderType === 'market' ? 'contained' : 'outlined'}
                  onClick={() => setOrderType('market')}
                  sx={{
                    minWidth: { xs: '80px', sm: '90px' },
                    height: { xs: '28px', sm: '32px' },
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    textTransform: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Market
                </Button>
                <Button
                  size="small"
                  variant={orderType === 'limit' ? 'contained' : 'outlined'}
                  onClick={() => setOrderType('limit')}
                  sx={{
                    minWidth: { xs: '80px', sm: '90px' },
                    height: { xs: '28px', sm: '32px' },
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    textTransform: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Limit
                </Button>
              </Stack>
            </Box>

            {/* Limit Price Input */}
            {orderType === 'limit' && (
              <Box sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Limit Price ({revert ? curr1.name : curr2.name} per {revert ? curr2.name : curr1.name})
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setShowOrderbook(!showOrderbook);
                      }}
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        textTransform: 'none',
                        color: showOrderbook ? theme.palette.primary.main : theme.palette.text.secondary,
                        backgroundColor: showOrderbook ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        border: `1px solid ${showOrderbook ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                        px: 1.5,
                        py: 0.5,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: showOrderbook 
                            ? alpha(theme.palette.primary.main, 0.2) 
                            : alpha(theme.palette.primary.main, 0.05),
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {showOrderbook ? 'Hide' : 'View'} Orderbook
                    </Button>
                  </Stack>
                  <Input
                    placeholder="0.00"
                    fullWidth
                    disableUnderline
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
                      backgroundColor: alpha(theme.palette.background.paper, 0.05),
                      borderRadius: '8px',
                      padding: '8px 12px',
                      input: {
                        fontSize: { xs: '14px', sm: '16px' },
                        fontWeight: 600
                      }
                    }}
                  />
                </Stack>
              </Box>
            )}

            {/* Minimalist Settings - Only show for market orders */}
            {orderType !== 'limit' && (
              <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.background.paper, 0.03),
                border: `1px solid ${alpha(theme.palette.divider, 0.03)}`
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Slippage
                  </Typography>
                  <Tooltip title="Maximum price movement you're willing to accept" arrow>
                    <Icon
                      icon={infoFill}
                      width={16}
                      height={16}
                      style={{
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.5)',
                        cursor: 'help'
                      }}
                    />
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {[1, 3, 5].map((preset) => (
                    <Button
                      key={preset}
                      size="small"
                      variant={slippage === preset ? 'contained' : 'text'}
                      onClick={() => setSlippage(preset)}
                      sx={{
                        minWidth: '32px',
                        height: '28px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        ...(slippage === preset
                          ? {
                              background: theme.palette.primary.main,
                              color: 'white',
                              '&:hover': {
                                background: theme.palette.primary.dark
                              }
                            }
                          : {
                              color:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.7)'
                                  : 'rgba(0,0,0,0.7)',
                              '&:hover': {
                                background:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.04)'
                              }
                            })
                      }}
                    >
                      {preset}%
                    </Button>
                  ))}
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Input
                      value={slippage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (
                          val === '' ||
                          (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 50)
                        ) {
                          setSlippage(val === '' ? 0 : parseFloat(val));
                        }
                      }}
                      disableUnderline
                      sx={{
                        width: { xs: '45px', sm: '55px' },
                        input: {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: { xs: '4px 6px', sm: '6px 8px' },
                          border: `1px solid ${
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'rgba(0, 0, 0, 0.2)'
                          }`,
                          borderRadius: '6px',
                          background:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                          color: theme.palette.mode === 'dark' ? 'white' : 'black',
                          '&:focus': {
                            borderColor: theme.palette.primary.main,
                            outline: 'none'
                          }
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.7)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 500
                      }}
                    >
                      %
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            )}

            {/* Conversion Rate Display */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.background.paper, 0.03),
                  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                }}
              >
                {loadingPrice ? (
                  <ClipLoader color={theme.palette.primary.main} size={16} />
                ) : (
                  <>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      1 {token1.name} = 
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {(() => {
                        // Show conversion rate from token1 to token2
                        const token1IsXRP = token1?.currency === 'XRP';
                        const token2IsXRP = token2?.currency === 'XRP';
                        
                        if (token1IsXRP && !token2IsXRP) {
                          // XRP -> Token: 1 XRP = 1/rate2 Token
                          return tokenExch2 > 0 ? (1 / tokenExch2).toFixed(6) : '0';
                        } else if (!token1IsXRP && token2IsXRP) {
                          // Token -> XRP: 1 Token = rate1 XRP
                          return tokenExch1 > 0 ? tokenExch1.toFixed(6) : '0';
                        } else {
                          // Non-XRP pairs
                          return tokenExch1 > 0 && tokenExch2 > 0 ? (tokenExch1 / tokenExch2).toFixed(6) : '0';
                        }
                      })()} {token2.name}
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>

            {/* Price Impact Row */}
            {amount1 && amount2 && (
              <Box 
                sx={{ 
                  mt: 1,
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: alpha(
                    getPriceImpactColor(Math.abs(priceImpact)), 
                    0.08
                  ),
                  border: `1px solid ${alpha(
                    getPriceImpactColor(Math.abs(priceImpact)), 
                    0.2
                  )}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: '100%' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getPriceImpactColor(Math.abs(priceImpact)),
                        animation: Math.abs(priceImpact) > 3 ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': {
                            opacity: 1,
                            transform: 'scale(1)'
                          },
                          '50%': {
                            opacity: 0.5,
                            transform: 'scale(1.2)'
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'scale(1)'
                          }
                        }
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Price Impact
                    </Typography>
                  </Stack>
                  
                  {loadingPrice ? (
                    <ClipLoader color={getPriceImpactColor(0)} size={14} />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        sx={{
                          color: getPriceImpactColor(Math.abs(priceImpact)),
                          fontWeight: 700,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {priceImpact > 0 ? '+' : ''}{priceImpact}%
                      </Typography>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: '6px',
                          backgroundColor: alpha(
                            getPriceImpactColor(Math.abs(priceImpact)), 
                            0.15
                          ),
                          border: `1px solid ${alpha(
                            getPriceImpactColor(Math.abs(priceImpact)), 
                            0.3
                          )}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: getPriceImpactColor(Math.abs(priceImpact)),
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {getPriceImpactSeverity(Math.abs(priceImpact))}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Stack>

                {/* Warning message for high impact */}
                {Math.abs(priceImpact) > 5 && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: getPriceImpactColor(Math.abs(priceImpact)),
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.4
                    }}
                  >
                    {Math.abs(priceImpact) > 10 
                      ? '⚠️ Very high price impact! Consider reducing your trade size.'
                      : 'High price impact. You may receive less than expected.'}
                  </Typography>
                )}
              </Box>
            )}

            {/* Action Button */}
            <Box sx={{ mt: 3 }}>

              {accountProfile && accountProfile.account ? (
                <ExchangeButton
                  variant="contained"
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={
                    isProcessing == 1 || 
                    (!isLoggedIn) ||
                    (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                  }
                  sx={{
                    minHeight: '52px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  {handleMsg()}
                </ExchangeButton>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    '& .MuiButton-root': {
                      width: '100% !important',
                      minWidth: '100% !important',
                      padding: '14px 24px !important',
                      minHeight: '52px !important',
                      fontSize: '16px !important',
                      borderRadius: '12px !important',
                      textTransform: 'none !important'
                    }
                  }}
                >
                  <ConnectWallet pair={pair} />
                </Box>
              )}
            </Box>
          </Box>
        </Box>


        <QRDialog
          open={openScanQR}
          type={transactionType}
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />

      </Stack>

      {/* Orderbook Side Panel */}
      {showOrderbook && (
        <Box
          sx={{
            width: { xs: '100%', md: '400px' },
            flex: { md: '0 0 400px' },
            backgroundColor: 'transparent',
            backdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.04)}`,
            overflow: 'hidden',
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: {
                opacity: 0,
                transform: 'translateX(20px)'
              },
              to: {
                opacity: 1,
                transform: 'translateX(0)'
              }
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              background: alpha(theme.palette.background.paper, 0.02)
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, color: theme.palette.text.primary }}>
              Orderbook
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                {curr1.name}/{curr2.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowOrderbook(false)}
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.active, 0.08)
                  }
                }}
              >
                <Icon icon="mdi:close" width={18} height={18} />
              </IconButton>
            </Stack>
          </Box>
          
          <Box sx={{ 
            height: { xs: '400px', md: 'calc(100vh - 300px)' }, 
            maxHeight: '700px',
            overflow: 'auto',
            backgroundColor: alpha(theme.palette.background.default, 0.01)
          }}>
            {/* Use props data directly if local state is empty */}
            <OrderBook
              pair={{
                curr1: { ...curr1, name: curr1.name || curr1.currency },
                curr2: { ...curr2, name: curr2.name || curr2.currency }
              }}
              asks={(asks && asks.length > 0) ? asks : (propsAsks || [])}
              bids={(bids && bids.length > 0) ? bids : (propsBids || [])}
              limitPrice={orderType === 'limit' ? parseFloat(limitPrice) : null}
              isBuyOrder={!revert} // true when buying curr2 with curr1
              onAskClick={(e, idx) => {
                const orderbookAsks = (asks && asks.length > 0) ? asks : (propsAsks || []);
                if (orderbookAsks && orderbookAsks[idx]) {
                  setLimitPrice(orderbookAsks[idx].price.toString());
                }
              }}
              onBidClick={(e, idx) => {
                const orderbookBids = (bids && bids.length > 0) ? bids : (propsBids || []);
                if (orderbookBids && orderbookBids[idx]) {
                  setLimitPrice(orderbookBids[idx].price.toString());
                }
              }}
            />
          </Box>
        </Box>
      )}
      </Stack>
    </Box>
  );
}
