import * as React from 'react';
//import { useContext } from 'react'
//import { useState, useEffect } from 'react';
//import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
// components
//
import { fIntNumber, fCurrency3, fNumber } from '../utils/formatNumber';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
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

const H24Style = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
    paddingTop: theme.spacing(0.2),
    paddingBottom: theme.spacing(0.2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: '#0C53B7',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
}));

const AllStyle = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
    paddingTop: theme.spacing(0.2),
    paddingBottom: theme.spacing(0.2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: '#0C53B7',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
}));

// ----------------------------------------------------------------------
export default function Topbar() {
    const status = useSelector(selectStatus);

    return (
        <StackStyle direction="row" spacing={2} sx={{pl:2, pr:3, pt:0.5, pb:0.5}} alignItems="center">
                {/* <AllStyle>
                    <Tooltip title="All">
                        <Stack direction="row" spacing={0.1} alignItems='center'>
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                                All
                            </Typography>
                        </Stack>
                    </Tooltip>
                </AllStyle> */}
                <h5>Tokens: </h5>
                <h5>{fIntNumber(status.token_count)}</h5>
                <H24Style>
                    <Tooltip title="Metrics on 24 hours">
                        <Stack spacing={0.05} alignItems='center'>
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                                24h
                            </Typography>
                        </Stack>
                    </Tooltip>
                </H24Style>
                <h5>Tx:</h5>
                <Typography align="center" style={{ color: "#74CAFF" }} variant="subtitle2">{fIntNumber(status.transactions24H)}</Typography>
                {/* <h6>|</h6> */}
                <h5>Vol:</h5>
                <Typography align="center" style={{ color: "#FF6C40" }} variant="subtitle2">
                    ${fNumber(status.tradedUSD24H)}
                    <Typography align="center" style={{ color: "#54D62C" }} variant="caption">
                        ({fNumber(status.tradedXRP24H)} XRP)
                    </Typography>
                </Typography>
                {/* <h6>|</h6> */}
                <h5>Tokens Traded:</h5>
                <Typography align="center" style={{ color: "#3366FF" }} variant="subtitle2">{fIntNumber(status.tradedTokens24H)}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <h5>1 XRP</h5>
                <h6>|</h6>
                <h5>$ {fCurrency3(1/status.USD)}</h5>
                <h6>|</h6>
                <h5>€ {fCurrency3(1/status.EUR)}</h5>
                <h6>|</h6>
                <h5>¥ {fCurrency3(1/status.JPY)}</h5>
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
        </StackStyle>
    );
}
