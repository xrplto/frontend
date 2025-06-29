import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { ClipLoader } from 'react-spinners';

// Set Decimal precision immediately after import
Decimal.set({ precision: 50 });
import { LazyLoadImage } from 'react-lazy-load-image-component';
import SparklineChart from 'src/components/SparklineChart';
import useWebSocket from 'react-use-websocket';

// Material
import { withStyles } from '@mui/styles';
import {
  alpha,
  styled,
  useTheme,
  Button,
  IconButton,
  Input,
  Stack,
  Typography,
  Snackbar,
  Alert,
  AlertTitle,
  CircularProgress,
  Box,
  Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

// Iconify
import { Icon } from '@iconify/react';
import exchangeIcon from '@iconify/icons-uil/exchange';
import infoFill from '@iconify/icons-eva/info-fill';
import shareIcon from '@iconify/icons-uil/share-alt';
import copyIcon from '@iconify/icons-uil/copy';

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

// Router
import { useRouter } from 'next/router';

const CurrencyContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin-left: 10px;
    margin-right: 10px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: row;
    padding: 20px 32px;
    border-radius: 10px;
    -webkit-box-align: center;
    align-items: center;
    background-color: #000000;
    &:not(:first-of-type) {
      margin-top: 2px;
    }
    
    @media (max-width: 600px) {
      padding: 16px 24px;
      margin-left: 8px;
      margin-right: 8px;
    }
    
    @media (min-width: 900px) {
      padding: 24px 40px;
      margin-left: 16px;
      margin-right: 16px;
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
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
    border-radius: 24px;
    display: flex;
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%);
    backdropFilter: blur(20px);
    border: 1px solid ${alpha(theme.palette.divider, 0.08)};
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.04
    )};
    padding-bottom: 10px;
    position: relative;
    overflow: visible;

    &::before {
      content: "";
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      height: 3px;
      background: linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(
        theme.palette.success.main,
        0.4
      )}, ${alpha(theme.palette.info.main, 0.4)});
      opacity: 0.6;
      border-radius: 24px 24px 0 0;
      z-index: 10;
    }

    @media (max-width: 600px) {
        border-right: none;
        border-left: none;
        border-image: initial;
        border-radius: unset;
        border-top: 1px solid ${
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        };
        border-bottom: 1px solid ${
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        };
        
        &::before {
          display: none;
        }
    }
    
    @media (min-width: 900px) {
        border-radius: 28px;
        padding-bottom: 16px;
        
        &::before {
          border-radius: 28px 28px 0 0;
        }
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

const ToggleContent = styled('div')(
  ({ theme }) => `
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 51%;
    transform: translate(-50%, -50%);
    margin-top: 14px;
`
);

const ExchangeButton = styled(Button)(
  ({ theme }) => `
    @media (max-width: 600px) {
        margin-left: 10px;
        margin-right: 10px;
    }
    @media (min-width: 900px) {
        margin-left: 16px;
        margin-right: 16px;
        padding: 12px 32px;
        border-radius: 16px;
        min-height: 60px;
        font-size: 20px;
    }
    position: relative;
    overflow: hidden;
    padding: 8px 24px;
    border-radius: 12px;
    transition: all 0.3s ease;
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

const TrustlineWarning = styled('div')(
  ({ theme }) => `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin: 0 16px 8px;
    border-radius: 8px;
    background: ${alpha(theme.palette.warning.main, 0.1)};
    border: 1px solid ${alpha(theme.palette.warning.main, 0.3)};
    
    @media (max-width: 600px) {
      margin: 0 10px 8px;
      padding: 10px 14px;
      gap: 10px;
      flex-direction: column;
      align-items: flex-start;
    }
`
);

const TrustlineButton = styled(Button)(
  ({ theme }) => `
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    min-width: 90px;
    height: 32px;
    text-transform: none;
    
    background: ${theme.palette.warning.main};
    color: ${theme.palette.warning.contrastText};
    
    &:hover {
      background: ${theme.palette.warning.dark};
    }
    
    &:disabled {
      background: ${alpha(theme.palette.warning.main, 0.5)};
      color: ${alpha(theme.palette.warning.contrastText, 0.7)};
    }
    
    @media (max-width: 600px) {
      width: 100%;
      padding: 8px 12px;
      height: 36px;
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

export default function Swap({ pair, setPair, revert, setRevert }) {
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
  const [transactionType, setTransactionType] = useState('OfferCreate');

  // Add slippage state
  const [slippage, setSlippage] = useState(5); // Default 5% slippage

  // Add state for latest sparkline prices
  const [latestPrice1, setLatestPrice1] = useState(null);
  const [latestPrice2, setLatestPrice2] = useState(null);

  const amount = revert ? amount2 : amount1;
  let value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;
  const tokenPrice1 = (() => {
    try {
      return new Decimal(tokenExch1 || 0)
        .mul(amount1 || 0)
        .div(metrics[activeFiatCurrency] || 1)
        .toNumber();
    } catch (e) {
      return 0;
    }
  })();
  const tokenPrice2 = (() => {
    try {
      return new Decimal(tokenExch2 || 0)
        .mul(amount2 || 0)
        .div(metrics[activeFiatCurrency] || 1)
        .toNumber();
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

  // const color1 = revert?theme.currency.background2:theme.currency.background1;
  // const color2 = revert?theme.currency.background1:theme.currency.background2;
  var color1, color2;
  if (typeof theme.currency !== 'undefined') {
    // webxtor SEO fix
    /*const */ color1 = theme.currency.background2;
    /*const */ color2 = theme.currency.background2;
  }

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

            // Debug logging for balance check
            console.log('Balance check debug:', {
              revert,
              amount1,
              amount2,
              spendingAmount,
              availableBalance,
              accountAmount: accountAmount,
              accountValue: accountValue,
              curr1Currency: curr1?.currency,
              curr2Currency: curr2?.currency,
              spendingCurrency: revert ? curr2?.currency : curr1?.currency,
              sufficientBalance: availableBalance >= spendingAmount
            });

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
          console.log('Error on getting details!!!', err);
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

            console.log(
              `Found ${totalTrustlines} total trustlines, fetched ${allTrustlines.length} on page ${currentPage}`
            );

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
                  console.log(
                    `Fetched ${response.data.lines.length} trustlines from page ${index + 1}`
                  );
                }
              });

              console.log(
                `Total trustlines fetched: ${allTrustlines.length} out of ${totalTrustlines}`
              );
            }

            return allTrustlines;
          }

          return [];
        } catch (error) {
          console.log('Error fetching trustlines:', error);
          return [];
        }
      };

      fetchAllTrustlines()
        .then((allTrustlines) => {
          setTrustlines(allTrustlines);

          // Debug: Log the first trustline to understand the structure
          if (allTrustlines.length > 0) {
            console.log('Trustline structure:', allTrustlines[0]);
          }

          // Debug: Log what we're looking for
          console.log('Looking for trustlines:', {
            curr1: {
              currency: curr1.currency,
              issuer: curr1.issuer,
              tokenName: token1?.name
            },
            curr2: {
              currency: curr2.currency,
              issuer: curr2.issuer,
              tokenName: token2?.name
            }
          });

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
              console.log(`Currency match for ${curr1.currency}:`, {
                expectedCurrency: curr1.currency,
                expectedIssuer: curr1.issuer,
                lineCurrencies,
                lineIssuers: [line._token1, line._token2, line.Balance?.issuer],
                issuerMatch,
                currencyMatch,
                isStandardCurrency,
                hasValidTrustline: currencyMatch && (issuerMatch || isStandardCurrency)
              });

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

              // Debug specific currency matches
              console.log(`Currency match for ${curr2.currency}:`, {
                expectedCurrency: curr2.currency,
                expectedIssuer: curr2.issuer,
                lineCurrencies,
                lineIssuers: [line._token1, line._token2, line.Balance?.issuer],
                issuerMatch,
                currencyMatch,
                isStandardCurrency,
                hasValidTrustline: currencyMatch && (issuerMatch || isStandardCurrency)
              });

              return currencyMatch && (issuerMatch || isStandardCurrency);
            });

          console.log('Trustline check results:', {
            curr1: curr1.currency,
            curr1Issuer: curr1.issuer,
            hasCurr1Trustline,
            curr2: curr2.currency,
            curr2Issuer: curr2.issuer,
            hasCurr2Trustline,
            totalLines: allTrustlines.length
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
          console.log('Available currencies in trustlines:', availableCurrencies);

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
            console.log('Found SCRAP-like currencies:', scrapLikeCurrencies);
          } else {
            console.log('No SCRAP-like currencies found in trustlines');
          }
        })
        .catch((err) => {
          console.log('Error getting trustlines:', err);
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
      console.log('Error fetching sparkline data:', error);
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

      console.log('Fetching token prices:', {
        token1: { name: token1.name, currency: token1.currency, md5: md51 },
        token2: { name: token2.name, currency: token2.currency, md5: md52 }
      });

      // https://api.xrpl.to/api/pair_rates?md51=84e5efeb89c4eae8f68188982dc290d8&md52=c9ac9a6c44763c1bd9ccc6e47572fd26
      axios
        .get(`${BASE_URL}/pair_rates?md51=${md51}&md52=${md52}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          console.log('Token price API response:', ret);
          if (ret) {
            console.log('Setting token exchange rates:', {
              rate1: ret.rate1,
              rate2: ret.rate2,
              previousRate1: tokenExch1,
              previousRate2: tokenExch2
            });
            setTokenExch1(ret.rate1 || 0);
            setTokenExch2(ret.rate2 || 0);
          }
        })
        .catch((err) => {
          console.log('Error on getting token info!', err);
        })
        .then(function () {
          // always executed
          setLoadingPrice(false);
        });
    }
    getTokenPrice();
  }, [token1, amount1, token2, amount2]);

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
      // console.log(counter + " " + isRunning, uuid);
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

  const onOfferCreateXumm = async () => {
    try {
      // const curr1 = revert?pair.curr2:pair.curr1;
      // const curr2 = revert?pair.curr1:pair.curr2;
      const curr1 = pair.curr1;
      const curr2 = pair.curr2;
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      const PaymentFlags = {
        tfPartialPayment: 131072,
        tfLimitQuality: 65536,
        tfNoDirectRipple: 1048576
      };

      const Flags = PaymentFlags.tfPartialPayment;

      let Amount, SendMax;

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
      let DeliverMin, DeliverMax;

      // DeliverMax is the same as Amount (what we want to receive)
      DeliverMax = Amount;

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

      const body = {
        TransactionType: 'Payment',
        Account,
        Destination: Account,
        Amount,
        DeliverMax,
        DeliverMin,
        SendMax,
        Flags,
        user_token,
        Fee: '12',
        SourceTag: 93339333
      };

      let memoData = `Swap via https://xrpl.to`;

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          setTransactionType('Payment'); // Set correct transaction type for swaps
          const res = await axios.post(`${BASE_URL}/offer/payment`, {
            ...body,
            Memos: configureMemos('', '', memoData)
          });

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
              let paymentTxData = {
                TransactionType: 'Payment',
                Account,
                Destination: Account,
                Amount,
                DeliverMax,
                DeliverMin,
                SendMax,
                Flags,
                Fee: '12',
                SourceTag: 93339333,
                Memos: configureMemos('', '', memoData)
              };

              dispatch(updateProcess(1));

              await submitTransaction({
                transaction: paymentTxData
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
          let paymentTxData = {
            TransactionType: 'Payment',
            Account,
            Destination: Account,
            Amount,
            DeliverMax,
            DeliverMin,
            SendMax,
            Flags,
            Fee: '12',
            SourceTag: 93339333,
            Memos: configureMemos('', '', memoData)
          };

          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(paymentTxData).then(({ response }) => {
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
      console.log('err', err);
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

      console.log('calcQuantity debug:', {
        amount: amt.toNumber(),
        active,
        revert,
        tokenExch1,
        tokenExch2,
        curr1: curr1?.currency,
        curr2: curr2?.currency,
        token1Currency: token1?.currency,
        token2Currency: token2?.currency
      });

      // Check if either currency is XRP
      const curr1IsXRP = curr1?.currency === 'XRP';
      const curr2IsXRP = curr2?.currency === 'XRP';

      // Use token exchange rates for calculation
      const rate1 = new Decimal(tokenExch1 || 0);
      const rate2 = new Decimal(tokenExch2 || 0);

      // For XRP pairs, use direct conversion
      if (curr1IsXRP || curr2IsXRP) {
        console.log('Handling XRP pair calculation:', {
          curr1IsXRP,
          curr2IsXRP,
          rate1: rate1.toNumber(),
          rate2: rate2.toNumber(),
          active,
          amount: amt.toNumber(),
          revert
        });

        // For XRP pairs, use simple rate calculation - no orderbook
        if (rate1.eq(0) && rate2.eq(0)) {
          console.log('Both rates are 0, cannot calculate');
          return '';
        }

        let result = new Decimal(0);

        if (revert) {
          // Currencies are swapped
          if (curr2IsXRP && !curr1IsXRP) {
            // Top is Token, Bottom is XRP
            if (rate1.gt(0)) {
              if (active === 'AMOUNT') {
                result = amt.mul(rate1);
              } else {
                result = amt.div(rate1);
              }
            }
          } else if (!curr2IsXRP && curr1IsXRP) {
            // Top is XRP, Bottom is Token
            if (rate2.gt(0)) {
              if (active === 'AMOUNT') {
                result = amt.div(rate2);
              } else {
                result = amt.mul(rate2);
              }
            }
          } else {
            result = amt;
          }
        } else {
          // Normal order
          if (curr1IsXRP && !curr2IsXRP) {
            // Top is XRP, Bottom is Token
            if (rate2.gt(0)) {
              if (active === 'AMOUNT') {
                result = amt.div(rate2);
              } else {
                result = amt.mul(rate2);
              }
            }
          } else if (!curr1IsXRP && curr2IsXRP) {
            // Top is Token, Bottom is XRP
            if (rate2.gt(0)) {
              if (active === 'AMOUNT') {
                result = amt.mul(rate2);
              } else {
                result = amt.div(rate2);
              }
            }
          } else {
            result = amt;
          }
        }

        // Validate result before formatting
        if (result.isNaN() || !result.isFinite()) {
          return '';
        }

        return result.toFixed(6, Decimal.ROUND_DOWN);
      } else {
        // Both are non-XRP tokens - use original logic
        if (rate1.eq(0) || rate2.eq(0)) {
          console.log('Exchange rates not available');
          return '';
        }

        let result = new Decimal(0);

        if (active === 'AMOUNT') {
          // Calculate value from amount
          if (revert) {
            // When reverted: amount1 (top) is curr2, calculate curr1 value
            result = amt.mul(rate2).div(rate1);
          } else {
            // Normal: amount1 (top) is curr1, calculate curr2 value
            result = amt.mul(rate1).div(rate2);
          }
        } else {
          // Calculate amount from value
          if (revert) {
            // When reverted: value is in curr1, calculate curr2 amount
            result = amt.mul(rate1).div(rate2);
          } else {
            // Normal: value is in curr2, calculate curr1 amount
            result = amt.mul(rate2).div(rate1);
          }
        }

        // Validate result before formatting
        if (result.isNaN() || !result.isFinite()) {
          return '';
        }

        return result.toFixed(6, Decimal.ROUND_DOWN);
      }
    } catch (e) {
      console.log('Error in price calculation:', e);
      return '';
    }
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm(uuid);
  };

  const handlePlaceOrder = (e) => {
    const fAmount1 = Number(amount1);
    const fAmount2 = Number(amount2);
    console.log('handlePlaceOrder debug:', {
      amount1,
      amount2,
      fAmount1,
      fAmount2,
      canPlaceOrder,
      isLoggedIn,
      isSufficientBalance,
      errMsg
    });

    if (fAmount1 > 0 && fAmount2 > 0) {
      onOfferCreateXumm();
    } else {
      openSnackbar('Invalid values! Please enter amounts for both currencies.', 'error');
    }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    console.log('handleChangeAmount1 called:', {
      value,
      revert,
      curr1: curr1?.currency,
      curr2: curr2?.currency
    });

    setAmount1(value);
    setActive(revert ? 'VALUE' : 'AMOUNT');

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
      console.log('About to call calcQuantity with:', {
        value,
        activeType,
        revert,
        curr1IsXRP,
        curr2IsXRP
      });

      const calculatedValue = calcQuantity(value, activeType);
      console.log('calcQuantity returned:', calculatedValue);

      if (calculatedValue && calculatedValue !== '0') {
        console.log('Setting amount2 to:', calculatedValue);
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

    console.log('handleChangeAmount2 called:', {
      value,
      revert,
      curr1: curr1?.currency,
      curr2: curr2?.currency
    });

    setAmount2(value);
    setActive(revert ? 'AMOUNT' : 'VALUE');

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
      console.log('About to call calcQuantity with:', {
        value,
        activeType,
        revert,
        curr1IsXRP,
        curr2IsXRP
      });

      const calculatedValue = calcQuantity(value, activeType);
      console.log('calcQuantity returned:', calculatedValue);

      if (calculatedValue && calculatedValue !== '0') {
        console.log('Setting amount1 to:', calculatedValue);
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
    if (!amount1 || !amount2) return 'Enter an Amount';
    else if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    else return 'Exchange';
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
      console.log('Trustline creation error:', err);
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
            console.log('Found token via /tokens endpoint:', foundToken);
            return foundToken;
          }
        }
      } catch (e) {
        console.log('Main tokens search failed:', e.message);
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
            console.log('Found token via /xrpnft/tokens endpoint:', foundToken);
            return foundToken;
          }
        }
      } catch (e) {
        console.log('NFT tokens search failed:', e.message);
      }

      // 3. Try direct token lookup by issuer_currency format
      try {
        const directResponse = await axios.get(`${BASE_URL}/token/${issuer}_${currency}`);

        if (directResponse.data && directResponse.data.token) {
          console.log('Found token via direct lookup:', directResponse.data.token);
          return directResponse.data.token;
        }
      } catch (e) {
        console.log('Direct token lookup failed:', e.message);
      }

      // 4. Fallback - create basic token object
      console.log(`Creating fallback token for ${currency}:${issuer}`);
      return {
        currency,
        issuer,
        name: currency,
        md5: `${currency}_${issuer}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        pro24h: 'pro24h'
      };
    } catch (error) {
      console.log('Error finding token:', error);
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
          console.log('Cannot set same token for both currencies');
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

        console.log('Loaded tokens from URL:', {
          token1: token1Data.name,
          token2: token2Data.name
        });
      }
    } catch (error) {
      console.log('Error loading tokens from URL:', error);
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
    <Stack
      alignItems="center"
      sx={{ width: '100%', maxWidth: '800px', margin: '0 auto', px: { xs: 1, sm: 2, md: 3 } }}
    >
      <Stack sx={{ width: '100%' }}>
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

        <OverviewWrapper sx={{ width: '100%', mb: 3 }}>
          <ConverterFrame>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={1}
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                pt: 2,
                pb: 1,
                position: 'relative'
              }}
            >
              <Tooltip title="Copy shareable link with current token pair" arrow>
                <ShareButton
                  variant="outlined"
                  onClick={handleShareUrl}
                  startIcon={<Icon icon={shareIcon} width={14} height={14} />}
                >
                  Share
                </ShareButton>
              </Tooltip>
              {isLoggedIn && (
                <Stack direction="row" spacing={1}>
                  <AllowButton variant="outlined" onClick={onFillHalf}>
                    Half
                  </AllowButton>
                  <AllowButton variant="outlined" onClick={onFillMax}>
                    Max
                  </AllowButton>
                </Stack>
              )}
            </Stack>
            <CurrencyContent
              style={{
                order: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
                border: focusTop
                  ? `1px solid ${theme?.general?.reactFrameworkColor}`
                  : `1px solid ${
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)'
                    }`,
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                margin: '0 16px',
                padding: '20px 32px'
              }}
            >
              <Stack>
                <QueryToken token={token1} onChangeToken={onChangeToken1} />
                {isLoggedIn && (
                  <Typography variant="s7">
                    Balance{' '}
                    <Typography variant="s2" color="primary">
                      {revert ? accountPairBalance?.curr2.value : accountPairBalance?.curr1.value}
                    </Typography>
                  </Typography>
                )}
              </Stack>
              <InputContent>
                <Input
                  placeholder="0"
                  autoComplete="new-password"
                  disableUnderline
                  value={amount1}
                  onChange={handleChangeAmount1}
                  sx={{
                    width: '100%',
                    input: {
                      autoComplete: 'off',
                      padding: '12px 0px',
                      border: 'none',
                      fontSize: { xs: '20px', sm: '24px', md: '28px' },
                      textAlign: 'end',
                      appearance: 'none',
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark' ? 'white' : 'black',
                      backgroundColor: 'transparent'
                    }
                  }}
                  onFocus={() => setFocusTop(true)}
                  onBlur={() => setFocusTop(false)}
                />
                <Typography
                  variant="s2"
                  color="primary"
                  sx={{
                    visibility: tokenPrice1 > 0 ? 'visible' : 'hidden',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {currencySymbols[activeFiatCurrency]} {fNumber(tokenPrice1)}
                </Typography>
              </InputContent>
            </CurrencyContent>

            <Box sx={{ position: 'relative', height: 0, my: -0.5, zIndex: 2, order: 2 }}>
              <ToggleButton
                onClick={onRevertExchange}
                className={isSwitching ? 'switching' : ''}
                disabled={isSwitching}
                title="Switch currencies (Alt + S)"
              >
                <Icon
                  icon={exchangeIcon}
                  width={24}
                  height={24}
                  color={theme.palette.mode === 'dark' ? '#fff' : '#000'}
                />
              </ToggleButton>
            </Box>

            <CurrencyContent
              style={{
                order: 3,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                border: focusBottom
                  ? `1px solid ${theme?.general?.reactFrameworkColor}`
                  : `1px solid ${
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)'
                    }`,
                borderRadius: '0',
                margin: '0 16px',
                padding: '20px 32px'
              }}
            >
              <Stack>
                <QueryToken token={token2} onChangeToken={onChangeToken2} />
                {isLoggedIn && (
                  <Typography variant="s7">
                    Balance{' '}
                    <Typography variant="s2" color="primary">
                      {revert ? accountPairBalance?.curr1.value : accountPairBalance?.curr2.value}
                    </Typography>
                  </Typography>
                )}
              </Stack>
              <InputContent>
                <Input
                  placeholder="0"
                  autoComplete="new-password"
                  disableUnderline
                  value={amount1 === '' ? '' : amount2}
                  onChange={handleChangeAmount2}
                  sx={{
                    width: '100%',
                    input: {
                      autoComplete: 'off',
                      padding: '12px 0px',
                      border: 'none',
                      fontSize: { xs: '20px', sm: '24px', md: '28px' },
                      textAlign: 'end',
                      appearance: 'none',
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark' ? 'white' : 'black',
                      backgroundColor: 'transparent'
                    }
                  }}
                  onFocus={() => setFocusBottom(true)}
                  onBlur={() => setFocusBottom(false)}
                />
                <Typography
                  variant="s2"
                  color="primary"
                  sx={{
                    visibility: tokenPrice2 > 0 ? 'visible' : 'hidden',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {currencySymbols[activeFiatCurrency]} {fNumber(tokenPrice2)}
                </Typography>
              </InputContent>
            </CurrencyContent>

            {/* Add slippage control before the price impact section */}
            <CurrencyContent
              style={{
                order: 3.5,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }`,
                borderRadius: '0',
                margin: '0 16px',
                padding: '20px 32px'
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="s6"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'white' : 'black',
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Slippage tolerance
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
                        minWidth: { xs: '36px', sm: '42px' },
                        height: { xs: '28px', sm: '32px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 600,
                        padding: { xs: '4px 8px', sm: '6px 12px' },
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
            </CurrencyContent>

            <CurrencyContent
              style={{
                order: 4,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }`,
                borderRadius: '0',
                margin: '0 16px',
                padding: '20px 32px'
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  width: '100%',
                  position: 'relative'
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="s6"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'white' : 'black',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Price impact
                  </Typography>
                  {loadingPrice ? (
                    <ClipLoader color="#FF6C40" size={15} />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="s2"
                        sx={{
                          color: getPriceImpactColor(priceImpact),
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {priceImpact}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: getPriceImpactColor(priceImpact),
                          opacity: 0.8,
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        ({getPriceImpactSeverity(priceImpact)})
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CurrencyContent>

            <CurrencyContent
              style={{
                order: 5,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }`,
                borderTopLeftRadius: '0',
                borderTopRightRadius: '0',
                borderBottomLeftRadius: '10px',
                borderBottomRightRadius: '10px',
                margin: '0 16px 16px',
                padding: '24px 32px'
              }}
            >
              {(!hasTrustline1 && curr1.currency !== 'XRP') ||
              (!hasTrustline2 && curr2.currency !== 'XRP') ? (
                <TrustlineWarning>
                  <Icon
                    icon={infoFill}
                    width={16}
                    height={16}
                    style={{
                      color: theme.palette.warning.main,
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      color: theme.palette.warning.main,
                      fontSize: '0.85rem'
                    }}
                  >
                    Missing trustline for{' '}
                    <Typography component="span" sx={{ fontWeight: 600 }}>
                      {!hasTrustline1 && curr1.currency !== 'XRP'
                        ? getCurrencyDisplayName(curr1.currency, token1?.name)
                        : getCurrencyDisplayName(curr2.currency, token2?.name)}
                    </Typography>
                  </Typography>
                  <TrustlineButton
                    onClick={() => {
                      const missingCurrency =
                        !hasTrustline1 && curr1.currency !== 'XRP' ? curr1 : curr2;
                      onCreateTrustline(missingCurrency);
                    }}
                    disabled={isProcessing === 1}
                  >
                    {isProcessing === 1 ? 'Setting...' : 'Set Trustline'}
                  </TrustlineButton>
                </TrustlineWarning>
              ) : null}

              {accountProfile && accountProfile.account ? (
                <ExchangeButton
                  variant="contained"
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder || isProcessing == 1}
                  sx={{
                    minHeight: { xs: '48px', sm: '56px' },
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600
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
                      padding: { xs: '12px 24px !important', sm: '16px 32px !important' },
                      minHeight: { xs: '48px !important', sm: '56px !important' },
                      fontSize: { xs: '16px !important', sm: '18px !important' }
                    }
                  }}
                >
                  <ConnectWallet pair={pair} />
                </Box>
              )}
            </CurrencyContent>
          </ConverterFrame>
        </OverviewWrapper>

        <Stack
          direction="column"
          spacing={0.75}
          alignItems="center"
          sx={{
            width: '100%',
            mt: 4,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
              theme.palette.primary.main,
              0.05
            )}`,
            padding: { xs: '12px', sm: '16px', md: '20px' },
            position: 'relative',
            overflow: 'visible',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 16px 48px ${alpha(
                theme.palette.common.black,
                0.12
              )}, 0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
              opacity: 0.8
            }
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ width: '100%', p: 1, pb: 0 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="img"
                src={`https://s1.xrpl.to/token/${revert ? token2.md5 : token1.md5}`}
                alt={revert ? token2.name : token1.name}
                onError={(e) => (e.target.src = '/static/alt.webp')}
                sx={{
                  width: { xs: 26, sm: 32 },
                  height: { xs: 26, sm: 32 },
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <Stack spacing={0}>
                <Typography
                  variant="s7"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                    fontSize: { xs: '0.825rem', sm: '0.95rem' },
                    lineHeight: 1.1
                  }}
                >
                  {revert ? token2.name : token1.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.7)',
                    fontSize: { xs: '0.675rem', sm: '0.75rem' },
                    lineHeight: 1
                  }}
                >
                  {revert
                    ? token2.issuer
                      ? `${token2.issuer.slice(0, 4)}...${token2.issuer.slice(-4)}`
                      : 'XRPL'
                    : token1.issuer
                      ? `${token1.issuer.slice(0, 4)}...${token1.issuer.slice(-4)}`
                      : 'XRPL'}
                </Typography>
              </Stack>
            </Stack>
            <Stack sx={{ flex: 1 }}>
              <Typography
                variant="s7"
                align="right"
                sx={{
                  mb: 0.1,
                  color: theme.palette.mode === 'dark' ? 'white' : 'black',
                  fontSize: { xs: '0.825rem', sm: '0.95rem' },
                  lineHeight: 1.1
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(
                  (() => {
                    const currentToken = revert ? token2 : token1;
                    const currentLatestPrice = revert ? latestPrice2 : latestPrice1;
                    const currentExchRate = revert ? tokenExch2 : tokenExch1;

                    // For XRP, use the latest sparkline price if available
                    if (currentToken?.currency === 'XRP' && currentLatestPrice) {
                      return new Decimal(currentLatestPrice)
                        .div(metrics[activeFiatCurrency] || 1)
                        .toNumber();
                    }

                    // For other tokens, use the exchange rate
                    return new Decimal(currentExchRate)
                      .div(metrics[activeFiatCurrency] || 1)
                      .toNumber();
                  })()
                )}
              </Typography>
              <Box
                sx={{
                  height: { xs: '32px', sm: '40px' },
                  width: '100%',
                  mt: '-1px',
                  position: 'relative',
                  zIndex: 10,
                  overflow: 'visible',
                  borderRadius: '6px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.4
                  )} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                  backdropFilter: 'blur(4px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                  }
                }}
              >
                <SparklineChart
                  url={`${BASE_URL}/sparkline/${revert ? token2.md5 : token1.md5}?period=24h&${
                    revert ? token2.pro24h : token1.pro24h
                  }`}
                  showGradient={true}
                  lineWidth={2.5}
                />
              </Box>
            </Stack>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ width: '100%', p: 1, pt: 0 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="img"
                src={`https://s1.xrpl.to/token/${revert ? token1.md5 : token2.md5}`}
                alt={revert ? token1.name : token2.name}
                onError={(e) => (e.target.src = '/static/alt.webp')}
                sx={{
                  width: { xs: 26, sm: 32 },
                  height: { xs: 26, sm: 32 },
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <Stack spacing={0}>
                <Typography
                  variant="s7"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                    fontSize: { xs: '0.825rem', sm: '0.95rem' },
                    lineHeight: 1.1
                  }}
                >
                  {revert ? token1.name : token2.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.7)',
                    fontSize: { xs: '0.675rem', sm: '0.75rem' },
                    lineHeight: 1
                  }}
                >
                  {revert
                    ? token1.issuer
                      ? `${token1.issuer.slice(0, 4)}...${token1.issuer.slice(-4)}`
                      : 'XRPL'
                    : token2.issuer
                      ? `${token2.issuer.slice(0, 4)}...${token2.issuer.slice(-4)}`
                      : 'XRPL'}
                </Typography>
              </Stack>
            </Stack>
            <Stack sx={{ flex: 1 }}>
              <Typography
                variant="s7"
                align="right"
                sx={{
                  mb: 0.1,
                  color: theme.palette.mode === 'dark' ? 'white' : 'black',
                  fontSize: { xs: '0.825rem', sm: '0.95rem' },
                  lineHeight: 1.1
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {fNumber(
                  (() => {
                    const currentToken = revert ? token1 : token2;
                    const currentLatestPrice = revert ? latestPrice1 : latestPrice2;
                    const currentExchRate = revert ? tokenExch1 : tokenExch2;

                    // For XRP, use the latest sparkline price if available
                    if (currentToken?.currency === 'XRP' && currentLatestPrice) {
                      return new Decimal(currentLatestPrice)
                        .div(metrics[activeFiatCurrency] || 1)
                        .toNumber();
                    }

                    // For other tokens, use the exchange rate
                    return new Decimal(currentExchRate)
                      .div(metrics[activeFiatCurrency] || 1)
                      .toNumber();
                  })()
                )}
              </Typography>
              <Box
                sx={{
                  height: { xs: '32px', sm: '40px' },
                  width: '100%',
                  mt: '-1px',
                  position: 'relative',
                  zIndex: 10,
                  overflow: 'visible',
                  borderRadius: '6px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.4
                  )} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                  backdropFilter: 'blur(4px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                  }
                }}
              >
                <SparklineChart
                  url={`${BASE_URL}/sparkline/${revert ? token1.md5 : token2.md5}?period=24h&${
                    revert ? token1.pro24h : token2.pro24h
                  }`}
                  showGradient={true}
                  lineWidth={2.5}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>

        <QRDialog
          open={openScanQR}
          type={transactionType}
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
      </Stack>
    </Stack>
  );
}
