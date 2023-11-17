import React from 'react';
// Material UI components
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// Iconify for icons
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Function to format numbers in 'en-US' locale
const formatNumber = (number) => new Intl.NumberFormat('en-US').format(number);

const Spread = ({ bids, asks }) => {
    // Function to get the highest bid price
    const getHighestBid = (bids) => Math.max(...bids.map(bid => bid.price));

    // Function to get the lowest ask price
    const getLowestAsk = (asks) => Math.min(...asks.map(ask => ask.price));

    // Function to calculate the spread amount
    const getSpreadAmount = (bids, asks) => Math.abs(getHighestBid(bids) - getLowestAsk(asks));

    // Function to calculate spread percentage
    const getSpreadPercentage = (spread, highestBid) => `(${((spread / highestBid) * 100).toFixed(2)}%)`;

    // Calculate spread amount and spread percentage
    const spreadAmount = getSpreadAmount(bids, asks);
    const spreadPercentage = getSpreadPercentage(spreadAmount, getHighestBid(bids));

    return (
        <>
            <Typography variant='subtitle1' sx={{ color: '#9E86FF', ml: 0, mt: 2, mb: 1 }}>
                Spread: {formatNumber(spreadAmount)} {spreadPercentage}
            </Typography>
            <Tooltip title={
                <Typography variant="body2">
                    The bid-ask spread, also known as bid-offer or bid/ask (and buy/sell when referring to a market maker),
                    represents the difference between the quoted prices for an immediate sale (ask) and an immediate purchase (bid)
                    of financial instruments such as stocks, futures contracts, options, or currency pairs.
                    These prices can be quoted by a single market maker or found in a limit order book.
                </Typography>
            }>
                <Icon icon={infoFilled} />
            </Tooltip>
        </>
    );
};

export default Spread;
