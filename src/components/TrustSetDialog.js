import axios from 'axios';
import { useState, useEffect } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

// Material
import { withStyles } from '@mui/styles';
import {
    alpha, useTheme, useMediaQuery,
    styled,
    Avatar,
    Backdrop,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography,
    TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Redux
import { useDispatch } from "react-redux";

// Components
import QRDialog from './QRDialog';

// Loader
import { PulseLoader } from "react-spinners";

// Utils
import { fNumber } from 'src/utils/formatNumber';
import Decimal from 'decimal.js';

// Iconify
import { Icon } from '@iconify/react';
import copyIcon from '@iconify/icons-fad/copy';
// ----------------------------------------------------------------------
const TrustDialog = styled(Dialog) (({ theme }) => ({
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));
  
const TrustDialogTitle = (props) => {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

export default function TrustSetDialog({token, setToken}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, openSnackbar } = useContext(AppContext);
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(fNumber(token.amount));

    const {
        issuer,
        name,
        user,
        currency,
        md5,
        ext,
        urlSlug
    } = token;

    // const imgUrl = `/static/tokens/${md5}.${ext}`;
    const imgUrl = `https://s1.xrpl.to/token/${md5}`;

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        async function getPayload() {
            // console.log(counter + " " + isRunning, uuid);
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
                        handleClose();
                        openSnackbar('Successfully set trustline!', 'success');
                    } else {
                        openSnackbar('Operation rejected!', 'error');
                    }

                    return;
                }
            } catch (err) {
            }
            isRunning = false;
            counter--;
            if (counter <= 0) {
                openSnackbar('Timeout!', 'error');
                handleScanQRClose();
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

    const onTrustSetXumm = async (value) => {
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
            const user_token = accountProfile?.user_token;

            const Flags = 0x00020000;

            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = value;
            
            const body={ LimitAmount, Flags, user_token};

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
            openSnackbar('Network error!', 'error');
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

    const handleClose = () => {
        setToken(null);
    }

    const handleChangeAmount = (e) => {
        const amt = e.target.value;
        setAmount(amt);
    }

    const isNumber = (num) => {
        return /^[0-9.,]*$/.test(num.toString());
    }

    const handleSetTrust = (e) => {
        let fAmount = 0;
        try {
            if (isNumber(amount)) {
                fAmount = new Decimal(amount.replaceAll(',','')).toNumber();
            }
                
        } catch(e) {}

        if (fAmount > 0) {
            onTrustSetXumm(fAmount);
        } else {
            openSnackbar('Invalid value!', 'error');
        }
    }

    return (
        <>
            <Backdrop
                sx={{ color: "#000", zIndex: 1303 }}
                open={loading}
            >
                <PulseLoader color={"#FF4842"} size={10} />
            </Backdrop>

            <TrustDialog
                fullScreen={fullScreen}
                onClose={handleClose}
                open={true}
                sx={{zIndex: 1302}}
                hideBackdrop={true}
            >
                <TrustDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    <Stack direction='row' alignItems='center'>
                        <Avatar alt={name} src={imgUrl} sx={{ mr: 1 }} />
                        <Stack>
                            <Typography variant="token">{name}</Typography>
                            <Typography variant="caption">{user}</Typography>
                        </Stack>
                    </Stack>
                </TrustDialogTitle>

                <DialogContent>
                    <Stack spacing={1.5} sx={{pl:1, pr:1}}>
                        <Stack direction="row" alignItems="center">
                            <Label variant="subtitle2" noWrap>
                                {issuer}
                            </Label>
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://bithomp.com/explorer/${issuer}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <IconButton edge="end" aria-label="bithomp">
                                    <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                </IconButton>
                            </Link>
                        </Stack>

                        <Label variant="subtitle2" noWrap>{currency}</Label>

                        <TextField fullWidth id="input-with-sx1" label="Amount" value={amount} onChange={handleChangeAmount} variant="standard"/>

                        <Stack direction="row" alignItems="center">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://xrpl.to/trustset/${urlSlug}`}
                                rel="noreferrer noopener nofollow"
                            >
                                https://xrpl.to/trustset/{urlSlug}
                            </Link>
                            <CopyToClipboard text={`https://xrpl.to/trustset/${urlSlug}`} onCopy={()=>openSnackbar('Copied!', 'success')}>
                                <Tooltip title={'Click to copy'}>
                                    <IconButton>
                                        <Icon icon={copyIcon} />
                                    </IconButton>
                                </Tooltip>
                            </CopyToClipboard>
                        </Stack>

                        <Stack direction='row' spacing={2} justifyContent="center" sx={{mt:2}}>
                            <Button
                                variant="outlined"
                                onClick={handleSetTrust}
                                color='primary'
                                size='small'
                            >
                                Set Trustline
                            </Button>

                            <CopyToClipboard text={`https://xrpl.to/trustset/${urlSlug}`} onCopy={()=>openSnackbar('Copied!', 'success')}>
                                <Button
                                    variant="outlined"
                                    color='primary'
                                    size='small'
                                >
                                    Copy Link
                                </Button>
                            </CopyToClipboard>                            
                        </Stack>
                    </Stack>
                </DialogContent>
            </TrustDialog>

            <QRDialog
                open={openScanQR}
                type="Trust Set"
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
