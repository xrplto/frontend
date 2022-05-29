import { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
// import { alpha, styled, useTheme } from '@mui/material/styles';

import {
    Alert,
    Button,
    Slide,
    Snackbar,
    Stack
} from '@mui/material';

import axios from 'axios';
import { useContext } from 'react'
import Context from '../../../Context'

// Components
import QROfferDialog from './QROfferDialog';

// ----------------------------------------------------------------------

const DisabledButton = withStyles({
    root: {
        "&.Mui-disabled": {
            pointerEvents: "unset", // allow :hover styles to be triggered
            cursor: "not-allowed", // and custom cursor can be defined without :hover state
        }
    }
})(Button);

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const ERR_ACCOUNT_LOGIN = 1;
const ERR_INVALID_VALUE = 2;
const ERR_REJECTED = 3;
const MSG_SUCCESSFUL = 4;

export default function PlaceOrder({buySell, pair, amount, value}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setLoading } = useContext(Context);
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [state, setState] = useState({
        openSnack: false,
        message: ERR_NONE
    });

    const { message, openSnack } = state;

    const handleCloseSnack = () => {
        setState({ openSnack: false, message: message });
    };

    const showAlert = (msg) => {
        setState({ openSnack: true, message: msg });
    }
    
    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        async function getPayload() {
            console.log(counter + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                // const account = res.account;
                const resolved_at = res.resolved_at;
                const dispatched_result = res.dispatched_result;
                if (resolved_at) {
                    setOpenScanQR(false);
                    if (dispatched_result && dispatched_result === 'tesSUCCESS')
                        showAlert(MSG_SUCCESSFUL);
                    else
                        showAlert(ERR_REJECTED);

                    return;
                }
            } catch (err) {
            }
            isRunning = false;
            counter--;
            if (counter <= 0) {
                setOpenScanQR(false);
            }
        }
        if (openScanQR) {
            timer = setInterval(getPayload, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [openScanQR, uuid]);

    const onOfferCreateXumm = async () => {
        setLoading(true);
        try {
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            // const Account = accountProfile.account;
            const user_token = accountProfile.token;
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
            const body={/*Account,*/ TakerGets, TakerPays, user_token};

            const res = await axios.post(`${BASE_URL}/xumm/offercreate`, body);

            if (res.status === 200) {
                const uuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                setUuid(uuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
                setOpenScanQR(true);
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
                setUuid(null);
            }
        } catch(err) {
        }
        setLoading(false);
    };

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm(uuid);
    };

    const handlePlaceOrder = (e) => {
        const fAmount = Number(amount);
        const fValue = Number(value);
        if (fAmount > 0 && fValue > 0)
            onOfferCreateXumm();
        else {
            showAlert(ERR_INVALID_VALUE);
        }

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

    return (
        <Stack alignItems='center'>
            <Snackbar
                autoHideDuration={2000}
                anchorOrigin={{ vertical:'top', horizontal:'right' }}
                open={openSnack}
                onClose={handleCloseSnack}
                TransitionComponent={TransitionLeft}
                key={'TransitionLeft'}
            >
                <Alert variant="filled" severity={message === MSG_SUCCESSFUL?"success":"error"} sx={{ m: 2, mt:0 }}>
                    {message === ERR_ACCOUNT_LOGIN && 'Please connect wallet!'}
                    {message === ERR_REJECTED && 'Transaction signing rejected!'}
                    {message === MSG_SUCCESSFUL && 'Successfully submitted the order!'}
                    {message === ERR_INVALID_VALUE && 'Invalid values!'}
                </Alert>
            </Snackbar>
            {accountProfile && accountProfile.account ? (
                <Button
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                    onClick={handlePlaceOrder}
                    color={buySell === 'BUY' ? 'primary':'error'}
                >
                    PLACE ORDER
                </Button>
            ) : (
                <DisabledButton
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                    onClick={()=>showAlert(ERR_ACCOUNT_LOGIN)}
                    disabled
                >
                    PLACE ORDER
                </DisabledButton>
            )}

            <QROfferDialog
                open={openScanQR}
                handleClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
                offerType='Create'
            />
        </Stack>
    );
}
