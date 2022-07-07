import axios from 'axios';
import { useState, useEffect } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

// Material
import { withStyles } from '@mui/styles';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    Alert,
    Avatar,
    Backdrop,
    Button,
    Dialog,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    Slide,
    Stack,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Tooltip,
    Typography,
    TextField
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Redux
import { useDispatch } from "react-redux";

// Components
import QRTrustDialog from './QRTrustDialog';

// Loader
import { PulseLoader } from "react-spinners";

// Utils
import { fNumber } from 'src/utils/formatNumber';
import Decimal from 'decimal.js';

// Iconify
import { Icon } from '@iconify/react';
import copyIcon from '@iconify/icons-fad/copy';
// ----------------------------------------------------------------------

const AdminDialog = styled(Dialog)(({ theme }) => ({
    // boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    // backgroundColor: alpha(theme.palette.background.paper, 0.0),
    // borderRadius: '0px',
    // padding: '0.5em'
    // backgroundColor: alpha("#00AB88", 0.99),
}));

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

const ERR_NONE = 0;
const MSG_COPIED = 1;
const ERR_INVALID_VALUE = 2;
const ERR_NETWORK = 3;
const ERR_TIMEOUT = 4;
const ERR_REJECTED = 5;
const MSG_SUCCESSFUL = 6;

export default function TrustSetDialog({showAlert, token, setToken}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const dispatch = useDispatch();
    const { accountProfile } = useContext(AppContext);
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
        imgExt,
        urlSlug
    } = token;

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

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
                        handleCancel();
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
                showAlert(ERR_TIMEOUT);
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
    }, [dispatch, openScanQR, uuid]);

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
                currency
            } = token;
            const user_token = accountProfile?.token;

            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = value;
            
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
            showAlert(ERR_NETWORK);
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

    const handleCancel = () => {
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
            showAlert(ERR_INVALID_VALUE);
        }
    }

    return (
        <>
            <Backdrop
                sx={{ color: "#000", zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={loading}
            >
                <PulseLoader color={"#FF4842"} size={10} />
            </Backdrop>

            <AdminDialog onClose={handleCancel} open={true} sx={{p:5}} hideBackdrop={true}>
                <DialogTitle sx={{pl:2,pr:4,pt:1,pb:1}}>
                    <Stack direction='row' alignItems='center'>
                        <Avatar alt={name} src={imgUrl} sx={{ mr: 1 }} />
                        <Stack>
                            <Typography variant="token">{name}</Typography>
                            <Typography variant="caption">{user}</Typography>
                        </Stack>
                    </Stack>
                </DialogTitle>
                <Divider />

                <Stack spacing={2} alignItems='center' sx={{mb: 3}}>
                    <Table sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: "0px solid",
                            borderBottomColor: theme.palette.divider
                        }
                    }}>
                        <TableBody>
                            <TableRow>
                                <TableCell align="right" sx={{pt:1, pb:0, width: '20%'}}>
                                    <Label variant="subtitle2" noWrap>Issuer</Label>
                                </TableCell>
                                <TableCell align="left" sx={{pt:1, pb:0, width: '80%'}}>
                                    <Stack direction="row" spacing={1} alignItems='center' sx={{mr:2}}>
                                        <Label variant="subtitle2" noWrap>{issuer}</Label>
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
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{pt:1, pb:0.2}}>
                                    <Label variant="subtitle2" noWrap>Currency</Label>
                                </TableCell>
                                <TableCell align="left" sx={{pt:1, pb:0.2}}>
                                    <Label variant="subtitle2" noWrap>{currency}</Label>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{pt:1, pb:0.2}}>
                                    <Label variant="subtitle2" noWrap>Amount</Label>
                                </TableCell>
                                <TableCell align="left" sx={{pt:1, pb:0.2}}>
                                    <TextField id="input-with-sx1" label="" value={amount} onChange={handleChangeAmount} variant="standard"/>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell align="right" sx={{pt:1.5, pb:0.2}}>
                                    <Label variant="subtitle2" noWrap>Link</Label>
                                </TableCell>
                                <TableCell align="left" sx={{pt:1, pb:0.2}}>
                                    <Link
                                        underline="none"
                                        color="inherit"
                                        target="_blank"
                                        href={`https://xrpl.to/trustline/${urlSlug}`}
                                        rel="noreferrer noopener nofollow"
                                    >
                                        https://xrpl.to/trustline/{urlSlug}
                                    </Link>
                                    
                                    <CopyToClipboard text={`https://xrpl.to/trustline/${urlSlug}`} onCopy={()=>showAlert(MSG_COPIED)}>
                                        <Tooltip title={'Click to copy'}>
                                            <IconButton>
                                                <Icon icon={copyIcon} />
                                            </IconButton>
                                        </Tooltip>
                                    </CopyToClipboard>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Stack direction='row' spacing={2} sx={{mt:1.5}}>

                        <Button
                            variant="outlined"
                            onClick={handleSetTrust}
                            color='primary'
                        >
                            Set Trustline
                        </Button>

                        <CopyToClipboard text={`https://xrpl.to/trustline/${urlSlug}`} onCopy={()=>showAlert(MSG_COPIED)}>
                            <Button
                                variant="outlined"
                                color='primary'
                            >
                                Copy Link
                            </Button>
                        </CopyToClipboard>

                    </Stack>

                </Stack>
                
            </AdminDialog>

            <QRTrustDialog
                open={openScanQR}
                handleClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
