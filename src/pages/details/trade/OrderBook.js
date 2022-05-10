import React, { useEffect, useState } from 'react';
import useWebSocket from "react-use-websocket";
import { PuffLoader } from "react-spinners";
import { styled, useTheme } from '@mui/material/styles';

import {formatOrderBook} from './parser';

import { fNumber } from '../../../utils/formatNumber';

import { ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "./constants";

// import { parseOrderbookChanges, parseBalanceChanges } from './parser'

//import {Decimal} from 'decimal.js';

import {
    Button,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";

const LoaderContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '79vh'
});

export default function OrderBook({token, pair}) {
    const WSS_FEED_URL = 'wss://ws.xrpl.to';
    const theme = useTheme();
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);
    const [ready, setReady] = useState(false);
    const [reqID, setReqID] = useState(1);

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
                //document.title = 'Orderbook Paused';
                setIsPageVisible(false);
            } else {
                //document.title = 'Orderbook';
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

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {console.log('wss://ws.xrpl.to opened');setReady(true);},
        onClose: () => {console.log('wss://ws.xrpl.to closed');setReady(false);},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event)
    });

    useEffect(() => {
        function setRequestID() {
            if (!ready) return;
            if (!pair) return;
            setReqID(reqID + 2);
            /*{
                "id":17,
                "command":"book_offers",
                "taker_gets":{
                    "currency":"534F4C4F00000000000000000000000000000000",
                    "issuer":"rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz"
                },
                "taker_pays":{
                    "currency":"XRP"
                },
                "ledger_index":"validated",
                "limit":200
            }

            {
                "id":20,
                "command":"book_offers",
                "taker_gets":{"currency":"XRP"},
                "taker_pays":{
                    "currency":"534F4C4F00000000000000000000000000000000",
                    "issuer":"rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz"
                },
                "ledger_index":"validated",
                "limit":200
            }*/
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
                limit: 200
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
                limit: 200
            }
            sendJsonMessage(cmdAsk);
            sendJsonMessage(cmdBid);
        }

        if (reqID === 1)
            setRequestID();

        const timer = setInterval(() => setRequestID(), 5000);

        return () => {
            clearInterval(timer);
        }

    }, [reqID, ready, pair, sendJsonMessage]);

    // useEffect(() => {
    //     function connect(pair) {
    //         const curr1 = pair.curr1;
    //         const curr2 = pair.curr2;
    //         setReady(true);
    //         /*
    //         { ASKs
    //             "Account": "r4A8CVAgcxBSvrw45YgjQEgwAC5zikx5ZF",
    //             "BookDirectory": "B288090D3C8C2DFE50D835DB4C0F09EAF4C1ABF29B1F92DD5806FECB896B8EE7",
    //             "BookNode": "0",
    //             "Flags": 131072,
    //             "LedgerEntryType": "Offer",
    //             "OwnerNode": "1",
    //             "PreviousTxnID": "2C6830E26108F374726B0C53824A1547B6017485E2863640C0B22AD57377669B",
    //             "PreviousTxnLgrSeq": 71537721,
    //             "Sequence": 67110224,
    //             "TakerGets": {
    //                 "currency": "CSC",
    //                 "issuer": "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr",
    //                 "value": "415460.6399156552"
    //             },
    //             "TakerPays": "818041999",
    //             "index": "CBF6BA4481EA2D4C12C2D78231C1DA8935D54406E8CB264DB6D7BC3CAEF2DA33",
    //             "owner_funds": "874562.6699156552",
    //             "quality": "1968.999997607655"
    //         }
    //         const subscribeMessage = {
    //             id: 'book',
    //             command: 'subscribe',
    //             books: [
    //                 {
    //                     taker_pays: {
    //                         currency: curr1.currency,
    //                         issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
    //                     },
    //                     taker_gets: {
    //                         currency: curr2.currency,
    //                         issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
    //                     },
    //                     snapshot: true,
    //                     both: true
    //                 }
    //             ]
    //         }

    //         // const unSubscribeMessage = {
    //         //     event: 'unsubscribe',
    //         //     feed: 'book_ui_1',
    //         //     product_ids: [ProductsMap[product]]
    //         // };
    //         // sendJsonMessage(unSubscribeMessage);

    //         sendJsonMessage(subscribeMessage);
    //     }

    //     if (isFeedKilled) {
    //         getWebSocket()?.close();
    //     } else {
    //         connect(pair);
    //     }
    // }, [pair, isFeedKilled, sendJsonMessage, getWebSocket]);

    const processMessages = (event) => {
        const orderBook = JSON.parse(event.data);

        if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
            const r = orderBook.id % 2;
            console.log(`Received id ${orderBook.id}`)
            if (r === 1) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS);
                setAsks(parsed);
            }
            if (r === 0) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS);
                setBids(parsed);
            }
        }
    };

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

        if (bids.length >= 1) {
            totB = bids[bids.length - 1].total
            avgB = totB / bids.length
        }

        const avg = (Number(avgA) + Number(avgB)) / 2
        
        const max100 = avg / 50 * 100

        const progress = value / max100 > 1 ? 1 : (value / max100).toFixed(2)

        const percentage = (progress * 100).toFixed(0)
        
        return percentage
    }

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

                return (
                    <>
                    {isBid ?
                        <TableRow
                            key={total + quantity}
                            tabIndex={-1}
                            hover
                            style={{
                                background: `linear-gradient(to left, #113534, rgba(0, 0, 0, 0.0) ${depth}%, rgba(0, 0, 0, 0.0))`,
                                "&:hover": {
                                    background: "blue !important"
                                }
                            }}
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
                            style={{background: `linear-gradient(to right, #3d1e28, rgba(0, 0, 0, 0.0) ${depth}%, rgba(0, 0, 0, 0.0))`}}
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
            {bids.length || asks.length ?
                <Grid container spacing={0} sx={{p:0}}>
                    <Grid item xs={12} md={6} lg={6}>
                        <Table
                            stickyHeader
                            size={'small'}
                            sx={{
                                [`& .${tableCellClasses.root}`]: {
                                    borderBottom: "0px solid",
                                    borderBottomColor: theme.palette.divider
                                }
                            }}
                        >
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
                        <Table
                            stickyHeader
                            size={'small'}
                            sx={{
                                [`& .${tableCellClasses.root}`]: {
                                    borderBottom: "0px solid",
                                    borderBottomColor: theme.palette.divider
                                }
                            }}
                        >
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
        </Stack> )
    } else
        return 'HIDDEN PAGE.';
};
