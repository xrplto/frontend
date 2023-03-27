import axios from 'axios';
import {MD5} from "crypto-js";
import { useState, useEffect } from 'react';
import { FadeLoader } from 'react-spinners';
import { normalizeAmount } from 'src/utils/normalizers';

// Material
import {
    Backdrop,
    Box,
    Button,
    CardMedia,
    Container,
    Divider,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';

// Loader
import { PuffLoader, PulseLoader } from "react-spinners";
import { ProgressBar, Discuss } from 'react-loader-spinner';

// Utils
import { formatDateTime } from 'src/utils/formatTime';
import { checkExpiration, getUnixTimeEpochFromRippleEpoch, parseNFTokenID, getImgUrl } from 'src/utils/parse';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import QRDialog from 'src/components/QRDialog';
import ConfirmAcceptOfferDialog from './ConfirmAcceptOfferDialog';
import ListToolbar from './ListToolbar';
import SeeMoreTypography from 'src/components/SeeMoreTypography';

function parseRippleState(state) {
    let balance = Number.parseFloat(state.Balance.value);
    let highLimit = Number.parseFloat(state.HighLimit.value);
    let lowLimit = Number.parseFloat(state.LowLimit.value);
    let currency = state.Balance.currency;
    let flags = state.Flags;
    let limit = 0;
    let issuer = null;
    let account = null;

    if (balance > 0) {
        issuer = state.HighLimit.issuer;
        account = state.LowLimit.issuer;
        limit = lowLimit;
    } else if (balance < 0) {
        issuer = state.LowLimit.issuer;
        account = state.HighLimit.issuer;
        limit = highLimit;
    } else {
        // balance is zero. check who has a limit set
        if (highLimit > 0 && lowLimit == 0) {
            issuer = state.LowLimit.issuer;
            account = state.HighLimit.issuer;
            limit = highLimit;
        } else if (lowLimit > 0 && highLimit == 0) {
            issuer = state.HighLimit.issuer;
            account = state.LowLimit.issuer;
            limit = lowLimit;
        } else {
            // can not determine issuer!
            issuer = null;
            account = null;
        }
    }

    let md5 = null;

    if (issuer && currency)
        md5 = MD5(issuer + "_" + currency).toString();

    return {account, md5, issuer, currency, flags, balance, limit};
}

function truncate(str, n) {
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function TrustList({ account, type }) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
    const accountLogin = accountProfile?.account;
    const accountToken = accountProfile?.token;

    const isOwner = accountLogin === account;

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [total, setTotal] = useState(0);
    const [lines, setLines] = useState([]);

    const [openScanQR, setOpenScanQR] = useState(false);
    const [xummUuid, setXummUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [qrType, setQrType] = useState("NFTokenAcceptOffer");

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    const [acceptOffer, setAcceptOffer] = useState(null);
    const [openConfirm, setOpenConfirm] = useState(false);

    useEffect(() => {
        function getTrusts() {
            setLoading(true);
            // https://api.xrpl.to/api/account/lines/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
            axios.get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTotal(ret.total);
                        setLines(ret.lines);
                    }
                }).catch(err => {
                    console.log("Error on getting trustlines list!!!", err);
                }).then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getTrusts();
    }, [account, type, page, rows, sync]);

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        async function getPayload() {
            console.log(counter + " " + isRunning, xummUuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/offers/acceptcancel/${xummUuid}`);
                const resolved_at = ret.data?.resolved_at;
                const dispatched_result = ret.data?.dispatched_result;
                if (resolved_at) {
                    setOpenScanQR(false);
                    if (dispatched_result === 'tesSUCCESS') {
                        setSync(sync + 1);
                        openSnackbar('Successful!', 'success');
                    }
                    else
                        openSnackbar('Rejected!', 'error');
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
    }, [openScanQR, xummUuid, sync]);

    const doProcessOffer = async (offer, isAcceptOrCancel) => {
        if (!accountLogin || !accountToken) {
            openSnackbar('Please login', 'error');
            return;
        }

        const isSell = offer.flags === 1;

        const index = offer.index;
        const owner = offer.owner;
        const destination = offer.destination;
        const NFTokenID = offer.NFTokenID;

        if (isAcceptOrCancel) {
            // Accept mode
            if (accountLogin === owner) {
                openSnackbar('You are the owner of this offer, you can not accept it.', 'error');
                return;
            }
        } else {
            // Cancel mode
            if (accountLogin !== owner) {
                openSnackbar('You are not the owner of this offer', 'error');
                return;
            }
        }

        setPageLoading(true);
        try {
            const user_token = accountProfile.user_token;

            const body = {
                account: accountLogin,
                NFTokenID,
                index,
                destination,
                accept: isAcceptOrCancel ? "yes" : "no",
                sell: isSell ? "yes" : "no",
                user_token
            };

            const res = await axios.post(`${BASE_URL}/offers/acceptcancel`, body, { headers: { 'x-access-token': accountToken } });

            if (res.status === 200) {
                const newUuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                let newQrType = isAcceptOrCancel ? "NFTokenAcceptOffer" : "NFTokenCancelOffer";
                if (isSell)
                    newQrType += " [Sell Offer]";
                else
                    newQrType += " [Buy Offer]";

                setQrType(newQrType);
                setXummUuid(newUuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
                setOpenScanQR(true);
            }
        } catch (err) {
            console.error(err);
        }
        setPageLoading(false);
    };

    const onDisconnectXumm = async () => {
        setPageLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/offers/acceptcancel/${xummUuid}`);
            // if (res.status === 200) {
            //     setXummUuid(null);
            // }
        } catch (err) {
            console.error(err);
        }
        setXummUuid(null);

        setPageLoading(false);
    };

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm();
    };

    const handleRemoveTrustLine = async (line) => {
        // doProcessOffer(offer, false);
    }

    const handleAcceptOffer = async (offer) => {
        setAcceptOffer(offer);
        setOpenConfirm(true);
    }

    const onContinueAccept = async () => {
        doProcessOffer(acceptOffer, true);
    }

    return (
        <Container maxWidth="md" sx={{pl: 0, pr: 0}}>
            <Backdrop
                sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={pageLoading}
            >
                <ProgressBar
                    height="80"
                    width="80"
                    ariaLabel="progress-bar-loading"
                    wrapperStyle={{}}
                    wrapperClass="progress-bar-wrapper"
                    borderColor='#F4442E'
                    barColor='#51E5FF'
                />
            </Backdrop>

            {loading ? (
                <Stack alignItems="center">
                    <PulseLoader color='#00AB55' size={10} />
                </Stack>
            ) : (
                lines && lines.length === 0 &&
                <Stack alignItems="center" sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="s6" color='#2de370'>[ No TrustLines ]</Typography>
                </Stack>
            )
            }

            <ConfirmAcceptOfferDialog open={openConfirm} setOpen={setOpenConfirm} offer={acceptOffer} onContinue={onContinueAccept} />

            <QRDialog
                open={openScanQR}
                type={qrType}
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />

            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
            >

            <Stack>
                {
                    lines.map((line, idx) => {
                        const {account, md5, issuer, currency, flags, balance, limit} = parseRippleState(line)

                        return (
                            <Stack key={md5} sx={{ mt: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">

                                    <Stack>
                                        <Tooltip title="Remove Trustline">
                                            <IconButton
                                                aria-label='close'
                                                onClick={() => handleRemoveTrustLine(line)}
                                            >
                                                <HighlightOffIcon fontSize='large' color='error' />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>

                                    <Stack spacing={0}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Typography variant='s6' color='#33C2FF'>{balance}</Typography>
                                            <Link
                                                // color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${issuer}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant='s6' style={{ wordWrap: "break-word" }}>{issuer}</Typography>
                                            </Link>
                                        </Stack>

                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="s7">Issuer: </Typography>
                                            <Link
                                                color="inherit"
                                                // target="_blank"
                                                href={`https://bithomp.com/explorer/${issuer}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant="s6" noWrap>{truncate(issuer, 16)}</Typography>
                                            </Link>
                                        </Stack>
                                    </Stack>
                                </Stack>
                                <Divider sx={{ mt: 2 }} />
                            </Stack>
                        )
                    })
                }
            </Stack>

            </Box>

            {total > 0 &&
                <ListToolbar
                    count={total}
                    rows={rows}
                    setRows={setRows}
                    page={page}
                    setPage={setPage}
                />
            }
        </Container>
    );
}
