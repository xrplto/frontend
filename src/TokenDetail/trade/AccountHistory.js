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

// Utils
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectAccountData, selectRefreshAccount, refreshAccountData } from "src/redux/statusSlice";
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

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
            )}
        </div>
    );
}
  
TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

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

export default function AccountHistory({pair}) {
    const theme = useTheme();
    const dispatch = useDispatch();
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const accountData = useSelector(selectAccountData);
    const refreshAccount = useSelector(selectRefreshAccount);
    
    const { accountProfile, setLoading } = useContext(AppContext);
    
    const [exchs, setExchs] = useState([]);
    
    const [tabValue, setTabValue] = useState(0);

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const accountAddress = accountProfile?.account;

    const curr1 = pair.curr1;
    // const curr2 = pair.curr2;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCancel = (event, seq) => {
        onOfferCancelXumm(seq);
    }

    useEffect(() => {
        function getExchanges() {
            if (!accountProfile || !accountProfile.account) return;
            if (!pair) return;
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            const account = accountProfile.account;
            // https://api.xrpl.to/api/accounttx/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm?curr1=534F4C4F00000000000000000000000000000000&issuer1=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&curr2=XRP&issuer2=undefined
            axios.get(`${BASE_URL}/accounttx/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setExchs(ret.exchs);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        // console.log('account_tx');
        if (tabValue === 1)
            getExchanges();

    }, [accountProfile, pair, tabValue, refreshAccount]);

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
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example" sx={{mb: 3}}>
                <Tab label="OPEN ORDERS" {...a11yProps(0)} />
                <Tab label="TRADE HISTORY" {...a11yProps(1)} />
            </Tabs>
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
                {tabValue === 0 ?
                    (
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
                    ):(
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
                                    <TableCell align="left">Taker Paid</TableCell>
                                    <TableCell align="left">Taker Got</TableCell>
                                    <TableCell align="left">Time</TableCell>
                                    <TableCell align="left">Maker</TableCell>
                                    <TableCell align="left">Taker</TableCell>
                                    <TableCell align="left">Hash</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accountAddress && exchs.map((row) => {
                                    /*
                                    {
                                        "dir": "buy",
                                        "flags": 0,
                                        "ledger": 71729458,
                                        "ledger_index": 71729458,
                                        "hash": "0F2CC103A3CD21BCAEF33ED7CEEC4AEB70660FE92A3140ED9506B80BFFFE710E",
                                        "maker": "r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm",
                                        "taker": "rMXN4AK1uKyFazVzTBTCTwcv17o9Az4rs2",
                                        "seq": 71158461,
                                        "date": 706175182,
                                        "takerPaid": {
                                            "currency": "534F4C4F00000000000000000000000000000000",
                                            "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                            "value": "0.01"
                                        },
                                        "takerGot": {
                                            "currency": "XRP",
                                            "value": "0.0061"
                                        },
                                        "pair": "fa99aff608a10186d3b1ff33b5cd665f"
                                    }
                                    */
                                    const {
                                        // dir,
                                        hash,
                                        maker,
                                        taker,
                                        //ledger,
                                        seq,
                                        takerPaid,
                                        takerGot,
                                        date,
                                        // cancel,
                                        // pair,
                                        // xUSD
                                    } = row;

                                    const tMaker = truncate(maker, 12);
                                    const tTaker = truncate(taker, 12);
                                    const tHash = truncate(hash, 8);

                                    const vPaid = takerPaid.value;
                                    const vGot = takerGot.value;
        
                                    let exch;
                                    let buy = false;
                                    if (takerPaid.issuer === curr1.issuer && takerPaid.currency === curr1.currency) {
                                        exch = new Decimal(vGot).div(vPaid).toNumber();
                                    } else {
                                        exch = new Decimal(vPaid).div(vGot).toNumber();
                                    }

                                    if (takerPaid.issuer === curr1.issuer && takerPaid.currency === curr1.currency && maker === accountAddress) {
                                        buy = true;
                                    } else if (takerGot.issuer === curr1.issuer && takerGot.currency === curr1.currency && taker === accountAddress) {
                                        buy = true;
                                    }

                                    const nDate = new Date((date + EPOCH_OFFSET) * 1000);
                                    const year = nDate.getFullYear();
                                    const month = (nDate.getMonth() + 1).toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                                    const day = nDate.getDate().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                                    const hour = nDate.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                                    const min = nDate.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                                    const sec = nDate.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});

                                    //const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
                                    //const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
                                    const strDate = `${year}-${month}-${day}`;
                                    const strTime = `${hour}:${min}:${sec}`;

                                    const namePaid = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                                    const nameGot = normalizeCurrencyCodeXummImpl(takerGot.currency);

                                    return (
                                        <TableRow
                                            hover
                                            key={seq}
                                            sx={{
                                                [`& .${tableCellClasses.root}`]: {
                                                    // color: (cancel ? '#FFC107': (dir === 'buy' ? '#007B55' : '#B72136'))
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
                                            <TableCell align="left"><Typography variant="h6">{exch}</Typography></TableCell>
                                            
                                            <TableCell align="left">
                                                <Typography variant="h6" noWrap>{vPaid} <Typography variant="small">{namePaid}</Typography></Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                <Typography variant="h6" noWrap>{vGot} <Typography variant="small">{nameGot}</Typography></Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                <Stack>
                                                    <Typography variant="h6" noWrap>{strDate} {strTime}</Typography>
                                                    {/* <Typography variant="caption">{strDate}</Typography> */}
                                                </Stack>
                                            </TableCell>
                                            
                                            <TableCell align="left">
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${maker}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    {tMaker}
                                                </Link>
                                            </TableCell>
                                            <TableCell align="left">
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${taker}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    {tTaker}
                                                </Link>
                                            </TableCell>
                                            <TableCell align="left">
                                                <Stack direction="row" alignItems='center'>
                                                    <Link
                                                        underline="none"
                                                        color="inherit"
                                                        target="_blank"
                                                        href={`https://bithomp.com/explorer/${hash}`}
                                                        rel="noreferrer noopener nofollow"
                                                    >
                                                        <Stack direction="row" alignItems='center'>
                                                            {tHash}
                                                            <IconButton edge="end" aria-label="bithomp">
                                                                <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                            </IconButton>
                                                        </Stack>
                                                    </Link>

                                                    <Link
                                                        underline="none"
                                                        color="inherit"
                                                        target="_blank"
                                                        href={`https://livenet.xrpl.org/transactions/${hash}`}
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
                    )
                }
            </Box>
            {!accountAddress && (
                <ConnectWalletContainer>
                    <Typography variant='subtitle2' color='error'>Connect your wallet to access data</Typography>
                </ConnectWalletContainer>
            )}
        </StackStyle>
    );
}
