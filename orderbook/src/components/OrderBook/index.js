import React, { FunctionComponent, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

import TitleRow from "./TitleRow";
import PriceLevelRow from "./PriceLevelRow";
import Spread from "../Spread";
import { useSelector, useDispatch } from "react-redux";
import { addAsks, addBids, addExistingState, selectAsks, selectBids } from './orderbookSlice';
import { MOBILE_WIDTH, ORDERBOOK_LEVELS, ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "../../constants";
import Loader from "../Loader";
import DepthVisualizer from "../DepthVisualizer";
import { ProductsMap } from "../../App";
import { formatNumber } from "../../helpers";
import styled from "styled-components";

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

const WSS_FEED_URL = 'wss://www.cryptofacilities.com/ws/v1';

let currentBids = []
let currentAsks = []

const OrderBook = ({ windowWidth, productId, isFeedKilled }) => {
  const bids = useSelector(selectBids);
  const asks = useSelector(selectAsks);
  const dispatch = useDispatch();

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

  return (
    <Container>
      {bids.length && asks.length ?
        <>
          <TableContainer>
            {windowWidth > MOBILE_WIDTH && <TitleRow windowWidth={windowWidth} reversedFieldsOrder={false} />}
            <div>{buildPriceLevels(bids, ORDER_TYPE_BIDS)}</div>
          </TableContainer>
          <Spread bids={bids} asks={asks} />
          <TableContainer>
            <TitleRow windowWidth={windowWidth} reversedFieldsOrder={true} />
            <div>
              {buildPriceLevels(asks, ORDER_TYPE_ASKS)}
            </div>
          </TableContainer>
        </> :
        <Loader />}
    </Container>
  )
};

export default OrderBook;
