import React from 'react';
import { formatNumber } from "./helpers";
import styled from "styled-components";

// const Container = styled.div`
//   color: #98a6af;
//   background-color: #121723;
//   width: 50%;
//   text-align: center;
//   padding: 0.7em 0;
  
//   @media only screen and (min-width: 800px) {
//     position: absolute;
//     top: 5px;
//   }
// `

const Container = styled.div`
  color: #98a6af;
  background-color: #121723;
  width: 50%;
  text-align: center;
`

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
