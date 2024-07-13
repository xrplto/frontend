import { Avatar, Backdrop, Button, Stack, TableCell, TableRow, Typography, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "src/AppContext";
import { fNumberWithCurreny } from "src/utils/formatNumber";
import CountUp from 'react-countup';
import { currencySymbols } from "src/utils/constants";
import axios from "axios";
import { isInstalled, setTrustline, submitBulkTransactions } from '@gemwallet/api';
import sdk from "@crossmarkio/sdk";
import { PulseLoader } from "react-spinners";
import CustomQRDialog from "src/components/QRDialog";
import { useDispatch } from "react-redux";
import { updateProcess, updateTxHash } from "src/redux/transactionSlice";

const TrustLineRow = ({ idx, currencyName, balance, md5, exchRate, issuer, account, currency }) => {

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
                // const account = res.account;
                const dispatched_result = res.dispatched_result;

                return dispatched_result;
            } catch (err) { }
        }

        const startInterval = () => {
            let times = 0;

            dispatchTimer = setInterval(async () => {
                const dispatched_result = await getDispatchResult();

                if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                    openSnackbar(
                        `Successfully ${isRemove ? 'removed' : 'set'} trustline!`,
                        'success'
                    );
                    stopInterval();
                    return;
                }

                times++;

                if (times >= 10) {
                    openSnackbar('Operation rejected!', 'error');
                    stopInterval();
                    return;
                }
            }, 1000);
        };


        // Stop the interval
        const stopInterval = () => {
            clearInterval(dispatchTimer);
            setOpenScanQR(false);
            handleClose();
        };

        async function getPayload() {
            // console.log(counter + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                // const account = res.account;
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
    }, [openScanQR, uuid]);

    const getToken = async () => {
        await axios.get(`${BASE_URL}/token/get-by-hash/${md5}`).then(res => {
            setToken(res.data.token);
        })
    }

    const handleCancel = async () => {
        if (!isLoggedIn) {
            openSnackbar('Please connect wallet!', 'error');
        } else if (accountProfile.account !== account) {
            openSnackbar('You are not the owner of this offer!', 'error');
        } else {
            // onOfferCancelXumm(seq);
            await onTrustRemoveXumm();
        }
    };

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm(uuid);
    };

    const onTrustRemoveXumm = async () => {
        try {
            const wallet_type = accountProfile.wallet_type;
            const user_token = accountProfile?.user_token;

            const Flags = 0x00020000;

            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = "0";

            const body = { LimitAmount, Flags, user_token };
            setLoading(true);

            switch (wallet_type) {
                case "xaman":
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
                    break;
                case "gem":
                    isInstalled().then(async (response) => {
                        if (response.result.isInstalled) {
                            const trustSet = {
                                ID: "002",
                                Flags: Flags,
                                LimitAmount: LimitAmount,
                                Account: accountProfile.account,
                                TransactionType: 'TrustSet',
                                // SourceTag: 20221212
                            }
                            let bulkTx = [trustSet];
                            if (balance > 0) {
                                const refundToIssuer = {
                                    ID: "001",
                                    TransactionType: "Payment",
                                    Account: accountProfile.account,
                                    Amount: {
                                        currency: currency,
                                        value: balance,
                                        issuer: issuer
                                    },
                                    Destination: issuer,
                                    // Fee: "12",
                                    // SourceTag: 20221212,
                                    // DestinationTag: 20221212,
                                };
                                bulkTx = [refundToIssuer, ...bulkTx];
                            }

                            dispatch(updateProcess(1));
                            await submitBulkTransactions({
                                transactions: bulkTx
                            }).then(({ type, result }) => {
                                console.log(result)
                                if (type == "response") {
                                    dispatch(updateProcess(2));
                                    dispatch(updateTxHash(result?.hash));
                                }

                                else {
                                    dispatch(updateProcess(3));
                                }
                            });
                            // await setTrustline(trustSet).then(({ type, result }) => {
                            //     if (type == "response") {
                            //         dispatch(updateProcess(2));
                            //         dispatch(updateTxHash(result?.hash));
                            //     }

                            //     else {
                            //         dispatch(updateProcess(3));
                            //     }
                            // });
                        }

                        else {
                            enqueueSnackbar("GemWallet is not installed", { variant: "error" });
                        }
                    })
                    break;
                case "crossmark":
                    console.log(balance);
                    // if (!window.xrpl) {
                    //   enqueueSnackbar("CrossMark wallet is not installed", { variant: "error" });
                    //   return;
                    // }
                    // const { isCrossmark } = window.xrpl;
                    // if (isCrossmark) {
                    dispatch(updateProcess(1));

                    const trustSet = {
                        Flags: Flags,
                        LimitAmount: LimitAmount,
                        Account: accountProfile.account,
                        TransactionType: 'TrustSet',
                    }
                    let bulkTx = [trustSet];
                    if (balance > 0) {
                        const refundToIssuer = {
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
                        };
                        bulkTx = [refundToIssuer, ...bulkTx];
                    }

                    dispatch(updateProcess(1));
                    await sdk.methods.bulkSignAndSubmitAndWait(bulkTx).then(({ response }) => {
                        console.log(response);
                        if (response.data.meta.isSuccess) {
                            dispatch(updateProcess(2));
                            dispatch(updateTxHash(response.data.resp.result?.hash));

                        } else {
                            dispatch(updateProcess(3));
                        }
                    });
                    // }
                    break;
            }

        } catch (err) {
            console.log(err);
            dispatch(updateProcess(0));
            openSnackbar('Network error!', 'error');
        }
        setLoading(false);
        setSync(!sync);
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

    return (
        <>
            {/* <Backdrop sx={{ color: '#000', zIndex: 1303 }} open={loading}>
                <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
            </Backdrop> */}
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
                        paddingLeft: '0px !important', // Ensure no padding
                        marginLeft: '0px !important' // Ensure no margin
                    }
                }}
            >

                {/* <TableCell
                    align="left"
                    sx={{ paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
                >
                    <Typography variant="s6" noWrap>
                        {idx}
                    </Typography>
                </TableCell> */}

                <TableCell
                    align="left"
                    sx={{ py: 1 }} // Ensure no padding or margin
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
                    sx={{ display: isMobile ? "none" : "table-cell", paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
                >
                    <Typography variant="s6" noWrap>
                        <CountUp
                            end={balance}
                            duration={3.5}
                            decimals={2}
                        />
                    </Typography>
                </TableCell>

                <TableCell
                    align="right"
                    sx={{ paddingLeft: 0, marginLeft: 0 }} // Ensure no padding or margin
                >
                    <Stack direction="row" alignItems="center" justifyContent="end" spacing={0.5}>
                        <span>{currencySymbols[activeFiatCurrency]}</span>
                        <CountUp
                            end={
                                token.exch ? balance * fNumberWithCurreny(token.exch, exchRate) : 0
                            }
                            duration={3.5}
                            decimals={2}
                        />
                    </Stack>
                </TableCell>
                {isLoggedIn && accountProfile?.account === account ?
                    <TableCell align="right">
                        <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </TableCell> : ""}

            </TableRow>
            <CustomQRDialog
                open={openScanQR}
                type="Trust Set"
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    )
}

export default TrustLineRow;
