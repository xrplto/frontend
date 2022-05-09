import React from 'react';

import { MOBILE_WIDTH, ORDER_TYPE_BIDS, ORDER_TYPE_ASKS } from "./constants";

import { formatNumber } from "./helpers";

import styled from "styled-components";

import { fNumber } from '../../../../utils/formatNumber';

import {
    Avatar,
    Box,
    Stack,
    Table,
    TableRow,
    TableBody,
    TableCell,
    Typography
} from '@mui/material';

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
    const total = fNumber(level.total);
    const amount = fNumber(level.amount);
    const quantity = fNumber(level.quantity);
    const quantityA = fNumber(level.quantityA);
    const price = fNumber(level.price);
    const partial = level.partial;
    const isBid= orderType === ORDER_TYPE_BIDS;

    return (
        <Container data-testid='price-level-row' isPartial={partial} isBid={isBid} windowWidth={windowWidth}>
            {orderType === ORDER_TYPE_ASKS || windowWidth < MOBILE_WIDTH ?
                <>
                    <TableCell style={{color: '#bb3336'}}>{price}</TableCell>
                    <TableCell style={{color: partial ? '#FFC107':''}}>{quantity}</TableCell>
                    <TableCell>{quantityA}</TableCell>
                    <TableCell>{amount}</TableCell>
                </> :
                <>
                    <TableCell>{amount}</TableCell>
                    <TableCell>{quantityA}</TableCell>
                    <TableCell style={{color: partial ? '#FFC107':''}}>{quantity}</TableCell>
                    <TableCell style={{color: '#118860'}}>{price}</TableCell>
                </>}
        </Container>
    );
};

export default PriceLevelRow;
