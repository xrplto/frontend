import React, { useEffect, useState } from 'react';
import useWebSocket from "react-use-websocket";
import { PuffLoader } from "react-spinners";
import { styled } from '@mui/material/styles';
import TitleRow from "./TitleRow";
import PriceLevelRow from "./PriceLevelRow";
import DepthVisualizer from "./DepthVisualizer";

import orderBookParser from './plugins/orderbook-parser';
import { formatNumber } from "./helpers";

import {
    Button,
    Stack,
    Typography
} from '@mui/material';

const LoaderContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '79vh'
});

const TableContainer = styled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    color: '#bfc1c8',
    '@media only screen and (min-width: 800px)': {
        width: '50%'
    }
});

const PriceLevelRowContainer = styled('div')({
    margin: '.155em 0'
});

const MOBILE_WIDTH = 800; // px
const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

let currentBids = []
let currentAsks = []

export default function OrderBook({token, pair}) {
    const WSS_FEED_URL = 'wss://ws.xrpl.to';
    
    const [windowWidth, setWindowWidth] = useState(0);
    const [isFeedKilled, setIsFeedKilled] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);

    // Window width detection
    useEffect(() => {
        window.onresize = () => {
            setWindowWidth(window.innerWidth);
        }
        setWindowWidth(() => window.innerWidth);
    }, []);

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
            const parsedAsks = orderBookParser(orderBook.result.asks);
            const parsedBids = orderBookParser(orderBook.result.bids, true);
            setAsks(parsedAsks);
            setBids(parsedBids);
        }

        //console.log(orderBook);
        // 
        if (orderBook.numLevels) {
            //dispatch(addExistingState(res));
        } else {
            //process(res);
        }
    };

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

    const process = (data) => {
        // if (data?.bids?.length > 0) {
        //     currentBids = [...currentBids, ...data.bids];

        //     if (currentBids.length > ORDERBOOK_LEVELS) {
        //         dispatch(addBids(currentBids));
        //         currentBids = [];
        //         currentBids.length = 0;
        //     }
        // }
        // if (data?.asks?.length >= 0) {
        //     currentAsks = [...currentAsks, ...data.asks];

        //     if (currentAsks.length > ORDERBOOK_LEVELS) {
        //         dispatch(addAsks(currentAsks));
        //         currentAsks = [];
        //         currentAsks.length = 0;
        //     }
        // }
    };

    const formatPrice = (arg) => {
        return arg.toLocaleString("en", { useGrouping: true, minimumFractionDigits: 2 })
    };

    const buildPriceLevels = (levels, orderType = ORDER_TYPE_BIDS) => {
        const sortedLevelsByPrice = [ ...levels ].sort(
            (a, b) => {
                let result = 0;
                if (orderType === ORDER_TYPE_BIDS || windowWidth < MOBILE_WIDTH) {
                    result = b.price - a.price;
                } else {
                    result = a.price - b.price;
                }
                return result;
            }
        );

        // { ASK
        //     "price": "0.7325",
        //     "quantity": 100,
        //     "total": 66863.44407301412
        // }

        // { BID
        //     "price": "1.403",
        //     "quantity": 49595232,
        //     "total": 33298479983
        // }

        // [ 36401, 450, 31620, 2.1745095490677873 ]
        // Price, Size, Total, Depth

        if (orderType === ORDER_TYPE_BIDS) {
            //console.log(levels);
        }
        return (
            sortedLevelsByPrice.map((level, idx) => {
                const calculatedTotal = level.total;
                const total = formatNumber(calculatedTotal);
                const depth = 100; // level[3];
                const size = formatNumber(level.quantity);
                const price = formatPrice(level.price);
                return (
                    <PriceLevelRowContainer key={idx + depth}>
                        <DepthVisualizer key={depth} windowWidth={windowWidth} depth={depth} orderType={orderType} />
                        <PriceLevelRow
                            key={size + total}
                            total={total}
                            size={size}
                            price={price}
                            reversedFieldsOrder={orderType === ORDER_TYPE_ASKS}
                            windowWidth={windowWidth} />
                    </PriceLevelRowContainer>
                );
            })
        );
    };

    if (isPageVisible) {
        return <Stack>
            <Stack direction="row">
                <Typography variant='h3'>Order Book</Typography>
                {/* <Spread bids={bids} asks={asks} /> */}
                {/* <GroupingSelectBox options={options[productId]} /> */}
            </Stack>
            {bids.length && asks.length ?
                <Stack direction="row">
                    <TableContainer>
                        {windowWidth > MOBILE_WIDTH && <TitleRow windowWidth={windowWidth} reversedFieldsOrder={false} />}
                        <div>
                            {buildPriceLevels(bids, ORDER_TYPE_BIDS)}
                        </div>
                    </TableContainer>
                    <TableContainer>
                        <TitleRow windowWidth={windowWidth} reversedFieldsOrder={true} />
                        <div>
                            {buildPriceLevels(asks, ORDER_TYPE_ASKS)}
                        </div>
                    </TableContainer>
                </Stack>
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
        </Stack>
    } else
        return 'HIDDEN PAGE.';
};
