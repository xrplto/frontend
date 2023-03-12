import axios from 'axios'
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
// Material
import { withStyles } from '@mui/styles';
import {
    styled,
    useTheme
} from '@mui/material';

import {
    Avatar,
    Box,
    IconButton,
    Link,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import CancelIcon from '@mui/icons-material/Cancel';

// Components
import QRDialog from 'src/components/QRDialog';

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectAccountData, selectRefreshAccount, refreshAccountData } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { formatDateTime } from 'src/utils/formatTime';
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    //backdropFilter: 'blur(2px)',
    //WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    //borderRadius: '13px',
    //padding: '0em 0.5em 1.5em 0.5em',
    //backgroundColor: alpha("#919EAB", 0.03),
}));
// ----------------------------------------------------------------------

const BuyTypography = withStyles({
    root: {
        color: "#007B55",
        borderRadius: '5px',
        border: '0.05em solid #007B55',
        fontSize: '0.7rem',
        lineHeight: '1',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '3px',
        paddingBottom: '3px',
    }
})(Typography);

const SellTypography = withStyles({
    root: {
        color: "#B72136",
        borderRadius: '5px',
        border: '0.05em solid #B72136',
        fontSize: '0.7rem',
        lineHeight: '1',
        paddingLeft: '6px',
        paddingRight: '6px',
        paddingTop: '3px',
        paddingBottom: '3px',
    }
})(Typography);

const ConnectWalletContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '10vh'
});

function truncate(str, n) {
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function Orders({pair}) {
    const theme = useTheme();
    const dispatch = useDispatch();
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const accountData = useSelector(selectAccountData);
    
    const { accountProfile, setLoading } = useContext(AppContext);
    const accountAddress = accountProfile?.account;
    
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const curr1 = pair.curr1;
    // const curr2 = pair.curr2;

    const handleCancel = (event, seq) => {
        onOfferCancelXumm(seq);
    }

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        async function getPayload() {
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                /*
                {
                    "hex": "120008228000000024043DCAC32019043DCAC2201B0448348868400000000000000F732103924E47158D3980DDAF7479A838EF3C0AE53D953BD2A526E658AC5F3EF0FA7D2174473045022100D10E91E2704A4BDAB510B599B8258956F9F34592B2B62BE383ED3E4DBF57DE2B02204837DD77A787D4E0DC43DCC53A7BBE160B164617FE3D0FFCFF9F6CC808D46DEE811406598086E863F1FF42AD87DCBE2E1B5F5A8B5EB8",
                    "txid": "EC13B221808A21EA1012C95FB0EF53BF0110D7AB2EB17104154A27E5E70C39C5",
                    "resolved_at": "2022-05-23T07:45:37.000Z",
                    "dispatched_to": "wss://s2.ripple.com",
                    "dispatched_result": "tesSUCCESS",
                    "dispatched_nodetype": "MAINNET",
                    "multisign_account": "",
                    "account": "r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm"
                }
                */

                const resolved_at = res.resolved_at;
                const dispatched_result = res.dispatched_result;
                if (resolved_at) {
                    setOpenScanQR(false);
                    if (dispatched_result === 'tesSUCCESS') {
                        // TRIGGER account refresh
                        dispatch(refreshAccountData());
                    }
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

    const onOfferCancelXumm = async (seq) => {
        setLoading(true);
        try {
            const OfferSequence = seq;

            const user_token = accountProfile.token;
            
            const body={OfferSequence, user_token};

            const res = await axios.post(`${BASE_URL}/xumm/offercancel`, body);

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

    // https://api.sologenic.org/api/v1/trades?symbol=534F4C4F00000000000000000000000000000000%2BrsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz%2FXRP&account=r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm

    return (
        <StackStyle>
            <QRDialog
                open={openScanQR}
                type="OfferCancel"
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
                <Table stickyHeader size={'small'}
                    sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: "0px solid",
                            borderBottomColor: theme.palette.divider
                        }
                    }}
                >
                    <TableHead>
                        <TableRow
                            sx={{
                                [`& .${tableCellClasses.root}`]: {
                                    borderBottom: "1px solid",
                                    borderBottomColor: theme.palette.divider
                                }
                            }}
                        >
                            <TableCell align="left">Side</TableCell>
                            <TableCell align="left">Price</TableCell>
                            <TableCell align="left">Taker Gets</TableCell>
                            <TableCell align="left">Taker Pays</TableCell>
                            <TableCell align="left">Cancel</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        accountAddress && accountData?.offers?.map((row) => {
                                const {
                                    // flags,
                                    quality,
                                    seq,
                                    taker_gets,
                                    taker_pays
                                } = row;
                                let exch = quality;
                                const _id = seq;

                                const gets = taker_gets.value || new Decimal(taker_gets).div(1000000).toNumber();
                                const pays = taker_pays.value || new Decimal(taker_pays).div(1000000).toNumber();

                                let name_pays;
                                let name_gets;

                                if (!taker_pays.value) {
                                    name_pays = 'XRP';
                                } else
                                    name_pays = normalizeCurrencyCodeXummImpl(taker_pays.currency);

                                
                                if (!taker_gets.value)
                                    name_gets = 'XRP';
                                else
                                    name_gets = normalizeCurrencyCodeXummImpl(taker_gets.currency);

                                let buy;
                                if (taker_pays.issuer === curr1.issuer && taker_pays.currency === curr1.currency) {
                                    // BUY
                                    buy = true;
                                    exch = new Decimal(gets).div(pays).toNumber();
                                } else {
                                    // SELL
                                    buy = false;
                                    exch = new Decimal(pays).div(gets).toNumber();
                                }

                                return (
                                    <TableRow
                                        hover
                                        key={_id}
                                        sx={{
                                            [`& .${tableCellClasses.root}`]: {
                                                color: (buy ? '#007B55' : '#B72136')
                                            }
                                        }}
                                    >
                                        <TableCell align="left">
                                            {
                                                buy ? (
                                                    <BuyTypography variant="caption">
                                                        BUY
                                                    </BuyTypography>
                                                ):(
                                                    <SellTypography variant="caption">
                                                        SELL
                                                    </SellTypography>
                                                )
                                            }
                                        </TableCell>
                                        <TableCell align="left">{exch}</TableCell>
                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{gets} <Typography variant="small">{name_gets}</Typography></Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{pays} <Typography variant="small">{name_pays}</Typography></Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <IconButton color='error' onClick={e=>handleCancel(e, seq)} aria-label="cancel">
                                                <CancelIcon fontSize='small'/>
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </Box>
            {!accountAddress && (
                <ConnectWalletContainer>
                    <Typography variant='subtitle2' color='error'>Connect your wallet to access data</Typography>
                </ConnectWalletContainer>
            )}
        </StackStyle>
    );
}
