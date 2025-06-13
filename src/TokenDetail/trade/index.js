import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { MD5 } from 'crypto-js';

// Material
import { styled, Grid, Stack, Box, Card, CardContent, Typography, Container } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Components
import OrderBook from './OrderBook';
import ExchHistory from './ExchHistory';
import PairsSelect from './PairsSelect';
import TradePanel from './TradePanel';
import BidAskChart from './BidAskChart';
import Account from './account';

// Utils
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
const CompactCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.85
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(
    theme.palette.background.paper,
    0.95
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.06)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: theme.palette.primary.main,
    opacity: 0.6
  }
}));

const MinimalContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`
}));

const CompactHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: '8px',
  background: alpha(theme.palette.background.paper, 0.4),
  border: `1px solid ${alpha(theme.palette.divider, 0.06)}`
}));

const MinimalIcon = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5),
  borderRadius: '6px',
  background: alpha(theme.palette.primary.main, 0.1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const ChartWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '8px',
  background: alpha(theme.palette.background.paper, 0.3),
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
}));

function getXRPPair(issuer, currency) {
  const t1 = 'XRPL_XRP';
  const t2 = issuer + '_' + currency;
  let pair = t1 + t2;
  if (t1.localeCompare(t2) > 0) pair = t2 + t1;
  return MD5(pair).toString();
}

function getInitPair(token) {
  const issuer = token.issuer;
  const currency = token.currency;
  const name = token.name;
  const pairMD5 = getXRPPair(issuer, currency);
  const curr1 = { currency, name, issuer, value: 0, ...token };
  const curr2 = {
    currency: 'XRP',
    issuer: 'XRPL',
    name: 'XRP',
    value: 0,
    md5: '84e5efeb89c4eae8f68188982dc290d8'
  };
  const pair = { id: 1, pair: pairMD5, curr1, curr2, count: 0 };

  return pair;
}

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function Trade({ token }) {
  const theme = useTheme();
  const WSS_URL = 'wss://xrplcluster.com';
  const BASE_URL = process.env.API_URL;

  const [pair, setPair] = useState(getInitPair(token));

  const [bids, setBids] = useState([]); // Orderbook Bids
  const [asks, setAsks] = useState([]); // Orderbook Asks

  const [bidId, setBidId] = useState(-1); // Bid click Id
  const [askId, setAskId] = useState(-1); // Ask click Id

  const [clearNewFlag, setClearNewFlag] = useState(false);

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

  useEffect(() => {
    let arr = [];
    if (clearNewFlag) {
      setClearNewFlag(false);
      for (let o of asks) {
        o.isNew = false;
        arr.push(o);
      }
      setAsks(arr);

      arr = [];
      for (let o of bids) {
        o.isNew = false;
        arr.push(o);
      }
      setBids(arr);
    }
  }, [clearNewFlag, asks, bids]);

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
  }, [wsReady, pair, sendJsonMessage]);
  // Orderbook related useEffect - END

  // web socket process messages for orderbook
  const processMessages = (event) => {
    const orderBook = JSON.parse(event.data);

    if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
      const req = orderBook.id % 2;
      if (req === 1) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS, asks);
        setAsks(parsed);
      }
      if (req === 0) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS, bids);
        setBids(parsed);
        setTimeout(() => {
          setClearNewFlag(true);
        }, 2000);
      }
    }
  };

  const onBidClick = (e, idx) => {
    setBidId(idx);
  };

  const onAskClick = (e, idx) => {
    setAskId(idx);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
      <MinimalContainer sx={{ p: 2 }}>
        {/* Compact Header */}
        <HeaderCard sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
  

            <PairsSelect token={token} pair={pair} setPair={setPair} />
          </CardContent>
        </HeaderCard>

        <Grid container spacing={2}>
          {/* Main Trading Section */}
          <Grid item xs={12} lg={9}>
            <Grid container spacing={2}>
              {/* Exchange History */}
              <Grid item xs={12} md={4} sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                <CompactCard sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
           
                    <ExchHistory pair={pair} md5={token.md5} />
                  </CardContent>
                </CompactCard>
              </Grid>

              {/* Order Book */}
              <Grid item xs={12} md={8}>
                <CompactCard sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
          
                    <OrderBook
                      pair={pair}
                      asks={asks}
                      bids={bids}
                      onBidClick={onBidClick}
                      onAskClick={onAskClick}
                    />
                  </CardContent>
                </CompactCard>
              </Grid>
            </Grid>
          </Grid>

          {/* Trading Panel Sidebar */}
          <Grid item xs={12} lg={3}>
            <Stack spacing={2}>
              {/* Trade Panel */}
              <CompactCard>
                <CardContent sx={{ p: 2 }}>

                  <TradePanel pair={pair} asks={asks} bids={bids} bidId={bidId} askId={askId} />
                </CardContent>
              </CompactCard>

              {/* Bid/Ask Chart */}
              <CompactCard>
                <CardContent sx={{ p: 2 }}>
                  <CompactHeader>
                    <MinimalIcon>
                      <TrendingUpIcon
                        sx={{
                          fontSize: '1rem',
                          color: theme.palette.error.main
                        }}
                      />
                    </MinimalIcon>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      Depth Chart
                    </Typography>
                  </CompactHeader>
                  <ChartWrapper>
                    <BidAskChart bids={bids} asks={asks} />
                  </ChartWrapper>
                </CardContent>
              </CompactCard>
            </Stack>
          </Grid>

          {/* Account Section */}
          <Grid item xs={12}>
            <CompactCard>
              <CardContent sx={{ p: 2 }}>
                <CompactHeader>
                  <MinimalIcon>
                    <AccountBalanceWalletIcon
                      sx={{
                        fontSize: '1rem',
                        color: theme.palette.secondary.main
                      }}
                    />
                  </MinimalIcon>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Account Overview
                  </Typography>
                </CompactHeader>
                <Account token={token} pair={pair} />
              </CardContent>
            </CompactCard>
          </Grid>
        </Grid>
      </MinimalContainer>
    </Container>
  );
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers) => {
  if (offers.length < 1) return [];

  const getCurrency = offers[0].TakerGets?.currency || 'XRP';
  const payCurrency = offers[0].TakerPays?.currency || 'XRP';

  let multiplier = 1;
  const isBID = orderType === ORDER_TYPE_BIDS;

  if (isBID) {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  } else {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  }

  const array = [];
  let sumAmount = 0;
  let sumValue = 0;

  let mapOldOffers = new Map();
  for (var offer of arrOffers) {
    mapOldOffers.set(offer.id, true);
  }

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const obj = {
      id: '',
      price: 0,
      amount: 0,
      value: 0,
      sumAmount: 0,
      sumValue: 0,
      avgPrice: 0,
      sumGets: 0,
      sumPays: 0,
      isNew: false
    };

    const id = `${offer.Account}:${offer.Sequence}`;
    const gets = offer.taker_gets_funded || offer.TakerGets;
    const pays = offer.taker_pays_funded || offer.TakerPays;

    const takerPays = pays.value || pays;
    const takerGets = gets.value || gets;

    const amount = Number(isBID ? takerPays : takerGets);
    const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier;
    const value = amount * price;

    sumAmount += amount;
    sumValue += value;
    obj.id = id;
    obj.price = price;
    obj.amount = amount;
    obj.value = value;
    obj.sumAmount = sumAmount;
    obj.sumValue = sumValue;

    if (sumAmount > 0) obj.avgPrice = sumValue / sumAmount;
    else obj.avgPrice = 0;

    obj.isNew = !mapOldOffers.has(id);

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
