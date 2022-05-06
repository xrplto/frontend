import React, { useEffect, useState } from 'react';
import useWebSocket from "react-use-websocket";

import TitleRow from "./TitleRow";
import Spread from "./Spread";
import { useSelector, useDispatch } from "react-redux";
import { addAsks, addBids, addExistingState, selectAsks, selectBids } from './orderbookSlice';
import { MOBILE_WIDTH, ORDERBOOK_LEVELS, ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "./constants";
import Loader from "./Loader";
import PriceLevelRow from "./PriceLevelRow";
import DepthVisualizer from "./DepthVisualizer";
import { formatNumber } from "./helpers";
import styled from "styled-components";
import StatusMessage from "./StatusMessage";
import { clearOrdersState } from "./orderbookSlice";
import GroupingSelectBox from "./GroupingSelectBox";
import {
  Button,
  Stack
} from '@mui/material';

const HeaderContainer = styled.div`
    display: flex;
    width: 100%;
    margin: 0 auto;
    justify-content: space-between;
    color: #98a6af;
    padding: .6em;
    background-color: #121723;
    border-bottom: 1px solid #29303e;
    
    h3 {
        color: #bfc1c8;
    }

    @media only screen and (min-width: 800px) {
        padding: 0.7em;
    }
`

const Container = styled.div`
    display: flex;
    min-height: 31.25em;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: center;
    border-color: #263946;

    @media only screen and (min-width: 800px) {
        flex-direction: row;
        justify-content: center;
    }
`

const TableContainer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    color: #bfc1c8;

    @media only screen and (min-width: 800px) {
        width: 50%;
    }
`

const PriceLevelRowContainer = styled.div`
    margin: .155em 0;
`

const ProductIds = {
    XBTUSD: 'PI_XBTUSD',
    ETHUSD: 'PI_ETHUSD'
};

const options = {
    PI_XBTUSD: [0.5, 1, 2.5],
    PI_ETHUSD: [0.05, 0.1, 0.25]
};

const ProductsMap = {
    "PI_XBTUSD": "PI_ETHUSD",
    "PI_ETHUSD": "PI_XBTUSD",
}

const WSS_FEED_URL = 'wss://www.cryptofacilities.com/ws/v1';

let currentBids = []
let currentAsks = []

const OrderBook = () => {
    const dispatch = useDispatch();
    
    const [windowWidth, setWindowWidth] = useState(0);
    const [productId, setProductId] = useState(ProductIds.XBTUSD);
    const [isFeedKilled, setIsFeedKilled] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const bids = useSelector(selectBids);
    const asks = useSelector(selectAsks);
  

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
                setIsPageVisible(false);
            } else {
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

    const toggleProductId = () => {
        dispatch(clearOrdersState());
        setProductId(ProductsMap[productId]);
    };

    const toggleFeed = () => {
        setIsFeedKilled(!isFeedKilled);
    }

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => console.log('WebSocket connection opened.'),
        onClose: () => console.log('WebSocket connection closed.'),
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event)
    });

    const processMessages = (event) => {
        const response = JSON.parse(event.data);

        if (response.numLevels) {
            dispatch(addExistingState(response));
        } else {
            process(response);
        }
    };

    useEffect(() => {
        function connect(product) {
            const unSubscribeMessage = {
                event: 'unsubscribe',
                feed: 'book_ui_1',
                product_ids: [ProductsMap[product]]
            };
            sendJsonMessage(unSubscribeMessage);

            const subscribeMessage = {
                event: 'subscribe',
                feed: 'book_ui_1',
                product_ids: [product]
            };
            sendJsonMessage(subscribeMessage);
        }

        if (isFeedKilled) {
            getWebSocket()?.close();
        } else {
            connect(productId);
        }
    }, [isFeedKilled, productId, sendJsonMessage, getWebSocket]);

    const process = (data) => {
        if (data?.bids?.length > 0) {
            currentBids = [...currentBids, ...data.bids];

            if (currentBids.length > ORDERBOOK_LEVELS) {
                dispatch(addBids(currentBids));
                currentBids = [];
                currentBids.length = 0;
            }
        }
        if (data?.asks?.length >= 0) {
            currentAsks = [...currentAsks, ...data.asks];

            if (currentAsks.length > ORDERBOOK_LEVELS) {
                dispatch(addAsks(currentAsks));
                currentAsks = [];
                currentAsks.length = 0;
            }
        }
    };

    const formatPrice = (arg) => {
        return arg.toLocaleString("en", { useGrouping: true, minimumFractionDigits: 2 })
    };

    const buildPriceLevels = (levels, orderType = ORDER_TYPE_BIDS) => {
        const sortedLevelsByPrice = [ ...levels ].sort(
          (currentLevel, nextLevel) => {
            let result = 0;
            if (orderType === ORDER_TYPE_BIDS || windowWidth < MOBILE_WIDTH) {
              result = nextLevel[0] - currentLevel[0];
            } else {
              result = currentLevel[0] - nextLevel[0];
            }
            return result;
          }
        );

        return (
          sortedLevelsByPrice.map((level, idx) => {
            const calculatedTotal = level[2];
            const total = formatNumber(calculatedTotal);
            const depth = level[3];
            const size = formatNumber(level[1]);
            const price = formatPrice(level[0]);

            return (
              <PriceLevelRowContainer key={idx + depth}>
                <DepthVisualizer key={depth} windowWidth={windowWidth} depth={depth} orderType={orderType} />
                <PriceLevelRow key={size + total}
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
            <HeaderContainer>
                <h3>Order Book</h3>
                <Spread bids={bids} asks={asks} />
                <GroupingSelectBox options={options[productId]} />
            </HeaderContainer>
          <Container>
          {bids.length && asks.length ?
            <>
              <TableContainer>
                {windowWidth > MOBILE_WIDTH && <TitleRow windowWidth={windowWidth} reversedFieldsOrder={false} />}
                <div>{buildPriceLevels(bids, ORDER_TYPE_BIDS)}</div>
              </TableContainer>
              {/* <Spread bids={bids} asks={asks} /> */}
              <TableContainer>
                <TitleRow windowWidth={windowWidth} reversedFieldsOrder={true} />
                <div>
                  {buildPriceLevels(asks, ORDER_TYPE_ASKS)}
                </div>
              </TableContainer>
            </> :
            <Loader />}
        </Container>
        <div
          style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
          }}
        >
          {!isFeedKilled && <Button variant="outlined" color="primary" sx={{mr: 1}} onClick={toggleProductId}>Toggle Feed</Button>}
          <Button variant="outlined" color="error" onClick={toggleFeed}>{isFeedKilled ? 'Renew feed' : 'Kill Feed'}</Button>
        </div>
        <StatusMessage isFeedKilled={isFeedKilled} selectedMarket={productId} />
        </Stack>
    } else
        return 'HIDDEN PAGE.';
};

export default OrderBook;
