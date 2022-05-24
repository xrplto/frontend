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

export default function AccountBalance({pair}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [lines, setLines] = useState([]);
    const [balance, setBalance] = useState(null);
    const [accountBalance, setAccountBalance] = useState(null);

    let curr1 = { ...pair.curr1 };
    let curr2 = { ...pair.curr2 };

    
    /*{
        "currency": "XRP",
        "value": 408593.89259000024,
        "md5": "71dbd3aabf2d99d205e0e2556ae4cf55",
        "name": "XRP"
    }*/

    for (var line of lines) {
        const {
            id,
            issuer,
            currency,
            name,
            balance
        } = line;

        /*if (currency === 'XRP') {
            if (curr1.currency === 'XRP')
                curr1.value = balance / 1000000;
            else if (curr2.currency === 'XRP')
            curr2.value = balance / 1000000;
        }*/

        if (curr1.currency === currency) {
            if (curr1.currency === 'XRP' || (curr1.currency !== 'XRP' && curr1.issuer === issuer)) {
                curr1.value = balance;
            }
        }

        if (curr2.currency === currency) {
            if (curr2.currency === 'XRP' || (curr2.currency !== 'XRP' && curr2.issuer === issuer)) {
                curr2.value = balance;
            }
        }
    }
    /*const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];*/

    useEffect(() => {
        function getAccountInfo(profile, pair) {
            if (!profile || !profile.account) return;
            if (!pair) return;
            const account = profile.account;
            // https://api.xrpl.to/api/accountinfo/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm?pair=fa99aff608a10186d3b1ff33b5cd665f
            axios.get(`${BASE_URL}/accountinfo/${account}?pair=${pair.pair}`)
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
        getAccountInfo(accountProfile, pair);

    }, [accountProfile, pair]);

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
            {accountProfile && accountProfile.account ? (
                accountBalance && <Table size={'small'}
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
                                key={-1}
                                tabIndex={-1}
                            >
                                <TableCell align="center" sx={{ p:0 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{curr1.name}</Typography>
                                    {fNumber(curr1.value)}
                                </TableCell>
                                <TableCell align="center" sx={{ p:0 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{curr2.name}</Typography>
                                    {fNumber(curr2.value)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
            ) : (
                <Stack alignItems='center'>
                    <Button variant="outlined" color='error' onClick={handleLogin} endIcon={<AccountBalanceWalletIcon />}>
                        Connect Wallet
                    </Button>
                </Stack>
            )}

            <QRLoginDialog
                open={openLogin}
                handleClose={handleLoginClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
