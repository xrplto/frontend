import * as React from 'react';
//import { useContext } from 'react'
import { useState, useEffect } from 'react';
//import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';
// components
//
import { fCurrency3 } from '../utils/formatNumber';
// ----------------------------------------------------------------------
import { useSelector } from "react-redux";
import { selectRate } from "../redux/exchangeSlice";
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
    const rates = useSelector(selectRate);
    console.log("Pricebar.js", rates.USD);

    useEffect(() => {
        console.log("Pricebar useEffect called!");
    }, []);

    return (
        <>
            <StackStyle direction="row" spacing={2} sx={{pl:10, pr:10, pt:1, pb:0.5}} alignItems="center">
                <Box sx={{ flexGrow: 1 }} />
                <h5>1 XRP</h5>
                <h6>|</h6>
                <h5>$ {fCurrency3(1/rates.USD)}</h5>
                <h6>|</h6>
                <h5>€ {fCurrency3(1/rates.EUR)}</h5>
                <h6>|</h6>
                <h5>¥ {fCurrency3(1/rates.JPY)}</h5>
            </StackStyle>
        </>
    );
}
