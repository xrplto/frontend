import axios from 'axios';
import { Icon } from '@iconify/react';
import { useRef, useState, useEffect } from 'react';
import userLock from '@iconify/icons-fa-solid/user-lock';
//import homeFill from '@iconify/icons-eva/home-fill';
//import personFill from '@iconify/icons-eva/person-fill';
//import settings2Fill from '@iconify/icons-eva/settings-2-fill';
//import { Link as RouterLink } from 'react-router-dom';
// material
//import { alpha } from '@mui/material/styles';
import { 
    Box,
    Typography,
    Button,
    MenuItem,
    Avatar,
    IconButton,
    Stack
} from '@mui/material';

// components
import MenuPopover from './MenuPopover';
import LoginDialog from './LoginDialog';
//
import { useContext } from 'react'
import Context from '../Context'

export default function AccountPopover() {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const anchorRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    //const [wsUrl, setWsUrl] = useState(null);
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
                    const res = await axios.get(`${BASE_URL}/xumm/payloadlogin/${uuid}`);
                    const data = res.data.data;
                    const admin = res.data.admin;
                    const account = data.response.account;
                    const token = data.application.issued_user_token;
                    if (account) {
                        setOpen(true);
                        setOpenLogin(false);
                        setAccountProfile({account: account, uuid: uuid, token:token, admin:admin});
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
                setAccountProfile(null);
                setUuid(null);
            }
        } catch(err) {
        }
        setLoading(false);
    };

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleLogin = () => {
        setOpen(false);
        onConnectXumm();
    };

    const handleLogout = () => {
        setOpen(false);
        onDisconnectXumm(accountProfile.uuid);
    }

    const handleLoginClose = () => {
        setOpenLogin(false);
        onDisconnectXumm(uuid);
    };

    // <Alert
    //     variant="outlined"
    //     severity="success">
    //     <AlertTitle>{accountProfile.account}</AlertTitle>
    //     <br/>
    //     Login successful!
    //     <br/>
    // </Alert>

    // <Alert severity="success" color="info">
    //     Login Successful!
    // </Alert>

    // <Snackbar open={true} autoHideDuration={2000} onClose={handleClose}>
    //     <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
    //         Login Successful!
    //     </Alert>
    // </Snackbar>

    return (
        <>
            <IconButton
                ref={anchorRef}
                onClick={handleOpen} >
                {/* <SupervisorAccountIcon fontSize="medium"/> */}
                <Icon icon={userLock}/>
            </IconButton>

            <MenuPopover
                open={open}
                onClose={handleClose}
                anchorEl={anchorRef.current}
                sx={{ width: 220 }}
            >

                {accountProfile && accountProfile.account ? (
                        <>
                        <Stack spacing={1} sx={{ pt: 2 }} alignItems='center'>
                            <Avatar alt="xumm" src="/static/xumm.jpg" sx={{ mr:1, width: 24, height: 24 }}/>
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="body2" sx={{ width: 180, color: 'text.secondary' }} >
                                {accountProfile.account}
                            </Typography>
                        </Stack>
                        <Box sx={{ p: 2, pt: 1.5 }}>
                            <Button fullWidth color="inherit" variant="outlined" onClick={handleLogout}>
                                Logout
                            </Button>
                        </Box>
                        </>
                    ) : (
                        <MenuItem
                            key="xumm"
                            onClick={handleLogin}
                            sx={{ typography: 'body2', py: 2, px: 2.5 }}
                        >
                            <Stack direction='row' spacing={1} sx={{mr: 2}} alignItems='center'>
                                <Avatar alt="xumm" src="/static/xumm.jpg"/>
                                <h3 style={{marginLeft: '10px'}}>XUMM</h3>
                            </Stack>
                        </MenuItem>
                )}

            {/* <Divider sx={{ my: 1 }} /> */}
            </MenuPopover>

            <LoginDialog
                open={openLogin}
                handleClose={handleLoginClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
