import * as React from 'react';
//import { useContext } from 'react'
//import { useState, useEffect } from 'react';
//import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
// components
//
import { fIntNumber, fCurrency3 } from '../utils/formatNumber';
import { Icon } from '@iconify/react';
import postageStamp from '@iconify/icons-mdi/postage-stamp';
// ----------------------------------------------------------------------
import { useSelector } from "react-redux";
import { selectStatus } from "../redux/statusSlice";
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

const XLS14DStyle = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
    paddingTop: theme.spacing(0.2),
    paddingBottom: theme.spacing(0.2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: theme.palette.background.widget,
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 0.9,
    '&:hover': { opacity: 1 }
}));

// ----------------------------------------------------------------------
export default function Topbar() {
    const status = useSelector(selectStatus);

    return (
        <StackStyle direction="row" spacing={2} sx={{pl:2, pr:3, pt:0.5, pb:0.5}} alignItems="center">
                <h5>Tokens: </h5>
                <h5>{fIntNumber(status.token_count)}</h5>
                <Box sx={{ flexGrow: 1 }} />
                <XLS14DStyle>
                    <Tooltip title="Deprecated">
                        <Stack direction="row" spacing={0.1} alignItems='center'>
                            <Icon icon={postageStamp} width={16} height={16} />
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                                XLS-14D
                            </Typography>
                        </Stack>
                    </Tooltip>
                </XLS14DStyle>
                <h5>1 XRP</h5>
                <h6>|</h6>
                <h5>$ {fCurrency3(1/status.USD)}</h5>
                <h6>|</h6>
                <h5>€ {fCurrency3(1/status.EUR)}</h5>
                <h6>|</h6>
                <h5>¥ {fCurrency3(1/status.JPY)}</h5>
        </StackStyle>
    );
}
