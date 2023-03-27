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
    Backdrop,
    Box,
    Container,
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
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import CancelIcon from '@mui/icons-material/Cancel';

// Loader
import { PuffLoader, PulseLoader } from "react-spinners";
import { ProgressBar, Discuss } from 'react-loader-spinner';


// Utils
import { checkExpiration } from 'src/utils/extra';
import { formatDateTime } from 'src/utils/formatTime';

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Components
import QRDialog from 'src/components/QRDialog';
import ListToolbar from './ListToolbar';

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

function truncate(str, n) {
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function OfferList({account}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const { accountProfile, sync, setSync } = useContext(AppContext);
    
    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [total, setTotal] = useState(0);
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        function getOffers() {
            setLoading(true);
            // https://api.xrpl.to/api/account/offers/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
            axios.get(`${BASE_URL}/account/offers/${account}?page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTotal(ret.total);
                        setOffers(ret.offers);
                    }
                }).catch(err => {
                    console.log("Error on getting account orders!!!", err);
                }).then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getOffers();
    }, [accountProfile, sync]);

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
                        setSync(sync + 1);
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
    }, [openScanQR, uuid]);

    const onOfferCancelXumm = async (seq) => {
        setLoading(true);
        try {
            const OfferSequence = seq;

            const user_token = accountProfile.user_token;
            
            const body={OfferSequence, user_token};

            const res = await axios.post(`${BASE_URL}/offer/cancel`, body);

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
            const res = await axios.delete(`${BASE_URL}/offer/logout/${uuid}`);
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

            <QRDialog
                open={openScanQR}
                type="OfferCancel"
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />

            {loading ? (
                <Stack alignItems="center">
                    <PulseLoader color='#00AB55' size={10} />
                </Stack>
            ) : (
                offers && offers.length === 0 &&
                <Stack alignItems="center" sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="s6" color='#2de370'>[ No Offers ]</Typography>
                </Stack>
            )
            }

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
                            <TableCell align="left"></TableCell>
                            <TableCell align="left">Taker Gets</TableCell>
                            <TableCell align="left">Taker Pays</TableCell>
                            <TableCell align="left">Expire</TableCell>
                            <TableCell align="left">Time</TableCell>
                            <TableCell align="left">Hash</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        offers.map((row) => {
                                /*{
                                    "_id": "r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm_71158478",
                                    "account": "r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm",
                                    "seq": 71158478,
                                    "flags": 0,
                                    "gets": {
                                        "issuer": "XRPL",
                                        "currency": "XRP",
                                        "name": "XRP",
                                        "value": "5"
                                    },
                                    "pays": {
                                        "issuer": "rLpunkscgfzS8so59bUCJBVqZ3eHZue64r",
                                        "currency": "4C656467657250756E6B73000000000000000000",
                                        "name": "LedgerPunks",
                                        "value": "5000"
                                    },
                                    "pair": "1e766311a6e689cd7225b5923ed5811c"
                                },*/
                                const {
                                    _id,
                                    account,
                                    seq,
                                    flags,
                                    gets,
                                    pays,
                                    expire,
                                    chash,
                                    ctime,
                                    mhash,
                                    mtime
                                } = row;

                                const expired = checkExpiration(expire);

                                const strDateTime = formatDateTime(ctime);
                                const strExpireTime = expire?formatDateTime(expire):"";
                                
                                return (
                                    <TableRow
                                        hover
                                        key={_id}
                                    >
                                        <TableCell align="left">
                                            <Tooltip title="Cancel Offer">
                                                <IconButton color='error' onClick={e=>handleCancel(e, seq)} aria-label="cancel">
                                                    <CancelIcon fontSize='small'/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{gets.value} <Typography variant="small">{gets.name}</Typography></Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{pays.value} <Typography variant="small">{pays.name}</Typography></Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{strExpireTime}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="h6" noWrap>{strDateTime}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Stack direction="row" alignItems='center'>
                                                <Link
                                                    // underline="none"
                                                    // color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${chash}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <Stack direction="row" alignItems='center'>
                                                        {truncate(chash, 16)}
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </Link>

                                                <Link
                                                    // underline="none"
                                                    // color="inherit"
                                                    target="_blank"
                                                    href={`https://livenet.xrpl.org/transactions/${chash}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <IconButton edge="end" aria-label="bithomp">
                                                        <Avatar alt="livenetxrplorg" src="/static/livenetxrplorg.ico" sx={{ width: 16, height: 16 }} />
                                                    </IconButton>
                                                </Link>
                                            </Stack>
                                        </TableCell>

                                        
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
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
