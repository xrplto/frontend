import axios from 'axios';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import Decimal from 'decimal.js-light';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Set Decimal precision immediately after import
Decimal.set({ precision: 50 });

import { ClipLoader } from './Spinners';

// Lucide React Icons
import {
  Wallet as WalletIcon,
  ChevronDown,
  CheckCircle,
  X,
  ArrowLeftRight,
  Info as InfoIcon,
  Share2,
  Search,
  ArrowLeft,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  List
} from 'lucide-react';

// Utils
import { cn } from 'src/utils/cn';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// ============================================
// MUI Replacement Utilities
// ============================================
const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  return color;
};

// Simple styled replacement - returns a functional component
const styled = (Component) => (styleFn) => {
  const StyledComponent = ({ className, style, ...props }) => {
    const { themeName } = useContext(AppContext);
    const isDark = themeName === 'XrplToDarkTheme';
    const theme = createTheme(isDark);
    const styles = typeof styleFn === 'function' ? styleFn({ theme }) : styleFn;
    // Filter out pseudo-selectors for inline styles
    const inlineStyles = {};
    Object.entries(styles).forEach(([key, value]) => {
      if (!key.startsWith('&') && !key.startsWith('.')) {
        inlineStyles[key] = value;
      }
    });
    if (Component === 'div' || Component === Box) {
      return <div style={{ ...inlineStyles, ...style }} className={className} {...props} />;
    }
    if (Component === Image) {
      return <Image style={{ ...inlineStyles, ...style }} className={className} {...props} />;
    }
    if (Component === Stack) {
      return <Stack style={{ ...inlineStyles, ...style }} className={className} {...props} />;
    }
    if (Component === Typography) {
      return <span style={{ ...inlineStyles, ...style }} className={className} {...props} />;
    }
    if (Component === Chip) {
      return <Chip style={{ ...inlineStyles, ...style }} className={className} {...props} />;
    }
    return <Component style={{ ...inlineStyles, ...style }} className={className} {...props} />;
  };
  StyledComponent.displayName = `Styled(${Component?.displayName || Component?.name || 'Component'})`;
  return StyledComponent;
};

// Theme creator
const createTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    divider: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    primary: { main: '#4285f4' },
    text: { primary: isDark ? '#fff' : '#000', secondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
    background: { default: isDark ? '#121212' : '#fff', paper: isDark ? '#1e1e1e' : '#fff' },
    success: { main: '#4caf50' },
    error: { main: '#f44336' },
    warning: { main: '#ff9800' }
  },
  spacing: (...args) => args.length === 1 ? args[0] * 8 : args.map(v => v * 8 + 'px').join(' ')
});

// useTheme hook replacement
const useTheme = () => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  return createTheme(isDark);
};

// Basic MUI component replacements
const Box = ({ children, sx, style, className, component, onClick, ...props }) => {
  const Component = component || 'div';
  return <Component style={style} className={className} onClick={onClick} {...props}>{children}</Component>;
};

const Stack = ({ children, direction = 'column', spacing = 0, alignItems, justifyContent, style, className, ...props }) => (
  <div style={{
    display: 'flex',
    flexDirection: direction === 'row' ? 'row' : 'column',
    gap: spacing * 8,
    alignItems,
    justifyContent,
    ...style
  }} className={className} {...props}>{children}</div>
);

const Typography = ({ children, variant, sx, style, className, ...props }) => (
  <span style={style} className={className} {...props}>{children}</span>
);

const Chip = ({ label, onClick, style, className, ...props }) => (
  <span
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 12,
      fontSize: 10,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}
    className={className}
    {...props}
  >{label}</span>
);

const Button = ({ children, variant = 'text', size, fullWidth, disabled, onClick, sx, startIcon, style, className, ...props }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: size === 'small' ? '4px 10px' : '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outlined' ? '1px solid rgba(255,255,255,0.2)' : 'none',
    background: variant === 'contained' ? '#4285f4' : 'transparent',
    color: variant === 'contained' ? '#fff' : '#4285f4',
    ...style
  };
  return (
    <button style={baseStyle} disabled={disabled} onClick={onClick} className={className} {...props}>
      {startIcon}
      {children}
    </button>
  );
};

const IconButton = ({ children, onClick, size, disabled, style, className, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'transparent',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: size === 'small' ? 4 : 8,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      ...style
    }}
    className={className}
    {...props}
  >
    {children}
  </button>
);

// ShareIcon using lucide Share2
const ShareIcon = ({ sx }) => (
  <Share2 size={sx?.width || sx?.fontSize || 16} />
);

// ArrowDropDownIcon
const ArrowDropDownIcon = ({ sx, className }) => (
  <ChevronDown size={sx?.fontSize || 18} className={className} />
);

// Input component (MUI replacement)
const Input = ({ inputRef, placeholder, value, onChange, onFocus, onBlur, disableUnderline, sx, inputProps, ...props }) => (
  <input
    ref={inputRef}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={onBlur}
    style={{
      border: 'none',
      outline: 'none',
      background: 'transparent',
      width: '100%',
      fontSize: 'inherit',
      color: 'inherit',
      fontFamily: 'inherit',
      ...sx
    }}
    {...inputProps}
    {...props}
  />
);

// SwapHorizIcon using lucide ArrowLeftRight
const SwapHorizIcon = ({ sx }) => (
  <ArrowLeftRight size={sx?.width || sx?.fontSize || 20} />
);

// Toggle icons using lucide
const ToggleOnIcon = ({ sx }) => (
  <ToggleRight size={sx?.width || sx?.fontSize || 14} />
);

const ToggleOffIcon = ({ sx }) => (
  <ToggleLeft size={sx?.width || sx?.fontSize || 14} />
);

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';
import { processOrderbookOffers } from 'src/utils/parseUtils';
import useWebSocket from 'react-use-websocket';

// Components
import Wallet from 'src/components/Wallet';
import TransactionDetailsPanel from 'src/TokenDetail/dialogs/TransactionDetailsPanel';

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
const BASE_URL = 'https://api.xrpl.to/api';
const WSS_URL = 'wss://s1.ripple.com';
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';

const ExchangeButton = memo(({ onClick, disabled, children, isDark, className, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full rounded-xl border-[1.5px] px-4 py-3 text-[14px] font-normal tracking-wide transition-colors",
      disabled
        ? isDark
          ? "cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500"
          : "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
        : "border-primary bg-primary text-white hover:bg-primary/90",
      "sm:py-2.5 sm:text-[13px]",
      className
    )}
    {...props}
  >
    {children}
  </button>
));

const AllowButton = memo(({ onClick, children, isDark, className, ...props }) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-lg border-[1.5px] px-3 py-1 text-[11px] font-normal transition-all",
      "border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10",
      className
    )}
    {...props}
  >
    {children}
  </button>
));

const ToggleButton = memo(({ onClick, isDark, isSwitching, children, ...props }) => (
  <button
    onClick={onClick}
    className={cn(
      "absolute left-1/2 top-1/2 z-[2] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-lg border-[1.5px] transition-all",
      isDark ? "border-white/10 bg-black" : "border-gray-200 bg-white",
      "hover:border-primary hover:bg-primary hover:text-white",
      isSwitching && "rotate-180"
    )}
    {...props}
  >
    {children}
  </button>
));

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

const WalletDisplay = memo(({ isDark, children, ...props }) => (
  <div
    className={cn(
      "mb-2 flex items-center justify-between rounded-lg border-[1.5px] px-2.5 py-2 transition-colors",
      "border-green-500/10 bg-green-500/5 hover:border-green-500/20 hover:bg-green-500/10",
      "sm:mb-1.5 sm:px-2 sm:py-1.5"
    )}
    {...props}
  >
    {children}
  </div>
));

const WalletInfo = ({ children, ...props }) => (
  <div className="flex items-center gap-0.5" {...props}>
    {children}
  </div>
);

const WalletIconBox = ({ children, ...props }) => (
  <div
    className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/10 text-green-500"
    {...props}
  >
    {children}
  </div>
);

const WalletDetails = ({ children, ...props }) => (
  <div className="flex flex-col gap-0" {...props}>
    {children}
  </div>
);

const WalletAddress = ({ isDark, children, ...props }) => (
  <span
    className={cn(
      "text-[12px] font-medium leading-tight sm:text-[11px]",
      isDark ? "text-white" : "text-black"
    )}
    {...props}
  >
    {children}
  </span>
);

const WalletType = ({ children, ...props }) => (
  <span
    className="text-[10px] font-normal capitalize leading-tight text-green-500"
    {...props}
  >
    {children}
  </span>
);

const StatusIndicator = () => (
  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
);

// Token Selector Components
const MAX_RECENT_SEARCHES = 6;

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.divider, 0.08)
      : alpha(theme.palette.divider, 0.08)
  }`,
}));

const SelectTokenButton = styled(Stack)(({ theme }) => ({
  padding: '6px 10px',
  borderRadius: '12px',
  cursor: 'pointer',
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backdropFilter: 'blur(10px)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
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
  maxWidth: '540px',
  margin: '0 auto',
  maxHeight: '80vh',
  height: '600px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: 'none'
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  paddingBottom: theme.spacing(2)
}));

const TokenCard = styled(Box)(({ theme }) => ({
  padding: '12px',
  borderRadius: '12px',
  cursor: 'pointer',
  border: `1px solid transparent`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderColor: alpha(theme.palette.primary.main, 0.12)
  }
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: '12px',
  fontWeight: 400,
  fontSize: '10px',
  height: 24,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.4),
    backgroundColor: alpha(theme.palette.primary.main, 0.04)
  },
  '& .MuiChip-label': {
    paddingLeft: '8px',
    paddingRight: '8px'
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 400,
  fontSize: '10px',
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

  // Add slippage state (persist in localStorage)
  const [slippage, setSlippage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swap_slippage');
      return saved ? parseFloat(saved) : 3;
    }
    return 3;
  });
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('never'); // 'never', '1h', '24h', '7d', '30d', 'custom'
  const [customExpiry, setCustomExpiry] = useState(24); // hours for custom expiry
  const [showOrders, setShowOrders] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showDepthPanel, setShowDepthPanel] = useState(false);
  const amount1Ref = useRef(null);

  // Persist slippage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swap_slippage', slippage.toString());
    }
  }, [slippage]);

  // Orderbook state
  const [bids, setBids] = useState(propsBids || []);
  const [asks, setAsks] = useState(propsAsks || []);
  const [wsReady, setWsReady] = useState(false);
  const reqIDRef = useRef(1000);

  // WebSocket for orderbook
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WSS_URL, {
    onOpen: () => {
      setWsReady(true);
    },
    onClose: () => {
      setWsReady(false);
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000
  });

  // Fetch orderbook data via WebSocket
  useEffect(() => {
    if (!wsReady || !curr1 || !curr2) {
      return;
    }

    const sendRequest = () => {

      // Build taker_gets/taker_pays (use API currency as-is, omit issuer for XRP)
      const buildAmount = (token) => {
        if (token.currency === 'XRP') {
          return { currency: 'XRP' };
        }
        return {
          currency: token.currency,  // Use as-is from API (already hex if needed)
          issuer: token.issuer
        };
      };

      const cmdAsk = {
        id: reqIDRef.current,
        command: 'book_offers',
        taker_gets: buildAmount(curr1),
        taker_pays: buildAmount(curr2),
        ledger_index: 'validated',
        limit: 60
      };
      const cmdBid = {
        id: reqIDRef.current + 1,
        command: 'book_offers',
        taker_gets: buildAmount(curr2),
        taker_pays: buildAmount(curr1),
        ledger_index: 'validated',
        limit: 60
      };
      sendJsonMessage(cmdAsk);
      sendJsonMessage(cmdBid);
      reqIDRef.current += 2;
    };

    sendRequest();
    const timer = setInterval(sendRequest, 4000);
    return () => clearInterval(timer);
  }, [wsReady, curr1, curr2, sendJsonMessage]);

  // Process orderbook responses
  useEffect(() => {
    if (!lastJsonMessage) return;
    const msg = lastJsonMessage;
    if (msg.type === 'response' && msg.result?.offers) {
      const req = msg.id % 2;
      const processed = processOrderbookOffers(msg.result.offers, req === 1 ? 'asks' : 'bids');
      if (req === 1) {
        setAsks(processed);
      } else if (req === 0) {
        setBids(processed);
      }
    }
  }, [lastJsonMessage]);

  // Debug orderbook state
  useEffect(() => {
  }, [bids, asks]);

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
        const tokenIsRLUSD = token?.currency === '524C555344000000000000000000000000000000' || token?.name === 'RLUSD';

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
        .catch((err) => {});
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

      // TODO: Implement wallet-specific transaction signing here
      // Based on wallet_type (device, xumm, etc.)
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


  // Create trustline for missing currency
  const onCreateTrustline = async (currency) => {
    try {
      // TODO: Implement trustline creation
      openSnackbar(`Creating trustline for ${currency.currency}...`, 'info');
    } catch (error) {
      openSnackbar('Failed to create trustline', 'error');
    }
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
    if (value === '0' && amount1 === '') value = '0.';
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
    if (value === '0' && amount2 === '') value = '0.';
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
        openSnackbar('Swap link copied to clipboard!', 'success');
      } else {
        openSnackbar('Unable to generate share link', 'error');
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
        openSnackbar('Swap link copied to clipboard!', 'success');
      } catch (fallbackErr) {
        openSnackbar('Failed to copy link to clipboard', 'error');
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
      // Fetch more tokens and XRP data in parallel
      const [tokensRes, xrpRes] = await Promise.all([
        axios.get(`${BASE_URL}/tokens?start=0&limit=200&sortBy=vol24hxrp&sortType=desc&filter=`),
        axios.get(`${BASE_URL}/token/84e5efeb89c4eae8f68188982dc290d8`)
      ]);

      const tokenList = tokensRes.data?.tokens || [];

      // Use actual XRP data from API
      const xrpToken = xrpRes.data?.token || {
        md5: '84e5efeb89c4eae8f68188982dc290d8',
        name: 'XRP',
        user: 'XRP',
        issuer: 'XRPL',
        currency: 'XRP',
        ext: 'png',
        isOMCF: 'yes',
        exch: 1,
        marketcap: 65080887109,
        vol24hxrp: 3834501
      };

      setSelectorTokens([xrpToken, ...tokenList]);
      // Also set initial filtered tokens
      setFilteredTokens([xrpToken, ...tokenList]);
    } catch (err) {
      // Fallback XRP token on error
      const xrpToken = {
        md5: '84e5efeb89c4eae8f68188982dc290d8',
        name: 'XRP',
        user: 'XRP',
        issuer: 'XRPL',
        currency: 'XRP',
        ext: 'png',
        isOMCF: 'yes',
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
            // Find XRP from the loaded tokens or use default
            let xrpToken = selectorTokens.find(t => t.currency === 'XRP');
            if (!xrpToken) {
              xrpToken = {
                md5: '84e5efeb89c4eae8f68188982dc290d8',
                name: 'XRP',
                user: 'XRP',
                issuer: 'XRPL',
                currency: 'XRP',
                ext: 'png',
                isOMCF: 'yes',
                exch: 1
              };
            }

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
    <div
      key={token.md5}
      onClick={() => handleSelectToken(token, isToken1)}
      className={cn(
        "flex items-center px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors",
        darkMode
          ? "border-white/5 hover:bg-primary/5"
          : "border-gray-100 hover:bg-primary/5"
      )}
    >
      {/* Token Icon */}
      <div className="relative w-[30px] h-[30px] mr-3 flex-shrink-0">
        <img
          src={`https://s1.xrpl.to/token/${token.md5}`}
          alt={token.name}
          className={cn(
            "w-[30px] h-[30px] rounded-full object-cover",
            darkMode ? "bg-white/5" : "bg-gray-100"
          )}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {token.verified && (
          <div className={cn(
            "absolute -bottom-px -right-px w-[10px] h-[10px] rounded-full bg-primary border-[1.5px]",
            darkMode ? "border-black" : "border-white"
          )} />
        )}
      </div>

      {/* Token Name & Issuer */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-normal leading-tight truncate", darkMode ? "text-white" : "text-gray-900")}>
          {token.name || token.currency}
        </p>
        <p className={cn("text-[10px] truncate opacity-60", darkMode ? "text-white/60" : "text-gray-500")}>
          {token.user || 'Unknown'}
        </p>
      </div>

      {/* Price */}
      <div className="w-[110px] text-right flex-shrink-0 mr-3">
        <span className={cn("text-[11px] font-normal tabular-nums whitespace-nowrap", darkMode ? "text-white" : "text-gray-900")}>
          {(() => {
            if (token.currency === 'XRP') return '1.0000 XRP';
            if (!token.exch && token.exch !== 0) return '0 XRP';
            let price = Number(token.exch);
            if (isNaN(price) || price === 0) return '0 XRP';
            if (price >= 10000) return `${price.toLocaleString('en-US', { maximumFractionDigits: 0 })} XRP`;
            if (price >= 1) return `${price.toFixed(4)} XRP`;
            if (price >= 0.01) return `${price.toFixed(6)} XRP`;
            if (price >= 0.0001) return `${price.toFixed(8)} XRP`;
            if (price >= 0.000001) return `${price.toFixed(10)} XRP`;
            if (price >= 0.00000001) return `${price.toFixed(12)} XRP`;
            return `${price.toFixed(15).replace(/\.?0+$/, '')} XRP`;
          })()}
        </span>
      </div>

      {/* Volume */}
      <div className="w-[65px] text-right flex-shrink-0 mr-3">
        <span className={cn("text-[10px] font-normal tabular-nums whitespace-nowrap", darkMode ? "text-white/60" : "text-gray-500")}>
          {(() => {
            if (!token.vol24hxrp) return '0';
            const vol = parseFloat(token.vol24hxrp);
            if (vol >= 1000000000) return `${(vol / 1000000000).toFixed(1)}B`;
            if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
            if (vol >= 10000) return `${(vol / 1000).toFixed(0)}K`;
            if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
            if (vol >= 1) return vol.toFixed(0);
            return vol.toFixed(1);
          })()}
        </span>
      </div>

      {/* Market Cap */}
      <div className="w-[70px] text-right flex-shrink-0">
        <span className={cn("text-[13px] font-normal tabular-nums", darkMode ? "text-white/60" : "text-gray-500")}>
          {(() => {
            if (!token.marketcap) return '0';
            const mcap = parseFloat(token.marketcap);
            if (mcap >= 1000000000) return `${(mcap / 1000000000).toFixed(1)}B`;
            if (mcap >= 1000000) return `${(mcap / 1000000).toFixed(1)}M`;
            if (mcap >= 10000) return `${(mcap / 1000).toFixed(0)}K`;
            if (mcap >= 1000) return `${(mcap / 1000).toFixed(1)}K`;
            if (mcap >= 1) return mcap.toFixed(0);
            return mcap.toFixed(1);
          })()}
        </span>
      </div>
    </div>
  );

  const renderTokenSelector = (token, onClickToken, panelTitle) => {
    if (!token) return null;

    const { md5 = '', name = 'Select Token', kyc = false } = token;
    const imgUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : '/static/alt.webp';

    return (
      <button
        onClick={onClickToken}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
          "border-[1.5px] bg-transparent cursor-pointer",
          darkMode
            ? "border-white/10 hover:border-primary/30 hover:bg-white/[0.02]"
            : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
        )}
        style={{ background: 'transparent' }}
      >
        <div className="relative flex-shrink-0">
          <img
            src={imgUrl}
            width={32}
            height={32}
            alt={name || 'Token'}
            className="rounded-full"
            onError={(e) => (e.target.src = '/static/alt.webp')}
          />
          {kyc && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
              <span className="text-[6px] text-white">✓</span>
            </div>
          )}
        </div>
        <span className={cn(
          "text-[14px] font-normal",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          {name || 'Select'}
        </span>
        <ChevronDown size={16} className="text-primary ml-auto" />
      </button>
    );
  };

  const renderTokenSelectorPanel = (currentToken, title, isToken1, onClose) => (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1200]"
      />

      {/* Modal Panel */}
      <div
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[720px] h-[90vh] max-h-[750px] rounded-xl border-[1.5px] flex flex-col z-[1201]",
          darkMode ? "bg-black border-white/10" : "bg-white border-gray-200"
        )}
      >
        {/* Header */}
        <div className={cn("p-2 border-b flex items-center justify-between", darkMode ? "border-white/10" : "border-gray-200")}>
          <span className={cn("text-[13px] font-normal", darkMode ? "text-white" : "text-gray-900")}>{title}</span>
          <button onClick={onClose} className={cn("p-1 rounded-lg hover:bg-white/5", darkMode ? "text-white/60" : "text-gray-500")}>
            <X size={18} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className={cn("p-2 border-b", darkMode ? "border-white/10" : "border-gray-200")}>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full px-3 py-2 text-[13px] rounded-xl border-[1.5px] bg-transparent outline-none transition-colors",
                darkMode
                  ? "border-white/10 text-white placeholder:text-white/40 focus:border-primary"
                  : "border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-[16px] hover:opacity-80",
                  darkMode ? "text-white/50" : "text-gray-400"
                )}
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-2 py-1 text-[10px] rounded-lg border-[1.5px] transition-colors",
                  selectedCategory === cat.value
                    ? "bg-primary/10 text-primary border-primary/30"
                    : darkMode
                      ? "text-white/50 border-white/10 hover:border-primary/30 hover:bg-primary/5"
                      : "text-gray-500 border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {/* Recent Tokens */}
          {!searchQuery && recentTokens.length > 0 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <SectionTitle>Recent</SectionTitle>
                <button
                  onClick={handleClearRecent}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className={cn("rounded-lg border", darkMode ? "border-white/5" : "border-gray-100")}>
                {recentTokens.map((token) => renderTokenItem(token, isToken1))}
              </div>
            </div>
          )}

          {/* Token List */}
          <div>
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
              <div>
                {[...Array(12)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex items-center px-2 py-1 mb-1 rounded-lg opacity-60 animate-pulse">
                    <div className={cn("w-7 h-7 rounded-full mr-2", darkMode ? "bg-white/10" : "bg-gray-200")} />
                    <div className="flex-1">
                      <div className={cn("h-2 w-[40%] rounded mb-1", darkMode ? "bg-white/10" : "bg-gray-200")} />
                      <div className={cn("h-1.5 w-[25%] rounded", darkMode ? "bg-white/10" : "bg-gray-200")} />
                    </div>
                    <div className={cn("h-2 w-[90px] rounded mr-3", darkMode ? "bg-white/10" : "bg-gray-200")} />
                    <div className={cn("h-1.5 w-[55px] rounded mr-3", darkMode ? "bg-white/10" : "bg-gray-200")} />
                    <div className={cn("h-1.5 w-[45px] rounded", darkMode ? "bg-white/10" : "bg-gray-200")} />
                  </div>
                ))}
              </div>
            ) : filteredTokens.length > 0 ? (
              <div>
                {/* Column Headers */}
                <div className={cn("flex items-center px-2 py-1 mb-1 border-b", darkMode ? "border-white/10" : "border-gray-200")}>
                  <span className={cn("flex-1 text-[9px] font-normal uppercase tracking-wide", darkMode ? "text-white/30" : "text-gray-400")}>Token</span>
                  <span className={cn("w-[110px] text-right mr-3 text-[9px] font-normal uppercase tracking-wide", darkMode ? "text-white/30" : "text-gray-400")}>Price</span>
                  <span className={cn("w-[65px] text-right mr-3 text-[9px] font-normal uppercase tracking-wide", darkMode ? "text-white/30" : "text-gray-400")}>Volume</span>
                  <span className={cn("w-[55px] text-right text-[9px] font-normal uppercase tracking-wide", darkMode ? "text-white/30" : "text-gray-400")}>MCap</span>
                </div>
                {/* Token list */}
                {filteredTokens.slice(0, 100).map((token) => renderTokenItem(token, isToken1))}
              </div>
            ) : (
              <div className={cn("p-6 text-center rounded-lg", darkMode ? "bg-white/5" : "bg-gray-50")}>
                <p className={cn("text-[15px] mb-1", darkMode ? "text-white/60" : "text-gray-500")}>No tokens found</p>
                <p className={cn("text-[13px]", darkMode ? "text-white/40" : "text-gray-400")}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No tokens available in this category'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Check if we should show token selector
  const showTokenSelector = panel1Open || panel2Open;
  const currentSelectorToken = panel1Open ? token1 : token2;
  const selectorTitle = panel1Open ? 'Select token to swap from' : 'Select token to receive';
  const isToken1Selector = panel1Open;

  // Auto-focus first input when modal closes
  useEffect(() => {
    if (amount1Ref.current && !showTokenSelector) {
      setTimeout(() => amount1Ref.current?.focus(), 100);
    }
  }, [showTokenSelector]);

  return (
    <div className="w-full">
      {/* Token Selector Modal */}
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

      {/* Swap UI */}
      {!showTokenSelector && (
        <div className="flex items-start justify-center gap-4 mx-auto">
          {/* Swap Container */}
          <div className={cn(
            "w-full max-w-[460px] rounded-xl border-[1.5px] overflow-hidden flex-shrink-0",
            darkMode ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-white"
                )}>
                  {/* Header with Market/Limit Tabs */}
                  <div className={cn(
                    "flex items-center justify-between p-2 border-b",
                    darkMode ? "border-white/5" : "border-gray-100"
                  )}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setOrderType('market'); setShowOrders(false); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors",
                          orderType === 'market'
                            ? "bg-primary text-white"
                            : darkMode ? "text-white/60 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        Market
                      </button>
                      <button
                        onClick={() => { setOrderType('limit'); setShowOrders(false); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors",
                          orderType === 'limit'
                            ? "bg-primary text-white"
                            : darkMode ? "text-white/60 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        Limit
                      </button>
                    </div>
                    <button
                      onClick={handleShareUrl}
                      aria-label="Share swap URL"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        darkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
                      )}
                    >
                      <Share2 size={16} className={darkMode ? "text-white/60" : "text-gray-400"} />
                    </button>
                  </div>

                  <div className="p-4">
                    {/* First Token - You Pay */}
                    <div className={cn(
                      "rounded-xl border-[1.5px] p-4 transition-colors",
                      focusTop
                        ? "border-primary/40"
                        : darkMode ? "border-white/10" : "border-gray-200",
                      darkMode ? "bg-white/[0.02]" : "bg-gray-50/50"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn(
                          "text-[11px] font-normal uppercase tracking-wide",
                          darkMode ? "text-white/50" : "text-gray-400"
                        )}>
                          You pay
                        </span>
                        {isLoggedIn && accountPairBalance && (
                          <span className={cn(
                            "text-[11px]",
                            darkMode ? "text-white/40" : "text-gray-400"
                          )}>
                            Balance: {fNumber(revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        {renderTokenSelector(token1, () => setPanel1Open(true), 'Select token')}
                        <div className="flex-1 text-right">
                          <input
                            ref={amount1Ref}
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount1}
                            onChange={handleChangeAmount1}
                            onFocus={() => setFocusTop(true)}
                            onBlur={() => setFocusTop(false)}
                            className={cn(
                              "w-full text-right text-2xl sm:text-3xl font-normal bg-transparent border-none outline-none",
                              darkMode ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-300"
                            )}
                          />
                          <span className={cn(
                            "text-[11px] block mt-1",
                            darkMode ? "text-white/40" : "text-gray-400"
                          )}>
                            {tokenPrice1 > 0 ? `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice1)}` : '\u00A0'}
                          </span>
                        </div>
                      </div>
                      {isLoggedIn && accountPairBalance && (revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value) > 0 && (
                        <div className="flex gap-1.5 mt-3 justify-end">
                          {[25, 50, 100].map((percent) => (
                            <button
                              key={percent}
                              onClick={() => {
                                const balance = revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value;
                                const newAmount = percent === 100 ? balance.toString() : ((balance * percent) / 100).toFixed(6);
                                handleChangeAmount1({ target: { value: newAmount } });
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-normal transition-colors",
                                darkMode
                                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                                  : "text-primary bg-primary/5 hover:bg-primary/10"
                              )}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Swap Toggle */}
                    <div className="relative h-5 my-2 flex items-center justify-center">
                      <button
                        onClick={onRevertExchange}
                        disabled={isSwitching}
                        title="Switch currencies (Alt + S)"
                        className={cn(
                          "w-8 h-8 rounded-lg border-[1.5px] flex items-center justify-center transition-all",
                          darkMode
                            ? "border-white/10 bg-black hover:border-primary hover:bg-primary hover:text-white"
                            : "border-gray-200 bg-white hover:border-primary hover:bg-primary hover:text-white",
                          isSwitching && "rotate-180"
                        )}
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                    </div>

                    {/* Second Token - You Receive */}
                    <div className={cn(
                      "rounded-xl border-[1.5px] p-4 transition-colors",
                      focusBottom
                        ? "border-primary/40"
                        : darkMode ? "border-white/10" : "border-gray-200",
                      darkMode ? "bg-white/[0.02]" : "bg-gray-50/50"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn(
                          "text-[11px] font-normal uppercase tracking-wide",
                          darkMode ? "text-white/50" : "text-gray-400"
                        )}>
                          You receive
                        </span>
                        {isLoggedIn && accountPairBalance && (
                          <span className={cn(
                            "text-[11px]",
                            darkMode ? "text-white/40" : "text-gray-400"
                          )}>
                            Balance: {fNumber(revert ? accountPairBalance?.curr1.value : accountPairBalance?.curr2.value)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        {renderTokenSelector(token2, () => setPanel2Open(true), 'Select token')}
                        <div className="flex-1 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount1 === '' ? '' : amount2}
                            onChange={handleChangeAmount2}
                            onFocus={() => setFocusBottom(true)}
                            onBlur={() => setFocusBottom(false)}
                            className={cn(
                              "w-full text-right text-2xl sm:text-3xl font-normal bg-transparent border-none outline-none",
                              darkMode ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-300"
                            )}
                          />
                          <span className={cn(
                            "text-[11px] block mt-1",
                            darkMode ? "text-white/40" : "text-gray-400"
                          )}>
                            {tokenPrice2 > 0 ? `≈ ${currencySymbols[activeFiatCurrency]}${fNumber(tokenPrice2)}` : '\u00A0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Buttons - Shows only for Limit orders */}
                    {orderType === 'limit' && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setShowOrderbook(!showOrderbook);
                            }}
                            startIcon={
                              showOrderbook ? (
                                <ToggleOnIcon sx={{ width: 14, height: 14 }} />
                              ) : (
                                <ToggleOffIcon sx={{ width: 14, height: 14 }} />
                              )
                            }
                            sx={{
                              py: 0.5,
                              fontSize: '10px',
                              textTransform: 'none',
                              borderColor: showOrderbook
                                ? theme.palette.primary.main
                                : alpha(theme.palette.divider, 0.2),
                              color: showOrderbook
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                              backgroundColor: showOrderbook
                                ? alpha(theme.palette.primary.main, 0.04)
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
                                py: 0.5,
                                fontSize: '10px',
                                textTransform: 'none',
                                borderColor: showOrders
                                  ? theme.palette.primary.main
                                  : alpha(theme.palette.divider, 0.2),
                                color: showOrders
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                                backgroundColor: showOrders
                                  ? alpha(theme.palette.primary.main, 0.04)
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

                    {/* Market Order UI - Slippage */}
                    {orderType === 'market' && (
                      <div className="mt-3 flex items-center justify-between px-1">
                        <span className={cn("text-[11px]", darkMode ? "text-white/40" : "text-gray-400")}>
                          Slippage
                        </span>
                        <div className="flex gap-1">
                          {[0.5, 1, 3].map((val) => (
                            <button
                              key={val}
                              onClick={() => setSlippage(val)}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[11px] font-normal transition-colors",
                                slippage === val
                                  ? "bg-primary text-white"
                                  : darkMode
                                    ? "text-white/60 hover:text-white hover:bg-white/5"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              )}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limit Order UI */}
                    {orderType === 'limit' && (
                      <Box
                        sx={{
                          mt: 1.5,
                          mb: 1.5,
                          p: 1,
                          borderRadius: '12px',
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
                                  fontSize: '13px',
                                  fontWeight: 400,
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
                                  fontSize: '10px',
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
                                borderRadius: '12px',
                                padding: '8px 12px',
                                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                input: {
                                  fontSize: '13px',
                                  fontWeight: 400,
                                  fontFamily:
                                    'inherit'
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

                          {/* Quick Price & Expiry - Inline */}
                          <div className="flex items-center gap-2 mt-2">
                            {bids[0] && (
                              <button
                                onClick={() => setLimitPrice(bids[0].price.toFixed(6))}
                                className="px-2 py-1 rounded-md text-[10px] text-green-500 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                              >
                                Bid {bids[0].price.toFixed(4)}
                              </button>
                            )}
                            {asks[0] && (
                              <button
                                onClick={() => setLimitPrice(asks[0].price.toFixed(6))}
                                className="px-2 py-1 rounded-md text-[10px] text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                              >
                                Ask {asks[0].price.toFixed(4)}
                              </button>
                            )}
                            <div className="flex-1" />
                            <div className="flex gap-1">
                              {[{ value: 'never', label: '∞' }, { value: '1h', label: '1h' }, { value: '24h', label: '1d' }, { value: '7d', label: '7d' }].map((exp) => (
                                <button
                                  key={exp.value}
                                  onClick={() => setOrderExpiry(exp.value)}
                                  className={cn(
                                    "px-2 py-1 rounded-md text-[10px] transition-colors",
                                    orderExpiry === exp.value
                                      ? "bg-primary text-white"
                                      : darkMode ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                                  )}
                                >
                                  {exp.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Price difference indicator */}
                          {limitPrice && parseFloat(limitPrice) > 0 && (() => {
                            const limit = parseFloat(limitPrice);
                            const currentPrice = !revert ? (asks[0]?.price || 0) : (bids[0]?.price || 0);
                            if (currentPrice <= 0) return null;
                            const priceDiff = ((limit - currentPrice) / currentPrice) * 100;
                            const isAbove = priceDiff > 0;
                            return (
                              <div className={cn(
                                "mt-2 px-2 py-1.5 rounded-md text-[10px]",
                                isAbove ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                              )}>
                                {isAbove ? '↑' : '↓'} {Math.abs(priceDiff).toFixed(2)}% {isAbove ? 'above' : 'below'} {!revert ? 'ask' : 'bid'}
                              </div>
                            );
                          })()}

                          {/* Show Order Book Button */}
                          <button
                            onClick={() => setShowOrderbook(!showOrderbook)}
                            className={cn(
                              "w-full mt-2 py-1.5 rounded-md text-[11px] transition-colors",
                              darkMode ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                            )}
                          >
                            {showOrderbook ? 'Hide' : 'Show'} Order Book
                          </button>
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
                              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                              overflow: 'hidden',
                              backgroundColor: alpha(theme.palette.background.paper, 0.04)
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
                            p: 1,
                            borderRadius: '12px',
                            backgroundColor: alpha(theme.palette.background.paper, 0.04),
                            border: `1px solid ${alpha(theme.palette.divider, 0.04)}`
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
                              sx={{ fontSize: '13px', color: theme.palette.text.secondary }}
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
                                  fontSize="11px"
                                >
                                  {orderType === 'limit' ? 'Sell Order' : 'You Pay'}
                                </Typography>
                                <Typography variant="caption" fontWeight={400} fontSize="12px">
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
                                  fontSize="11px"
                                >
                                  {orderType === 'limit' ? 'To Buy' : 'You Receive'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontWeight={400}
                                  fontSize="12px"
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
                                  fontSize="11px"
                                >
                                  {orderType === 'limit'
                                    ? `${token1.name} at Rate`
                                    : 'Exchange Rate'}
                                </Typography>
                                <Typography variant="caption" fontWeight={400} fontSize="12px">
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
                                      fontSize="11px"
                                    >
                                      Order Type
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={400}
                                      fontSize="12px"
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
                                      fontSize="11px"
                                    >
                                      Expiry
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={400}
                                      fontSize="12px"
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
                                    fontSize="11px"
                                  >
                                    Max Slippage
                                  </Typography>
                                  <Typography variant="caption" fontWeight={400} fontSize="12px">
                                    {slippage}%
                                  </Typography>
                                </Stack>
                              )}

                              {/* Platform Fee */}
                              <Divider
                                sx={{ my: 0.5, borderColor: alpha(theme.palette.divider, 0.04) }}
                              />
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontSize="11px"
                                >
                                  Network Fee
                                </Typography>
                                <Typography variant="caption" fontWeight={400} fontSize="12px">
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
                              borderRadius: '12px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.04),
                              border: `1px solid ${alpha(theme.palette.divider, 0.04)}`
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              Price Impact
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: getPriceImpactColor(Math.abs(priceImpact)),
                                  fontWeight: 400,
                                  fontSize: '10px'
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
                    <div className="mt-4">
                      {accountProfile && accountProfile.account ? (
                        <button
                          onClick={handlePlaceOrder}
                          disabled={
                            isProcessing === 1 ||
                            !isLoggedIn ||
                            (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                          }
                          className={cn(
                            "w-full py-3 rounded-xl text-[14px] font-normal transition-colors border-[1.5px]",
                            isProcessing === 1 || !isLoggedIn || (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
                              ? darkMode
                                ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-primary bg-primary text-white hover:bg-primary/90"
                          )}
                        >
                          {handleMsg()}
                        </button>
                      ) : (
                        <Wallet
                          style={{ width: '100%' }}
                          buttonOnly={true}
                        />
                      )}
                    </div>
                  </div>
          </div>

          {/* Orderbook on right side */}
          {showOrderbook && orderType === 'limit' && (
            <div className={cn(
              "w-[300px] flex-shrink-0 hidden md:block rounded-xl border-[1.5px] overflow-hidden",
              darkMode ? "border-white/10 bg-black" : "border-gray-200 bg-white"
            )}>
              <div className={cn(
                "px-3 py-2 border-b text-[12px] font-normal",
                darkMode ? "border-white/10 text-white/70" : "border-gray-100 text-gray-600"
              )}>
                Order Book
              </div>
              <div className="flex text-[10px] px-2 py-1.5 border-b" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <span className={cn("flex-1", darkMode ? "text-white/40" : "text-gray-400")}>Price</span>
                <span className={cn("flex-1 text-right", darkMode ? "text-white/40" : "text-gray-400")}>Amount</span>
                <span className={cn("flex-1 text-right", darkMode ? "text-white/40" : "text-gray-400")}>Total</span>
              </div>
              {/* Asks */}
              <div className="max-h-[280px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {asks.slice(0, 15).reverse().map((ask, idx) => (
                  <div
                    key={`ask-${idx}`}
                    onClick={() => setLimitPrice(ask.price.toString())}
                    className={cn(
                      "flex px-2 py-1 text-[11px] cursor-pointer hover:bg-red-500/10",
                      darkMode ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    <span className="flex-1 text-red-500">{ask.price?.toFixed(6)}</span>
                    <span className="flex-1 text-right">{ask.amount?.toFixed(2)}</span>
                    <span className={cn("flex-1 text-right", darkMode ? "text-white/50" : "text-gray-500")}>{ask.total?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {/* Spread */}
              <div className={cn(
                "px-2 py-1.5 text-[11px] text-center border-y",
                darkMode ? "border-white/10 bg-white/[0.02] text-white/60" : "border-gray-100 bg-gray-50 text-gray-500"
              )}>
                Spread: {asks[0] && bids[0] ? ((asks[0].price - bids[0].price) / asks[0].price * 100).toFixed(2) : '0.00'}%
              </div>
              {/* Bids */}
              <div className="max-h-[280px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {bids.slice(0, 15).map((bid, idx) => (
                  <div
                    key={`bid-${idx}`}
                    onClick={() => setLimitPrice(bid.price.toString())}
                    className={cn(
                      "flex px-2 py-1 text-[11px] cursor-pointer hover:bg-green-500/10",
                      darkMode ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    <span className="flex-1 text-green-500">{bid.price?.toFixed(6)}</span>
                    <span className="flex-1 text-right">{bid.amount?.toFixed(2)}</span>
                    <span className={cn("flex-1 text-right", darkMode ? "text-white/50" : "text-gray-500")}>{bid.total?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(Swap);
