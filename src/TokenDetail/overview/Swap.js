import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Stack,
  Typography,
  Input,
  IconButton,
  Box,
  Alert,
  AlertTitle
} from '@mui/material';
import { styled, useTheme, keyframes, alpha, css } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import exchangeIcon from '@iconify/icons-uil/exchange';
import swapIcon from '@iconify/icons-uil/sync'; // Import an icon for swap
import hideIcon from '@iconify/icons-uil/eye-slash'; // Import an icon for hide
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import ConnectWallet from 'src/components/ConnectWallet';
import QRDialog from 'src/components/QRDialog';
import { selectMetrics } from 'src/redux/statusSlice';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { currencySymbols, XRP_TOKEN } from 'src/utils/constants';
import Decimal from 'decimal.js';
import { fNumber } from 'src/utils/formatNumber';
import useWebSocket from 'react-use-websocket';
import { isInstalled, submitTransaction, setTrustline } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import { configureMemos } from 'src/utils/parse/OfferChanges';
import { processOrderbookOffers } from 'src/utils/orderbookService';
import Image from 'next/image';
import { PuffLoader } from 'react-spinners';
import { enqueueSnackbar } from 'notistack';
import OrderBook from 'src/TokenDetail/trade/OrderBook';

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

const CurrencyContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 5px 0;
    display: flex;
    flex-direction: row;
    padding: 16px 20px;
    border-radius: 16px;
    align-items: center;
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%);
    backdrop-filter: blur(24px);
    width: 100%;
    justify-content: space-between;
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.08)};
    }
    @media (max-width: 600px) {
      padding: 12px 16px;
      margin: 3px 0;
    }
`
);

const InputContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    color: ${theme.palette.text.primary};
`
);

const OverviewWrapper = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
    border-radius: 20px;
    display: flex;
    padding: 16px;
    width: 100%;
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.04)} 100%);
    backdrop-filter: blur(32px);
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.06)};
    @media (max-width: 600px) {
        border-radius: 16px;
        padding: 12px;
    }
`
);

const ConverterFrame = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    position: relative;
    display: flex;
    width: 100%;
`
);

const ToggleContent = styled('div')(
  ({ theme }) => css`
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    padding: 8px;
    z-index: 1;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px ${alpha(theme.palette.common.black, 0.1)};

    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
      background: linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%);
      
      svg {
        color: ${theme.palette.primary.main} !important;
      }
    }
  `
);

const ExchangeButton = styled(Button)(
  ({ theme }) => `
    width: 100%;
    max-width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%);
    backdrop-filter: blur(24px);
    color: ${theme.palette.primary.main};
    font-weight: 600;
    box-shadow: 0 4px 16px ${alpha(theme.palette.primary.main, 0.1)};

    &:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%);
      box-shadow: 0 8px 24px ${alpha(theme.palette.primary.main, 0.15)};
    }

    &:active {
      transform: translateY(0);
    }

    &.Mui-disabled {
      background: linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%);
      color: ${alpha(theme.palette.text.primary, 0.4)};
      box-shadow: none;
    }

    @media (max-width: 600px) {
      margin-left: 10px;
      margin-right: 10px;
    }
`
);

const TokenImage = styled(Image)(({ theme }) => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
  [theme.breakpoints.down('sm')]: {
    width: '28px',
    height: '28px'
  }
}));

const Swap = ({ token }) => {
  const WSS_URL = 'wss://xrplcluster.com';

  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [pair, setPair] = useState({
    curr1: XRP_TOKEN,
    curr2: token
  });

  const curr1 = pair.curr1;
  const curr2 = pair.curr2;

  const theme = useTheme();
  const color1 = theme.palette.background.default;
  const color2 = theme.palette.background.default;

  const BASE_URL = process.env.API_URL;
  const QR_BLUR = '/static/blurqr.webp';

  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const isProcessing = useSelector(selectProcess);

  const { accountProfile, darkMode, setLoading, sync, setSync, openSnackbar, activeFiatCurrency } =
    useContext(AppContext);

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [revert, setRevert] = useState(false);

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

  // Add trustline states
  const [trustlines, setTrustlines] = useState([]);
  const [hasTrustline1, setHasTrustline1] = useState(true);
  const [hasTrustline2, setHasTrustline2] = useState(true);
  const [transactionType, setTransactionType] = useState('Payment');

  // Add slippage state
  const [slippage, setSlippage] = useState(5); // Default 5% slippage
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  
  // Add state for orderbook visibility
  const [showOrderbook, setShowOrderbook] = useState(false);

  const amount = revert ? amount2 : amount1;
  const value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;

  // Calculate prices - for XRP pairs, show XRP equivalent instead of USD
  let tokenPrice1, tokenPrice2;

  const curr1IsXRP = curr1?.currency === 'XRP';
  const curr2IsXRP = curr2?.currency === 'XRP';

  if (curr1IsXRP || curr2IsXRP) {
    // For XRP pairs, show XRP equivalent amounts instead of USD
    if (curr1IsXRP) {
      // curr1 is XRP, so tokenPrice1 should be the XRP amount itself
      tokenPrice1 = new Decimal(amount1 || 0).toNumber();
      // For curr2 (token), convert token amount to XRP equivalent
      // When curr1 is XRP, tokenExch2 represents the token-to-XRP conversion rate
      tokenPrice2 = new Decimal(amount2 || 0)
        .mul(tokenExch2 || 0) // Use tokenExch2 for token-to-XRP conversion
        .toNumber();
    } else {
      // curr2 is XRP, so tokenPrice2 should be the XRP amount itself
      tokenPrice2 = new Decimal(amount2 || 0).toNumber();
      // For curr1 (token), convert token amount to XRP equivalent
      // When curr2 is XRP, tokenExch2 represents the token-to-XRP conversion rate
      tokenPrice1 = new Decimal(amount1 || 0)
        .mul(tokenExch2 || 0) // Use tokenExch2 for token-to-XRP conversion
        .toNumber();
    }
  } else {
    // For non-XRP pairs, use original USD calculation
    tokenPrice1 = new Decimal(tokenExch1 || 0)
      .mul(amount1 || 0)
      .div(metrics[activeFiatCurrency] || 1)
      .toNumber();
    tokenPrice2 = new Decimal(tokenExch2 || 0)
      .mul(amount2 || 0)
      .div(metrics[activeFiatCurrency] || 1)
      .toNumber();
  }

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
        const fAmount = new Decimal(amount || 0).toNumber();
        const fValue = new Decimal(value || 0).toNumber();
        const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();
        const accountValue = new Decimal(accountPairBalance.curr2.value).toNumber();

        if (amount1 && amount2) {
          if (fAmount > 0 && fValue > 0) {
            // Check balance against the correct currency based on revert state
            const spendingAmount = revert
              ? new Decimal(amount2 || 0).toNumber()
              : new Decimal(amount1 || 0).toNumber();
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

  const [bids, setBids] = useState([]); // Orderbook Bids
  const [asks, setAsks] = useState([]); // Orderbook Asks

  const [wsReady, setWsReady] = useState(false);
  const { sendJsonMessage /*, getWebSocket*/ } = useWebSocket(WSS_URL, {
    onOpen: () => {
      setWsReady(true);
    },
    onClose: () => {
      setWsReady(false);
    },
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processMessages(event)
  });

  // Orderbook related useEffect - Start
  useEffect(() => {
    let reqID = 1;
    function sendRequest() {
      if (!wsReady) return;

      const curr1 = pair.curr1;
      const curr2 = pair.curr2;

      const cmdAsk = {
        id: reqID,
        command: 'book_offers',
        taker_gets: {
          currency: curr1.currency,
          issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
        },
        taker_pays: {
          currency: curr2.currency,
          issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
        },
        ledger_index: 'validated',
        limit: 60
      };
      const cmdBid = {
        id: reqID + 1,
        command: 'book_offers',
        taker_gets: {
          currency: curr2.currency,
          issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
        },
        taker_pays: {
          currency: curr1.currency,
          issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
        },
        ledger_index: 'validated',
        limit: 60
      };
      sendJsonMessage(cmdAsk);
      sendJsonMessage(cmdBid);
      reqID += 2;
    }

    sendRequest();

    const timer = setInterval(() => sendRequest(), 4000);

    return () => {
      clearInterval(timer);
    };
  }, [wsReady, pair, revert, sendJsonMessage]);
  // Orderbook related useEffect - END

  // web socket process messages for orderbook
  const processMessages = (event) => {
    const orderBook = JSON.parse(event.data);

    if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
      const req = orderBook.id % 2;
      //console.log(`Received id ${orderBook.id}`)
      if (req === 1) {
        const parsed = processOrderbookOffers(orderBook.result.offers, 'asks');
        setAsks(parsed);
      }
      if (req === 0) {
        const parsed = processOrderbookOffers(orderBook.result.offers, 'bids');
        setBids(parsed);
      }
    }
  };

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
          console.log('Error fetching trustlines:', error);
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
        .catch((err) => {
          console.log('Error getting trustlines:', err);
        });
    }

    getAccountInfo();
  }, [accountProfile, curr1, curr2, sync, isSwapped]);

  useEffect(() => {
    function getTokenPrice() {
      setLoadingPrice(true);
      const md51 = token1.md5;
      const md52 = token2.md5;
      // https://api.xrpl.to/api/pair_rates?md51=84e5efeb89c4eae8f68188982dc290d8&md52=c9ac9a6c44763c1bd9ccc6e47572fd26
      axios
        .get(`${BASE_URL}/pair_rates?md51=${md51}&md52=${md52}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
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
  }, [token1, token2]);

  // Removed auto-calculation useEffect to prevent unwanted value changes
  // Calculations now only happen when user types in the input handlers

  useEffect(() => {
    const pair = {
      curr1: revert ? token2 : token1,
      curr2: revert ? token1 : token2
    };
    setPair(pair);
  }, [revert, token1, token2]);

  // Debug useEffect to track amount1 changes
  useEffect(() => {
    console.log('amount1 changed to:', amount1, 'at', new Date().toISOString());
    if (amount1 === '' && amount1 !== undefined) {
      console.trace('amount1 was cleared - stack trace:');
    }
  }, [amount1]);

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
          stopInterval(true); // Clear amounts on successful transaction
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Transaction signing rejected!', 'error');
          stopInterval(false); // Don't clear amounts on rejection
          return;
        }
      }, 1000);
    };

    // Stop the interval
    const stopInterval = (clearAmounts = false) => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
      if (clearAmounts) {
        setAmount1('');
        setAmount2('');
      }
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
      const amt = new Decimal(amount || 0).toNumber();
      if (amt === 0) return '';

      console.log('calcQuantity debug:', {
        amount: amt,
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
          amount: amt,
          revert
        });

        // For XRP pairs, use simple rate calculation - no orderbook
        if (rate1.eq(0) && rate2.eq(0)) {
          console.log('Both rates are 0, cannot calculate');
          return '';
        }

        let result = 0;

        if (curr1IsXRP && !curr2IsXRP) {
          // curr1 = XRP, curr2 = Token
          // tokenExch2 appears to be Token-to-XRP rate, so we need to invert it for XRP-to-Token
          const tokenToXrpRate = rate2.toNumber();
          const xrpToTokenRate = tokenToXrpRate > 0 ? 1 / tokenToXrpRate : 0;

          console.log('XRP to Token rate conversion:', {
            tokenToXrpRate,
            xrpToTokenRate,
            calculation: `1 / ${tokenToXrpRate} = ${xrpToTokenRate}`
          });

          if (active === 'AMOUNT') {
            // User typed in top field = XRP, calculate Token
            // XRP_amount * XRP_to_Token_rate = Token_amount
            result = new Decimal(amt).mul(xrpToTokenRate).toNumber();
          } else {
            // User typed in bottom field = Token, calculate XRP
            // Token_amount / XRP_to_Token_rate = XRP_amount
            result = new Decimal(amt).div(xrpToTokenRate).toNumber();
          }
        } else if (!curr1IsXRP && curr2IsXRP) {
          // curr1 = Token, curr2 = XRP
          // Use tokenExch2 as the direct Token-to-XRP conversion rate
          const tokenToXrpRate = rate2.toNumber();

          console.log('Token/XRP calculation debug:', {
            amt,
            active,
            revert,
            tokenToXrpRate,
            rate1: rate1.toNumber(),
            rate2: rate2.toNumber(),
            tokenExch1,
            tokenExch2
          });

          if (active === 'AMOUNT') {
            // User typed in top field = Token, calculate XRP
            // Token_amount * Token_to_XRP_rate = XRP_amount
            result = new Decimal(amt).mul(tokenToXrpRate).toNumber();
            console.log('Token to XRP calculation:', {
              tokenAmount: amt,
              rate: tokenToXrpRate,
              result,
              formula: `${amt} * ${tokenToXrpRate} = ${result}`
            });
          } else {
            // User typed in bottom field = XRP, calculate Token
            // XRP_amount / Token_to_XRP_rate = Token_amount
            result = new Decimal(amt).div(tokenToXrpRate).toNumber();
            console.log('XRP to Token calculation:', {
              xrpAmount: amt,
              rate: tokenToXrpRate,
              result,
              formula: `${amt} / ${tokenToXrpRate} = ${result}`
            });
          }
        } else {
          // Both XRP (shouldn't happen)
          result = amt;
        }

        // Determine what currencies are actually in each field for logging
        let topCurrency, bottomCurrency, inputCurrency, outputCurrency;

        if (curr1IsXRP && !curr2IsXRP) {
          // curr1=XRP, curr2=Token
          topCurrency = 'XRP';
          bottomCurrency = 'Token';
        } else if (!curr1IsXRP && curr2IsXRP) {
          // curr1=Token, curr2=XRP
          topCurrency = 'Token';
          bottomCurrency = 'XRP';
        }

        inputCurrency = active === 'AMOUNT' ? topCurrency : bottomCurrency;
        outputCurrency = active === 'AMOUNT' ? bottomCurrency : topCurrency;

        console.log('XRP calculation result:', {
          input: amt,
          rate1: rate1.toNumber(),
          rate2: rate2.toNumber(),
          result,
          curr1IsXRP,
          curr2IsXRP,
          active,
          revert,
          inputField: active === 'AMOUNT' ? 'top' : 'bottom',
          outputField: active === 'AMOUNT' ? 'bottom' : 'top',
          inputCurrency,
          outputCurrency,
          calculation: `${amt} ${inputCurrency} (${
            active === 'AMOUNT' ? 'top' : 'bottom'
          }) → ${result} ${outputCurrency} (${active === 'AMOUNT' ? 'bottom' : 'top'})`
        });

        return new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
      } else {
        // For non-XRP pairs, use simple rate calculation too
        if (rate1.eq(0) || rate2.eq(0)) {
          console.log('Missing rates for non-XRP pair, cannot calculate');
          return '';
        }

        let result = 0;
        if (active === 'AMOUNT') {
          // User typed in top field, calculate bottom field using rates
          result = new Decimal(amt).mul(rate1).div(rate2).toNumber();
        } else {
          // User typed in bottom field, calculate top field using rates
          result = new Decimal(amt).mul(rate2).div(rate1).toNumber();
        }

        return new Decimal(result).toFixed(6, Decimal.ROUND_DOWN);
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
    // Check if we need to create trustlines first
    if (isLoggedIn && ((!hasTrustline1 && curr1.currency !== 'XRP') || (!hasTrustline2 && curr2.currency !== 'XRP'))) {
      const missingCurrency = !hasTrustline1 && curr1.currency !== 'XRP' ? curr1 : curr2;
      onCreateTrustline(missingCurrency);
      return;
    }

    const fAmount = Number(amount);
    const fValue = Number(value);
    if (fAmount > 0 && fValue > 0) {
      if (orderType === 'limit' && !limitPrice) {
        openSnackbar('Please enter a limit price!', 'error');
        return;
      }
      onOfferCreateXumm();
    } else {
      openSnackbar('Invalid values!', 'error');
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
      curr2: curr2?.currency,
      timestamp: new Date().toISOString()
    });

    setAmount1(value);
    console.log('setAmount1 called with:', value);
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
      console.log('amount1 is empty, not clearing amount2');
      // Don't clear amount2 when amount1 is empty - let user control both fields independently
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
      // Don't clear amount1 when amount2 is empty - let user control both fields independently
    }
  };

  const onRevertExchange = () => {
    setRevert(!revert);
    // Clear input fields when tokens are flipped to allow fresh input
    setAmount1('');
    setAmount2('');
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

  const onFillMax = () => {
    // The MAX button is always for the top input (amount1) which shows curr1.value
    if (accountPairBalance?.curr1.value > 0) setAmount1(accountPairBalance?.curr1.value);
  };

  // Add trustline creation function
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
                  enqueueSnackbar('Trustline created successfully!', { variant: 'success' });
                } else {
                  dispatch(updateProcess(3));
                  enqueueSnackbar('Failed to create trustline', { variant: 'error' });
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
                enqueueSnackbar('Trustline created successfully!', { variant: 'success' });
              } else {
                dispatch(updateProcess(3));
                enqueueSnackbar('Failed to create trustline', { variant: 'error' });
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

  return (
    <Stack alignItems="center" width="100%" sx={{ px: { xs: 0, sm: 0 } }}>
      <OverviewWrapper>
        <ConverterFrame>
          <CurrencyContent style={{ backgroundColor: color1 }}>
            <Box display="flex" flexDirection="column" flex="1" gap="3px">
              <Box display="flex" justifyContent="space-between" alignItems="top" width="100%">
                <Typography lineHeight="1.2" variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  You sell
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TokenImage
                  src={`https://s1.xrpl.to/token/${curr1.md5}`}
                  width={32}
                  height={32}
                  alt={`${curr1.name} token icon`}
                  onError={(event) => (event.target.src = '/static/alt.webp')}
                />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {curr1.name}
                </Typography>
              </Stack>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {curr1.user}
              </Typography>
            </Box>
            <InputContent>
              {isLoggedIn && (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Balance{' '}
                    <Typography variant="caption" color="primary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {accountPairBalance?.curr1.value}
                    </Typography>
                  </Typography>

                  <Button
                    sx={{ px: { xs: 0.75, sm: 0.5 }, py: 0, minWidth: 0, fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: '24px', sm: '20px' } }}
                    onClick={onFillMax}
                  >
                    MAX
                  </Button>
                </Stack>
              )}
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
                    padding: '0px 0 6px 0px',
                    border: 'none',
                    fontSize: { xs: '18px', sm: '16px' },
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {curr1IsXRP || curr2IsXRP
                  ? `~${fNumber(tokenPrice1)} XRP`
                  : `~${currencySymbols[activeFiatCurrency]} ${fNumber(tokenPrice1)}`}
              </Typography>
            </InputContent>
          </CurrencyContent>

          <CurrencyContent style={{ backgroundColor: color2 }}>
            <Box display="flex" flexDirection="column" flex="1" gap="3px">
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  You buy
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TokenImage
                  src={`https://s1.xrpl.to/token/${curr2.md5}`}
                  width={32}
                  height={32}
                  alt={`${curr2.name} token icon`}
                  onError={(event) => (event.target.src = '/static/alt.webp')}
                />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {curr2.name}
                </Typography>
              </Stack>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {curr2.user}
              </Typography>
            </Box>
            <InputContent>
              {isLoggedIn && (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Balance{' '}
                    <Typography variant="caption" color="primary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {accountPairBalance?.curr2.value}
                    </Typography>
                  </Typography>
                </Stack>
              )}
              <Input
                placeholder="0"
                autoComplete="new-password"
                disableUnderline
                value={amount2}
                onChange={handleChangeAmount2}
                sx={{
                  width: '100%',
                  input: {
                    autoComplete: 'off',
                    padding: '0px 0 6px 0px',
                    border: 'none',
                    fontSize: { xs: '18px', sm: '16px' },
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {curr1IsXRP || curr2IsXRP
                  ? `~${fNumber(tokenPrice2)} XRP`
                  : `~${currencySymbols[activeFiatCurrency]} ${fNumber(tokenPrice2)}`}
              </Typography>
            </InputContent>
          </CurrencyContent>

          <ToggleContent>
            <IconButton
              size="small"
              onClick={onRevertExchange}
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
              <Icon
                icon={exchangeIcon}
                width="18"
                height="18"
                style={{
                  color: theme.palette.text.primary,
                  transform: 'rotate(90deg)',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            </IconButton>
          </ToggleContent>

          {/* Add slippage control */}
          <Box sx={{ px: 1.5, py: 0.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Slippage tolerance
              </Typography>
              <Stack direction="row" spacing={0.25} alignItems="center">
                {[1, 3, 5].map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={slippage === preset ? 'contained' : 'text'}
                    onClick={() => setSlippage(preset)}
                    sx={{
                      minWidth: { xs: '32px', sm: '28px' },
                      height: { xs: '26px', sm: '22px' },
                      fontSize: { xs: '0.7rem', sm: '0.7rem' },
                      padding: { xs: '3px 8px', sm: '2px 6px' }
                    }}
                  >
                    {preset}%
                  </Button>
                ))}
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
                    width: { xs: '40px', sm: '35px' },
                    input: {
                      fontSize: { xs: '0.7rem', sm: '0.7rem' },
                      textAlign: 'center',
                      padding: { xs: '3px 4px', sm: '2px 4px' },
                      border: '1px solid rgba(0,0,0,0.2)',
                      borderRadius: '3px',
                      height: { xs: '20px', sm: '18px' }
                    }
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.7rem' } }}>
                  %
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Order Type Toggle */}
          <Box sx={{ px: 1.5, py: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Button
                size="small"
                variant={orderType === 'market' ? 'contained' : 'outlined'}
                onClick={() => {
                  setOrderType('market');
                  setShowOrderbook(false); // Hide orderbook when switching to market
                }}
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
            <Box sx={{ px: 1.5, py: 1 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Limit Price ({revert ? curr1.name : curr2.name} per {revert ? curr2.name : curr1.name})
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowOrderbook(!showOrderbook)}
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      textTransform: 'none',
                      color: showOrderbook ? theme.palette.primary.main : theme.palette.text.secondary,
                      minWidth: 'auto',
                      px: 1,
                      py: 0.25,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
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

        </ConverterFrame>
      </OverviewWrapper>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        spacing={0.5}
        sx={{ mt: 0.5, mb: 0.5, width: '100%' }}
      >
        <PuffLoader color={darkMode ? '#007B55' : '#5569ff'} size={16} />
        <Typography variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
          1 {curr1.name} = {revert ? tokenExch2.toFixed(3) : (1 / tokenExch2).toFixed(3)}{' '}
          {curr2.name}
        </Typography>
      </Stack>

      <Stack sx={{ width: '100%' }}>
        {accountProfile && accountProfile.account ? (
          <ExchangeButton
            variant="contained"
            onClick={handlePlaceOrder}
            sx={{
              mt: 0,
              height: { xs: '44px', sm: '40px' },
              fontSize: { xs: '0.95rem', sm: '0.9rem' }
            }}
            disabled={
              isProcessing == 1 || 
              (!isLoggedIn) ||
              (canPlaceOrder === false && hasTrustline1 && hasTrustline2)
            }
          >
            {handleMsg()}
          </ExchangeButton>
        ) : (
          <ConnectWallet pair={pair} />
        )}
      </Stack>

      <QRDialog
        open={openScanQR}
        type={transactionType}
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
      
      {/* Orderbook Display */}
      {showOrderbook && (
        <Box
          sx={{
            mt: 2,
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            overflow: 'hidden',
            boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`
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
            height: { xs: '300px', md: '400px' }, 
            maxHeight: '500px',
            overflow: 'auto',
            backgroundColor: alpha(theme.palette.background.default, 0.01)
          }}>
            <OrderBook
              pair={{
                curr1: { ...curr1, name: curr1.name || curr1.currency },
                curr2: { ...curr2, name: curr2.name || curr2.currency }
              }}
              asks={asks}
              bids={bids}
              limitPrice={orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : null}
              isBuyOrder={!revert}
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
          </Box>
        </Box>
      )}
    </Stack>
  );
};

const App = ({ token }) => {
  const [showSwap, setShowSwap] = useState(false);

  const toggleSwap = () => {
    setShowSwap(!showSwap);
  };

  return (
    <Stack alignItems="center" width="100%" sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        onClick={toggleSwap}
        fullWidth
        startIcon={<Icon icon={showSwap ? hideIcon : swapIcon} />}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`,
          backdropFilter: 'blur(24px)',
          backgroundSize: '200% 200%',
          animation: { xs: 'none', sm: 'gradient 5s ease infinite' },
          color: (theme) => (theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main),
          boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
          fontSize: { xs: '0.95rem', sm: '1rem' },
          padding: { xs: '10px 24px', sm: '8px 22px' },
          '@keyframes gradient': {
            '0%': {
              backgroundPosition: '0% 50%'
            },
            '50%': {
              backgroundPosition: '100% 50%'
            },
            '100%': {
              backgroundPosition: '0% 50%'
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: (theme) =>
              `radial-gradient(circle, ${alpha(
                theme.palette.primary.light,
                0.1
              )} 0%, transparent 70%)`,
            animation: 'rotate 4s linear infinite',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          },
          '@keyframes rotate': {
            '0%': {
              transform: 'rotate(0deg)'
            },
            '100%': {
              transform: 'rotate(360deg)'
            }
          },
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-2px) scale(1.02)' },
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, 
                #000000 0%, 
                ${alpha('#000000', 0.95)} 25%,
                ${alpha('#1a1a1a', 1)} 50%,
                ${alpha('#000000', 0.95)} 75%,
                #000000 100%)`
                : `linear-gradient(45deg, 
                #ffffff 0%, 
                ${alpha('#ffffff', 0.95)} 25%,
                ${alpha('#f5f5f5', 1)} 50%,
                ${alpha('#ffffff', 0.95)} 75%,
                #ffffff 100%)`
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        }}
      >
        {showSwap ? 'Hide Swap' : 'Swap Now'}
      </Button>
      {showSwap && <Swap token={token} />}
    </Stack>
  );
};

export default App;
