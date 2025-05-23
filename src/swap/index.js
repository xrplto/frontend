import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { ClipLoader } from 'react-spinners';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import SparklineChart from 'src/components/SparklineChart';

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
  Box
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

// Iconify
import { Icon } from '@iconify/react';
import exchangeIcon from '@iconify/icons-uil/exchange';
import infoFill from '@iconify/icons-eva/info-fill';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { isInstalled, submitTransaction } from '@gemwallet/api';
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

const CurrencyContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin-left: 10px;
    margin-right: 10px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: row;
    padding: 10px 24px;
    border-radius: 10px;
    -webkit-box-align: center;
    align-items: center;
    background-color: #000000;
    &:not(:first-of-type) {
      margin-top: 2px;
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
    border-radius: 16px;
    display: flex;
    background-color: ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'};
    border: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
    padding-bottom: 10px;

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
  () => `
  padding: 2px;
  border-radius: 24px;
  font-size: 12px;
  min-width: 48px;
`
);

const ToggleButton = styled(IconButton)(
  ({ theme }) => `
    background-color: ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.8)};
    border: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
    width: 32px;
    height: 32px;
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

export default function Swap({ asks, bids, pair, setPair, revert, setRevert }) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;
  const QR_BLUR = '/static/blurqr.webp';

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

  // const color1 = revert?theme.currency.background2:theme.currency.background1;
  // const color2 = revert?theme.currency.background1:theme.currency.background2;
  var color1, color2;
  if (typeof theme.currency !== 'undefined') {
    // webxtor SEO fix
    /*const */ color1 = theme.currency.background2;
    /*const */ color2 = theme.currency.background2;
  }

  const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;

  let isSufficientBalance = false;
  let errMsg = '';

  if (isLoggedIn) {
    /* accountPairBalance
        {
            "curr1": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "0.00000383697235788"
            },
            "curr2": {
                "currency": "XRP",
                "issuer": "XRPL",
                "value": 26.733742000000007
            }
        }
        */

    errMsg = '';
    isSufficientBalance = false;
    try {
      const fAmount = new Decimal(amount || 0).toNumber();
      const fValue = new Decimal(value || 0).toNumber();
      const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();
      const accountValue = new Decimal(accountPairBalance.curr2.value).toNumber();

      if (amount1 && amount2) {
        if (fAmount > 0 && fValue > 0) {
          if (accountAmount >= fAmount) {
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
      // https://api.xrpl.to/api/account/info/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm?curr1=534F4C4F00000000000000000000000000000000&issuer1=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&curr2=XRP&issuer2=XRPL
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
        })
        .then(function () {
          // always executed
        });
    }
    // console.log('account_info')
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
          openSnackbar('Successfully submitted the order!', 'success');
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
      let TakerGets, TakerPays;
      /*if (buySell === 'BUY') {
                // BUY logic
                TakerGets = {currency:curr2.currency, issuer:curr2.issuer, value: value.toString()};
                TakerPays = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
            } else */
      // {
      // SELL logic
      TakerGets = {
        currency: curr1.currency,
        issuer: curr1.issuer,
        value: amount.toString()
      };
      TakerPays = {
        currency: curr2.currency,
        issuer: curr2.issuer,
        value: value.toString()
      };
      // }

      const OfferCreate = {
        tfPassive: 0x00010000,
        tfImmediateOrCancel: 0x00020000,
        tfFillOrKill: 0x00040000,
        tfSell: 0x00080000
      };

      //const Flags = OfferCreate.tfSell | OfferCreate.tfImmediateOrCancel;
      const Flags = OfferCreate.tfImmediateOrCancel;

      const body = { /*Account,*/ TakerGets, TakerPays, Flags, user_token };

      let memoData = `Create offer via https://xrpl.to`;
      if (Flags & OfferCreate.tfImmediateOrCancel) {
        memoData = `Token Exchange via https://xrpl.to`;
      }

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          const res = await axios.post(`${BASE_URL}/offer/create`, body);

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
              if (TakerGets.currency === 'XRP') {
                TakerGets = Decimal.mul(TakerGets.value, 1000000).toString();
              }

              if (TakerPays.currency === 'XRP') {
                TakerPays = Decimal.mul(TakerPays.value, 1000000).toString();
              }
              let offerTxData = {
                TransactionType: 'OfferCreate',
                Account,
                Flags,
                TakerGets,
                TakerPays,
                Memos: configureMemos('', '', memoData)
              };

              dispatch(updateProcess(1));

              await submitTransaction({
                transaction: offerTxData
              }).then(({ type, result }) => {
                if (type == 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setSync(sync + 1);
                } else {
                  dispatch(updateProcess(3));
                }

                setSwapped(!isSwapped);
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;
        case 'crossmark':
          if (TakerGets.currency === 'XRP') {
            TakerGets = Decimal.mul(TakerGets.value, 1000000).toString();
          }

          if (TakerPays.currency === 'XRP') {
            TakerPays = Decimal.mul(TakerPays.value, 1000000).toString();
          }
          let offerTxData = {
            TransactionType: 'OfferCreate',
            Account,
            Flags,
            TakerGets,
            TakerPays,
            Memos: configureMemos('', '', memoData)
          };

          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(offerTxData).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(response.data.resp.result?.hash));
              setSync(sync + 1);
            } else {
              dispatch(updateProcess(3));
            }
            setSwapped(!isSwapped);
          });
          // }
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
    const fAmount = Number(amount);
    const fValue = Number(value);
    if (fAmount > 0 && fValue > 0) onOfferCreateXumm();
    else {
      openSnackbar('Invalid values!', 'error');
    }

    // if (accountProfile && accountProfile.account) {
    //     // Create offer
    //     /*{
    //         "TransactionType": "OfferCreate",
    //         "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
    //         "Fee": "12",
    //         "Flags": 0,
    //         "LastLedgerSequence": 7108682,
    //         "Sequence": 8,
    //         "TakerGets": "6000000",
    //         "TakerPays": {
    //           "currency": "GKO",
    //           "issuer": "ruazs5h1qEsqpke88pcqnaseXdm6od2xc",
    //           "value": "2"
    //         }
    //     }*/
    //     onOfferCreateXumm();

    // } else {
    //     setShowAccountAlert(true);
    //     setTimeout(() => {
    //         setShowAccountAlert(false);
    //     }, 2000);
    // }
  };

  const handleChangeAmount1 = (e) => {
    let value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount1(value);
    setActive(revert ? 'VALUE' : 'AMOUNT');
  };

  const handleChangeAmount2 = (e) => {
    const value = e.target.value;

    if (value == '.') value = '0.';
    if (isNaN(Number(value))) return;

    setAmount2(value);
    setActive(revert ? 'AMOUNT' : 'VALUE');
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

    // Store current values
    const tempAmount1 = amount1;
    const tempAmount2 = amount2;
    const tempToken1 = token1;
    const tempToken2 = token2;

    // Clear amounts temporarily for smooth transition
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

    // Restore values in switched positions after a small delay
    setTimeout(() => {
      setAmount1(tempAmount2);
      setAmount2(tempAmount1);
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
      if (accountPairBalance?.curr1.value > 0) setAmount2(accountPairBalance?.curr1.value / 2);
    } else {
      if (accountPairBalance?.curr1.value > 0) setAmount1(accountPairBalance?.curr1.value / 2);
    }
  };

  const onFillMax = () => {
    if (revert) {
      if (accountPairBalance?.curr1.value > 0) setAmount2(accountPairBalance?.curr1.value);
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

  return (
    <Stack alignItems="center" sx={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <Stack sx={{ width: '100%' }}>
        <OverviewWrapper sx={{ width: '100%', mb: 3 }}>
          <ConverterFrame>
            {isLoggedIn && (
              <Stack
                direction="row"
                justifyContent="end"
                spacing={1.5}
                siz="small"
                sx={{ px: 2, mb: 2 }}
              >
                <AllowButton variant="outlined" onClick={onFillHalf}>
                  Half
                </AllowButton>
                <AllowButton variant="outlined" onClick={onFillMax}>
                  Max
                </AllowButton>
              </Stack>
            )}
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
                padding: '16px 24px'
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
                      padding: '10px 0px',
                      border: 'none',
                      fontSize: '18px',
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
                  sx={{ visibility: tokenPrice1 > 0 ? 'visible' : 'hidden' }}
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
                  width={20}
                  height={20}
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
                padding: '16px 24px'
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
                      padding: '10px 0px',
                      border: 'none',
                      fontSize: '18px',
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
                  sx={{ visibility: tokenPrice2 > 0 ? 'visible' : 'hidden' }}
                >
                  {currencySymbols[activeFiatCurrency]} {fNumber(tokenPrice2)}
                </Typography>
              </InputContent>
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
                padding: '16px 24px'
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
                      color: theme.palette.mode === 'dark' ? 'white' : 'black'
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
                          fontWeight: 600
                        }}
                      >
                        {priceImpact}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: getPriceImpactColor(priceImpact),
                          opacity: 0.8,
                          fontWeight: 500
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
                padding: '24px 24px'
              }}
            >
              {accountProfile && accountProfile.account ? (
                <ExchangeButton
                  variant="contained"
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder || isProcessing == 1}
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
                      padding: '12px 24px !important',
                      minHeight: '48px !important',
                      fontSize: '16px !important'
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
            backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }`,
            padding: '12px'
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
                src={`https://s1.xrpl.to/token/${token1.md5}`}
                alt={token1.name}
                onError={(e) => (e.target.src = '/static/alt.webp')}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <Stack spacing={0}>
                <Typography
                  variant="s7"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                    fontSize: '0.825rem',
                    lineHeight: 1.1
                  }}
                >
                  {token1.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.675rem',
                    lineHeight: 1
                  }}
                >
                  {token1.issuer
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
                  fontSize: '0.825rem',
                  lineHeight: 1.1
                }}
              >
                {currencySymbols[activeFiatCurrency]} {fNumber(tokenExch1)}
              </Typography>
              <Box sx={{ height: '32px', width: '100%', mt: '-1px' }}>
                <SparklineChart
                  url={`${BASE_URL}/sparkline/${token1.md5}?period=24h&${token1.pro24h}`}
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
                src={`https://s1.xrpl.to/token/${token2.md5}`}
                alt={token2.name}
                onError={(e) => (e.target.src = '/static/alt.webp')}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <Stack spacing={0}>
                <Typography
                  variant="s7"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                    fontSize: '0.825rem',
                    lineHeight: 1.1
                  }}
                >
                  {token2.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.675rem',
                    lineHeight: 1
                  }}
                >
                  {token2.issuer
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
                  fontSize: '0.825rem',
                  lineHeight: 1.1
                }}
              >
                {currencySymbols[activeFiatCurrency]} {fNumber(tokenExch2)}
              </Typography>
              <Box sx={{ height: '32px', width: '100%', mt: '-1px' }}>
                <SparklineChart
                  url={`${BASE_URL}/sparkline/${token2.md5}?period=24h&${token2.pro24h}`}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>

        <QRDialog
          open={openScanQR}
          type="OfferCreate"
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
      </Stack>
    </Stack>
  );
}
