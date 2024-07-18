import { Avatar, IconButton, Stack, TableCell, TableRow, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "src/AppContext";
import { fNumberWithCurreny } from "src/utils/formatNumber";
import { currencySymbols } from "src/utils/constants";
import axios from "axios";
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from "@crossmarkio/sdk";
import CustomQRDialog from "src/components/QRDialog";
import { useDispatch } from "react-redux";
import CustomDialog from "src/components/Dialog";
import CancelIcon from '@mui/icons-material/Cancel';

const TrustLineRow = ({ limit, currencyName, balance, md5, exchRate, issuer, account, currency }) => {

    const BASE_URL = 'https://api.xrpl.to/api';

    const dispatch = useDispatch();
    const { darkMode, activeFiatCurrency, openSnackbar, accountProfile, sync, setSync } = useContext(AppContext);
    const isMobile = useMediaQuery('(max-width:600px)');
    const isLoggedIn = accountProfile && accountProfile.account;

    const [token, setToken] = useState({});
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [content, setContent] = useState("");
    const [openConfirm, setOpenConfirm] = useState(false);
    const [xamanStep, setXamanStep] = useState(0);
    const [xamanTitle, setXamanTitle] = useState(0);
    const [stepTitle, setStepTitle] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (md5) {
            getToken();
        }
    }, [md5]);

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        var dispatchTimer = null;

        async function getDispatchResult() {
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                const dispatched_result = res.dispatched_result;
                return dispatched_result;
            } catch (err) { }
        }

        const startInterval = () => {
            let times = 0;
            dispatchTimer = setInterval(async () => {
                const dispatched_result = await getDispatchResult();
                if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                    setXamanStep(xamanStep + 1);
                    stopInterval();
                    return;
                }
                times++;
                if (times >= 20) {
                    openSnackbar('Operation rejected!', 'error');
                    stopInterval();
                    handleConfirmClose();
                    return;
                }
            }, 1000);
        };

        const stopInterval = () => {
            clearInterval(dispatchTimer);
            setOpenScanQR(false);
        };

        async function getPayload() {
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                const resolved_at = res.resolved_at;
                if (resolved_at) {
                    startInterval();
                    return;
                }
            } catch (err) { }
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
                clearInterval(timer);
            }
        };
    }, [openScanQR, uuid, xamanStep]);

    useEffect(() => {
        switch (xamanStep) {
            case 1:
                setContent(`This TrustLine still contains ${balance} ${currencyName}. If you continue, it will be sent back to the issuer before your TrustLine is deleted.`);
                setXamanTitle("Refund to Issuer");
                setStepTitle("Warning");
                setOpenConfirm(true);
                break;
            case 2:
                setContent("Your dust balance has been sent back to the issuer. The TrustLine can now be eliminated");
                setStepTitle("Success");
                setOpenConfirm(true);
                break;
            case 3:
                setContent("You are removing this token from your XRP ledger account. Are you sure?");
                setXamanTitle("Trust Set");
                setStepTitle("Warning");
                setOpenConfirm(true);
                break;
            case 4:
                openSnackbar("You removed trustline", "success");
                handleConfirmClose();
                break;
        }
    }, [xamanStep]);

    const getToken = async () => {
        await axios.get(`${BASE_URL}/token/get-by-hash/${md5}`).then(res => {
            setToken(res.data.token);
        });
    }

    const handleCancel = async () => {
        if (!isLoggedIn) {
            openSnackbar('Please connect wallet!', 'error');
        } else if (accountProfile.account !== account) {
            openSnackbar('You are not the owner of this offer!', 'error');
        } else {
            await onTrustRemoveXumm();
        }
    };

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm(uuid);
    };

    const onTrustRemoveXumm = async () => {
        try {
            if (balance > 0) {
                setXamanStep(1);
            } else {
                setXamanStep(3);
            }
        } catch (err) {
            console.log(err);
            openSnackbar('Network error!', 'error');
        }
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
            if (res.status === 200) {
                setUuid(null);
            }
        } catch (err) { }
        setLoading(false);
    };

    const handleConfirmClose = () => {
        setOpenConfirm(false);
        setXamanStep(0);
        setSync(!sync);
    }

    const handleConfirmContinue = async () => {
        const user_token = accountProfile?.user_token;
        const wallet_type = accountProfile?.wallet_type;
        let body;
        switch (xamanStep) {
            case 3:
                if (limit == 0) {
                    setXamanStep(4);
                    return;
                }
                const Flags = 0x00020000;
                let LimitAmount = {};
                LimitAmount.issuer = issuer;
                LimitAmount.currency = currency;
                LimitAmount.value = "0";
                body = { LimitAmount, Flags, user_token, TransactionType: "TrustSet" };
                if (wallet_type == "xaman") {
                    const res1 = await axios.post(`${BASE_URL}/xumm/trustset`, body);
                    if (res1.status === 200) {
                        const uuid = res1.data.data.uuid;
                        const qrlink = res1.data.data.qrUrl;
                        const nextlink = res1.data.data.next;
                        setUuid(uuid);
                        setQrUrl(qrlink);
                        setNextUrl(nextlink);
                        setOpenScanQR(true);
                    }
                } else if (wallet_type == "gem") {
                    isInstalled().then(async (response) => {
                        if (response.result.isInstalled) {
                            await submitTransaction({
                                transaction: body
                            }).then(({ type, result }) => {
                                if (type === "response") {
                                    setXamanStep(4);
                                } else {
                                    handleConfirmClose();
                                }
                            });
                        } else {
                            enqueueSnackbar("GemWallet is not installed", { variant: "error" });
                            handleConfirmClose();
                        }
                    });
                } else if (wallet_type == "crossmark") {
                    await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
                        if (response.data.meta.isSuccess) {
                            setXamanStep(4);
                        } else {
                            handleConfirmClose();
                        }
                    });
                }
                break;
            case 2:
                setXamanStep(3);
                break;
            case 1:
                body = {
                    TransactionType: "Payment",
                    Account: accountProfile.account,
                    Amount: {
                        currency: currency,
                        value: balance,
                        issuer: issuer
                    },
                    Destination: issuer,
                    Fee: "12",
                    SourceTag: 20221212,
                    DestinationTag: 20221212,
                }
                if (wallet_type == "xaman") {
                    const res2 = await axios.post(`${BASE_URL}/xumm/transfer`, body);
                    if (res2.status === 200) {
                        const uuid = res2.data.data.uuid;
                        const qrlink = res2.data.data.qrUrl;
                        const nextlink = res2.data.data.next;
                        setUuid(uuid);
                        setQrUrl(qrlink);
                        setNextUrl(nextlink);
                        setOpenScanQR(true);
                    }
                } else if (wallet_type == "gem") {
                    isInstalled().then(async (response) => {
                        if (response.result.isInstalled) {
                            await submitTransaction({
                                transaction: body
                            }).then(({ type, result }) => {
                                if (type === "response") {
                                    setXamanStep(2);
                                } else {
                                    handleConfirmClose();
                                }
                            });
                        } else {
                            enqueueSnackbar("GemWallet is not installed", { variant: "error" });
                            handleConfirmClose();
                        }
                    });
                } else if (wallet_type == "crossmark") {
                    await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
                        if (response.data.meta.isSuccess) {
                            setXamanStep(2);
                        } else {
                            handleConfirmClose();
                        }
                    });
                }
                break;
        }
    }

    const getDecimal = (str) => {
        str = str.toString();
        if (str) {
            const dotIdx = str.indexOf(".");
            const decimal = str.length - dotIdx - 1;
            return decimal > 11 ? 11 : decimal;
        } else return 1;
    }

    return (
        <>
            <TableRow
                sx={{
                    '&:hover': {
                        '& .MuiTableCell-root': {
                            backgroundColor: darkMode
                                ? '#232326 !important'
                                : '#D9DCE0 !important'
                        }
                    },
                    '& .MuiTableCell-root': {
                        paddingLeft: '0px !important',
                        marginLeft: '0px !important'
                    }
                }}
            >
                <TableCell
                    align="left"
                    sx={{ py: 1 }}
                >
                    <Stack direction="row" spacing={1} alignItems="center" paddingLeft={1}>
                        <Avatar src={`https://s1.xrpl.to/token/${md5}`} sx={{ width: 32, height: 32 }} />
                        <Typography variant="s6" noWrap>
                            {currencyName}
                        </Typography>
                    </Stack>
                </TableCell>

                <TableCell
                    align="left"
                    sx={{ display: isMobile ? "none" : "table-cell", paddingLeft: 0, marginLeft: 0 }}
                >
                    <Typography variant="s6" noWrap>
                        {balance}
                    </Typography>
                </TableCell>

                <TableCell
                    align="right"
                    sx={{ paddingLeft: 0, marginLeft: 0 }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="end" spacing={0.5}>
                        <span>{currencySymbols[activeFiatCurrency]}</span>
                        {token.exch ? (balance * fNumberWithCurreny(token.exch, exchRate)).toFixed(getDecimal(balance * fNumberWithCurreny(token.exch, exchRate))) : 0}
                    </Stack>
                </TableCell>
                {isLoggedIn && accountProfile?.account === account ?
                    <TableCell align="right">
                        <Tooltip title="Cancel Offer">
                            <IconButton color='error' onClick={handleCancel} aria-label="cancel">
                                <CancelIcon fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    </TableCell> : ""}

            </TableRow>
            <CustomQRDialog
                open={openScanQR}
                type={xamanTitle}
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
            <CustomDialog open={openConfirm} content={content} title={stepTitle} handleClose={handleConfirmClose} handleContinue={handleConfirmContinue} />
        </>
    )
}

export default TrustLineRow;
