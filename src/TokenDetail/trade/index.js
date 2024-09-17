
import { useState, useEffect, useMemo, useCallback } from 'react';
import useWebSocket from "react-use-websocket";
import {MD5} from "crypto-js";

// Material
import {
    styled,
    Grid,
    Stack
} from '@mui/material';

// Components
import OrderBook from "./OrderBook";
import ExchHistory from './ExchHistory';
import PairsSelect from './PairsSelect';
import TradePanel from './TradePanel';
import BidAskChart from './BidAskChart';
import Account from './account';

// Utils
import Decimal from 'decimal.js';

// ----------------------------------------------------------------------
const StackDexStyle = styled(Stack)(({ theme }) => ({
    width: '100%',
    display: 'inline-block',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    // backgroundColor: '#7A0C2E',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    padding: '0px 12px'
}));

const getXRPPair = (issuer, currency) => {
    const t1 = 'XRPL_XRP'
    const t2 = issuer  + '_' +  currency;
    let pair = t1 + t2;
    if (t1.localeCompare(t2) > 0)
        pair = t2 + t1;
    return MD5(pair).toString();
}

const getInitPair = (token) => {
    const issuer = token.issuer;
    const currency = token.currency;
    const name = token.name;
    const pairMD5 = getXRPPair(issuer, currency);
    const curr1 = {currency, name, issuer, value: 0, ...token};
    const curr2 = {currency:'XRP', issuer: "XRPL", name: 'XRP', value: 0, md5: '84e5efeb89c4eae8f68188982dc290d8'};
    const pair = {id: 1, pair: pairMD5, curr1, curr2, count: 0};

    return pair;
}

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function Trade({token}) {
    const WSS_URL = 'wss://ws.xrpl.to';
    const BASE_URL = process.env.API_URL;

    const [pair, setPair] = useState(getInitPair(token));

    const [bids, setBids] = useState([]); // Orderbook Bids
    const [asks, setAsks] = useState([]); // Orderbook Asks

    const [bidId, setBidId] = useState(-1); // Bid click Id
    const [askId, setAskId] = useState(-1); // Ask click Id

    const [clearNewFlag, setClearNewFlag] = useState(false);

    const [wsReady, setWsReady] = useState(false);
    const { sendJsonMessage/*, getWebSocket*/ } = useWebSocket(WSS_URL, {
        onOpen: () => {setWsReady(true);},
        onClose: () => {setWsReady(false);},
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

    const processMessages = useCallback((event) => {
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
    }, [asks, bids]);

    useEffect(() => {
        if (!wsReady) return;

        let reqID = 1;
        const sendRequest = () => {
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
            }
            const cmdBid = {
                id: reqID+1,
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
            }
            sendJsonMessage(cmdAsk);
            sendJsonMessage(cmdBid);
            reqID += 2;
        };

        sendRequest();
        const timer = setInterval(sendRequest, 4000);

        return () => {
            clearInterval(timer);
        };
    }, [wsReady, pair, sendJsonMessage]);

    const memoizedBidAskChart = useMemo(() => (
        <BidAskChart bids={bids} asks={asks} />
    ), [bids, asks]);

    const onBidClick = (e, idx) => {
        setBidId(idx);
    }

    const onAskClick = (e, idx) => {
        setAskId(idx);
    }

    // https://mui.com/system/display/

    return (
        <Grid container spacing={2} sx={{p:0}}>
            <Grid item xs={12} md={12} lg={12} >
                <PairsSelect token={token} pair={pair} setPair={setPair} />
            </Grid>

            <Grid item xs={12} md={9.5} lg={9.5} >
                <Grid container spacing={3} sx={{p:0}}>
                    <Grid item xs={12} md={4} lg={4} sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <ExchHistory pair={pair} md5={token.md5} />
                    </Grid>
                    <Grid item xs={12} md={8} lg={8}>
                        <OrderBook pair={pair} asks={asks} bids={bids} onBidClick={onBidClick} onAskClick={onAskClick}/>
                    </Grid>
                </Grid>
            </Grid>
            
            <Grid item xs={12} md={2.5} lg={2.5}>
                <TradePanel pair={pair} asks={asks} bids={bids} bidId={bidId} askId={askId}/>

                <StackDexStyle spacing={0} sx={{ mt:4, mb:3, pt:2, pb:0, pl:0 }}>
                    {memoizedBidAskChart}
                </StackDexStyle>
            </Grid>

            <Grid item xs={12}>
                <Account token={token} pair={pair} />
            </Grid>
        </Grid>
    );
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers) => {
    if (offers.length < 1) return [];

    const getCurrency = offers[0].TakerGets?.currency || 'XRP';
    const payCurrency = offers[0].TakerPays?.currency || 'XRP';
    
    const multiplier = (getCurrency === 'XRP' || payCurrency === 'XRP') ? 1_000_000 : 1;
    const isBID = orderType === ORDER_TYPE_BIDS;

    const mapOldOffers = new Map(arrOffers.map(offer => [offer.id, true]));

    const array = offers.reduce((acc, offer) => {
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
        }

        const id = `${offer.Account}:${offer.Sequence}`;
        const gets = offer.taker_gets_funded || offer.TakerGets;
        const pays = offer.taker_pays_funded || offer.TakerPays;

        const takerPays = pays.value || pays;
        const takerGets = gets.value || gets;

        const amount = Number(isBID ? takerPays : takerGets);
        const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier;
        const value = amount * price;

        obj.id = id;
        obj.price = price;
        obj.amount = amount; // SOLO
        obj.value = value; // XRP
        obj.sumAmount = acc.length > 0 ? acc[acc.length - 1].sumAmount + amount : amount;
        obj.sumValue = acc.length > 0 ? acc[acc.length - 1].sumValue + value : value;
        obj.avgPrice = obj.sumAmount > 0 ? obj.sumValue / obj.sumAmount : 0;
        obj.isNew = !mapOldOffers.has(id);

        if (amount > 0) {
            acc.push(obj);
        }

        return acc;
    }, []);

    return array.sort((a, b) => isBID ? b.price - a.price : a.price - b.price);
};
