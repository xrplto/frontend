import { Icon } from '@iconify/react';
import { useRef, useState, useEffect } from 'react';
import userLock from '@iconify/icons-fa-solid/user-lock';

import {
    Logout as LogoutIcon,
    AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';

import {
    Alert,
    Box,
    Typography,
    Button,
    Link,
    MenuItem,
    Avatar,
    IconButton,
    Stack
} from '@mui/material';

// components
import LoginDialog from './LoginDialog';
//
import { useContext } from 'react'
import Context from '../../../Context'

//import profile from '../_mocks_/profile';
import axios from 'axios';
import CreateOfferDialog from './CreateOfferDialog';



// import {
//     SupervisorAccount as SupervisorAccountIcon
// } from '@mui/icons-material'
// ----------------------------------------------------------------------
//const SERVER_BASE_URL = 'http://127.0.0.1/api/xumm';
const SERVER_BASE_URL = 'https://api.xrpl.to/api/xumm';
// ----------------------------------------------------------------------
function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function PlaceOrder({buySell, pair, amount, value}) {
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const anchorRef = useRef(null);
    const [openLogin, setOpenLogin] = useState(false);
    const [uuid, setUuid] = useState(null);
    //const [wsUrl, setWsUrl] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [showAccountAlert, setShowAccountAlert] = useState(false);

    const [showResult, setShowResult] = useState(0);
    
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
                if (isRunning) return;
                isRunning = true;
                try {
                    const ret = await axios.get(`${SERVER_BASE_URL}/payload/${uuid}`);
                    const res = ret.data.data.response;

                    const account = res.account;
                    const resolved_at = res.resolved_at;
                    const dispatched_result = res.dispatched_result;
                    if (resolved_at) {
                        setOpenLogin(false);
                        if (dispatched_result && dispatched_result === 'tesSUCCESS')
                            setShowResult(1);
                        else
                            setShowResult(2);
                        
                        setTimeout(() => {
                            setShowResult(0);
                        }, 2000);
                        // setAccountProfile({account: account, uuid: uuid});
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

    const onOfferCreateXumm = async () => {
        setLoading(true);
        try {
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            // const Account = accountProfile.account;
            let TakerGets, TakerPays;
            if (buySell === 'BUY') {
                // BUY logic
                // TakerGets: curr2(value) TakerPays: curr1(amount)
                if (curr2.currency === 'XRP') {
                    TakerGets = (value * 1000000).toString();
                    TakerPays = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
                } else {
                    TakerGets = {currency:curr2.currency, issuer:curr2.issuer, value: value.toString()};
                    TakerPays = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
                }
            } else {
                // SELL logic
                // TakerGets: curr1(amount) TakerPays: curr2(value)
                if (curr2.currency === 'XRP') {
                    TakerGets = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
                    TakerPays = (value * 1000000).toString();
                } else {
                    TakerGets = {currency:curr1.currency, issuer:curr1.issuer, value: amount.toString()};
                    TakerPays = {currency:curr2.currency, issuer:curr2.issuer, value: value.toString()};
                }
            }
            const body={/*Account,*/ TakerGets, TakerPays};

            const res = await axios.post(`${SERVER_BASE_URL}/offercreate`, body);

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
                //setAccountProfile(null);
                setUuid(null);
            }
        } catch(err) {
        }
        setLoading(false);
    };

    const handleLogout = () => {
        //onDisconnectXumm(accountProfile.uuid);
    }

    const handleLoginClose = () => {
        setOpenLogin(false);
        onDisconnectXumm(uuid);
    };

    const handlePlaceOrder = (e) => {
        onOfferCreateXumm();

        // if (accountProfile && accountProfile.account) {
        //     // Create offer
        //     /*{
        //         "TransactionType": "OfferCreate",
        //         "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
        //         "Fee": "12",
        //         "Flags": 0,
        //         "LastLedgerSequence": 7108682,
        //         "Sequence": 8,
        //         "TakerGets": "6000000",
        //         "TakerPays": {
        //           "currency": "GKO",
        //           "issuer": "ruazs5h1qEsqpke88pcqnaseXdm6od2xc",
        //           "value": "2"
        //         }
        //     }*/
        //     onOfferCreateXumm();

        // } else {
        //     setShowAccountAlert(true);
        //     setTimeout(() => {
        //         setShowAccountAlert(false);
        //     }, 2000);
        // }
    }

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
            <Button variant="outlined" sx={{ mt: 1.5 }}
                onClick={handlePlaceOrder}
                color={buySell === 'BUY' ? 'primary':'error'}
            >
                PLACE  ORDER
            </Button>

            {showAccountAlert && <Alert variant="filled" severity="error" sx={{ m: 2, mt:0 }}>
                Please login first!
            </Alert>}

            {showResult === 2 && <Alert variant="filled" severity="error" sx={{ m: 2, mt:0 }}>
                Failed by user!
            </Alert>}

            {showResult === 1 && <Alert variant="filled" severity="success" sx={{ m: 2, mt:0 }}>
                Successfully submitted the order!
            </Alert>}

            <CreateOfferDialog
                open={openLogin}
                handleClose={handleLoginClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
