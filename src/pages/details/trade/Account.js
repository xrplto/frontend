import axios from 'axios';
import { useState, useEffect } from 'react';

import {
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
    Stack
} from '@mui/material';

// components
import QRLoginDialog from './QRLoginDialog';
//
import { useContext } from 'react'
import Context from '../../../Context'
// ----------------------------------------------------------------------
function truncate(str, n){
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function AccountPopover() {
    const SERVER_BASE_URL = 'https://api.xrpl.to/api/xumm';
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    /*const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];*/

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
                    const res = await axios.get(`${SERVER_BASE_URL}/payload/${uuid}`);
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
            const res = await axios.post(`${SERVER_BASE_URL}/login`);
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
            const res = await axios.delete(`${SERVER_BASE_URL}/logout/${uuid}`);
            if (res.status === 200) {
                //setLog(res.data.status ? "disconnect success" : "disconnect failed");
                setAccountProfile(null);
                setUuid(null);
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
                                {truncate(accountProfile.account, 12)}
                            </Typography>
                            <IconButton edge="end" aria-label="bithomp">
                                <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                            </IconButton>
                        </Stack>
                    </Link>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" color='error' onClick={handleLogout} endIcon={<AccountBalanceWalletIcon />}>
                        Logout
                    </Button>
                    </>
                ) : (
                    <>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" color='error' onClick={handleLogin} endIcon={<AccountBalanceWalletIcon />}>
                        Connect
                    </Button>
                    </>
                )}
            </Box>

            <QRLoginDialog
                open={openLogin}
                handleClose={handleLoginClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
