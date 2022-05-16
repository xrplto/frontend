import React, { useEffect, useState } from 'react';
import { PuffLoader } from "react-spinners";
import { styled, useTheme } from '@mui/material/styles';

//import { fNumber } from '../../../utils/formatNumber';

import { ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "./constants";

// import { parseOrderbookChanges, parseBalanceChanges } from './parser'

//import {Decimal} from 'decimal.js';

import {
    Button,
    Grid,
    Menu,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";

const LoaderContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '79vh'
});

export default function OrderBook({pair, asks, bids}) {
    const theme = useTheme();
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [selected, setSelected] = useState([0, 0]);

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

    const getIndicatorProgress = (value) => {
        if(isNaN(value)) throw new Error('Needs a value')

        let totA
        let avgA

        if (asks.length >= 1) {
            totA = Number(asks[asks.length - 1].sumAmount)
            avgA = totA / asks.length
        }

        let totB
        let avgB

        if (bids.length >= 1) {
            totB = Number(bids[bids.length - 1].sumAmount)
            avgB = totB / bids.length
        }

        const avg = (Number(avgA) + Number(avgB)) / 2
        
        const max100 = avg / 50 * 100

        const progress = value / max100 > 1 ? 1 : (value / max100).toFixed(2)

        const percentage = (progress * 100).toFixed(0)

        return percentage
    }

    const onBidMouseOver = (e, idx) => {
        setSelected([idx + 1, 0]);
    }

    const onAskMouseOver = (e, idx) => {
        setSelected([0, idx + 1]);
    }

    const onMouseLeave = (e, idx) => {
        setSelected([0, 0]);
    }

    const buildPriceLevels = (levels, orderType = ORDER_TYPE_BIDS) => {
        return (
            levels.map((level, idx) => {
                const id = level.id;
                const price = level.price.toFixed(5);//fNumber(level.price);
                const avgPrice = level.avgPrice.toFixed(5);
                const amount = level.amount.toFixed(2); // fNumber(level.amount);
                const value = level.value.toFixed(2); // fNumber(level.value);
                const sumAmount = level.sumAmount.toFixed(2); // fNumber(level.sumAmount);
                const sumValue = level.sumValue.toFixed(2); // fNumber(level.sumValue);
                const isNew = level.isNew;
                const isBid = orderType === ORDER_TYPE_BIDS;
                const depth = getIndicatorProgress(level.amount);
                const currName1 = pair.curr1.name;
                const currName2 = pair.curr2.name;
              
                let bidBackgroundColor;
                if (isNew)
                    bidBackgroundColor = `#00AB5588`;
                else
                    bidBackgroundColor = `linear-gradient(to right, #00AB5533, rgba(0, 0, 0, 0.0) ${depth}%, rgba(0, 0, 0, 0.0))`;
                    // bidBackgroundColor = `#00AB55${depth}`;

                let askBackgroundColor;
                if (isNew)
                    askBackgroundColor = `#FF484288`;
                else
                    askBackgroundColor = `linear-gradient(to left, #FF484233, rgba(0, 0, 0, 0.0) ${depth}%, rgba(0, 0, 0, 0.0))`;
                    // askBackgroundColor = `#FF4842${depth}`;

                if (idx < selected[0])
                    bidBackgroundColor = `#00AB5588`;

                if (idx < selected[1])
                    askBackgroundColor = `#FF484288`;

                // TableRow
                // sx={{
                //     cursor: 'pointer',
                //     background: `${bidBackgroundColor}`,
                //     "&:hover": {
                //         background: "#00AB5588 !important"
                //     },
                //     transition: "all .3s ease",
                //     WebkitTransition: "all .3s ease",
                //     MozTransition: "all .3s ease",
                // }}

                return (
                    <Tooltip
                        key={`Tooltip${orderType}${idx}`}
                        title={
                            <Stack>
                                <Stack direction="row">
                                    <Typography variant='body2'>Avg Price:</Typography>
                                    <Typography variant='body2' align='right' sx={{minWidth: '120px'}}>{avgPrice}</Typography>
                                </Stack>
                                <Stack direction="row">
                                    <Typography variant='body2'>Sum {currName1}:</Typography>
                                    <Typography variant='body2' align='right' sx={{minWidth: '120px'}}>{sumAmount}</Typography>
                                </Stack>
                                <Stack direction="row">
                                    <Typography variant='body2'>Sum {currName2}:</Typography>
                                    <Typography variant='body2' align='right' sx={{minWidth: '120px'}}>{sumValue}</Typography>
                                </Stack>
                            </Stack>
                        }
                        placement='right-end' arrow
                    >
                    {isBid ?
                        <TableRow
                            tabIndex={-1}
                            hover
                            sx={{
                                cursor: 'pointer',
                                background: `${bidBackgroundColor}`,
                                "&:hover": {
                                    background: "#00AB5588 !important"
                                }
                            }}
                            onMouseOver={e=>onBidMouseOver(e, idx)}
                            onMouseLeave={e=>onMouseLeave(e, idx)}
                        >
                            <TableCell sx={{ p:0 }} align="right">{sumAmount}</TableCell>
                            <TableCell sx={{ p:0 }} align="right">{value}</TableCell>
                            <TableCell sx={{ p:0 }} align="right">{amount}</TableCell>
                            {/* <TableCell sx={{ p:0, pr:1 }} align="right">{price}</TableCell> */}
                            <TableCell sx={{ p:0, pr:1 }} align="right" style={{color: `${isNew || selected[0] > idx?'':'#118860'}`}}>{price}</TableCell>
                        </TableRow>
                    :
                        <TableRow
                            hover
                            tabIndex={-1}
                            sx={{
                                cursor: 'pointer',
                                background: `${askBackgroundColor}`,
                                "&:hover": {
                                    background: "#FF484288 !important"
                                },
                            }}
                            onMouseOver={e=>onAskMouseOver(e, idx)}
                            onMouseLeave={e=>onMouseLeave(e, idx)}
                        >
                            {/* <TableCell sx={{ p:0, pl:1 }}>{price}</TableCell> */}
                            <TableCell sx={{ p:0, pl:1 }} style={{color: `${isNew || selected[1] > idx?'':'#bb3336'}`}}>{price}</TableCell>
                            <TableCell sx={{ p:0 }}>{amount}</TableCell>
                            <TableCell sx={{ p:0 }}>{value}</TableCell>
                            <TableCell sx={{ p:0 }}>{sumAmount}</TableCell>
                        </TableRow>
                    }
                    </Tooltip>
                );
            })
        );
    };

    if (isPageVisible) {
        return (
        <Stack>
            {bids.length || asks.length ?
                <Grid container spacing={0} sx={{p:0}}>
                    <Grid item xs={12} md={6} lg={6}>
                        <Typography variant='subtitle1' sx={{color:'#007B55', ml:0, mt:2, mb:1}}>Buy Orders</Typography>
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
                                <TableRow
                                    key={'BID_KEY'}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            borderBottom: "1px solid",
                                            borderBottomColor: theme.palette.divider
                                        }
                                    }}
                                >
                                    <TableCell align="right" sx={{ p:0 }}>Sum</TableCell>
                                    <TableCell align="right" sx={{ p:0 }}>Value</TableCell>
                                    <TableCell align="right" sx={{ p:0 }}>Amount</TableCell>
                                    <TableCell align="right" sx={{ p:0, pr: 1 }}>Bid</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {buildPriceLevels(bids, ORDER_TYPE_BIDS)}
                            </TableBody>
                        </Table>
                    </Grid>
                    <Grid item xs={12} md={6} lg={6} sx={{p:0}}>
                        <Typography align='right' variant='subtitle1' sx={{color:'#B72136', ml:2, mt:2, mb:1}}>Sell Orders</Typography>
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
                                <TableRow
                                    key={'ASK_KEY'}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            borderBottom: "1px solid",
                                            borderBottomColor: theme.palette.divider
                                        }
                                    }}
                                >
                                    <TableCell align="left" sx={{ p:0, pl: 1 }}>Ask</TableCell>
                                    <TableCell align="left" sx={{ p:0 }}>Amount</TableCell>
                                    <TableCell align="left" sx={{ p:0 }}>Value</TableCell>
                                    <TableCell align="left" sx={{ p:0 }}>Sum</TableCell>
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
