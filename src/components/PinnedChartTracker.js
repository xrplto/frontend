import {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  createContext,
  useContext,
  useMemo
} from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  useTheme,
  Collapse,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
  Chip,
  alpha,
  Tooltip,
  TextField,
  Stack,
  Divider
} from '@mui/material';
import { createChart, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import axios from 'axios';
import { currencySymbols, XRP_TOKEN } from 'src/utils/constants';
import { useRouter } from 'next/router';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, updateProcess, updateTxHash } from '../redux/transactionSlice';
import { enqueueSnackbar } from 'notistack';
import Decimal from 'decimal.js-light';
import QRDialog from './QRDialog';
import { configureMemos } from 'src/utils/parse/OfferChanges';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Create a context for pinned charts state management
const PinnedChartContext = createContext();

// Local storage helpers
const loadState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const serializedState = localStorage.getItem('pinnedChartsTracker');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    const serializedState = JSON.stringify({
      pinnedCharts: state.pinnedCharts,
      miniChartPosition: state.miniChartPosition,
      isVisible: state.isVisible,
      isMinimized: state.isMinimized
    });
    localStorage.setItem('pinnedChartsTracker', serializedState);
  } catch (err) {
    console.error('Failed to save pinned charts state:', err);
  }
};

// Provider component for pinned charts state
export const PinnedChartProvider = ({ children }) => {
  const persistedState = loadState();

  const [pinnedCharts, setPinnedCharts] = useState(persistedState?.pinnedCharts || []);
  const [activePinnedChart, setActivePinnedChart] = useState(
    persistedState?.pinnedCharts?.[0] || null
  );
  const [miniChartPosition, setMiniChartPosition] = useState(
    persistedState?.miniChartPosition || { x: 20, y: 80 }
  );
  const [isMinimized, setIsMinimized] = useState(persistedState?.isMinimized || false);
  const [isVisible, setIsVisible] = useState(persistedState?.isVisible !== false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState({ pinnedCharts, miniChartPosition, isVisible, isMinimized });
  }, [pinnedCharts, miniChartPosition, isVisible, isMinimized]);

  // Rehydrate on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setPinnedCharts(saved.pinnedCharts || []);
      setActivePinnedChart(saved.pinnedCharts?.[0] || null);
      setMiniChartPosition(saved.miniChartPosition || { x: 20, y: 80 });
      setIsVisible(saved.isVisible !== false);
      setIsMinimized(saved.isMinimized || false);
    }
  }, []);

  const pinChart = useCallback((chartConfig) => {
    const { token, chartType, range, indicators, activeFiatCurrency } = chartConfig;

    setPinnedCharts((prev) => {
      const existingIndex = prev.findIndex(
        (chart) => chart.token.md5 === token.md5 && chart.chartType === chartType
      );

      let newCharts;
      let newChart;

      if (existingIndex === -1) {
        newChart = {
          id: `${token.md5}-${chartType}-${Date.now()}`,
          token,
          chartType,
          range,
          indicators,
          activeFiatCurrency,
          pinnedAt: Date.now()
        };
        newCharts = [...prev, newChart];
      } else {
        newChart = {
          ...prev[existingIndex],
          range,
          indicators,
          activeFiatCurrency,
          pinnedAt: Date.now()
        };
        newCharts = [...prev];
        newCharts[existingIndex] = newChart;
      }

      setActivePinnedChart(newChart);
      setIsVisible(true);
      setIsMinimized(false);

      return newCharts;
    });
  }, []);

  const unpinChart = useCallback(
    (chartId) => {
      setPinnedCharts((prev) => {
        const newCharts = prev.filter((chart) => chart.id !== chartId);

        if (activePinnedChart?.id === chartId) {
          setActivePinnedChart(newCharts[0] || null);
        }

        return newCharts;
      });
    },
    [activePinnedChart]
  );

  const unpinChartByToken = useCallback(
    (tokenMd5, chartType) => {
      setPinnedCharts((prev) => {
        const newCharts = prev.filter(
          (chart) => !(chart.token.md5 === tokenMd5 && chart.chartType === chartType)
        );

        if (
          activePinnedChart?.token.md5 === tokenMd5 &&
          activePinnedChart?.chartType === chartType
        ) {
          setActivePinnedChart(newCharts[0] || null);
        }

        return newCharts;
      });
    },
    [activePinnedChart]
  );

  const clearAllPinnedCharts = useCallback(() => {
    setPinnedCharts([]);
    setActivePinnedChart(null);
  }, []);

  const value = useMemo(
    () => ({
      pinnedCharts,
      activePinnedChart,
      miniChartPosition,
      isMinimized,
      isVisible,
      setActivePinnedChart,
      setMiniChartPosition,
      setIsMinimized,
      setIsVisible,
      pinChart,
      unpinChart,
      unpinChartByToken,
      clearAllPinnedCharts
    }),
    [
      pinnedCharts,
      activePinnedChart,
      miniChartPosition,
      isMinimized,
      isVisible,
      setActivePinnedChart,
      setMiniChartPosition,
      setIsMinimized,
      setIsVisible,
      pinChart,
      unpinChart,
      unpinChartByToken,
      clearAllPinnedCharts
    ]
  );

  return <PinnedChartContext.Provider value={value}>{children}</PinnedChartContext.Provider>;
};

// Hook to use pinned chart context
export const usePinnedCharts = () => {
  const context = useContext(PinnedChartContext);
  if (!context) {
    throw new Error('usePinnedCharts must be used within a PinnedChartProvider');
  }
  return context;
};

// Pin button component to add to charts
export const PinChartButton = memo(
  ({ token, chartType, range, indicators, activeFiatCurrency }) => {
    const theme = useTheme();
    const { pinnedCharts, pinChart, unpinChartByToken } = usePinnedCharts();
    const isMobile = theme.breakpoints.values.sm > window.innerWidth;

    const isChartPinned = pinnedCharts.some(
      (chart) => chart.token.md5 === token.md5 && chart.chartType === chartType
    );

    const handlePinChart = () => {
      if (isChartPinned) {
        unpinChartByToken(token.md5, chartType);
      } else {
        pinChart({
          token: {
            md5: token.md5,
            name: token.name,
            symbol: token.symbol || token.code,
            code: token.code,
            currency: token.currency,
            issuer: token.issuer,
            slug: token.slug,
            logo: token.logo
          },
          chartType,
          range,
          indicators,
          activeFiatCurrency
        });
      }
    };

    return (
      <Tooltip title={isChartPinned ? 'Unpin chart' : 'Pin chart to track anywhere'}>
        <IconButton
          size="small"
          onClick={handlePinChart}
          sx={{
            ml: isMobile ? 0.5 : 1,
            p: isMobile ? 0.5 : 1,
            color: isChartPinned ? theme.palette.primary.main : 'inherit',
            '& .MuiSvgIcon-root': {
              fontSize: isMobile ? '1rem' : '1.25rem'
            }
          }}
        >
          {isChartPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
        </IconButton>
      </Tooltip>
    );
  }
);

PinChartButton.displayName = 'PinChartButton';

// Floating chart component
export const FloatingPinnedChart = memo(() => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    accountProfile,
    sync,
    setSync,
    setLoading: setAppLoading,
    openSnackbar
  } = useContext(AppContext);
  const {
    pinnedCharts,
    activePinnedChart,
    miniChartPosition,
    isMinimized,
    isVisible,
    setActivePinnedChart,
    setMiniChartPosition,
    setIsMinimized,
    setIsVisible,
    unpinChart,
    clearAllPinnedCharts
  } = usePinnedCharts();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRange, setSelectedRange] = useState('1D');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < theme.breakpoints.values.sm);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [theme.breakpoints.values.sm]);
  const [showSwap, setShowSwap] = useState(false);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFromXRP, setSwapFromXRP] = useState(true); // XRP at top by default
  const [hasTrustline, setHasTrustline] = useState(null); // null = not checked, true/false = result
  const [tokenExchangeRate, setTokenExchangeRate] = useState({ rate1: 0, rate2: 0 }); // Exchange rates
  const [accountBalances, setAccountBalances] = useState({ xrp: '0', token: '0' }); // Account balances
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [transactionType, setTransactionType] = useState('Payment');

  const isDark = theme.palette.mode === 'dark';
  const BASE_URL = process.env.API_URL;

  // Poll for xaman/xumm transaction status
  useEffect(() => {
    let timer;
    let counter = 90;
    let isRunning = false;
    let dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
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
          if (transactionType === 'TrustSet') {
            setHasTrustline(true);
            enqueueSnackbar('Trustline created successfully!', { variant: 'success' });
          } else {
            enqueueSnackbar('Swap successful!', { variant: 'success' });
            setSwapAmount('');
          }
          stopInterval();
          return;
        }
        times++;
        if (times >= 10) {
          enqueueSnackbar('Transaction signing rejected!', { variant: 'error' });
          stopInterval();
          return;
        }
      }, 1000);
    };

    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
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
        setOpenScanQR(false);
      }
    }

    if (openScanQR && uuid) {
      timer = setInterval(getPayload, 2000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openScanQR, uuid, BASE_URL, sync, enqueueSnackbar, transactionType]);

  // Fetch data for active chart
  useEffect(() => {
    if (!activePinnedChart) return;

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiRange = selectedRange === 'ALL' ? '1Y' : selectedRange;
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${activePinnedChart.token.md5}?range=${apiRange}&vs_currency=${activePinnedChart.activeFiatCurrency}`;

        const response = await axios.get(endpoint, { signal: controller.signal });

        if (response.data?.ohlc && response.data.ohlc.length > 0) {
          const processedData = response.data.ohlc
            .map((candle) => ({
              time: Math.floor(candle[0] / 1000),
              open: Number(candle[1]),
              high: Number(candle[2]),
              low: Number(candle[3]),
              close: Number(candle[4]),
              value: Number(candle[4]),
              volume: Number(candle[5]) || 0
            }))
            .sort((a, b) => a.time - b.time)
            .slice(-100); // Limit data points for performance

          setData(processedData);
        }
        setLoading(false);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Mini chart data error:', error);
        }
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [activePinnedChart, selectedRange, BASE_URL]);

  // Swap execution function - following exact pattern from swap/index.js
  const onSwap = async () => {
    if (!accountProfile || !accountProfile.account) {
      openSnackbar('Please connect your wallet first', 'warning');
      return;
    }

    try {
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      // Parse issuer and currency from token
      let tokenIssuer = activePinnedChart.token.issuer;
      let tokenCurrency = activePinnedChart.token.currency || activePinnedChart.token.code;

      if (
        !tokenIssuer &&
        activePinnedChart.token.slug &&
        activePinnedChart.token.slug.includes('-')
      ) {
        const parts = activePinnedChart.token.slug.split('-');
        if (parts.length === 2) {
          tokenIssuer = parts[0];
          tokenCurrency = parts[1];
        }
      }

      // Set up currencies based on swap direction
      const curr1 = swapFromXRP
        ? { currency: 'XRP', issuer: '' }
        : { currency: tokenCurrency, issuer: tokenIssuer };
      const curr2 = swapFromXRP
        ? { currency: tokenCurrency, issuer: tokenIssuer }
        : { currency: 'XRP', issuer: '' };

      // Fetch exchange rates - always with XRP as token1
      let receiveAmount = '0';
      try {
        const xrpMd5 = 'f8cd8e5bc5aeb1e8e5e89e83f8ee2d06';
        const ratesRes = await axios.get(
          `${BASE_URL}/pair_rates?md51=${xrpMd5}&md52=${activePinnedChart.token.md5}`
        );

        if (ratesRes.data) {
          // rate1 = 1 (XRP to XRP)
          // rate2 = XRP per token
          const rate2 = Number(ratesRes.data.rate2) || 0;

          // Calculate receive amount based on rates
          if (swapAmount && swapAmount !== '0') {
            const amount = new Decimal(swapAmount);

            if (swapFromXRP) {
              // XRP -> Token: divide XRP by rate2 (XRP per token)
              if (rate2 > 0) {
                receiveAmount = amount.div(rate2).toFixed(15, Decimal.ROUND_DOWN);
              }
            } else {
              // Token -> XRP: multiply token by rate2 (XRP per token)
              if (rate2 > 0) {
                receiveAmount = amount.mul(rate2).toFixed(15, Decimal.ROUND_DOWN);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching rates:', err);
        openSnackbar('Failed to fetch exchange rates', 'error');
        return;
      }

      const sendAmount = swapAmount;

      // Build Payment transaction (market order)
      const PaymentFlags = {
        tfPartialPayment: 131072
      };
      const Flags = PaymentFlags.tfPartialPayment;

      let Amount, SendMax, DeliverMin;

      // Build SendMax (what we're spending)
      if (swapFromXRP) {
        SendMax = new Decimal(sendAmount).mul(1000000).toFixed(0, Decimal.ROUND_DOWN); // XRP in drops
      } else {
        SendMax = {
          currency: tokenCurrency,
          issuer: tokenIssuer,
          value: new Decimal(sendAmount).toFixed(15, Decimal.ROUND_DOWN)
        };
      }

      // Build Amount (what we want to receive)
      if (!swapFromXRP) {
        Amount = new Decimal(receiveAmount).mul(1000000).toFixed(0, Decimal.ROUND_DOWN); // XRP in drops
      } else {
        Amount = {
          currency: tokenCurrency,
          issuer: tokenIssuer,
          value: new Decimal(receiveAmount).toFixed(15, Decimal.ROUND_DOWN)
        };
      }

      // Calculate slippage (3% default)
      const slippage = 3;
      const slippageDecimal = new Decimal(slippage).div(100);

      // DeliverMin with slippage
      if (typeof Amount === 'object') {
        DeliverMin = {
          currency: Amount.currency,
          issuer: Amount.issuer,
          value: new Decimal(receiveAmount)
            .mul(new Decimal(1).sub(slippageDecimal))
            .toFixed(15, Decimal.ROUND_DOWN)
        };
      } else {
        DeliverMin = new Decimal(Amount)
          .mul(new Decimal(1).sub(slippageDecimal))
          .toFixed(0, Decimal.ROUND_DOWN);
      }

      const transactionData = {
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

      // Add memos
      let memoData = 'Quick Swap via https://xrpl.to';
      transactionData.Memos = configureMemos('', '', memoData);

      switch (wallet_type) {
        case 'xaman':
          setAppLoading(true);
          setTransactionType('Payment');
          const body = {
            ...transactionData,
            user_token
          };

          const res = await axios.post(`${BASE_URL}/offer/payment`, body);
          if (res.status === 200) {
            const uuid = res.data.data.uuid;
            const qrlink = res.data.data.qrUrl;
            const nextlink = res.data.data.next;

            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
            enqueueSnackbar('Please approve the swap in your wallet', { variant: 'info' });
          }
          break;

        case 'gem':
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              dispatch(updateProcess(1));
              await submitTransaction({
                transaction: transactionData
              }).then(({ type, result }) => {
                if (type === 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setTimeout(() => {
                    setSync(sync + 1);
                    dispatch(updateProcess(0));
                    setSwapAmount('');
                  }, 1500);
                  enqueueSnackbar('Swap successful!', { variant: 'success' });
                } else {
                  dispatch(updateProcess(3));
                  enqueueSnackbar('Swap failed', { variant: 'error' });
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
                setSwapAmount('');
              }, 1500);
              enqueueSnackbar('Swap successful!', { variant: 'success' });
            } else {
              dispatch(updateProcess(3));
              enqueueSnackbar('Swap failed', { variant: 'error' });
            }
          });
          break;

        default:
          enqueueSnackbar('Unsupported wallet type', { variant: 'error' });
          break;
      }
    } catch (err) {
      dispatch(updateProcess(0));
      enqueueSnackbar('Error executing swap', { variant: 'error' });
    }
    setAppLoading(false);
  };

  // Trustline creation function - following exact pattern from Swap.js
  const onCreateTrustline = async (token) => {
    if (!accountProfile || !accountProfile.account) {
      openSnackbar('Please connect your wallet first', 'warning');
      return;
    }

    try {
      const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      // Parse issuer and currency from token
      let issuer = token.issuer;
      let currency = token.currency || token.code;

      // If we don't have issuer/currency but have slug, parse from slug
      if (!issuer && token.slug && token.slug.includes('-')) {
        const parts = token.slug.split('-');
        if (parts.length === 2) {
          issuer = parts[0]; // First part is issuer
          currency = parts[1]; // Second part is currency
        }
      }

      if (!issuer || !currency) {
        openSnackbar('Unable to create trustline: missing token information', 'error');
        return;
      }

      const Flags = 0x00020000; // Standard trustline flag
      let LimitAmount = {};
      LimitAmount.issuer = issuer;
      LimitAmount.currency = currency;
      LimitAmount.value = '1000000000'; // Set a high trust limit

      switch (wallet_type) {
        case 'xaman':
          setAppLoading(true);
          setTransactionType('TrustSet');
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
            enqueueSnackbar('Please approve the trustline in your wallet', { variant: 'info' });
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
                if (type === 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setTimeout(() => {
                    setSync(sync + 1);
                    setHasTrustline(true); // Update local state
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
                  setHasTrustline(true); // Update local state
                }, 1500);
                enqueueSnackbar('Trustline created successfully!', { variant: 'success' });
              } else {
                dispatch(updateProcess(3));
                enqueueSnackbar('Failed to create trustline', { variant: 'error' });
              }
            });
          break;

        default:
          enqueueSnackbar('Unsupported wallet type', { variant: 'error' });
          break;
      }
    } catch (err) {
      dispatch(updateProcess(0));
      enqueueSnackbar('Error creating trustline', { variant: 'error' });
    }
    setAppLoading(false);
  };

  // Fetch exchange rates when token changes or swap panel opens
  useEffect(() => {
    if (!activePinnedChart?.token || !showSwap) return;

    const fetchRates = async () => {
      try {
        // XRP md5 is a known constant
        const xrpMd5 = 'f8cd8e5bc5aeb1e8e5e89e83f8ee2d06';
        const tokenMd5 = activePinnedChart.token.md5;

        // Fetch rates with XRP as token1 and our token as token2
        const res = await axios.get(`${BASE_URL}/pair_rates?md51=${xrpMd5}&md52=${tokenMd5}`);

        if (res.data) {
          // When XRP is token1 and our token is token2:
          // rate1 = 1 (XRP to XRP)
          // rate2 = XRP per token (e.g., 0.35 XRP per RLUSD)
          const rates = {
            rate1: Number(res.data.rate1) || 1, // Should be 1 for XRP
            rate2: Number(res.data.rate2) || 0 // XRP per token
          };
          setTokenExchangeRate(rates);
        }
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
      }
    };

    fetchRates();
  }, [activePinnedChart, showSwap, BASE_URL]);

  // Fetch account balances
  useEffect(() => {
    if (!accountProfile?.account || !activePinnedChart?.token || !showSwap) {
      return;
    }

    const fetchBalances = async () => {
      setLoadingBalances(true);
      try {
        // Parse currency and issuer from token
        let tokenCurrency = activePinnedChart.token.currency || activePinnedChart.token.code;
        let tokenIssuer = activePinnedChart.token.issuer;

        if (
          !tokenCurrency &&
          activePinnedChart.token.slug &&
          activePinnedChart.token.slug.includes('-')
        ) {
          const parts = activePinnedChart.token.slug.split('-');
          if (parts.length === 2) {
            tokenIssuer = parts[0];
            tokenCurrency = parts[1];
          }
        }

        // Use the same endpoint as Swap.js to get balances
        const res = await axios.get(
          `${BASE_URL}/account/info/${accountProfile.account}?curr1=XRP&issuer1=&curr2=${tokenCurrency}&issuer2=${tokenIssuer}`
        );

        if (res.status === 200 && res.data?.pair) {
          const pair = res.data.pair;
          setAccountBalances({
            xrp: pair.curr1?.value || '0',
            token: pair.curr2?.value || '0'
          });
        } else {
          setAccountBalances({
            xrp: '0',
            token: '0'
          });
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
        setAccountBalances({
          xrp: '0',
          token: '0'
        });
      } finally {
        setLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [accountProfile, activePinnedChart, showSwap, BASE_URL, sync]);

  // Check trustline when account or token changes
  useEffect(() => {
    if (!accountProfile?.account || !activePinnedChart?.token) {
      setHasTrustline(null);
      return;
    }

    // XRP doesn't need trustline
    if (activePinnedChart.token.currency === 'XRP' || activePinnedChart.token.code === 'XRP') {
      setHasTrustline(true);
      return;
    }

    const checkTrustline = async () => {
      try {
        // Fetch all trustlines with pagination like swap/index.js does
        let allTrustlines = [];
        let currentPage = 0;
        let totalTrustlines = 0;

        // First request to get initial data and total count
        const firstResponse = await axios.get(
          `${BASE_URL}/account/lines/${accountProfile.account}?page=${currentPage}&limit=50`
        );

        if (firstResponse.status === 200 && firstResponse.data) {
          allTrustlines = firstResponse.data.lines || [];
          totalTrustlines = firstResponse.data.total || 0;

          // If total is more than 50, fetch additional pages
          if (totalTrustlines > 50) {
            const totalPages = Math.ceil(totalTrustlines / 50);
            const additionalRequests = [];

            for (let page = 1; page < totalPages; page++) {
              additionalRequests.push(
                axios.get(
                  `${BASE_URL}/account/lines/${accountProfile.account}?page=${page}&limit=50`
                )
              );
            }

            const additionalResponses = await Promise.all(additionalRequests);
            additionalResponses.forEach((response) => {
              if (response.status === 200 && response.data.lines) {
                allTrustlines = allTrustlines.concat(response.data.lines);
              }
            });
          }
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

            const conv1 = convertHexToAscii(curr1);
            const conv2 = convertHexToAscii(curr2);
            return conv1 === conv2;
          } catch (e) {
            return false;
          }
        };

        // Parse currency and issuer from token
        let tokenCurrency = activePinnedChart.token.currency || activePinnedChart.token.code;
        let tokenIssuer = activePinnedChart.token.issuer;

        if (
          !tokenCurrency &&
          activePinnedChart.token.slug &&
          activePinnedChart.token.slug.includes('-')
        ) {
          const parts = activePinnedChart.token.slug.split('-');
          if (parts.length === 2) {
            tokenIssuer = parts[0];
            tokenCurrency = parts[1];
          }
        }

        if (allTrustlines.length > 0) {
          const hasTrust = allTrustlines.some((line) => {
            // Get all possible issuer fields from the trustline
            const lineIssuers = [
              line.account,
              line.Account,
              line.issuer,
              line._token1,
              line._token2,
              line.Balance?.issuer,
              line.HighLimit?.issuer,
              line.LowLimit?.issuer
            ].filter(Boolean);

            // Check if issuer matches (if we have an issuer to check)
            if (tokenIssuer && lineIssuers.length > 0) {
              const issuerMatches = lineIssuers.some((issuer) => issuer === tokenIssuer);
              if (!issuerMatches) {
                return false; // Issuer doesn't match
              }
            }

            // Get all possible currency fields from the trustline
            const currencies = [
              line.Balance?.currency,
              line.currency,
              line._currency,
              line.HighLimit?.currency,
              line.LowLimit?.currency
            ].filter(Boolean);

            // Check if any currency matches our token
            const currencyMatches = currencies.some((curr) => {
              const matches =
                currenciesMatch(curr, tokenCurrency) ||
                currenciesMatch(curr, activePinnedChart.token.symbol);

              if (matches) {
              }

              return matches;
            });

            return currencyMatches;
          });

          setHasTrustline(hasTrust);
        } else {
          setHasTrustline(false);
        }
      } catch (err) {
        setHasTrustline(false);
      }
    };

    checkTrustline();
  }, [accountProfile, activePinnedChart, BASE_URL, showSwap, sync]); // Re-check when swap panel opens or sync changes

  // Create/update chart
  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0 || isMinimized) {
      return;
    }

    // Clean up existing chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.error('Error removing mini chart:', e);
      }
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      width: isMobile ? 248 : 300,
      height: isMobile ? 160 : 180,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
        fontSize: isMobile ? 10 : 11,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          visible: true
        }
      },
      crosshair: {
        mode: 1,
        vertLine: { visible: false },
        horzLine: { visible: false }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
        visible: true
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: 6,
        minBarSpacing: 0.5,
        fixLeftEdge: true,
        fixRightEdge: true
      },
      localization: {
        priceFormatter: (price) => {
          const symbol = currencySymbols[activePinnedChart?.activeFiatCurrency] || '';
          if (price < 0.01) return symbol + price.toFixed(8);
          if (price < 100) return symbol + price.toFixed(4);
          return symbol + price.toFixed(2);
        }
      }
    });

    chartRef.current = chart;

    // Add series based on chart type
    if (activePinnedChart?.chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: false,
        wickVisible: true
      });
      candleSeries.setData(data);
      seriesRef.current = candleSeries;
    } else if (
      activePinnedChart?.chartType === 'line' ||
      activePinnedChart?.chartType === 'holders'
    ) {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor:
          activePinnedChart?.chartType === 'holders' ? '#9c27b0' : theme.palette.primary.main,
        topColor:
          activePinnedChart?.chartType === 'holders'
            ? 'rgba(156, 39, 176, 0.4)'
            : theme.palette.primary.main + '40',
        bottomColor:
          activePinnedChart?.chartType === 'holders'
            ? 'rgba(156, 39, 176, 0.08)'
            : theme.palette.primary.main + '08',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: false
      });
      const lineData = data.map((d) => ({ time: d.time, value: d.close || d.value }));
      areaSeries.setData(lineData);
      seriesRef.current = areaSeries;
    }

    // Add volume series
    if (activePinnedChart?.chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });

      const volumeData = data.map((d) => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'
      }));
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const newWidth = window.innerWidth < theme.breakpoints.values.sm ? 248 : 300;
        chart.applyOptions({ width: newWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, [data, activePinnedChart, theme, isDark, isMinimized, isMobile]);

  // Handle dragging with mouse and touch support
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current) return;

      // Get coordinates from mouse or touch event
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragStart.current.x;
      const newY = clientY - dragStart.current.y;

      // Get current chart dimensions
      const chartWidth = isMobile ? 280 : 320;
      const chartHeight = isMinimized ? 60 : (isMobile ? 380 : 450); // Approximate heights

      // Constrain to viewport with smart edge detection
      const padding = 10;
      const maxX = window.innerWidth - chartWidth - padding;
      const maxY = window.innerHeight - chartHeight - padding;

      // Add magnetic edge snapping
      const snapThreshold = 15;
      let constrainedX = Math.max(padding, Math.min(newX, maxX));
      let constrainedY = Math.max(padding, Math.min(newY, maxY));

      // Snap to edges if close enough
      if (constrainedX < snapThreshold) constrainedX = padding;
      if (constrainedX > maxX - snapThreshold) constrainedX = maxX;
      if (constrainedY < snapThreshold) constrainedY = padding;
      if (constrainedY > maxY - snapThreshold) constrainedY = maxY;

      setMiniChartPosition({ x: constrainedX, y: constrainedY });
    };

    const handleEnd = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Remove dragging styles
      if (dragRef.current) {
        dragRef.current.style.opacity = '';
      }
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [setMiniChartPosition, isMinimized]);

  const handleDragStart = (e) => {
    // Prevent default to avoid text selection on mobile
    e.preventDefault();

    isDragging.current = true;
    setIsDraggingState(true);

    // Get starting coordinates from mouse or touch event
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX - miniChartPosition.x,
      y: clientY - miniChartPosition.y
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';

    // Add visual feedback
    if (dragRef.current) {
      dragRef.current.style.opacity = '0.95';
    }
  };


  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClearAll = () => {
    clearAllPinnedCharts();
    setAnchorEl(null);
  };

  const handleOpenFull = () => {
    if (activePinnedChart) {
      // Use slug if available, otherwise fall back to symbol or code
      const slug =
        activePinnedChart.token.slug ||
        activePinnedChart.token.symbol ||
        activePinnedChart.token.code ||
        activePinnedChart.token.md5;
      router.push(`/token/${slug}`);
    }
    setAnchorEl(null);
  };

  if (pinnedCharts.length === 0 || !activePinnedChart) {
    return null;
  }

  const currentPrice = data && data.length > 0 ? data[data.length - 1].close : null;
  const priceChange =
    data && data.length > 1
      ? (((data[data.length - 1].close - data[0].close) / data[0].close) * 100).toFixed(2)
      : null;

  return (
    <>
      <Paper
        elevation={isDraggingState ? 16 : 8}
        sx={{
          position: 'fixed',
          left: miniChartPosition.x,
          top: miniChartPosition.y,
          width: isVisible ? (isMobile ? 280 : 320) : (isMobile ? 120 : 160),
          zIndex: 1300,
          bgcolor: isDark ? 'rgba(18, 18, 18, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
          borderRadius: 3,
          overflow: 'hidden',
          transition: isDraggingState ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDraggingState ? 'scale(1.03) rotate(0.5deg)' : 'scale(1)',
          boxShadow: isDraggingState
            ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
            : `0 8px 32px ${alpha(theme.palette.common.black, isDark ? 0.6 : 0.15)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.5)} 50%, transparent 100%)`,
            opacity: isDraggingState ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }
        }}
      >
        {/* Header */}
        <Box
          ref={dragRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            background: isDark
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            cursor: 'move',
            userSelect: 'none',
            touchAction: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
            },
            '&:active': {
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.4, flexShrink: 0 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <img
                src={`https://s1.xrpl.to/token/${activePinnedChart.token.md5}`}
                width={24}
                height={24}
                style={{ borderRadius: '50%', flexShrink: 0 }}
                onError={(e) => (e.target.src = '/static/alt.webp')}
                alt={activePinnedChart.token.name}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activePinnedChart.token.symbol || activePinnedChart.token.code}
                </Typography>
                {currentPrice && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      display: 'block',
                      lineHeight: 1
                    }}
                  >
                    {currencySymbols[activePinnedChart.activeFiatCurrency] || ''}
                    {currentPrice < 0.01 ? currentPrice.toFixed(6) : currentPrice.toFixed(4)}
                  </Typography>
                )}
              </Box>
            </Box>
            {currentPrice && priceChange && (
              <Chip
                size="small"
                label={`${Number(priceChange) > 0 ? '+' : ''}${priceChange}%`}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: Number(priceChange) > 0
                    ? alpha('#4caf50', isDark ? 0.2 : 0.1)
                    : alpha('#f44336', isDark ? 0.2 : 0.1),
                  color: Number(priceChange) > 0 ? '#4caf50' : '#f44336',
                  border: `1px solid ${Number(priceChange) > 0 ? alpha('#4caf50', 0.3) : alpha('#f44336', 0.3)}`,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isVisible && (
              <>
                <IconButton size="small" onClick={handleMinimize}>
                  {isMinimized ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ExpandLessIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {pinnedCharts.length > 1 && (
            <Box>
              <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                Switch Chart
              </MenuItem>
              {pinnedCharts.map((chart) => (
                <MenuItem
                  key={chart.id}
                  onClick={() => {
                    setActivePinnedChart(chart);
                    setAnchorEl(null);
                  }}
                  selected={chart.id === activePinnedChart.id}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {chart.token.name} - {chart.chartType}
                </MenuItem>
              ))}
              <MenuItem divider />
            </Box>
          )}
          <MenuItem onClick={handleOpenFull} sx={{ fontSize: '0.875rem' }}>
            <OpenInFullIcon fontSize="small" sx={{ mr: 1 }} />
            Open Full Chart
          </MenuItem>
          <MenuItem
            onClick={() => {
              setShowSwap(!showSwap);
              setAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            <SwapHorizIcon fontSize="small" sx={{ mr: 1 }} />
            Quick Swap
          </MenuItem>
          <MenuItem
            onClick={() => {
              unpinChart(activePinnedChart.id);
              setAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            <CloseIcon fontSize="small" sx={{ mr: 1 }} />
            Unpin This Chart
          </MenuItem>
          <MenuItem onClick={handleClearAll} sx={{ fontSize: '0.875rem', color: 'error.main' }}>
            <DeleteSweepIcon fontSize="small" sx={{ mr: 1 }} />
            Clear All Pinned
          </MenuItem>
        </Menu>

        {/* Chart Content */}
        {isVisible && (
          <Collapse
            in={!isMinimized}
            timeout={300}
            easing="cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <Box
              sx={{
                p: isMobile ? 1 : 1.5,
                background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.02)} 0%, transparent 100%)`
              }}
            >
              {/* Range selector */}
              <ButtonGroup
                size={isMobile ? 'small' : 'medium'}
                fullWidth
                sx={{
                  mb: isMobile ? 1 : 1.5,
                  '& .MuiButton-root': {
                    borderColor: alpha(theme.palette.divider, 0.3),
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                {['1D', '7D', '1M', '3M'].map((range) => (
                  <Button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    variant={selectedRange === range ? 'contained' : 'outlined'}
                    sx={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      py: isMobile ? 0.25 : 0.5,
                      fontWeight: selectedRange === range ? 600 : 400,
                      ...(selectedRange === range && {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        transform: 'scale(1.02)'
                      })
                    }}
                  >
                    {range}
                  </Button>
                ))}
              </ButtonGroup>

              {/* Chart */}
              <Box
                sx={{
                  position: 'relative',
                  height: isMobile ? 160 : 180,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.3)
                }}
              >
                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderTop: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Loading chart data...
                    </Typography>
                  </Box>
                ) : (
                  <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
                )}
              </Box>

              {/* Current price display */}
              {currentPrice && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: `linear-gradient(90deg, ${alpha(theme.palette.background.paper, 0.05)} 0%, transparent 100%)`,
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Current Price
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: priceChange && Number(priceChange) > 0 ? '#4caf50' : priceChange && Number(priceChange) < 0 ? '#f44336' : 'text.primary'
                    }}
                  >
                    {currencySymbols[activePinnedChart.activeFiatCurrency] || ''}
                    {currentPrice < 0.01 ? currentPrice.toFixed(8) : currentPrice.toFixed(4)}
                  </Typography>
                </Box>
              )}

              {/* Quick Swap Section */}
              {showSwap && (
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 0.5, display: 'block' }}
                  >
                    Quick Swap
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.08),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.12),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                        }
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography
                            variant="caption"
                            sx={{ fontSize: '0.6rem', color: 'text.secondary' }}
                          >
                            Balance:{' '}
                            {loadingBalances
                              ? '...'
                              : swapFromXRP
                                ? accountBalances.xrp
                                : accountBalances.token}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() =>
                              setSwapAmount(
                                swapFromXRP ? accountBalances.xrp : accountBalances.token
                              )
                            }
                            disabled={
                              loadingBalances ||
                              (swapFromXRP
                                ? accountBalances.xrp === '0'
                                : accountBalances.token === '0')
                            }
                            sx={{
                              minWidth: 'auto',
                              padding: '0px 4px',
                              fontSize: '0.6rem',
                              height: 16,
                              textTransform: 'none'
                            }}
                          >
                            MAX
                          </Button>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 28, height: 28 }}>
                            <img
                              src={
                                swapFromXRP
                                  ? 'https://s1.xrpl.to/token/xrp'
                                  : `https://s1.xrpl.to/token/${activePinnedChart.token.md5}`
                              }
                              width={28}
                              height={28}
                              style={{ borderRadius: '50%' }}
                              onError={(e) => (e.target.src = '/static/alt.webp')}
                              alt="From"
                            />
                          </Box>
                          <TextField
                            value={swapAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0)) {
                                setSwapAmount(val);
                              }
                            }}
                            placeholder="0.00"
                            variant="standard"
                            InputProps={{
                              disableUnderline: true,
                              sx: { fontSize: '0.85rem', fontWeight: 600 }
                            }}
                            sx={{ flex: 1 }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                            {swapFromXRP
                              ? 'XRP'
                              : activePinnedChart.token.symbol || activePinnedChart.token.code}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => setSwapFromXRP(!swapFromXRP)}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          transition: 'all 0.2s ease',
                          transform: 'rotate(0deg)',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.25),
                            transform: 'rotate(180deg) scale(1.1)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                          }
                        }}
                      >
                        <SwapVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.08),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.12),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                        }
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.6rem', color: 'text.secondary' }}
                        >
                          You receive: {!swapFromXRP ? accountBalances.xrp : accountBalances.token}{' '}
                          available
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 28, height: 28 }}>
                            <img
                              src={
                                !swapFromXRP
                                  ? 'https://s1.xrpl.to/token/xrp'
                                  : `https://s1.xrpl.to/token/${activePinnedChart.token.md5}`
                              }
                              width={28}
                              height={28}
                              style={{ borderRadius: '50%' }}
                              onError={(e) => (e.target.src = '/static/alt.webp')}
                              alt="To"
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
                          >
                            {(() => {
                              if (!swapAmount || swapAmount === '0') return '0.00';
                              const amount = new Decimal(swapAmount);

                              // Use exchange rates for calculation
                              if (tokenExchangeRate.rate1 > 0 || tokenExchangeRate.rate2 > 0) {
                                if (swapFromXRP) {
                                  // XRP -> Token: divide XRP by rate2 (XRP per token)
                                  // If rate2 is 0.35 (0.35 XRP per RLUSD), then 1 XRP / 0.35 = 2.85 RLUSD
                                  if (tokenExchangeRate.rate2 > 0) {
                                    const result = amount.div(tokenExchangeRate.rate2).toFixed(6);
                                    return result;
                                  }
                                } else {
                                  // Token -> XRP: multiply token by rate2 (XRP per token)
                                  // rate2 is XRP per token, so multiply token amount by rate2
                                  // If rate2 is 0.35 (0.35 XRP per RLUSD), then 2 RLUSD * 0.35 = 0.7 XRP
                                  if (tokenExchangeRate.rate2 > 0) {
                                    const result = amount.mul(tokenExchangeRate.rate2).toFixed(6);
                                    return result;
                                  }
                                }
                              }
                              return '0.00';
                            })()}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                            {!swapFromXRP
                              ? 'XRP'
                              : activePinnedChart.token.symbol || activePinnedChart.token.code}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    {/* Trustline warning - show when buying token (swapFromXRP = true means we're buying the token) */}
                    {swapFromXRP && hasTrustline === false && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          color: 'warning.main',
                          textAlign: 'center',
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        No trustline for{' '}
                        {activePinnedChart.token.symbol || activePinnedChart.token.code}
                      </Typography>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="medium"
                      onClick={async () => {
                        // Check if we need to set trustline first
                        // swapFromXRP = true means we're buying the token (XRP -> Token)
                        if (swapFromXRP && hasTrustline === false) {
                          // Create trustline directly
                          await onCreateTrustline(activePinnedChart.token);
                        } else {
                          // Execute swap directly
                          await onSwap();
                        }
                      }}
                      sx={{
                        fontSize: '0.8rem',
                        py: 1,
                        fontWeight: 600,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 1.1)} 0%, ${theme.palette.primary.main} 100%)`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                        },
                        '&:active': {
                          transform: 'translateY(0px)'
                        },
                        '&:disabled': {
                          background: alpha(theme.palette.action.disabled, 0.1),
                          color: theme.palette.action.disabled
                        }
                      }}
                      disabled={!accountProfile?.account || !swapAmount || swapAmount === '0'}
                    >
                      {!accountProfile?.account
                        ? 'Connect Wallet'
                        : swapFromXRP && hasTrustline === false
                          ? 'Set Trustline'
                          : 'Swap Now'}
                    </Button>

                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.6rem', color: 'text.secondary', textAlign: 'center' }}
                    >
                      Rate: 1 {activePinnedChart.token.symbol || activePinnedChart.token.code} ={' '}
                      {currentPrice?.toFixed(4)} {activePinnedChart.activeFiatCurrency}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Collapse>
        )}
      </Paper>

      {/* QR Dialog for xaman/xumm transactions */}
      {openScanQR && (
        <QRDialog
          open={openScanQR}
          onClose={() => setOpenScanQR(false)}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
          transactionType={transactionType}
        />
      )}
    </>
  );
});

FloatingPinnedChart.displayName = 'FloatingPinnedChart';

// Main export - single component that handles everything
const PinnedChartTracker = memo(({ children }) => {
  return (
    <PinnedChartProvider>
      {children}
      <FloatingPinnedChart />
    </PinnedChartProvider>
  );
});

PinnedChartTracker.displayName = 'PinnedChartTracker';

export default PinnedChartTracker;
