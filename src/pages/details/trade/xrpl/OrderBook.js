import React, { useEffect, useState } from 'react';
import useWebSocket from "react-use-websocket";
import { PuffLoader } from "react-spinners";
import { styled } from '@mui/material/styles';
import DepthVisualizer from "./DepthVisualizer";

import orderBookParser from './orderbook-parser';
import { formatNumber } from "./helpers";

import { fNumber } from '../../../../utils/formatNumber';

import { ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "./constants";

import { parseOrderbookChanges, parseBalanceChanges } from './transactionparser'

import {Decimal} from 'decimal.js';

import {
    Button,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';

const LoaderContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '79vh'
});

// const TableContainer = styled('div')({
//     display: 'flex',
//     width: '100%',
//     flexDirection: 'column',
//     color: '#bfc1c8',
//     '@media only screen and (min-width: 800px)': {
//         width: '50%'
//     }
// });

const PriceLevelRowContainer = styled('div')({
    margin: '.155em 0'
});

let currentBids = []
let currentAsks = []

var _parseOffer = new WeakSet, parseOffer_fn;

function decode(e) {
    if (3 === e.length || !/^[A-Z0-9]{40}$/.test(e)) return e;
    let t = new Uint8Array(e.length / 2);
    for (let n = 0; n !== e.length; n++) t[n] = parseInt(e.substr(2 * n, 2), 16);
    let n = (new TextDecoder).decode(t),
        s = n.length;
    for (;
        "\0" === n.charAt(s - 1);) s--;
    return n.slice(0, s)
}

function encode(e) {
    if (/^[a-zA-Z0-9\?\!\@\#\$\%\^\&\*\<\>\(\)\{\}\[\]\|\]\{\}]{3}$/.test(e)) return e;
    if (/^[A-Z0-9]{40}$/.test(e)) return e;
    let t = "";
    for (let n = 0; n < e.length; n++) t += e.charCodeAt(n).toString(16);
    return t.toUpperCase().padEnd(40, "0")
}

function compare(e, t) {
    return e = "string" == typeof e ? {
        currency: "XRP"
    } : {
        currency: encode(e.currency),
        issuer: e.issuer
    }, t = "string" == typeof t ? {
        currency: "XRP"
    } : {
        currency: encode(t.currency),
        issuer: t.issuer
    }, e.currency === t.currency && e.issuer == t.issuer
}

function fromRippled(e, t) {
    return "string" == typeof e ? {
        currency: "XRP",
        value: Decimal.div(e, "1000000").toString()
    } : {
        currency: t ? decode(e.currency) : e.currency,
        issuer: e.issuer,
        value: e.value
    }
}

function toRippled(e) {
    return "XRP" === e.currency ? Decimal.mul(e.value, "1000000").round().toString() : {
        currency: encode(e.currency),
        issuer: e.issuer,
        value: e.value.toString()
    }
}

parseOffer_fn = function(e) {
    let t = fromRippled(e.TakerGets),
        n = fromRippled(e.TakerPays);
    return {
        id: `${e.Account}:${e.Sequence}`,
        takerGets: t,
        takerPays: n,
        price: Decimal.div(n.value, t.value).toString()
    }
};

export default function OrderBook({token, pair}) {
    const WSS_FEED_URL = 'wss://ws.xrpl.to';
    
    const [isFeedKilled, setIsFeedKilled] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);

    // Page Visibility detection
    useEffect(() => {
        // Set the name of the hidden property and the change event for visibility
        let hidden = '';
        let visibilityChange = '';

        if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
            hidden = 'hidden';
            visibilityChange = 'visibilitychange';
        } else { // @ts-ignore
            if (typeof document.msHidden !== 'undefined') {
                hidden = 'msHidden';
                visibilityChange = 'msvisibilitychange';
            } else { // @ts-ignore
                if (typeof document.webkitHidden !== 'undefined') {
                    hidden = 'webkitHidden';
                    visibilityChange = 'webkitvisibilitychange';
                }
            }
        }

        const handleVisibilityChange = () => {
            const isHidden = document['hidden'];
            if (isHidden) {
                document.title = 'Orderbook Paused';
                setIsPageVisible(false);
            } else {
                document.title = 'Orderbook';
                setIsPageVisible(true);
            }
        };

        // Warn if the browser doesn't support addEventListener or the Page Visibility API
        if (typeof document.addEventListener === 'undefined' || hidden === '') {
            console.log('This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.');
        } else {
            // Handle page visibility change
            document.addEventListener(visibilityChange, handleVisibilityChange, false);
        }
    }, []);

    const toggleFeed = () => {
        setIsFeedKilled(!isFeedKilled);
    }

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => console.log('wss://ws.xrpl.to opened'),
        onClose: () => console.log('wss://ws.xrpl.to closed'),
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event)
    });

    const processMessages = (event) => {
        const orderBook = JSON.parse(event.data);

        if (orderBook.hasOwnProperty('result')) {
            const parsedAsks = orderBookParser(orderBook.result.asks, ORDER_TYPE_ASKS);
            const parsedBids = orderBookParser(orderBook.result.bids, ORDER_TYPE_BIDS);
            setAsks(parsedAsks);
            setBids(parsedBids);
        } else {
            const epochToDate = (epoch) => {
                let date = new Date('2000-01-01T00:00:00Z')
                date.setUTCSeconds(epoch)
    
                return date.toJSON()
            }
            const tx = orderBook;
            if (tx.engine_result === 'tesSUCCESS') {
                const changes = parseOrderbookChanges(tx.meta);
                console.log(changes);
            }
        }
    };

    // const parseOrderBookChanges = (tx) => {
    //     //const tx = payload.tx

    //     // console.log(tx)

    //     // console.log(parseBalanceChanges(tx.meta))

    //     let t = !1;
    //     if (tx?.meta?.AffectedNodes) {
    //         for (let n of tx.meta.AffectedNodes) {
    //             let e = Object.keys(n)[0],
    //                 s = n[e];
    //             if ("Offer" !== s.LedgerEntryType) continue;
    //             let r = `${s.FinalFields?.Account||s.NewFields?.Account}:${s.FinalFields?.Sequence||s.NewFields?.Sequence}`,
    //                 i = __privateMethod(this, _parseOffer, parseOffer_fn).call(this, s.NewFields || s.FinalFields);
    //             if (!compare(i.takerPays, this.takerPays)) continue;
    //             if (!compare(i.takerGets, this.takerGets)) continue;
    //             if ("CreatedNode" === e) {
    //                 this.offers = this.offers.concat([i]).map((e => ({
    //                     offer: e,
    //                     r: Decimal.div(e.takerPays.value, e.takerGets.value)
    //                 }))).sort(((e, t) => e.r.eq(t.r) ? 0 : e.r.gt(t.r) ? 1 : -1)).map((({
    //                     offer: e
    //                 }) => e)), t = !0;
    //                 continue
    //             }
    //             let a = this.offers.findIndex((e => e.id === r)); - 1 !== a && ("DeletedNode" === e ? this.offers.splice(a, 1) : Object.assign(this.offers[a], i), t = !0)
    //         }
    //         t && this.emit("update")
    //     }

    //     const curr1 = pair.curr1;
    //     const curr2 = pair.curr2;
    //     const tradingPair = {
    //         base: {
    //             currency: curr1.currency,
    //             issuer: curr1.currency === 'XRP' ? null : curr1.issuer
    //         },
    //         quote: {
    //             currency: curr2.currency,
    //             issuer: curr2.currency === 'XRP' ? null : curr2.issuer
    //         }
    //     }

    //     const array = tx?.meta?.AffectedNodes

    //     if(!Array.isArray(array)) return console.warn('No metadata')

    //     const epochToDate = (epoch) => {
    //         let date = new Date('2000-01-01T00:00:00Z')
    //         date.setUTCSeconds(epoch)

    //         return date.toJSON()
    //     }
        
    //     const changes = parseBalanceChanges(tx.meta)
    //     console.log(changes);

    //     let tradeUpdates = []
    //     // let direction = null

    //     for(let party in changes) {
    //         if(party === tx.transaction.Account) {
    //             // todo
    //             // const accountChangesCreatedArray = changes[tx.transaction.Account]
    //             // if(accountChangesCreatedArray.length > 1) {
    //             //     for(let line of accountChangesCreatedArray) {
    //             //         if( (line.counterparty === tradingPair.base.issuer && line.currency === tradingPair.base.currency) || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP') ) {
    //             //             baseObject = line
    //             //         }
    //             //         if( (line.counterparty === tradingPair.quote.issuer && line.currency === tradingPair.quote.currency) || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP') ) {
    //             //             quoteObject = line
    //             //         }
    //             //     }
    //             //     direction = changes[tx.transaction.Account]
    //             // }

    //             // console.log('Skip: look into other accounts for trading history than it\'s creator')
    //             continue
    //         }

    //         let baseObject = null
    //         let quoteObject = null
    //         // if party & account equals transaction make sure fee is deducted or added to amount for price calculations
    //         for(let line of changes[party]) {
    //             if(line.currency === 'XRP' && party === tx.transaction.Account) {
    //                 // todo unreachable, the account who offercrete skip at this moment
    //                 // value with fess
    //                 line.grossValue = line.value

    //                 let valDrops = Math.trunc(Number(line.value) * 1_000_000)
    //                 line.value = (valDrops + Number(tx.transaction.Fee)) / 1_000_000
    //             }

    //             if( (line.counterparty === tradingPair.base.issuer && line.currency === tradingPair.base.currency) || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP') ) {
    //                 baseObject = line
    //             }
    //             if( (line.counterparty === tradingPair.quote.issuer && line.currency === tradingPair.quote.currency) || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP') ) {
    //                 quoteObject = line
    //             }

    //             if(tradingPair.base.issuer === party || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP')) {
    //                 if(line.currency === tradingPair.base.currency) {
    //                     baseObject = line
    //                 }
    //             }

    //             if(tradingPair.quote.issuer === party || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP')) {
    //                 if(line.currency === tradingPair.quote.currency) {
    //                     quoteObject = line
    //                 }
    //             }
    //         }

    //         if(!baseObject || !quoteObject) {
    //             // console.log('skip: No base or quote')
    //             baseObject = null
    //             quoteObject = null
    //             continue
    //         }
    //         console.log({baseObject, quoteObject})

    //         try {
    //             const newTrade = {
    //                 base_amount: Math.abs(baseObject.value),
    //                 base_currency: baseObject.currency,
    //                 base_issuer: baseObject.currency === 'XRP' ? null : baseObject.counterparty,
        
    //                 counter_amount: Math.abs(quoteObject.value),
    //                 counter_currency: quoteObject.currency,
    //                 counter_issuer: quoteObject.currency === 'XRP' ? null : baseObject.counterparty,
        
    //                 rate: Number(Math.abs(quoteObject.value)) / Number(Math.abs(baseObject.value)),
    //                 executed_date: tx?.transaction?.date,
    //                 executed_time: epochToDate(tx?.transaction?.date),
    //                 direction: null
    //                 // ledger_index: 0,
    //                 // node_index: 0,
    //                 // offer_sequence: 0,
    //                 // provider: "rpXhhWmCvDwkzNtRbm7mmD1vZqdfatQNEe",
    //                 // seller: "rpMwusB1JD8PYYJwrw5qT65pgDMx3rLcEe",
    //                 // buyer: null,
    //                 // taker: "rpMwusB1JD8PYYJwrw5qT65pgDMx3rLcEe",
    //                 // tx_hash: null,
    //                 // tx_index: 0,
    //                 // tx_type: "OfferCreate"
    //             }
    //             if (newTrade.base_amount < 0 && newTrade.counter_amount > 0) newTrade.direction = 'sell'
    //             else if(newTrade.base_amount > 0 && newTrade.counter_amount < 0) newTrade.direction = 'buy'
    //             else if(newTrade.base_currency === 'XRP' && newTrade.base_amount <= 0 && newTrade.counter_amount < 0) newTrade.direction = 'buy'
    //             else if(newTrade.counter_currency === 'XRP' && newTrade.counter_amount <= 0 && newTrade.base_amount < 0) newTrade.direction = 'buy'
    //             else newTrade.direction = 'undefined'
    //             tradeUpdates.push(newTrade)

    //             baseObject = null
    //             quoteObject = null
    //         } catch(e) { console.warn(e) }
    //     }

    //     tradeUpdates.sort((a, b) => {
    //         if(tradeUpdates[0].direction === 'buy') {
    //             // lowest first highest last
    //             return a.rate - b.rate
    //         } else {
    //             return b.rate - a.rate
    //         }
    //     })

    //     for(let updateItem of tradeUpdates) {
    //         //context.dispatch('updateLastTradedPrice', updateItem.rate)
    //         //context.dispatch('pushTxToTradeHistory', updateItem)
    //         //payload.emitter.emit('tradeDataUpdate', updateItem)

    //         console.log(updateItem);

    //         // if (updateItem.base_currency === 'XRP' || updateItem.counter_currency === 'XRP') {
    //             // if( (baseObject.grossValue <= 0 || baseObject.value <= 0) && (quoteObject.grossValue <= 0 || quoteObject.value <= 0) ) {
    //             //     console.log('Do not update market price: both values negative')
    //             // }
    //             // else if( (baseObject.grossValue >= 0 || baseObject.value >= 0) && (quoteObject.grossValue >= 0 || quoteObject.value >= 0) ) {
    //             //     console.log('Do not update market price: both values positive')
    //             // }
    //             // else {
    //                 // context.dispatch('updateLastTradedPrice', updateItem.rate)
    //             // }
    //             // context.dispatch('pushTxToTradeHistory', updateItem)
    //         // } else {
    //         //     context.dispatch('updateLastTradedPrice', updateItem.rate)
    //         //     context.dispatch('pushTxToTradeHistory', updateItem)
    //         // }
    //     }
    // }

    const getIndicatorProgress = (value) => {
        if(isNaN(value)) throw new Error('Needs a value')

        let totA
        let avgA

        if (asks.length >= 1) {
            totA = asks[asks.length - 1].total
            avgA = totA / asks.length
        }

        let totB
        let avgB

        if(bids.length >= 1) {
            totB = bids[bids.length - 1].total
            avgB = totB / bids.length
        }

        const avg = (Number(avgA) + Number(avgB)) / 2
        
        const max100 = avg / 50 * 100

        const progress = value / max100 > 1 ? 1 : (value / max100).toFixed(2)

        const percentage = (progress * 100).toFixed(0)
        
        return percentage
    }

    useEffect(() => {
        function connect(pair) {
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            const subscribeMessage = {
                id: 'book',
                command: 'subscribe',
                books: [
                    {
                        taker_pays: {
                            currency: curr1.currency,
                            issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
                        },
                        taker_gets: {
                            currency: curr2.currency,
                            issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
                        },
                        snapshot: true,
                        both: true
                    }
                ]
            }
            // const unSubscribeMessage = {
            //     event: 'unsubscribe',
            //     feed: 'book_ui_1',
            //     product_ids: [ProductsMap[product]]
            // };
            // sendJsonMessage(unSubscribeMessage);

            sendJsonMessage(subscribeMessage);
        }

        if (isFeedKilled) {
            getWebSocket()?.close();
        } else {
            connect(pair);
        }
    }, [pair, isFeedKilled, sendJsonMessage, getWebSocket]);

    const buildPriceLevels = (levels, orderType = ORDER_TYPE_BIDS) => {
        const sortedLevelsByPrice = [ ...levels ].sort(
            (a, b) => {
                let result = 0;
                if (orderType === ORDER_TYPE_BIDS) {
                    result = b.price - a.price;
                } else {
                    result = a.price - b.price;
                }
                return result;
            }
        );

        const array = sortedLevelsByPrice.slice(0, 30);

        return (
            array.map((level, idx) => {
                const depth = getIndicatorProgress(level.quantity);
                const total = fNumber(level.total);
                const amount = fNumber(level.amount);
                const quantity = fNumber(level.quantity);
                const quantityA = fNumber(level.quantityA);
                const price = fNumber(level.price);
                const partial = level.partial;
                const isBid= orderType === ORDER_TYPE_BIDS;
                {/* <PriceLevelRowContainer key={level.id}>
                    <DepthVisualizer key={depth} windowWidth={windowWidth} depth={depth} orderType={orderType} />
                    <PriceLevelRow
                        key={quantity + total}
                        level={level}
                        orderType={orderType}
                        windowWidth={windowWidth} />
                </PriceLevelRowContainer> */}

                const DepthVisualizerColors = {
                    BIDS: "#113534",
                    ASKS: "#3d1e28"
                };

                return (
                    <>
                    {isBid ?
                        <TableRow
                            hover
                            key={total + quantity}
                            tabIndex={-1}
                            style={{background: `linear-gradient(to left, #113534 ${depth}%, rgba(0, 0, 0, 0.0) ${100-depth}%)`}}
                        >
                            <TableCell>{amount}</TableCell>
                            <TableCell>{quantityA}</TableCell>
                            <TableCell style={{color: partial ? '#FFC107':''}}>{quantity}</TableCell>
                            <TableCell style={{color: '#118860'}}>{price}</TableCell>
                        </TableRow>
                    :
                        <TableRow
                            hover
                            key={total + quantity}
                            tabIndex={-1}
                            style={{background: `linear-gradient(to right, #3d1e28 ${depth}%, rgba(0, 0, 0, 0.0) ${100-depth}%)`}}
                        >
                            <TableCell style={{color: '#bb3336'}}>{price}</TableCell>
                            <TableCell style={{color: partial ? '#FFC107':''}}>{quantity}</TableCell>
                            <TableCell>{quantityA}</TableCell>
                            <TableCell>{amount}</TableCell>
                        </TableRow>}
                    </>
                );
            })
        );
    };

    if (isPageVisible) {
        return (
        <Stack>
            <Stack direction="row">
                <Typography variant='h4'>Order Book</Typography>
                {/* <Spread bids={bids} asks={asks} /> */}
                {/* <GroupingSelectBox options={options[productId]} /> */}
            </Stack>
            {bids.length && asks.length ?
                <Grid container spacing={0} sx={{p:0}}>
                    <Grid item xs={12} md={6} lg={6}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Total</TableCell>
                                    <TableCell align="left"></TableCell>
                                    <TableCell align="left">Size</TableCell>
                                    <TableCell align="left">Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {buildPriceLevels(bids, ORDER_TYPE_BIDS)}
                            </TableBody>
                        </Table>
                    </Grid>
                    <Grid item xs={12} md={6} lg={6} sx={{p:0}}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Price</TableCell>
                                    <TableCell align="left">Size</TableCell>
                                    <TableCell align="left"></TableCell>
                                    <TableCell align="left">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {buildPriceLevels(asks, ORDER_TYPE_ASKS)}
                            </TableBody>
                        </Table>
                    </Grid>
                </Grid>
            :
                <LoaderContainer>
                    <PuffLoader color={"#00AB55"} size={50} />
                </LoaderContainer>
            }
        <div
          style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
          }}
        >
          <Button variant="outlined" color="error" onClick={toggleFeed}>{isFeedKilled ? 'Renew feed' : 'Kill Feed'}</Button>
        </div>
        </Stack> )
    } else
        return 'HIDDEN PAGE.';
};
