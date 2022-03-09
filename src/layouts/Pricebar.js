import * as React from 'react';
import { useContext } from 'react'
import { useState, useEffect } from 'react';
import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, Toolbar, IconButton } from '@mui/material';
// components
//
import { limitNumber, fCurrency5, fCurrency3 } from '../utils/formatNumber';
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //backgroundColor: alpha("#00AB88", 0.99),
}));

// ----------------------------------------------------------------------
export default function Pricebar() {
    const [exch_usd, setUSD] = useState(100);
    const [exch_eur, setEUR] = useState(100);
    const [exch_jpy, setJPY] = useState(100);
    const [exch_cny, setCNY] = useState(100);
    return (
        <>
            <StackStyle direction="row" spacing={2} sx={{pl:10, pr:10, pt:1, pb:0.5}} alignItems="center">
                <Box sx={{ flexGrow: 1 }} />
                <h5>1 XRP</h5>
                <h6>|</h6>
                <h5>$ {fCurrency3(1/exch_usd)}</h5>
                <h6>|</h6>
                <h5>€ {fCurrency3(1/exch_eur)}</h5>
                <h6>|</h6>
                <h5>¥ {fCurrency3(1/exch_jpy)}</h5>
            </StackStyle>
        </>
    );
}
