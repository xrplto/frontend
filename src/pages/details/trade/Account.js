import axios from 'axios';
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';

import {
    Login as LoginIcon,
    Logout as LogoutIcon,
    AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';

import { 
    Box,
    Typography,
    Button,
    Link,
    Avatar,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";

// components
import QRLoginDialog from './QRLoginDialog';
//
import { useContext } from 'react'
import Context from '../../../Context'
import { fNumber } from '../../../utils/formatNumber';
// ----------------------------------------------------------------------
function truncate(str, n){
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function AccountPopover() {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [lines, setLines] = useState([]);
    const [balance, setBalance] = useState(0);

    /*const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];*/

    useEffect(() => {
        
        function getAccountInfo(profile) {
            if (!profile || !profile.account) return;
            const account = profile.account;
            // https://api.xrpl.to/api/accountinfo/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
            axios.get(`${BASE_URL}/accountinfo/${account}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const lines = ret.lines;
                        if (lines) {
                            setLines(lines);                            
                        }
                        const account_data = ret.info?.account_data;
                        if (account_data) {
                            setBalance(account_data.Balance);
                        }
                    }
                }).catch(err => {
                    console.log("Error on getting details!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getAccountInfo(accountProfile);

    }, [accountProfile]);

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        if (openLogin) {
            timer = setInterval(async () => {
                console.log(counter + " " + isRunning, uuid);
                if (isRunning) return;
                isRunning = true;
                try {
                    const res = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                    const account = res.data.data.response.account;
                    if (account) {
                        setOpenLogin(false);
                        setAccountProfile({account: account, uuid: uuid});
                        return;
                    }
                } catch (err) {
                }
                isRunning = false;
                counter--;
                if (counter <= 0) {
                    setOpenLogin(false);
                }
            }, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [openLogin, uuid, setAccountProfile]);

    const onConnectXumm = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/xumm/login`);
            if (res.status === 200) {
                const uuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                setUuid(uuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
                setOpenLogin(true);
            }
        } catch (err) {
            alert(err);
        }
        setLoading(false);
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
            if (res.status === 200) {
                //setLog(res.data.status ? "disconnect success" : "disconnect failed");
                setAccountProfile(null);
                setUuid(null);
                setLines([]);
            }
        } catch(err) {
        }
        setLoading(false);
    };

    const handleLogin = () => {
        onConnectXumm();
    };

    const handleLogout = () => {
        onDisconnectXumm(accountProfile.uuid);
    }

    const handleLoginClose = () => {
        setOpenLogin(false);
        onDisconnectXumm(uuid);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                {accountProfile && accountProfile.account ? (
                    <>
                    <Link
                        // underline="none"
                        color="inherit"
                        target="_blank"
                        href={`https://bithomp.com/explorer/${accountProfile.account}`}
                        rel="noreferrer noopener"
                    >
                        <Stack direction="row" alignItems='center'>
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="body2" >
                                {truncate(accountProfile.account, 16)}
                            </Typography>
                            <IconButton edge="end" aria-label="bithomp">
                                <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                            </IconButton>
                        </Stack>
                    </Link>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title='Logout'>
                        <IconButton color='primary' onClick={handleLogout} aria-label="logout">
                            <LogoutIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    </>
                ) : (
                    <>
                    <Typography variant='caption' alignItems='center' color='primary'>Connect to check your account balances and tokens.</Typography>
                    <Box sx={{ flexGrow: 1 }} />

                    <Tooltip title='Login'>
                        <IconButton color='primary' onClick={handleLogin} aria-label="login">
                            <LoginIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    </>
                )}
            </Box>

            {
                lines.length > 0 && 
                <Table stickyHeader size={'small'}
                    sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: "0px solid",
                            borderBottomColor: theme.palette.divider
                        }
                    }}
                >
                    <TableBody>
                        <TableRow
                            hover
                            key={0}
                            tabIndex={-1}
                        >
                            <TableCell align="left" sx={{ pt:2, pb:2 }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar alt='XRP' src="/static/xrp.png" sx={{ mr:1, width: 24, height: 24 }}/>
                                    XRP
                                </Stack>
                            </TableCell>
                            <TableCell align="left" sx={{ pt:2, pb:2 }}>
                                {fNumber(balance / 1000000.0)}
                            </TableCell>
                        </TableRow>
                    {
                        lines.map((row) => {
                                const {
                                    id,
                                    issuer,
                                    currency,
                                    name,
                                    balance
                                } = row;

                                const imgUrl = `/static/tokens/${name.replace(/[^a-zA-Z]/g, "")}.jpg`;

                                return (
                                    <TableRow
                                        hover
                                        key={id}
                                        tabIndex={-1}
                                    >
                                        <TableCell align="left" sx={{ pt:2, pb:2 }}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar alt={name} src={imgUrl} sx={{ mr:1, width: 24, height: 24 }}/>
                                                {name}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="left" sx={{ pt:2, pb:2 }}>
                                            {fNumber(balance)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            }
            <QRLoginDialog
                open={openLogin}
                handleClose={handleLoginClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
