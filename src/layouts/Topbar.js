import * as React from 'react';
//import { useContext } from 'react'
import { /*useState,*/ useEffect } from 'react';
//import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';
// components
//
import { fIntNumber, fCurrency3 } from '../utils/formatNumber';
// ----------------------------------------------------------------------
import { useSelector } from "react-redux";
import { selectStatus } from "../redux/statusSlice";
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
export default function Topbar() {
    const status = useSelector(selectStatus);

    useEffect(() => {
        //console.log("Topbar useEffect called!");
    }, []);

    return (
        <>
            <StackStyle direction="row" spacing={2} sx={{pl:5, pr:10, pt:1, pb:0.5}} alignItems="center">
                <h5>Tokens: </h5>
                <h5>{fIntNumber(status.token_count)}</h5>
                <Box sx={{ flexGrow: 1 }} />
                <h5>1 XRP</h5>
                <h6>|</h6>
                <h5>$ {fCurrency3(1/status.USD)}</h5>
                <h6>|</h6>
                <h5>€ {fCurrency3(1/status.EUR)}</h5>
                <h6>|</h6>
                <h5>¥ {fCurrency3(1/status.JPY)}</h5>
            </StackStyle>
        </>
    );
}
