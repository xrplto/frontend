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
import { styled, useTheme, keyframes, alpha } from '@mui/material/styles';
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
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { PuffLoader } from 'react-spinners';
import { enqueueSnackbar } from 'notistack';

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
    padding: 16px;
    border-radius: 10px;
    align-items: center;
    background-color: ${theme.palette.background.paper};
    border: 1px solid ${theme.palette.divider};
    width: 100%;
    justify-content: space-between;
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
    border-radius: 16px;
    display: flex;
    border: ${theme.palette.divider};
    padding-bottom: 10px;
    width: 100%;
    background-color: ${theme.palette.background.default};
    @media (max-width: 600px) {
        border-right: none;
        border-left: none;
        border-image: initial;
        border-radius: unset;
        border-top: none;
        border-bottom: none;
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
  ({ theme }) => `
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: ${theme.palette.background.paper};
    border-radius: 50%;
    padding: 4px;
    z-index: 1;
    transition: all 0.2s ease-in-out;
    border: 1px solid ${theme.palette.divider};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
      background-color: ${theme.palette.primary.main};
      border-color: ${theme.palette.primary.main};

      svg {
        color: ${theme.palette.primary.contrastText} !important;
      }
    }

    animation: ${pulse} 2s infinite;
`
);

const ExchangeButton = styled(Button)(
  ({ theme }) => `
    width: 100%;
    max-width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    transition: all 0.3s ease;
    background: ${
      theme.palette.mode === 'dark'
        ? `linear-gradient(45deg, 
        #000000 0%, 
        ${alpha('#000000', 0.9)} 25%,
        ${alpha('#1a1a1a', 0.95)} 50%,
        ${alpha('#000000', 0.9)} 75%,
        #000000 100%)`
        : `linear-gradient(45deg, 
        #ffffff 0%, 
        ${alpha('#ffffff', 0.9)} 25%,
        ${alpha('#f5f5f5', 0.95)} 50%,
        ${alpha('#ffffff', 0.9)} 75%,
        #ffffff 100%)`
    };
    background-size: 200% 200%;
    animation: gradient 5s ease infinite;
    border: 1px solid ${alpha(theme.palette.primary.light, 0.5)};
    color: ${theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main};
    box-shadow: 
      0 0 5px ${alpha(theme.palette.primary.main, 0.2)},
      0 0 10px ${alpha(theme.palette.primary.main, 0.1)};

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
        0.1
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
      background: ${
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
      };
      border: 1px solid ${alpha(theme.palette.primary.light, 0.7)};
      box-shadow: 
        0 0 8px ${alpha(theme.palette.primary.main, 0.3)},
        0 0 15px ${alpha(theme.palette.primary.main, 0.15)};

      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(0);
    }

    &.Mui-disabled {
      background: ${theme.palette.mode === 'dark' ? alpha('#000000', 0.5) : alpha('#ffffff', 0.5)};
      border: 1px solid ${alpha(theme.palette.primary.light, 0.2)};
      box-shadow: none;
    }

    @media (max-width: 600px) {
      margin-left: 10px;
      margin-right: 10px;
    }
`
);

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
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

  const amount = revert ? amount2 : amount1;
  const value = revert ? amount1 : amount2;
  const setAmount = revert ? setAmount2 : setAmount1;
  const setValue = revert ? setAmount1 : setAmount2;
  const tokenPrice1 = new Decimal(tokenExch1 || 0)
    .mul(amount1 || 0)
    .div(metrics[activeFiatCurrency] || 1)
    .toNumber();
  const tokenPrice2 = new Decimal(tokenExch2 || 0)
    .mul(amount2 || 0)
    .div(metrics[activeFiatCurrency] || 1)
    .toNumber();

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
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS);
        setAsks(parsed);
      }
      if (req === 0) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS);
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
  }, [token1, amount1, token2, amount2]);

  useEffect(() => {
    if (active === 'VALUE') {
      setAmount(calcQuantity(value, active));
    } else {
      setValue(calcQuantity(amount, active));
    }
  }, [asks, bids, revert, active]);

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
      const curr1 = pair.curr1;
      const curr2 = pair.curr2;
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      // Use Payment transaction instead of OfferCreate
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

      let memoData = `Swap via https://xrpl.to`;

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          setTransactionType('Payment'); // Set correct transaction type for swaps
          const body = {
            TransactionType: 'Payment',
            Account,
            Destination: Account,
            Amount,
            DeliverMin,
            SendMax,
            Flags,
            user_token,
            Fee: '12',
            SourceTag: 93339333
          };

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
                  enqueueSnackbar('Swap completed successfully!', { variant: 'success' });
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
              enqueueSnackbar('Swap completed successfully!', { variant: 'success' });
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
    let amt = 0;
    let val = 0;

    /*
            ask: taker_gets = curr1, taker_pays = curr2
            bid: taker_gets = curr2, taker_pays = curr1
         */
    try {
      amt = new Decimal(amount).toNumber();
    } catch (e) {}

    if (amt === 0) return '';

    try {
      if (active === 'AMOUNT') {
        for (var bid of bids) {
          if (bid.sumAmount >= amt) {
            val = new Decimal(bid.sumValue).mul(amt).div(bid.sumAmount).toNumber();
            break;
          }
        }
      } else {
        for (var bid of bids) {
          if (bid.sumValue >= amt) {
            val = new Decimal(bid.sumAmount).mul(amt).div(bid.sumValue).toNumber();
            break;
          }
        }
      }
      return new Decimal(val).toFixed(6, Decimal.ROUND_DOWN);
    } catch (e) {}

    return 0;
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm(uuid);
  };

  const handlePlaceOrder = (e) => {
    // First check if trustlines are missing
    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, token1?.name);
      openSnackbar(`Please set trustline for ${displayName} first`, 'error');
      return;
    }
    if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, token2?.name);
      openSnackbar(`Please set trustline for ${displayName} first`, 'error');
      return;
    }

    const fAmount = Number(amount);
    const fValue = Number(value);
    if (fAmount > 0 && fValue > 0) onOfferCreateXumm();
    else {
      openSnackbar('Invalid values!', 'error');
    }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive(revert ? 'VALUE' : 'AMOUNT');
  };

  const handleChangeAmount2 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount2(value);
    setActive(revert ? 'AMOUNT' : 'VALUE');
  };

  const onRevertExchange = () => {
    setRevert(!revert);
  };

  const handleMsg = () => {
    if (isProcessing == 1) return 'Pending Exchanging';
    if (!hasTrustline1 && curr1.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr1.currency, token1?.name);
      return `Set trustline for ${displayName} first`;
    }
    if (!hasTrustline2 && curr2.currency !== 'XRP') {
      const displayName = getCurrencyDisplayName(curr2.currency, token2?.name);
      return `Set trustline for ${displayName} first`;
    }
    if (!amount1 || !amount2) return 'Enter an Amount';
    else if (errMsg && amount1 !== '' && amount2 !== '') return errMsg;
    else return 'Exchange';
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
    <Stack alignItems="center" width="100%">
      <OverviewWrapper>
        <ConverterFrame>
          <CurrencyContent style={{ backgroundColor: color1 }}>
            <Box display="flex" flexDirection="column" flex="1" gap="5.4px">
              <Box display="flex" justifyContent="space-between" alignItems="top" width="100%">
                <Typography lineHeight="1.4" variant="subtitle1">
                  You sell
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TokenImage
                  src={`https://s1.xrpl.to/token/${curr1.md5}`} // use normal <img> attributes as props
                  width={32}
                  height={32}
                  onError={(event) => (event.target.src = '/static/alt.webp')}
                />
                <Typography variant="h6">{curr1.name}</Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary">
                {curr1.user}
              </Typography>
            </Box>
            <InputContent>
              {isLoggedIn && (
                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                  <Typography variant="s7">
                    Balance{' '}
                    <Typography variant="s2" color="primary">
                      {accountPairBalance?.curr1.value}
                    </Typography>
                  </Typography>

                  <Button sx={{ px: 0, py: 0, minWidth: 0 }} onClick={onFillMax}>
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
                    padding: '0px 0 10px 0px',
                    border: 'none',
                    fontSize: '18px',
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="body2" color="textSecondary">
                ~{currencySymbols[activeFiatCurrency]} {fNumber(tokenPrice1)}
              </Typography>
            </InputContent>
          </CurrencyContent>

          <CurrencyContent style={{ backgroundColor: color2 }}>
            <Box display="flex" flexDirection="column" flex="1" gap="5.4px">
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="subtitle1">You buy</Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TokenImage
                  src={`https://s1.xrpl.to/token/${curr2.md5}`} // use normal <img> attributes as props
                  width={32}
                  height={32}
                  onError={(event) => (event.target.src = '/static/alt.webp')}
                />
                <Typography variant="h6">{curr2.name}</Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary">
                {curr2.user}
              </Typography>
            </Box>
            <InputContent>
              {isLoggedIn && (
                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                  <Typography variant="s7">
                    Balance{' '}
                    <Typography variant="s2" color="primary">
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
                disabled
                sx={{
                  width: '100%',
                  input: {
                    autoComplete: 'off',
                    padding: '0px 0 10px 0px',
                    border: 'none',
                    fontSize: '18px',
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="body2" color="textSecondary">
                ~{currencySymbols[activeFiatCurrency]} {fNumber(tokenPrice2)}
              </Typography>
            </InputContent>
          </CurrencyContent>

          <ToggleContent>
            <IconButton
              size="small"
              onClick={onRevertExchange}
              sx={{
                backgroundColor: 'transparent',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <Icon
                icon={exchangeIcon}
                width="20"
                height="20"
                style={{
                  color: theme.palette.text.primary,
                  transform: 'rotate(90deg)',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            </IconButton>
          </ToggleContent>

          {/* Add slippage control */}
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                Slippage tolerance
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {[1, 3, 5].map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={slippage === preset ? 'contained' : 'text'}
                    onClick={() => setSlippage(preset)}
                    sx={{ minWidth: '36px', height: '28px', fontSize: '0.75rem' }}
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
                    width: '45px',
                    input: {
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      padding: '4px 6px',
                      border: '1px solid rgba(0,0,0,0.2)',
                      borderRadius: '4px'
                    }
                  }}
                />
                <Typography variant="caption">%</Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Add trustline warning */}
          {((!hasTrustline1 && curr1.currency !== 'XRP') ||
            (!hasTrustline2 && curr2.currency !== 'XRP')) && (
            <Box sx={{ px: 2, py: 1 }}>
              <Alert severity="warning" sx={{ mb: 1 }}>
                <AlertTitle>Missing Trustline</AlertTitle>
                You need to set a trustline for{' '}
                {!hasTrustline1 && curr1.currency !== 'XRP'
                  ? getCurrencyDisplayName(curr1.currency, token1?.name)
                  : getCurrencyDisplayName(curr2.currency, token2?.name)}
                <Button
                  size="small"
                  onClick={() => {
                    const missingCurrency =
                      !hasTrustline1 && curr1.currency !== 'XRP' ? curr1 : curr2;
                    onCreateTrustline(missingCurrency);
                  }}
                  disabled={isProcessing === 1}
                  sx={{ ml: 1 }}
                >
                  {isProcessing === 1 ? 'Setting...' : 'Set Trustline'}
                </Button>
              </Alert>
            </Box>
          )}
        </ConverterFrame>
      </OverviewWrapper>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        spacing={0.5}
        sx={{ mt: 1, mb: 1, width: '100%' }}
      >
        <PuffLoader color={darkMode ? '#007B55' : '#5569ff'} size={20} />
        <Typography variant="body1">
          1 {curr1.name} = {revert ? tokenExch2.toFixed(3) : (1 / tokenExch2).toFixed(3)}{' '}
          {curr2.name}
        </Typography>
      </Stack>

      <Stack sx={{ width: '100%' }}>
        {accountProfile && accountProfile.account ? (
          <ExchangeButton
            variant="contained"
            onClick={handlePlaceOrder}
            sx={{ mt: 0 }}
            disabled={
              !canPlaceOrder ||
              isProcessing == 1 ||
              (!hasTrustline1 && curr1.currency !== 'XRP') ||
              (!hasTrustline2 && curr2.currency !== 'XRP')
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
    </Stack>
  );
};

const App = ({ token }) => {
  const [showSwap, setShowSwap] = useState(false);

  const toggleSwap = () => {
    setShowSwap(!showSwap);
  };

  return (
    <Stack alignItems="center" width="100%">
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
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, 
              #000000 0%, 
              ${alpha('#000000', 0.9)} 25%,
              ${alpha('#1a1a1a', 0.95)} 50%,
              ${alpha('#000000', 0.9)} 75%,
              #000000 100%)`
              : `linear-gradient(45deg, 
              #ffffff 0%, 
              ${alpha('#ffffff', 0.9)} 25%,
              ${alpha('#f5f5f5', 0.95)} 50%,
              ${alpha('#ffffff', 0.9)} 75%,
              #ffffff 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradient 5s ease infinite',
          color: (theme) => (theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main),
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.5)}`,
          boxShadow: (theme) => `
            0 0 5px ${alpha(theme.palette.primary.main, 0.2)},
            0 0 10px ${alpha(theme.palette.primary.main, 0.1)}
          `,
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
            transform: 'translateY(-2px) scale(1.02)',
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
                #ffffff 100%)`,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.7)}`,
            boxShadow: (theme) => `
              0 0 8px ${alpha(theme.palette.primary.main, 0.3)},
              0 0 15px ${alpha(theme.palette.primary.main, 0.15)}
            `,
            '&::before': {
              opacity: 1
            }
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

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS) => {
  if (offers.length < 1) return [];

  const getCurrency = offers[0].TakerGets?.currency || 'XRP';
  const payCurrency = offers[0].TakerPays?.currency || 'XRP';

  let multiplier = 1;
  const isBID = orderType === ORDER_TYPE_BIDS;

  // It's the same on each condition?
  if (isBID) {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  } else {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  }

  // let precision = maxDecimals(isBID ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

  // let index = 0
  const array = [];
  let sumAmount = 0;
  let sumValue = 0;

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const obj = {
      id: '',
      price: 0,
      amount: 0,
      value: 0,
      sumAmount: 0, // SOLO
      sumValue: 0, // XRP
      avgPrice: 0,
      sumGets: 0,
      sumPays: 0,
      isNew: false
    };

    const id = `${offer.Account}:${offer.Sequence}`;
    const gets = offer.taker_gets_funded || offer.TakerGets;
    const pays = offer.taker_pays_funded || offer.TakerPays;
    // const partial = (offer.taker_gets_funded || offer.taker_pays_funded) ? true: false;

    const takerPays = pays.value || pays;
    const takerGets = gets.value || gets;

    const amount = Number(isBID ? takerPays : takerGets);
    const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier;
    const value = amount * price;

    sumAmount += amount;
    sumValue += value;
    obj.id = id;
    obj.price = price;
    obj.amount = amount; // SOLO
    obj.value = value; // XRP
    obj.sumAmount = sumAmount;
    obj.sumValue = sumValue;

    if (sumAmount > 0) obj.avgPrice = sumValue / sumAmount;
    else obj.avgPrice = 0;

    //obj.partial = partial

    if (amount > 0) array.push(obj);
  }

  const sortedArrayByPrice = [...array].sort((a, b) => {
    let result = 0;
    if (orderType === ORDER_TYPE_BIDS) {
      result = b.price - a.price;
    } else {
      result = a.price - b.price;
    }
    return result;
  });

  return sortedArrayByPrice;
};
