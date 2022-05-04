import React, { FunctionComponent } from 'react';
import { Container } from "./styles";
import { formatNumber } from "../../helpers";

const Spread = ({ bids, asks }) => {
  const getHighestBid = (bids) => {
    const prices = bids.map(bid => bid[0]);
    return  Math.max.apply(Math, prices);
  }

  const getLowestAsk = (asks) => {
    const prices = asks.map(ask => ask[0]);
    return  Math.min.apply(Math, prices);
  }

  const getSpreadAmount = (bids, asks) => Math.abs(getHighestBid(bids) - getLowestAsk(asks));

  const getSpreadPercentage = (spread, highestBid) => `(${((spread * 100) / highestBid).toFixed(2)}%)`;

  return (
    <Container>
      Spread: {formatNumber(getSpreadAmount(bids, asks))} {getSpreadPercentage(getSpreadAmount(bids, asks), getHighestBid(bids))}
    </Container>
  );
};

export default Spread;
