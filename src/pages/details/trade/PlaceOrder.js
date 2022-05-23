import { useState, useEffect } from 'react';

import {
    Alert,
    Button,
    Stack
} from '@mui/material';

import axios from 'axios';
import { useContext } from 'react'
import Context from '../../../Context'

// Components
import QROfferDialog from './QROfferDialog';

// ----------------------------------------------------------------------
export default function PlaceOrder({buySell, pair, amount, value}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { setLoading } = useContext(Context);
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [showAccountAlert, setShowAccountAlert] = useState(false);
    const [showResult, setShowResult] = useState(0);
    const [showInvalidValue, setShowInvalidValue] = useState(false);
    
    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        if (openScanQR) {
            timer = setInterval(async () => {
                if (isRunning) return;
                isRunning = true;
                try {
                    const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                    const res = ret.data.data.response;

                    const account = res.account;
                    const resolved_at = res.resolved_at;
                    const dispatched_result = res.dispatched_result;
                    if (resolved_at) {
                        setOpenScanQR(false);
                        if (dispatched_result && dispatched_result === 'tesSUCCESS')
                            setShowResult(1);
                        else
                            setShowResult(2);
                        
                        setTimeout(() => {
                            setShowResult(0);
                        }, 2000);
                        return;
                    }
                } catch (err) {
                }
                isRunning = false;
                counter--;
                if (counter <= 0) {
                    setOpenScanQR(false);
                }
            }, 2000);
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
                //setLog(res.data.status ? "disconnect success" : "disconnect failed");
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
            setShowInvalidValue(true);
            setTimeout(() => {
                setShowInvalidValue(false);
            }, 2000);
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

            {showInvalidValue && <Alert variant="filled" severity="error" sx={{ m: 2, mt:0 }}>
                Invalid values!
            </Alert>}

            <QROfferDialog
                open={openScanQR}
                handleClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </Stack>
    );
}
