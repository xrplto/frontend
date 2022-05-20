import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import {
    Tooltip,
    Typography
} from '@mui/material';

const Container = styled('div')({
    color: '#98a6af',
    backgroundColor: '#121723',
    width: '50%',
    textAlign: 'center'
});

const formatNumber = (arg) => {
    return new Intl.NumberFormat('en-US').format(arg);
};

const Spread = ({ bids, asks }) => {
    const getHighestBid = (bids) => {
        const prices = bids.map(bid => bid.price);
        return  Math.max.apply(Math, prices);
    }

    const getLowestAsk = (asks) => {
        const prices = asks.map(ask => ask.price);
        return  Math.min.apply(Math, prices);
    }

    const getSpreadAmount = (bids, asks) => Math.abs(getHighestBid(bids) - getLowestAsk(asks));

    const getSpreadPercentage = (spread, highestBid) => `(${((spread * 100) / highestBid).toFixed(2)}%)`;

    /*
    The bid–ask spread (also bid–offer or bid/ask and buy/sell in the case of a market maker) 
    is the difference between the prices quoted (either by a single market maker or in a limit order book) 
    for an immediate sale (ask) and an immediate purchase (bid) for stocks, futures contracts, options, or currency pairs.
    */

    return (
        <>
        <Typography variant='subtitle1' sx={{color:'#9E86FF', ml:0, mt:2, mb:1}}>
            Spread: {formatNumber(getSpreadAmount(bids, asks))} {getSpreadPercentage(getSpreadAmount(bids, asks), getHighestBid(bids))}
        </Typography>
        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">The bid–ask spread (also bid–offer or bid/ask and buy/sell in the case of a market maker) 
    is the difference between the prices quoted (either by a single market maker or in a limit order book) 
    for an immediate sale (ask) and an immediate purchase (bid) for stocks, futures contracts, options, or currency pairs.</Typography>}>
            <Icon icon={infoFilled} />
        </Tooltip>
        </>
    );
};

export default Spread;
