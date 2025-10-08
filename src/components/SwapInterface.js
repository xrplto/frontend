import axios from 'axios';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import Decimal from 'decimal.js-light';

// Set Decimal precision immediately after import
Decimal.set({ precision: 50 });

// Lazy load heavy components
const Sparkline = dynamic(() => import('src/components/Sparkline'), {
  loading: () => <div style={{ height: 300 }}>Loading chart...</div>,
  ssr: false
});

import { ClipLoader } from './Spinners';

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
  Tooltip,
  Slide,
  TextField,
  InputAdornment,
  Avatar,
  Skeleton,
  Chip,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

// Material UI Icons
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoIcon from '@mui/icons-material/Info';
import ShareIcon from '@mui/icons-material/Share';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ListIcon from '@mui/icons-material/List';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';

// Components
import Wallet from 'src/components/Wallet';

const QRDialog = () => null;
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const BASE_URL = 'https://api.xrpl.to/api';
import Image from 'next/image';
import { enqueueSnackbar } from 'notistack';
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
// Commented out missing components - these files don't exist
// const Orders = dynamic(() => import('src/TokenDetail/trade/account/Orders'), {
//   loading: () => <div>Loading orders...</div>,
//   ssr: false
// });
// // Orderbook / Tx details side panel (used in orderbook mode)
// const TransactionDetailsPanel = dynamic(
//   () => import('src/TokenDetail/common/TransactionDetailsPanel'),
//   { ssr: false }
// );

// Router
import { useRouter } from 'next/router';

const ExchangeButton = memo(
  styled(Button)(
    ({ theme }) => `
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: ${theme.palette.primary.main};
    color: white;
    border: none;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    &:hover:not(:disabled) {
      background: ${theme.palette.primary.dark};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${alpha(theme.palette.primary.main, 0.25)};
      
      &::after {
        width: 250px;
        height: 250px;
      }
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:disabled {
      background: ${alpha(theme.palette.action.disabled, 0.12)};
      color: ${theme.palette.action.disabled};
      cursor: not-allowed;
    }
    
    @media (max-width: 600px) {
      padding: 10px 14px;
      font-size: 13px;
    }
`
  )
);

const AllowButton = memo(
  styled(Button)(
    ({ theme }) => `
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: none;
    transition: all 0.2s ease;
    background: ${alpha(theme.palette.primary.main, 0.1)};
    color: ${theme.palette.primary.main};
    border: 1px solid ${alpha(theme.palette.primary.main, 0.2)};
    
    &:hover {
      background: ${alpha(theme.palette.primary.main, 0.15)};
      border-color: ${theme.palette.primary.main};
      transform: scale(1.02);
    }
`
  )
);

const ToggleButton = memo(
  styled(IconButton)(
    ({ theme }) => `
    background: ${theme.palette.background.paper};
    border: 1px solid ${alpha(theme.palette.divider, 0.12)};
    width: 28px;
    height: 28px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 1px 4px ${alpha(theme.palette.common.black, 0.08)};
    
    &:hover {
      background: ${theme.palette.primary.main};
      border-color: ${theme.palette.primary.main};
      transform: translate(-50%, -50%) rotate(180deg) scale(1.05);
      box-shadow: 0 2px 8px ${alpha(theme.palette.primary.main, 0.25)};
      
      svg {
        color: white;
      }
    }

    &.switching {
      transform: translate(-50%, -50%) rotate(180deg);
    }
`
  )
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

const WalletDisplay = memo(
  styled('div')(
    ({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: ${alpha(theme.palette.success.main, 0.05)};
    border: 1px solid ${alpha(theme.palette.success.main, 0.15)};
    transition: all 0.3s ease;
    
    &:hover {
      background: ${alpha(theme.palette.success.main, 0.08)};
      border-color: ${alpha(theme.palette.success.main, 0.25)};
    }
    
    @media (max-width: 600px) {
      padding: 6px 8px;
      margin-bottom: 6px;
    }
`
  )
);

const WalletInfo = styled('div')(
  ({ theme }) => `
    display: flex;
    align-items: center;
    gap: 8px;
`
);

const WalletIcon = styled('div')(
  ({ theme }) => `
    width: 24px;
    height: 24px;
    border-radius: 6px;
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
    gap: 0;
`
);

const WalletAddress = styled(Typography)(
  ({ theme }) => `
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    color: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    line-height: 1.2;
    
    @media (max-width: 600px) {
      font-size: 0.7rem;
    }
`
);

const WalletType = styled(Typography)(
  ({ theme }) => `
    font-size: 0.65rem;
    color: ${theme.palette.success.main};
    font-weight: 500;
    text-transform: capitalize;
    line-height: 1.2;
`
);

const StatusIndicator = styled('div')(
  ({ theme }) => `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${theme.palette.success.main};
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0.7)};
      }
      70% {
        box-shadow: 0 0 0 3px ${alpha(theme.palette.success.main, 0)};
      }
      100% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0)};
      }
    }
`
);

// Token Selector Components
const MAX_RECENT_SEARCHES = 6;

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.divider, 0.1)
      : alpha(theme.palette.divider, 0.08)
  }`,
  transition: 'all 0.3s ease'
}));

const SelectTokenButton = styled(Stack)(({ theme }) => ({
  padding: '6px 10px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backdropFilter: 'blur(10px)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.7),
    borderColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'scale(1.02)',
    '& .arrow-icon': {
      color: theme.palette.primary.main
    }
  },
  '&:active': {
    transform: 'scale(0.98)'
  }
}));

const PanelContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '400px',
  maxHeight: '70vh',
  backgroundColor: alpha(theme.palette.background.paper, 0.98),
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.12)}`,
  backdropFilter: 'blur(20px)'
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  background: alpha(theme.palette.background.paper, 0.02)
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.default, 0.02),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.divider, 0.2),
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.divider, 0.3)
    }
  }
}));

const TokenCard = styled(Box)(({ theme }) => ({
  padding: '8px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateX(4px)'
  },
  '&:active': {
    transform: 'translateX(0)'
  }
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.7rem',
  height: 24,
  transition: 'all 0.2s ease',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'scale(1.05)',
    borderColor: theme.palette.primary.main
  },
  '& .MuiChip-label': {
    paddingLeft: '8px',
    paddingRight: '8px'
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.25)
}));

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

function Swap({ pair, setPair, revert, setRevert, bids: propsBids, asks: propsAsks }) {
  const theme = useTheme();
  const router = useRouter();

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const curr1 = pair?.curr1;
  const curr2 = pair?.curr2;

  const { accountProfile, darkMode, setLoading, sync, setSync, openSnackbar, activeFiatCurrency } =
    useContext(AppContext);


  const [token1, setToken1] = useState(curr1);
  const [token2, setToken2] = useState(curr2);

  const [amount1, setAmount1] = useState(''); // XRP
  const [amount2, setAmount2] = useState(''); // Token

  const [tokenExch1, setTokenExch1] = useState(0);
  const [tokenExch2, setTokenExch2] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);

  const [active, setActive] = useState('AMOUNT');

  const [accountPairBalance, setAccountPairBalance] = useState(null);

  const [focusTop, setFocusTop] = useState(false);
  const [focusBottom, setFocusBottom] = useState(false);

  const [isSwitching, setIsSwitching] = useState(false);
  const [trustlines, setTrustlines] = useState([]);
  const [hasTrustline1, setHasTrustline1] = useState(true);
  const [hasTrustline2, setHasTrustline2] = useState(true);
  const [transactionType, setTransactionType] = useState('');

  // Add slippage state
  const [slippage, setSlippage] = useState(3); // Default 3% slippage
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('never'); // 'never', '1h', '24h', '7d', '30d', 'custom'
  const [customExpiry, setCustomExpiry] = useState(24); // hours for custom expiry

  // Add state for latest sparkline prices
  const [latestPrice1, setLatestPrice1] = useState(null);
  const [latestPrice2, setLatestPrice2] = useState(null);

  // Add state for orderbook modal
  const [showOrderbook, setShowOrderbook] = useState(false);
  // Add state for showing user orders
  const [showOrders, setShowOrders] = useState(false);
  // Add state for order summary collapse
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Use orderbook data from props
  const bids = propsBids || [];
  const asks = propsAsks || [];

  // Token Selector Panel states
  const [panel1Open, setPanel1Open] = useState(false);
  const [panel2Open, setPanel2Open] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectorTokens, setSelectorTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [recentTokens, setRecentTokens] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);

  // Categories will be populated from API
  const [categories, setCategories] = useState([]);
  const [apiTags, setApiTags] = useState([]);

  // URL parsing and token loading state
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [urlParsed, setUrlParsed] = useState(false);

  const amount = revert ? amount2 : amount1;
  let value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;
  const curr1IsXRP = curr1?.currency === 'XRP';
  const curr2IsXRP = curr2?.currency === 'XRP';

  // Helper function to calculate token price in fiat
  const calculateTokenPrice = useCallback(
    (token, otherToken, amount, tokenExch, activeFiatCurrency, metrics) => {
      try {
        const tokenIsXRP = token?.currency === 'XRP';
        const otherTokenIsXRP = otherToken?.currency === 'XRP';
        const tokenIsRLUSD = token?.currency === 'RLUSD' || token?.name === 'RLUSD';

        if (activeFiatCurrency === 'XRP') {
          // When display currency is XRP, show XRP value
          if (tokenIsXRP) {
            return new Decimal(amount || 0).toNumber();
          } else if (otherTokenIsXRP && tokenExch > 0) {
            return new Decimal(amount || 0).mul(tokenExch).toNumber();
          } else {
            return 0;
          }
        } else {
          // For other fiat currencies (USD, EUR, etc.)
          if (tokenIsXRP) {
            return new Decimal(amount || 0).div(metrics[activeFiatCurrency] || 1).toNumber();
          } else if (otherTokenIsXRP && tokenIsRLUSD) {
            if (activeFiatCurrency === 'USD') {
              return new Decimal(amount || 0).toNumber();
            } else {
              const usdValue = new Decimal(amount || 0);
              const usdToXrp = new Decimal(metrics['USD'] || 1);
              const targetToXrp = new Decimal(metrics[activeFiatCurrency] || 1);
              return usdValue.mul(usdToXrp).div(targetToXrp).toNumber();
            }
          } else if (otherTokenIsXRP) {
            const xrpValue = new Decimal(amount || 0).mul(tokenExch || 0);
            return xrpValue.div(metrics[activeFiatCurrency] || 1).toNumber();
          } else {
            return new Decimal(tokenExch || 0)
              .mul(amount || 0)
              .div(metrics[activeFiatCurrency] || 1)
              .toNumber();
          }
        }
      } catch (e) {
        return 0;
      }
    },
    []
  );

  const tokenPrice1 = useMemo(
    () => calculateTokenPrice(token1, token2, amount1, tokenExch1, activeFiatCurrency, metrics),
    [calculateTokenPrice, token1, token2, amount1, tokenExch1, activeFiatCurrency, metrics]
  );

  const tokenPrice2 = useMemo(
    () => calculateTokenPrice(token2, token1, amount2, tokenExch2, activeFiatCurrency, metrics),
    [calculateTokenPrice, token2, token1, amount2, tokenExch2, activeFiatCurrency, metrics]
  );

  const inputPrice = revert ? tokenPrice2 : tokenPrice1;
  const outputPrice = revert ? tokenPrice1 : tokenPrice2;
  const priceImpact = useMemo(() => {
    if (inputPrice <= 0) return 0;

    const result = new Decimal(outputPrice).sub(inputPrice).mul(100).div(inputPrice).toNumber();

    // Round to 2 decimal places
    return Math.round(result * 100) / 100;
  }, [inputPrice, outputPrice]);

  // Helper function to format token price for charts
  const formatTokenPrice = useCallback(
    (token, otherToken, tokenExch, latestPrice) => {
      if (token.currency === 'XRP') {
        return `$${fNumber(latestPrice || token.exch || tokenExch)}`;
      }

      // Special handling for RLUSD when paired with XRP
      if ((token.currency === 'RLUSD' || token.name === 'RLUSD') && otherToken.currency === 'XRP') {
        let price = Number(tokenExch);
        if (isNaN(price) || price === 0) {
          // Try calculating from other token exchange rate
          const otherExch = token === token1 ? tokenExch2 : tokenExch1;
          price = otherExch > 0 ? 1 / otherExch : 0;
        }
        if (price > 0) {
          return `${price.toFixed(4)} XRP`;
        }
      }

      // Use token.exch first, then tokenExch, then latestPrice
      let price = Number(token.exch || tokenExch || latestPrice);
      if (isNaN(price) || price === 0) return '0 XRP';

      // Format based on size
      if (price >= 1) {
        return `${price.toFixed(4)} XRP`;
      }

      // Handle scientific notation for small numbers
      const priceStr = price.toString();
      if (priceStr.includes('e')) {
        const exponent = parseInt(priceStr.split('e')[1]);
        const decimalPlaces = Math.abs(exponent) + 4;
        const formattedPrice = price.toFixed(Math.min(decimalPlaces, 20));
        return `${formattedPrice.replace(/\.?0+$/, '')} XRP`;
      }

      // Regular small numbers
      if (price >= 0.01) return `${price.toFixed(6)} XRP`;
      if (price >= 0.0001) return `${price.toFixed(8)} XRP`;
      if (price >= 0.000001) return `${price.toFixed(10)} XRP`;
      return `${price.toFixed(15).replace(/\.?0+$/, '')} XRP`;
    },
    [token1, token2, tokenExch1, tokenExch2]
  );

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
    // Note: hasTrustline1/2 correspond to curr1/2 from the pair, not token1/2
    // But for error messages, we want to show what the user sees (token1/2)
    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, curr1?.name);
      errMsg = `No trustline for ${displayName}`;
    } else if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, curr2?.name);
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
        .catch((err) => {});

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
        })
        .catch((err) => {});
    }

    getAccountInfo();
  }, [accountProfile, curr1, curr2, sync, isSwapped]);

  // Add function to fetch latest sparkline price
  const fetchLatestSparklinePrice = async (token, setPriceFunction) => {
    try {
      const response = await axios.get(`${BASE_URL}/sparkline/${token.md5}?period=24h`);

      if (response.data && response.data.data && response.data.data.prices) {
        const prices = response.data.data.prices;
        if (prices.length > 0) {
          // Get the latest price (last element in the array)
          const latestPrice = prices[prices.length - 1];
          setPriceFunction(latestPrice);
        }
      }
    } catch (error) {}
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
      // Check if tokens have required md5 properties
      if (!token1?.md5 || !token2?.md5) {
        return;
      }

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
        .catch((err) => {})
        .catch(() => {
          // Silently handle errors
        });
    }

    // Only call if both tokens exist
    if (token1 && token2) {
      getTokenPrice();
    }
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

  // Transaction result polling - disabled until ret variable is properly connected
  // This useEffect was checking transaction status but ret is not defined
  /*
  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
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
      setAmount1('');
      setAmount2('');
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
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
        clearInterval(timer);
      }
    }

    if (ret && ret.data && ret.data.data) {
      timer = setInterval(getPayload, 2000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (dispatchTimer) {
        clearInterval(dispatchTimer);
      }
    };
  }, [ret]);
  */

  const onSwap = async () => {
    try {
      // IMPORTANT FIX: The UI always shows:
      // - Top field (amount1): What you pay
      // - Bottom field (amount2): What you receive
      // But when revert=false, the displayed tokens are token1/token2
      // When revert=true, the displayed tokens are actually swapped internally

      // We should always use what the user sees in the UI
      const swapCurr1 = token1; // Top field token ("You pay")
      const swapCurr2 = token2; // Bottom field token ("You receive")
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

        // For limit orders, recalculate amount2 based on the limit price
        let limitAmount2;
        if (limitPrice && amount1) {
          const limitPriceDecimal = new Decimal(limitPrice);
          const amount1Decimal = new Decimal(amount1);

          // Determine which direction to calculate based on currencies
          if (swapCurr1.currency === 'XRP' && swapCurr2.currency !== 'XRP') {
            // XRP -> Token: multiply XRP amount by limit price (Token per XRP)
            // If limit price is "3.06 RLUSD per XRP", then 1 XRP * 3.06 = 3.06 RLUSD
            limitAmount2 = amount1Decimal.mul(limitPriceDecimal).toFixed(6);
          } else if (swapCurr1.currency !== 'XRP' && swapCurr2.currency === 'XRP') {
            // Token -> XRP: divide token amount by limit price (Token per XRP)
            // If limit price is "3.06 RLUSD per XRP", then to get XRP: RLUSD amount / 3.06
            limitAmount2 = amount1Decimal.div(limitPriceDecimal).toFixed(6);
          } else {
            // Non-XRP pair: use limit price as direct exchange rate
            limitAmount2 = amount1Decimal.mul(limitPriceDecimal).toFixed(6);
          }
        } else {
          // Fallback to calculated amount2 if no limit price
          limitAmount2 = amount2;
        }

        if (revert) {
          // Selling curr2 to get curr1
          TakerGets = {
            currency: swapCurr1.currency,
            issuer: swapCurr1.issuer,
            value: amount1.toString()
          };
          TakerPays = {
            currency: swapCurr2.currency,
            issuer: swapCurr2.issuer,
            value: limitAmount2.toString()
          };
        } else {
          // Selling curr1 to get curr2
          TakerGets = {
            currency: swapCurr2.currency,
            issuer: swapCurr2.issuer,
            value: limitAmount2.toString()
          };
          TakerPays = {
            currency: swapCurr1.currency,
            issuer: swapCurr1.issuer,
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

        // Calculate expiration if not "never"
        let expiration = null;
        if (orderExpiry !== 'never') {
          // XRPL uses Ripple Epoch (Jan 1, 2000 00:00 UTC)
          const RIPPLE_EPOCH = 946684800;
          const now = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;

          let expiryHours = 0;
          switch (orderExpiry) {
            case '1h':
              expiryHours = 1;
              break;
            case '24h':
              expiryHours = 24;
              break;
            case '7d':
              expiryHours = 24 * 7;
              break;
            case '30d':
              expiryHours = 24 * 30;
              break;
            case 'custom':
              expiryHours = customExpiry;
              break;
          }

          if (expiryHours > 0) {
            expiration = now + expiryHours * 60 * 60;
          }
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

        // Add expiration if set
        if (expiration) {
          transactionData.Expiration = expiration;
        }
      } else {
        // Use Payment transaction for market orders
        const PaymentFlags = {
          tfPartialPayment: 131072,
          tfLimitQuality: 65536,
          tfNoDirectRipple: 1048576
        };

        const Flags = PaymentFlags.tfPartialPayment;

        let Amount, SendMax, DeliverMin;

        // IMPORTANT: In XRPL Payment transactions:
        // - SendMax = what you're willing to spend (input)
        // - Amount = what you want to receive (output)
        //
        // The UI shows: Top field (amount1) -> Bottom field (amount2)
        // This means: Spend amount1 of curr1 to get amount2 of curr2

        // Always: Send from top field (curr1/amount1), Receive in bottom field (curr2/amount2)
        const sendCurrency = swapCurr1;
        const receiveCurrency = swapCurr2;
        const sendAmount = amount1;
        const receiveAmount = amount2;

        // Check if we're selling 100% of the balance
        const accountBalance = revert
          ? accountPairBalance?.curr2?.value
          : accountPairBalance?.curr1?.value;
        const isSelling100Percent = accountBalance && sendAmount === accountBalance.toString();

        // Build SendMax (what we're spending) - handle XRP special case
        if (sendCurrency.currency === 'XRP') {
          SendMax = new Decimal(sendAmount).mul(1000000).toFixed(0, 1); // Convert to drops
        } else {
          SendMax = {
            currency: sendCurrency.currency,
            issuer: sendCurrency.issuer,
            // For 100% sells, use more precision to ensure all tokens are sold
            value: isSelling100Percent
              ? sendAmount // Use exact balance string
              : new Decimal(sendAmount).toFixed(6, 1) // Use safe precision for XRPL
          };
        }

        // Build Amount (what we want to receive) - handle XRP special case
        if (receiveCurrency.currency === 'XRP') {
          Amount = new Decimal(receiveAmount).mul(1000000).toFixed(0, 1); // Convert to drops
        } else {
          Amount = {
            currency: receiveCurrency.currency,
            issuer: receiveCurrency.issuer,
            value: new Decimal(receiveAmount).toFixed(6, 1) // Use safe precision for XRPL
          };
        }

        // XRP conversion already handled above

        // Calculate slippage amounts
        const slippageDecimal = new Decimal(slippage).div(100);

        // DeliverMin is Amount minus slippage tolerance
        if (typeof Amount === 'object') {
          DeliverMin = {
            currency: Amount.currency,
            issuer: Amount.issuer,
            value: new Decimal(receiveAmount).mul(new Decimal(1).sub(slippageDecimal)).toFixed(6, 1) // Safe precision for XRPL
          };
        } else {
          // For XRP amounts (strings) - Amount is already in drops
          DeliverMin = new Decimal(Amount).mul(new Decimal(1).sub(slippageDecimal)).toFixed(0, 1);
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
          SourceTag: 20221212
        };
      }

      let memoData = `${orderType === 'limit' ? 'Limit' : 'Swap'} via https://xrpl.to`;
      transactionData.Memos = configureMemos('', '', memoData);

      switch (wallet_type) {
      }
    } catch (err) {
      dispatch(updateProcess(0));
    }
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

      // Check if result is valid - use toString and check for invalid values
      const resultStr = result.toString();
      if (resultStr === 'NaN' || resultStr === 'Infinity' || resultStr === '-Infinity') {
        return '';
      }

      // Use safe precision for XRPL (max 16 significant digits total)
      const finalValue = result.toFixed(6, 1);
      return finalValue;
    } catch (e) {
      return '';
    }
  };

  const handleScanQRClose = () => {
  };

  const handlePlaceOrder = (e) => {
    // Check if we need to create trustlines first
    if (
      isLoggedIn &&
      ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))
    ) {
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

    if (value === '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive('AMOUNT'); // Top field is always AMOUNT

    // Calculate using token prices - use token1/token2, not curr1/curr2
    const token1IsXRP = token1?.currency === 'XRP';
    const token2IsXRP = token2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      token1IsXRP || token2IsXRP
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

    if (value === '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount2(value);
    setActive('VALUE'); // Bottom field is always VALUE

    // Calculate using token prices - use token1/token2, not curr1/curr2
    const token1IsXRP = token1?.currency === 'XRP';
    const token2IsXRP = token2?.currency === 'XRP';

    // Check if we have valid rates for calculation
    const hasValidRates =
      token1IsXRP || token2IsXRP
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

  const onRevertExchange = useCallback(() => {
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
      // Inline URL update to avoid dependency issues
      if (tempToken2 && tempToken1) {
        const createUrlString = (token) => {
          if (!token) return '';
          if (token.currency === 'XRP') return 'xrp';
          return `${token.currency}-${token.issuer}`;
        };

        const currency1String = createUrlString(tempToken2);
        const currency2String = createUrlString(tempToken1);

        if (currency1String && currency2String) {
          const newPath = `/swap/${currency1String}/${currency2String}`;
          const currentCurrency1 = router.query.currencies?.[0];
          const currentCurrency2 = router.query.currencies?.[1];

          if (currentCurrency1 !== currency1String || currentCurrency2 !== currency2String) {
            router.push(newPath, undefined, { shallow: true });
          }
        }
      }
    }

    // Complete the switching animation without restoring amounts
    setTimeout(() => {
      setIsSwitching(false);
    }, 200);
  }, [token1, token2, revert, urlParsed, isLoadingFromUrl, router]);

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
  }, [onRevertExchange]);

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Exchanging';

    // Check for missing trustlines
    if (
      isLoggedIn &&
      ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))
    ) {
      const missingToken =
        !hasTrustline1 && curr1.currency !== 'XRP'
          ? getCurrencyDisplayName(curr1.currency, curr1?.name)
          : getCurrencyDisplayName(curr2.currency, curr2?.name);
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
      case 'device':
        return 'Passkeys Authentication';
      default:
        return 'Unknown';
    }
  };

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
  const updateUrl = useCallback(
    (token1, token2) => {
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
    },
    [router]
  );

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
      } catch (e) {}

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
      } catch (e) {}

      // 3. Try direct token lookup by issuer_currency format
      try {
        const directResponse = await axios.get(`${BASE_URL}/token/${issuer}_${currency}`);

        if (directResponse.data && directResponse.data.token) {
          return directResponse.data.token;
        }
      } catch (e) {}

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
    } catch (error) {}

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

  // Fetch categories from API on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch tags from API
        const tagsRes = await axios.get(`${BASE_URL}/tags`);
        if (tagsRes.status === 200 && tagsRes.data) {
          setApiTags(tagsRes.data);

          // Build categories from API response
          const dynamicCategories = [
            { value: 'all', label: 'All Tokens' },
            { value: 'trending', label: 'Trending' },
            { value: 'spotlight', label: 'Spotlight' },
            { value: 'new', label: 'New' },
            { value: 'gainers-24h', label: 'Gainers 24h' },
            { value: 'most-viewed', label: 'Most Viewed' }
          ];

          // Add tag-based categories from API
          if (tagsRes.data && Array.isArray(tagsRes.data)) {
            tagsRes.data.forEach((tag) => {
              dynamicCategories.push({
                value: tag,
                label: tag
              });
            });
          }

          setCategories(dynamicCategories);
        }
      } catch (err) {
        // Set basic categories as fallback
        setCategories([
          { value: 'all', label: 'All Tokens' },
          { value: 'trending', label: 'Trending' }
        ]);
      }
    };

    fetchCategories();
  }, []);

  // Token Selector Functions
  useEffect(() => {
    if (panel1Open || panel2Open) {
      loadTokensForSelector();
      loadRecentTokens();
      // Focus search after animation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
    } else {
      // Reset state when closing
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [panel1Open, panel2Open]);

  useEffect(() => {
    filterSelectorTokens();
  }, [searchQuery, selectorTokens, selectedCategory]);

  const loadTokensForSelector = async () => {
    if (loadingTokens) return;
    setLoadingTokens(true);
    try {
      // Use the same endpoint that provides marketcap data
      const res = await axios.get(
        `${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=`
      );
      if (res.status === 200 && res.data) {
        const tokenList = res.data.tokens || [];
        // Add XRP token with full data
        const xrpToken = {
          md5: '84e5efeb89c4eae8f68188982dc290d8',
          name: 'XRP',
          user: 'XRP',
          issuer: 'XRPL',
          currency: 'XRP',
          ext: 'png',
          isOMCF: 'yes',
          marketcap: 0, // XRP marketcap is not relevant here
          vol24hxrp: 0,
          exch: 1
        };
        setSelectorTokens([xrpToken, ...tokenList]);
      }
    } catch (err) {
      // Still include XRP even on error
      const xrpToken = {
        md5: '84e5efeb89c4eae8f68188982dc290d8',
        name: 'XRP',
        user: 'XRP',
        issuer: 'XRPL',
        currency: 'XRP',
        ext: 'png',
        isOMCF: 'yes',
        marketcap: 0,
        vol24hxrp: 0,
        exch: 1
      };
      setSelectorTokens([xrpToken]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadRecentTokens = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentTokens') || '[]');
      setRecentTokens(recent.slice(0, MAX_RECENT_SEARCHES));
    } catch (e) {
      setRecentTokens([]);
    }
  };

  const filterSelectorTokens = async () => {
    // If searching, apply search filter on current tokens
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      let filtered = selectorTokens.filter(
        (token) =>
          token.name?.toLowerCase().includes(query) ||
          token.currency?.toLowerCase().includes(query) ||
          token.user?.toLowerCase().includes(query)
      );

      // Also search via API for more results
      if (searchQuery.length > 2) {
        try {
          const res = await axios.get(
            `${BASE_URL}/tokens?filter=${encodeURIComponent(searchQuery)}&limit=50`
          );
          if (res.status === 200 && res.data?.tokens) {
            const remoteTokens = res.data.tokens || [];
            const existingMd5s = new Set(filtered.map((t) => t.md5));
            remoteTokens.forEach((rt) => {
              if (!existingMd5s.has(rt.md5)) {
                filtered.push(rt);
              }
            });
          }
        } catch (err) {}
      }

      setFilteredTokens(filtered);
      return;
    }

    // For categories, fetch from appropriate API endpoint
    if (selectedCategory && selectedCategory !== 'all') {
      setLoadingTokens(true);
      try {
        let apiUrl = '';

        // Use specific endpoints for known categories - matching the dedicated pages
        if (selectedCategory === 'trending') {
          apiUrl = `${BASE_URL}/tokens?start=0&limit=50&sortBy=trendingScore&sortType=desc`;
        } else if (selectedCategory === 'spotlight') {
          apiUrl = `${BASE_URL}/tokens?start=0&limit=50&sortBy=assessmentScore&sortType=desc`;
        } else if (selectedCategory === 'new') {
          apiUrl = `${BASE_URL}/tokens?start=0&limit=50&sortBy=dateon&sortType=desc`;
        } else if (selectedCategory === 'gainers-24h') {
          apiUrl = `${BASE_URL}/tokens?start=0&limit=50&sortBy=pro24h&sortType=desc`;
        } else if (selectedCategory === 'most-viewed') {
          apiUrl = `${BASE_URL}/tokens?start=0&limit=50&sortBy=nginxScore&sortType=desc`;
        } else {
          // For tag-based categories, use tag parameter
          apiUrl = `${BASE_URL}/tokens?tag=${encodeURIComponent(selectedCategory)}&start=0&limit=50`;
        }

        const res = await axios.get(apiUrl);
        if (res.status === 200 && res.data?.tokens) {
          const tokens = res.data.tokens || [];

          // Check if we should exclude XRP for specific categories
          const excludeXrpCategories = [
            'trending',
            'spotlight',
            'new',
            'gainers-24h',
            'most-viewed'
          ];

          if (excludeXrpCategories.includes(selectedCategory)) {
            // For these categories, don't add XRP and filter out any XRP entries
            const nonXrpTokens = tokens.filter((t) => t.currency !== 'XRP');
            setFilteredTokens(nonXrpTokens);
          } else {
            // For 'all' and tag-based categories, include XRP at the top
            const xrpToken = {
              md5: '84e5efeb89c4eae8f68188982dc290d8',
              name: 'XRP',
              user: 'XRP',
              issuer: 'XRPL',
              currency: 'XRP',
              ext: 'png',
              isOMCF: 'yes',
              marketcap: 0,
              vol24hxrp: 0,
              exch: 1
            };

            // Filter out any duplicate XRP entries
            const nonXrpTokens = tokens.filter((t) => t.currency !== 'XRP');
            setFilteredTokens([xrpToken, ...nonXrpTokens]);
          }
        } else {
          setFilteredTokens(selectorTokens);
        }
      } catch (err) {
        // Fall back to showing all tokens
        setFilteredTokens(selectorTokens);
      } finally {
        setLoadingTokens(false);
      }
    } else {
      // Show all tokens
      setFilteredTokens(selectorTokens);
    }
  };

  const handleSelectToken = (token, isToken1) => {
    // Save to recent tokens
    const recent = [token, ...recentTokens.filter((t) => t.md5 !== token.md5)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem('recentTokens', JSON.stringify(recent));

    if (isToken1) {
      onChangeToken1(token);
      setPanel1Open(false);
    } else {
      onChangeToken2(token);
      setPanel2Open(false);
    }
  };

  const handleClearRecent = () => {
    localStorage.removeItem('recentTokens');
    setRecentTokens([]);
  };

  const renderTokenItem = (token, isToken1) => (
    <Box
      key={token.md5}
      onClick={() => handleSelectToken(token, isToken1)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04)
        },
        '&:last-child': {
          borderBottom: 'none'
        }
      }}
    >
      <Avatar
        src={`https://s1.xrpl.to/token/${token.md5}`}
        alt={token.name}
        sx={{
          width: 28,
          height: 28,
          mr: 1.5
        }}
        imgProps={{
          onError: (e) => {
            e.target.src = '/static/alt.webp';
          }
        }}
      />

      <Box sx={{ flex: '0 0 25%', minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ fontSize: '0.8rem' }}
            color={token.isOMCF === 'yes' ? '#1db954' : 'text.primary'}
          >
            {token.name}
          </Typography>
          {token.verified && (
            <CheckCircleIcon
              sx={{
                fontSize: 12,
                color: theme.palette.primary.main,
                flexShrink: 0
              }}
            />
          )}
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.65rem', display: 'block' }}
        >
          {token.user || 'Unknown'}
        </Typography>
      </Box>

      <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
          {(() => {
            if (!token.exch && token.exch !== 0) return '0 XRP';

            // Convert to number, handling scientific notation
            let price = Number(token.exch);

            // Check for invalid number
            if (isNaN(price) || price === 0) return '0 XRP';

            // For large numbers
            if (price >= 1) {
              return `${price.toFixed(4)} XRP`;
            }

            // For smaller numbers, dynamically determine decimal places
            // Convert to string to check how many decimals we need
            const priceStr = price.toString();

            // If already in decimal format, just format it
            if (!priceStr.includes('e')) {
              if (price >= 0.01) return `${price.toFixed(6)} XRP`;
              if (price >= 0.0001) return `${price.toFixed(8)} XRP`;
              if (price >= 0.000001) return `${price.toFixed(10)} XRP`;
              return `${price.toFixed(15).replace(/\.?0+$/, '')} XRP`;
            }

            // Handle scientific notation (e.g., 2.8273e-7)
            // Use toFixed with enough decimal places
            const exponent = parseInt(priceStr.split('e')[1]);
            const decimalPlaces = Math.abs(exponent) + 4; // Add 4 more digits after the significant part

            // Cap at 20 decimal places for display
            const formattedPrice = price.toFixed(Math.min(decimalPlaces, 20));

            // Remove trailing zeros
            return `${formattedPrice.replace(/\.?0+$/, '')} XRP`;
          })()}
        </Typography>
      </Box>

      <Box sx={{ flex: '0 0 25%', textAlign: 'right' }}>
        <Typography
          variant="caption"
          sx={{ fontSize: '0.75rem', color: theme.palette.success.main }}
        >
          {(() => {
            if (!token.vol24hxrp) return '0 XRP';
            const vol = parseFloat(token.vol24hxrp);
            if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M XRP`;
            if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K XRP`;
            if (vol >= 1) return `${vol.toFixed(2)} XRP`;
            return `${vol.toFixed(4)} XRP`;
          })()}
        </Typography>
      </Box>

      <Box sx={{ flex: '0 0 25%', textAlign: 'right' }}>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.info.main }}>
          {(() => {
            if (!token.marketcap) return '0 XRP';
            const mcap = parseFloat(token.marketcap);
            if (mcap >= 1000000) return `${(mcap / 1000000).toFixed(2)}M XRP`;
            if (mcap >= 1000) return `${(mcap / 1000).toFixed(2)}K XRP`;
            if (mcap >= 1) return `${mcap.toFixed(2)} XRP`;
            return `${mcap.toFixed(4)} XRP`;
          })()}
        </Typography>
      </Box>

      {((isToken1 && token1?.md5 === token.md5) || (!isToken1 && token2?.md5 === token.md5)) && (
        <CheckCircleIcon
          sx={{
            fontSize: 16,
            color: theme.palette.primary.main,
            ml: 1
          }}
        />
      )}
    </Box>
  );

  const renderTokenSelector = (token, onClickToken, panelTitle) => {
    if (!token) return null;

    const { md5 = '', name = 'Select Token', user = '', kyc = false, isOMCF = 'no' } = token;

    const imgUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : '/static/alt.webp';

    return (
      <SelectTokenButton direction="row" alignItems="center" spacing={1.5} onClick={onClickToken}>
        <Box sx={{ position: 'relative' }}>
          <TokenImage
            src={imgUrl}
            width={36}
            height={36}
            alt={name || 'Token'}
            onError={(event) => (event.target.src = '/static/alt.webp')}
          />
          {kyc && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: '#00AB55',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${darkMode ? '#1a1a1a' : '#ffffff'}`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Typography sx={{ fontSize: '8px', color: 'white', fontWeight: 'bold' }}>
                ✓
              </Typography>
            </Box>
          )}
        </Box>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            color={isOMCF !== 'yes' ? 'text.primary' : darkMode ? '#00AB55' : '#4E8DF4'}
            sx={{
              lineHeight: 1.2,
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em'
            }}
            noWrap
          >
            {name || 'Select Token'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1,
              fontSize: '0.75rem',
              opacity: 0.8,
              letterSpacing: '0.02em'
            }}
            noWrap
          >
            {user ? truncate(user, 15) : 'Choose a token to swap'}
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            borderRadius: '50%',
            width: 28,
            height: 28,
            justifyContent: 'center',
            ml: 1
          }}
        >
          <ArrowDropDownIcon
            className="arrow-icon"
            sx={{
              fontSize: 18,
              color: 'primary.main',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </Box>
      </SelectTokenButton>
    );
  };

  const renderTokenSelectorPanel = (currentToken, title, isToken1, onClose) => (
    <PanelContainer>
      {/* Header */}
      <PanelHeader>
        <Stack direction="row" alignItems="center" justifyContent="space-between" pb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={onClose}
              aria-label="Back to swap interface"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <ArrowBackIcon sx={{ width: 24, height: 24 }} />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
          </Stack>

          {currentToken && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Current:
              </Typography>
              <Chip
                avatar={
                  <Avatar
                    src={`https://s1.xrpl.to/token/${currentToken.md5}`}
                    sx={{ width: 20, height: 20 }}
                  />
                }
                label={currentToken.name}
                size="small"
                variant="outlined"
              />
            </Stack>
          )}
        </Stack>
      </PanelHeader>

      {/* Search Bar */}
      <SearchContainer>
        <TextField
          inputRef={searchInputRef}
          fullWidth
          placeholder="Search by name, symbol, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="medium"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.8),
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.15)
              },
              '&:hover fieldset': {
                borderColor: alpha(theme.palette.primary.main, 0.3)
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ width: 20, height: 20, color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Category Filters */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: 0 }
          }}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat.value}
              label={cat.label}
              onClick={() => setSelectedCategory(cat.value)}
              color={selectedCategory === cat.value ? 'primary' : 'default'}
              variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </SearchContainer>

      {/* Content */}
      <ScrollableContent>
        <Box>
          {/* Recent Tokens */}
          {!searchQuery && recentTokens.length > 0 && (
            <Box mb={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <SectionTitle>
                  <AccessTimeIcon sx={{ width: 14, height: 14 }} />
                  Recent Selections
                </SectionTitle>
                <Typography
                  variant="caption"
                  sx={{
                    cursor: 'pointer',
                    color: theme.palette.error.main,
                    fontSize: '0.7rem',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={handleClearRecent}
                >
                  Clear All
                </Typography>
              </Stack>
              <Box
                sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 1 }}
              >
                {recentTokens.map((token) => renderTokenItem(token, isToken1))}
              </Box>
              <Divider sx={{ mt: 2, mb: 1 }} />
            </Box>
          )}

          {/* Token List */}
          <Box>
            <SectionTitle>
              {searchQuery ? (
                <>Search Results ({filteredTokens.length})</>
              ) : selectedCategory === 'all' ? (
                <>All Available Tokens</>
              ) : (
                <>{categories.find((c) => c.value === selectedCategory)?.label}</>
              )}
            </SectionTitle>

            {loadingTokens ? (
              <Grid container spacing={1}>
                {[...Array(8)].map((_, i) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`swap-skeleton-${i}`}>
                    <Paper sx={{ p: 1, borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="60%" height={14} />
                          <Skeleton variant="text" width="40%" height={12} />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : filteredTokens.length > 0 ? (
              <Box>
                {/* Table Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: `2px solid ${alpha(theme.palette.divider, 0.15)}`,
                    backgroundColor: alpha(theme.palette.background.default, 0.3)
                  }}
                >
                  <Box sx={{ width: 28, mr: 1.5 }} />
                  <Box sx={{ flex: '0 0 25%' }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      TOKEN
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      PRICE (XRP)
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0 0 25%', textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      24H VOL (XRP)
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0 0 25%', textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      MARKET CAP (XRP)
                    </Typography>
                  </Box>
                </Box>
                {/* Table Body */}
                <Box
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 1,
                    borderTop: 'none'
                  }}
                >
                  {filteredTokens.slice(0, 50).map((token) => renderTokenItem(token, isToken1))}
                </Box>
              </Box>
            ) : (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5)
                }}
              >
                <Typography variant="h6" gutterBottom color="text.secondary">
                  No tokens found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'No tokens available in this category'}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </ScrollableContent>
    </PanelContainer>
  );

  // Check if we should show token selector
  const showTokenSelector = panel1Open || panel2Open;
  const currentSelectorToken = panel1Open ? token1 : token2;
  const selectorTitle = panel1Open ? 'Select token to swap from' : 'Select token to receive';
  const isToken1Selector = panel1Open;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Swap Interface Container */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          px: { xs: 0.5, sm: 2, md: 3 },
          transition: 'max-width 0.3s ease'
        }}
      >
        <Box sx={{ position: 'relative', width: '100%' }}>
          {/* Token Selector */}
          <Box
            sx={{
              opacity: showTokenSelector ? 1 : 0,
              visibility: showTokenSelector ? 'visible' : 'hidden',
              position: showTokenSelector ? 'relative' : 'absolute',
              width: '100%',
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
              pointerEvents: showTokenSelector ? 'auto' : 'none'
            }}
          >
            {(panel1Open || panel2Open) &&
              renderTokenSelectorPanel(
                currentSelectorToken,
                selectorTitle,
                isToken1Selector,
                () => {
                  setPanel1Open(false);
                  setPanel2Open(false);
                }
              )}
          </Box>

          {/* Swap UI */}
          <Box
            sx={{
              opacity: showTokenSelector ? 0 : 1,
              visibility: showTokenSelector ? 'hidden' : 'visible',
              position: showTokenSelector ? 'absolute' : 'relative',
              width: '100%',
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
              pointerEvents: showTokenSelector ? 'none' : 'auto'
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 1, md: 3 }}
              alignItems="flex-start"
              justifyContent="center"
              sx={{ width: '100%' }}
            >
              <Stack
                sx={{
                  width: '100%',
                  flex: 1,
                  maxWidth: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
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
                  {/* Header with Market/Limit Tabs */}
                  <Box
                    sx={{
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      background: alpha(theme.palette.background.paper, 0.02)
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ p: 1 }}
                    >
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant={orderType === 'market' ? 'contained' : 'text'}
                          onClick={() => {
                            setOrderType('market');
                            setShowOrders(false); // Reset orders view when switching tabs
                          }}
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            backgroundColor:
                              orderType === 'market' ? theme.palette.primary.main : 'transparent',
                            color: orderType === 'market' ? 'white' : theme.palette.text.secondary,
                            '&:hover': {
                              backgroundColor:
                                orderType === 'market'
                                  ? theme.palette.primary.dark
                                  : alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          Market
                        </Button>
                        <Button
                          size="small"
                          variant={orderType === 'limit' ? 'contained' : 'text'}
                          onClick={() => {
                            setOrderType('limit');
                            setShowOrders(false); // Reset orders view when switching tabs
                          }}
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            backgroundColor:
                              orderType === 'limit' ? theme.palette.primary.main : 'transparent',
                            color: orderType === 'limit' ? 'white' : theme.palette.text.secondary,
                            '&:hover': {
                              backgroundColor:
                                orderType === 'limit'
                                  ? theme.palette.primary.dark
                                  : alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          Limit
                        </Button>
                      </Stack>
                      <IconButton size="small" aria-label="Share swap URL" onClick={handleShareUrl}>
                        <ShareIcon sx={{ width: 16, height: 16 }} />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    {/* First Token - Clean Card Design */}
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: '20px',
                        border: `1px solid ${focusTop ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.08)}`,
                        transition: 'all 0.3s ease',
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        backdropFilter: 'blur(12px)',
                        overflow: 'hidden',
                        background: `linear-gradient(135deg,
                  ${alpha(theme.palette.background.paper, 0.6)},
                  ${alpha(theme.palette.background.paper, 0.4)})`,
                        boxShadow: focusTop
                          ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                          : 'none',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.6),
                          borderColor: alpha(theme.palette.primary.main, 0.15),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                        }
                      }}
                    >
                      {/* Embedded sparkline background */}
                      {token1 && token1.md5 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '60%',
                            height: '100%',
                            opacity: 0.15,
                            pointerEvents: 'none',
                            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)',
                            WebkitMaskImage:
                              'linear-gradient(to left, rgba(0,0,0,0.8), transparent)'
                          }}
                        >
                          <Sparkline
                            url={`${BASE_URL}/sparkline/${token1.md5}?period=24h&lightweight=true`}
                            style={{ width: '100%', height: '100%' }}
                            showGradient={false}
                            lineWidth={1.5}
                            animation={false}
                          />
                        </Box>
                      )}
                      <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={2}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                mb: 1,
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: theme.palette.text.primary,
                                opacity: 0.9
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.error.main,
                                    opacity: 0.8
                                  }}
                                />
                                You pay
                              </Box>
                            </Typography>
                            {renderTokenSelector(
                              token1,
                              () => setPanel1Open(true),
                              'Select token to swap from'
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flex: 1, maxWidth: '60%' }}>
                            <Input
                              placeholder="0.00"
                              disableUnderline
                              value={amount1}
                              onChange={handleChangeAmount1}
                              inputMode="decimal"
                              sx={{
                                width: '100%',
                                input: {
                                  textAlign: 'right',
                                  fontSize: { xs: '24px', sm: '32px' },
                                  fontWeight: 700,
                                  padding: '8px 0',
                                  background: 'transparent',
                                  color: theme.palette.text.primary,
                                  border: 'none',
                                  outline: 'none',
                                  fontFamily:
                                    '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                                  letterSpacing: '-0.02em',
                                  transition: 'all 0.2s ease',
                                  '&::placeholder': {
                                    color: alpha(theme.palette.text.primary, 0.3),
                                    fontWeight: 400
                                  },
                                  '&:focus': {
                                    transform: 'scale(1.02)',
                                    transformOrigin: 'right center'
                                  }
                                }
                              }}
                              onFocus={() => setFocusTop(true)}
                              onBlur={() => setFocusTop(false)}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                mt: 1,
                                display: 'block',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                opacity: focusTop ? 1 : 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                            >
                              {tokenPrice1 > 0
                                ? `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice1)}`
                                : ' '}
                            </Typography>
                          </Box>
                        </Stack>
                        {isLoggedIn && accountPairBalance && (
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1 }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                letterSpacing: '0.01em'
                              }}
                            >
                              Balance:{' '}
                              {fNumber(
                                revert
                                  ? accountPairBalance?.curr2.value
                                  : accountPairBalance?.curr1.value
                              )}
                            </Typography>
                            {(revert
                              ? accountPairBalance?.curr2.value
                              : accountPairBalance?.curr1.value) > 0 && (
                              <Stack direction="row" spacing={0.75}>
                                {[25, 50, 100].map((percent) => (
                                  <Box
                                    key={percent}
                                    onClick={() => {
                                      const balance = revert
                                        ? accountPairBalance?.curr2.value
                                        : accountPairBalance?.curr1.value;
                                      const newAmount =
                                        percent === 100
                                          ? balance.toString()
                                          : ((balance * percent) / 100).toFixed(6);
                                      handleChangeAmount1({ target: { value: newAmount } });
                                    }}
                                    sx={{
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: '8px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main,
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                        borderColor: theme.palette.primary.main,
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                                      },
                                      '&:active': {
                                        transform: 'translateY(0)'
                                      }
                                    }}
                                  >
                                    {percent}%
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Stack>
                        )}
                      </Box>
                    </Box>

                    {/* Clean Swap Button */}
                    <Box sx={{ position: 'relative', height: '20px', my: 1 }}>
                      <ToggleButton
                        onClick={onRevertExchange}
                        disabled={isSwitching}
                        className={isSwitching ? 'switching' : ''}
                        title="Switch currencies (Alt + S)"
                      >
                        <SwapHorizIcon sx={{ width: 20, height: 20 }} />
                      </ToggleButton>
                    </Box>

                    {/* Second Token - Clean Card Design */}
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: '20px',
                        border: `2px dashed ${focusBottom ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.divider, 0.12)}`,
                        transition: 'all 0.3s ease',
                        backgroundColor: alpha(theme.palette.background.default, 0.3),
                        backdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                        background: `linear-gradient(135deg,
                  ${alpha(theme.palette.background.default, 0.2)},
                  ${alpha(theme.palette.background.paper, 0.1)})`,
                        opacity: amount2 ? 1 : 0.9,
                        boxShadow: focusBottom
                          ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
                          : `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.4),
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                          opacity: 1
                        }
                      }}
                    >
                      {/* Embedded sparkline background */}
                      {token2 && token2.md5 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '60%',
                            height: '100%',
                            opacity: 0.15,
                            pointerEvents: 'none',
                            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)',
                            WebkitMaskImage:
                              'linear-gradient(to left, rgba(0,0,0,0.8), transparent)'
                          }}
                        >
                          <Sparkline
                            url={`${BASE_URL}/sparkline/${token2.md5}?period=24h&lightweight=true`}
                            style={{ width: '100%', height: '100%' }}
                            showGradient={false}
                            lineWidth={1.5}
                            animation={false}
                          />
                        </Box>
                      )}
                      <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={2}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                mb: 1,
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: theme.palette.text.secondary,
                                opacity: 0.8
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.success.main,
                                    opacity: 0.7
                                  }}
                                />
                                You receive
                              </Box>
                            </Typography>
                            {renderTokenSelector(
                              token2,
                              () => setPanel2Open(true),
                              'Select token to receive'
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flex: 1, maxWidth: '60%' }}>
                            <Input
                              placeholder="0.00"
                              disableUnderline
                              value={amount1 === '' ? '' : amount2}
                              onChange={handleChangeAmount2}
                              inputMode="decimal"
                              sx={{
                                width: '100%',
                                input: {
                                  textAlign: 'right',
                                  fontSize: { xs: '24px', sm: '32px' },
                                  fontWeight: 700,
                                  padding: '8px 0',
                                  background: 'transparent',
                                  color: theme.palette.text.primary,
                                  border: 'none',
                                  outline: 'none',
                                  fontFamily:
                                    '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                                  letterSpacing: '-0.02em',
                                  transition: 'all 0.2s ease',
                                  '&::placeholder': {
                                    color: alpha(theme.palette.text.primary, 0.3),
                                    fontWeight: 400
                                  },
                                  '&:focus': {
                                    transform: 'scale(1.02)',
                                    transformOrigin: 'right center'
                                  }
                                }
                              }}
                              onFocus={() => setFocusBottom(true)}
                              onBlur={() => setFocusBottom(false)}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                mt: 1,
                                display: 'block',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                opacity: focusBottom ? 1 : 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                            >
                              {tokenPrice2 > 0
                                ? `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice2)}`
                                : ' '}
                            </Typography>
                          </Box>
                        </Stack>
                        {isLoggedIn && accountPairBalance && (
                          <Typography variant="caption" color="text.secondary">
                            Balance:{' '}
                            {fNumber(
                              revert
                                ? accountPairBalance?.curr1.value
                                : accountPairBalance?.curr2.value
                            )}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* View Buttons - Shows only for Limit orders */}
                    {orderType === 'limit' && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            onClick={() => setShowOrderbook(!showOrderbook)}
                            startIcon={
                              showOrderbook ? (
                                <ToggleOnIcon sx={{ width: 14, height: 14 }} />
                              ) : (
                                <ToggleOffIcon sx={{ width: 14, height: 14 }} />
                              )
                            }
                            sx={{
                              py: 0.6,
                              fontSize: '0.7rem',
                              textTransform: 'none',
                              borderColor: showOrderbook
                                ? theme.palette.primary.main
                                : alpha(theme.palette.divider, 0.2),
                              color: showOrderbook
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                              backgroundColor: showOrderbook
                                ? alpha(theme.palette.primary.main, 0.05)
                                : 'transparent',
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.08)
                              }
                            }}
                          >
                            {showOrderbook ? 'Hide' : 'Show'} Book
                          </Button>
                          {accountProfile?.account && (
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              onClick={() => setShowOrders(!showOrders)}
                              startIcon={<ListIcon sx={{ width: 14, height: 14 }} />}
                              sx={{
                                py: 0.6,
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                borderColor: showOrders
                                  ? theme.palette.primary.main
                                  : alpha(theme.palette.divider, 0.2),
                                color: showOrders
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                                backgroundColor: showOrders
                                  ? alpha(theme.palette.primary.main, 0.05)
                                  : 'transparent',
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.08)
                                }
                              }}
                            >
                              {showOrders ? 'Hide' : 'Show'} Orders
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Market Order UI */}
                    {orderType === 'market' && (
                      <Box sx={{ mb: 2 }}>
                        <Stack spacing={1}>
                          {/* Slippage Setting */}
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '10px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.03),
                              border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.7rem"
                                >
                                  Slippage Tolerance
                                </Typography>
                                <Tooltip title="Maximum price change you accept" arrow>
                                  <InfoIcon sx={{ width: 12, height: 12, opacity: 0.5 }} />
                                </Tooltip>
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                {[0.5, 1, 3].map((val) => (
                                  <Chip
                                    key={val}
                                    label={`${val}%`}
                                    size="small"
                                    onClick={() => setSlippage(val)}
                                    sx={{
                                      height: '18px',
                                      fontSize: '0.6rem',
                                      cursor: 'pointer',
                                      backgroundColor:
                                        slippage === val
                                          ? theme.palette.primary.main
                                          : alpha(theme.palette.action.selected, 0.08),
                                      color:
                                        slippage === val ? 'white' : theme.palette.text.secondary,
                                      '&:hover': {
                                        backgroundColor:
                                          slippage === val
                                            ? theme.palette.primary.dark
                                            : alpha(theme.palette.action.selected, 0.16)
                                      }
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Stack>
                          </Box>

                          {/* Min Received */}
                          {amount2 && (
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '8px',
                                backgroundColor: alpha(theme.palette.info.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.65rem"
                                >
                                  Minimum Received
                                </Typography>
                                <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                                  {new Decimal(amount2).mul(1 - slippage / 100).toFixed(4)}{' '}
                                  {token2.name}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Limit Order UI */}
                    {orderType === 'limit' && (
                      <Box
                        sx={{
                          mt: 1.5,
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: '10px',
                          backgroundColor: alpha(theme.palette.background.paper, 0.2),
                          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                        }}
                      >
                        <Stack spacing={1.5}>
                          {/* Limit Price Input */}
                          <Box>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mb: 0.5 }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  color: theme.palette.text.secondary,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em'
                                }}
                              >
                                Limit Price
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.6rem',
                                  color: theme.palette.text.secondary,
                                  opacity: 0.7
                                }}
                              >
                                {token2.name || token2.currency} per{' '}
                                {token1.name || token1.currency}
                              </Typography>
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
                                backgroundColor: alpha(theme.palette.background.default, 0.4),
                                borderRadius: '8px',
                                padding: '8px 12px',
                                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                transition: 'all 0.2s ease',
                                input: {
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  fontFamily:
                                    '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                                },
                                '&:hover': {
                                  borderColor: alpha(theme.palette.primary.main, 0.2)
                                },
                                '&:focus-within': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.background.default, 0.6)
                                }
                              }}
                            />
                          </Box>

                          {/* Quick Price Select */}
                          {(bids[0] || asks[0]) && (
                            <Stack direction="row" spacing={0.75}>
                              {bids[0] && (
                                <Box
                                  onClick={() => setLimitPrice(bids[0].price.toFixed(6))}
                                  sx={{
                                    flex: 1,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center',
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.success.main, 0.15)
                                    }
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      color: theme.palette.success.main
                                    }}
                                  >
                                    Bid: {bids[0].price.toFixed(4)}
                                  </Typography>
                                </Box>
                              )}
                              {asks[0] && (
                                <Box
                                  onClick={() => setLimitPrice(asks[0].price.toFixed(6))}
                                  sx={{
                                    flex: 1,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center',
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.error.main, 0.15)
                                    }
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      color: theme.palette.error.main
                                    }}
                                  >
                                    Ask: {asks[0].price.toFixed(4)}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          )}

                          {/* Expiration Setting */}
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                mb: 0.5,
                                display: 'block'
                              }}
                            >
                              Expires
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              {[
                                { value: 'never', label: 'Never' },
                                { value: '1h', label: '1h' },
                                { value: '24h', label: '1d' },
                                { value: '7d', label: '7d' }
                              ].map((exp) => (
                                <Box
                                  key={exp.value}
                                  onClick={() => setOrderExpiry(exp.value)}
                                  sx={{
                                    flex: 1,
                                    px: 0.75,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    backgroundColor:
                                      orderExpiry === exp.value
                                        ? alpha(theme.palette.primary.main, 0.12)
                                        : alpha(theme.palette.background.default, 0.2),
                                    color:
                                      orderExpiry === exp.value
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary,
                                    border: `1px solid ${
                                      orderExpiry === exp.value
                                        ? alpha(theme.palette.primary.main, 0.2)
                                        : alpha(theme.palette.divider, 0.08)
                                    }`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor:
                                        orderExpiry === exp.value
                                          ? alpha(theme.palette.primary.main, 0.18)
                                          : alpha(theme.palette.background.default, 0.3)
                                    }
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ fontSize: '0.6rem', fontWeight: 600 }}
                                  >
                                    {exp.label}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                            {orderExpiry === 'custom' && (
                              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Input
                                  type="number"
                                  value={customExpiry}
                                  onChange={(e) =>
                                    setCustomExpiry(Math.max(1, parseInt(e.target.value) || 1))
                                  }
                                  disableUnderline
                                  sx={{
                                    width: '60px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: alpha(theme.palette.background.paper, 0.05),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    input: {
                                      fontSize: '0.7rem',
                                      textAlign: 'center'
                                    }
                                  }}
                                />
                                <Typography variant="caption" fontSize="0.7rem">
                                  hours
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Price difference from market and warnings */}
                          {limitPrice &&
                            parseFloat(limitPrice) > 0 &&
                            (() => {
                              const limit = parseFloat(limitPrice);
                              const bestAsk = asks[0]?.price || 0;
                              const bestBid = bids[0]?.price || 0;

                              // Determine the current market price based on order type
                              const currentPrice = !revert ? bestAsk : bestBid;

                              if (currentPrice > 0) {
                                const priceDiff = ((limit - currentPrice) / currentPrice) * 100;
                                const isAbove = priceDiff > 0;

                                // Check if order will execute immediately
                                const willExecute =
                                  (!revert && limit >= bestAsk && bestAsk > 0) ||
                                  (revert && limit <= bestBid && bestBid > 0);

                                return (
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    {/* Price difference indicator */}
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: '6px',
                                        backgroundColor: alpha(
                                          isAbove
                                            ? theme.palette.error.main
                                            : theme.palette.success.main,
                                          0.1
                                        ),
                                        border: `1px solid ${alpha(
                                          isAbove
                                            ? theme.palette.error.main
                                            : theme.palette.success.main,
                                          0.3
                                        )}`
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 600,
                                          color: isAbove
                                            ? theme.palette.error.main
                                            : theme.palette.success.main
                                        }}
                                      >
                                        {isAbove ? '▲' : '▼'} {Math.abs(priceDiff).toFixed(2)}%{' '}
                                        {isAbove ? 'above' : 'below'} current{' '}
                                        {!revert ? 'ask' : 'bid'} price ({currentPrice.toFixed(6)})
                                      </Typography>
                                    </Box>

                                    {/* Warning for immediate execution */}
                                    {willExecute && (
                                      <Box
                                        sx={{
                                          p: 1,
                                          borderRadius: '6px',
                                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          color="warning.main"
                                          sx={{ fontWeight: 600 }}
                                        >
                                          ⚠️ Order will execute immediately at market price
                                        </Typography>
                                      </Box>
                                    )}
                                  </Stack>
                                );
                              }
                              return null;
                            })()}
                        </Stack>
                      </Box>
                    )}

                    {/* User's Open Orders - Display when button is clicked */}
                    {/* Commented out Orders component - file doesn't exist */}
                    {/* {showOrders && accountProfile?.account && (
                      <Box sx={{ mb: 2 }}>
                        {
                          <Box
                            sx={{
                              borderRadius: '12px',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              overflow: 'hidden',
                              backgroundColor: alpha(theme.palette.background.paper, 0.02)
                            }}
                          >
                            <Orders
                              pair={{
                                // For now, use a simple pair string format that the API might accept
                                // The backend should handle both MD5 and string formats
                                pair: `${curr1.currency}:${curr1.issuer || 'XRP'}/${curr2.currency}:${curr2.issuer || 'XRP'}`,
                                curr1: {
                                  ...curr1,
                                  name: curr1.name || curr1.currency,
                                  issuer:
                                    curr1.issuer || (curr1.currency === 'XRP' ? undefined : ''),
                                  currency: curr1.currency
                                },
                                curr2: {
                                  ...curr2,
                                  name: curr2.name || curr2.currency,
                                  issuer:
                                    curr2.issuer || (curr2.currency === 'XRP' ? undefined : ''),
                                  currency: curr2.currency
                                }
                              }}
                            />
                          </Box>
                        }
                      </Box>
                    )} */}

                    {/* Transaction Summary */}
                    {amount1 && amount2 && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            backgroundColor: alpha(theme.palette.background.paper, 0.03),
                            border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            onClick={() => setShowOrderSummary(!showOrderSummary)}
                            sx={{ cursor: 'pointer', mb: showOrderSummary ? 1 : 0 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}
                            >
                              ORDER SUMMARY
                            </Typography>
                            <InfoIcon
                              icon={showOrderSummary ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                              width={16}
                              height={16}
                              style={{ color: theme.palette.text.secondary }}
                            />
                          </Stack>
                          {showOrderSummary && (
                            <Stack spacing={0.75}>
                              {/* Sell Amount */}
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.7rem"
                                >
                                  {orderType === 'limit' ? 'Sell Order' : 'You Pay'}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
                                  {amount1} {token1.name || token1.currency}
                                </Typography>
                              </Stack>

                              {/* Buy Amount */}
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.7rem"
                                >
                                  {orderType === 'limit' ? 'To Buy' : 'You Receive'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  fontSize="0.75rem"
                                  color="primary.main"
                                >
                                  {orderType === 'limit' && limitPrice
                                    ? (() => {
                                        const limitPriceDecimal = new Decimal(limitPrice);
                                        const amount1Decimal = new Decimal(amount1);
                                        if (
                                          token1.currency === 'XRP' &&
                                          token2.currency !== 'XRP'
                                        ) {
                                          return amount1Decimal.mul(limitPriceDecimal).toFixed(6);
                                        } else if (
                                          token1.currency !== 'XRP' &&
                                          token2.currency === 'XRP'
                                        ) {
                                          return amount1Decimal.div(limitPriceDecimal).toFixed(6);
                                        } else {
                                          return amount1Decimal.mul(limitPriceDecimal).toFixed(6);
                                        }
                                      })()
                                    : amount2}{' '}
                                  {token2.name || token2.currency}
                                </Typography>
                              </Stack>

                              {/* Rate */}
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.7rem"
                                >
                                  {orderType === 'limit'
                                    ? `${token1.name} at Rate`
                                    : 'Exchange Rate'}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
                                  {orderType === 'limit' && limitPrice
                                    ? `${limitPrice} ${token2.name || token2.currency}`
                                    : (() => {
                                        const token1IsXRP = token1?.currency === 'XRP';
                                        const token2IsXRP = token2?.currency === 'XRP';

                                        if (token1IsXRP && !token2IsXRP) {
                                          return tokenExch2 > 0
                                            ? `${(1 / tokenExch2).toFixed(6)} ${token2.name}`
                                            : '0';
                                        } else if (!token1IsXRP && token2IsXRP) {
                                          return tokenExch1 > 0
                                            ? `${tokenExch1.toFixed(6)} ${token2.name}`
                                            : '0';
                                        } else {
                                          return tokenExch1 > 0 && tokenExch2 > 0
                                            ? `${(tokenExch1 / tokenExch2).toFixed(6)} ${token2.name}`
                                            : '0';
                                        }
                                      })()}
                                </Typography>
                              </Stack>

                              {/* Order Type & Expiry for Limit Orders */}
                              {orderType === 'limit' && (
                                <>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontSize="0.7rem"
                                    >
                                      Order Type
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                      fontSize="0.75rem"
                                    >
                                      Limit Order
                                    </Typography>
                                  </Stack>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontSize="0.7rem"
                                    >
                                      Expiry
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                      fontSize="0.75rem"
                                    >
                                      {orderExpiry === 'never'
                                        ? 'Never'
                                        : orderExpiry === '1h'
                                          ? '1 Hour'
                                          : orderExpiry === '24h'
                                            ? '1 Day'
                                            : orderExpiry === '7d'
                                              ? '7 Days'
                                              : orderExpiry === '30d'
                                                ? '30 Days'
                                                : orderExpiry === 'custom'
                                                  ? `${customExpiry} Hours`
                                                  : 'Never'}
                                    </Typography>
                                  </Stack>
                                </>
                              )}

                              {/* Slippage for Market Orders */}
                              {orderType === 'market' && (
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontSize="0.7rem"
                                  >
                                    Max Slippage
                                  </Typography>
                                  <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
                                    {slippage}%
                                  </Typography>
                                </Stack>
                              )}

                              {/* Platform Fee */}
                              <Divider
                                sx={{ my: 0.5, borderColor: alpha(theme.palette.divider, 0.05) }}
                              />
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="0.7rem"
                                >
                                  Network Fee
                                </Typography>
                                <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
                                  ~0.000012 XRP
                                </Typography>
                              </Stack>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Price Impact Row - Only show for market orders or limit orders that will execute immediately */}
                    {amount1 &&
                      amount2 &&
                      (() => {
                        // For limit orders, only show price impact if the order will execute immediately
                        if (orderType === 'limit') {
                          const limit = parseFloat(limitPrice);
                          const bestAsk = asks[0]?.price || 0;
                          const bestBid = bids[0]?.price || 0;
                          const willExecute =
                            (!revert && limit >= bestAsk && bestAsk > 0) ||
                            (revert && limit <= bestBid && bestBid > 0);

                          // Don't show price impact for limit orders that won't execute immediately
                          if (!willExecute || !limit) {
                            return null;
                          }
                        }

                        return (
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{
                              mt: 1,
                              p: 1,
                              borderRadius: '8px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.03),
                              border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                              Price Impact
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: getPriceImpactColor(Math.abs(priceImpact)),
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              >
                                {priceImpact > 0 ? '+' : ''}
                                {priceImpact}%
                              </Typography>
                              {Math.abs(priceImpact) > 5 && (
                                <Tooltip
                                  title={
                                    Math.abs(priceImpact) > 10
                                      ? 'Very high impact! Consider reducing size'
                                      : 'High impact detected'
                                  }
                                  arrow
                                >
                                  <InfoIcon
                                    icon="mdi:alert-circle"
                                    width={14}
                                    height={14}
                                    style={{ color: getPriceImpactColor(Math.abs(priceImpact)) }}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                          </Stack>
                        );
                      })()}

                    {/* Action Button */}
                    <Box sx={{ mt: 3 }}>
                      {accountProfile && accountProfile.account ? (
                        <ExchangeButton
                          variant="contained"
                          fullWidth
                          onClick={handlePlaceOrder}
                          disabled={
                            isProcessing === 1 ||
                            !isLoggedIn ||
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
                        <Wallet
                          style={{ width: '100%' }}
                          buttonOnly={true}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                <QRDialog
                  type={transactionType}
                  onClose={handleScanQRClose}
                />
              </Stack>

              {/* Orderbook Drawer (embedded) using TransactionDetailsPanel) */}
              {/* Commented out TransactionDetailsPanel - file doesn't exist */}
              {/* <TransactionDetailsPanel
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
              /> */}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Chart Display - Full width sparklines matching swap container */}
      {(token1 || token2) && !showTokenSelector && (
        <Box
          sx={{
            mt: 4,
            width: '100%',
            maxWidth: '680px',
            margin: '40px auto 20px',
            px: { xs: 0.5, sm: 2, md: 3 }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: '100%'
            }}
          >
            {token1 && (
              <Box
                sx={{
                  flex: '1 1 50%',
                  minWidth: 0,
                  p: 1.5,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    borderColor: alpha(theme.palette.primary.main, 0.15)
                  }
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {token1.name}
                  </Typography>
                  {(token1.exch || tokenExch1 || latestPrice1) && (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {formatTokenPrice(token1, token2, tokenExch1, latestPrice1)}
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ height: '80px', width: '100%' }}>
                  <Sparkline
                    url={`${BASE_URL}/sparkline/${token1.md5}?period=24h`}
                    style={{ width: '100%', height: '100%' }}
                    showGradient={true}
                    lineWidth={2}
                    animation={true}
                  />
                </Box>
              </Box>
            )}

            {token2 && (
              <Box
                sx={{
                  flex: '1 1 50%',
                  minWidth: 0,
                  p: 1.5,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    borderColor: alpha(theme.palette.primary.main, 0.15)
                  }
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {token2.name}
                  </Typography>
                  {(token2.exch || tokenExch2 || latestPrice2) && (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {formatTokenPrice(token2, token1, tokenExch2, latestPrice2)}
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ height: '80px', width: '100%' }}>
                  <Sparkline
                    url={`${BASE_URL}/sparkline/${token2.md5}?period=24h`}
                    style={{ width: '100%', height: '100%' }}
                    showGradient={true}
                    lineWidth={2}
                    animation={true}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default memo(Swap);
