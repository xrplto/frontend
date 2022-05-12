// material
// import axios from 'axios'
// import { useState, useEffect } from 'react';
import { /*alpha,*/ styled } from '@mui/material/styles';
// import { withStyles } from '@mui/styles';
import {
    Grid,
    Stack
} from '@mui/material';
import PairsList from './PairsList';
// import { MD5 } from 'crypto-js';
// ----------------------------------------------------------------------
// utils
// import { fNumber } from '../../../utils/formatNumber';
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    //backdropFilter: 'blur(2px)',
    //WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    //borderRadius: '13px',
    //padding: '0em 0.5em 1.5em 0.5em',
    //backgroundColor: alpha("#919EAB", 0.03),
}));
// ----------------------------------------------------------------------

// function getPair(issuer, code) {
//     // issuer, currencyCode, 'XRP', undefined
//     const t1 = 'undefined_XRP';
//     const t2 = issuer  + '_' +  code;
//     let pair = t1 + t2;
//     if (t1.localeCompare(t2) > 0)
//         pair = t2 + t1;
//     return MD5(pair).toString();
// }

export default function MarketData({token, pairs}) {
    return (
        <StackStyle>
            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={12} lg={12} sx={{pl:0}}>
                    <PairsList token={token} pairs={pairs} />
                </Grid>
            </Grid>
        </StackStyle>
    );
}
