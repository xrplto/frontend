import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    Alert,
    Backdrop,
    Button,
    Dialog,
    DialogTitle,
    Divider,
    Slide,
    Snackbar,
    Stack
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Redux
import { useDispatch } from "react-redux";
import { refreshAccountData } from "src/redux/statusSlice";

// Components
import QRTrustDialog from './QRTrustDialog';

// Loader
import { PulseLoader } from "react-spinners";
// ----------------------------------------------------------------------
const DisabledButton = withStyles({
    root: {
        "&.Mui-disabled": {
            pointerEvents: "unset", // allow :hover styles to be triggered
            cursor: "not-allowed", // and custom cursor can be defined without :hover state
        }
    }
})(Button);

const AdminDialog = styled(Dialog)(({ theme }) => ({
    // boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    // backgroundColor: alpha(theme.palette.background.paper, 0.0),
    // borderRadius: '0px',
    // padding: '0.5em'
    // backgroundColor: alpha("#00AB88", 0.99),
}));

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const ERR_ACCOUNT_LOGIN = 1;
const ERR_INVALID_VALUE = 2;
const ERR_REJECTED = 3;
const MSG_SUCCESSFUL = 4;

export default function TrustSet({token, setToken}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const dispatch = useDispatch();
    const { accountProfile } = useContext(AppContext);
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [loading, setLoading] = useState(false);

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
                    if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                        // TRIGGER account refresh
                        showAlert(MSG_SUCCESSFUL);
                    }
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
    }, [dispatch, openScanQR, uuid]);

    const onTrustSetXumm = async (token) => {
        if (!token) return;
        /*{
            "TransactionType": "TrustSet",
            "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            "Fee": "12",
            "Flags": 262144,
            "LastLedgerSequence": 8007750,
            "LimitAmount": {
              "currency": "USD",
              "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
              "value": "100"
            },
            "Sequence": 12
        }*/
        setLoading(true);
        try {
            const {
                issuer,
                currency,
            } = token;
            const user_token = accountProfile.token;

            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = 100;
            
            const body={ LimitAmount, user_token};

            const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

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

    const handleSetTrust = (e) => {
        onTrustSetXumm(token);
    }

    const handleCancel = () => {
        setToken(null);
    }

    return (
        <>
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
                    {message === ERR_REJECTED && 'Operation rejected!'}
                    {message === MSG_SUCCESSFUL && 'Successfully set trustline!'}
                    {message === ERR_INVALID_VALUE && 'Invalid values!'}
                </Alert>
            </Snackbar>

            <Backdrop
                sx={{ color: "#000", zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={loading}
            >
                <PulseLoader color={"#FF4842"} size={10} />
            </Backdrop>

            { token &&
                <AdminDialog onClose={handleCancel} open={true} sx={{p:5}} hideBackdrop={true} fullWidth={true} maxWidth={'xs'}>
                    <DialogTitle sx={{pl:4,pr:4,pt:1,pb:1}}>Trust Set</DialogTitle>
                    <Divider />

                    <Button
                        variant="outlined"
                        sx={{ mt: 1.5 }}
                        onClick={handleSetTrust}
                        color='primary'
                    >
                        Set Trustline
                    </Button>
                    
                </AdminDialog>
            }

            <QRTrustDialog
                open={openScanQR}
                handleClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
                offerType='Create'
            />
        </>
    );
}
