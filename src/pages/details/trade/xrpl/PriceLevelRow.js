import React from 'react';

import { MOBILE_WIDTH, ORDER_TYPE_BIDS, ORDER_TYPE_ASKS } from "./constants";

import { formatNumber } from "./helpers";

import styled from "styled-components";

const Container = styled.div`
    display: flex;
    justify-content: space-around;
    position: relative;
    
    &:after {
        background-position: center;
        height: 100%;
        padding: .3em 0;
        display: block;
        content: "";
        position: absolute;
        left: 0;
        right: unset;
        z-index: 0;

        @media only screen and (min-width: 800px) {
            left: ${props => props.isBid ? 'unset' : 0};
            right: ${props => props.isBid ? 0 : 'unset'};
        }
    }
    
    span {
        z-index: 1;
        min-width: 54px;
    }
    
    .price {
        color: ${props => props.isBid ? '#118860' : '#bb3336'}
    }

    .quantity {
        color: ${props => props.isPartial ? '#FFC107' : ''}
    }
`

const DepthVisualizerColors = {
    BIDS: "#113534",
    ASKS: "#3d1e28"
};

const formatPrice = (val) => {
    return val.toLocaleString("en", { useGrouping: true, minimumFractionDigits: 2 })
};

const PriceLevelRow = ({ level, orderType, windowWidth }) => {
    const total = formatNumber(level.total);
    const amount = formatNumber(level.amount);
    const quantity = formatNumber(level.quantity);
    const quantityA = formatNumber(level.quantityA);
    const price = formatPrice(level.price);
    const partial = level.partial;
    
    return (
        <Container data-testid='price-level-row' isPartial={partial} isBid={orderType === ORDER_TYPE_BIDS} windowWidth={windowWidth}>
            {orderType === ORDER_TYPE_ASKS || windowWidth < MOBILE_WIDTH ?
                <>
                    <span className='price'>{price}</span>
                    <span className='quantity'>{quantity}</span>
                    <span>{quantityA}</span>
                    <span>{amount}</span>
                </> :
                <>
                    <span>{amount}</span>
                    <span>{quantityA}</span>
                    <span className='quantity'>{quantity}</span>
                    <span className='price'>{price}</span>
                </>}
        </Container>
    );
};

export default PriceLevelRow;
