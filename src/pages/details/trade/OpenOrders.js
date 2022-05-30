// material
import axios from 'axios'
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import BigNumber from 'bignumber.js';
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
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../../utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from '../../../utils/normalizers';
// ----------------------------------------------------------------------
import { useContext } from 'react'
import Context from '../../../Context'
import QROfferDialog from './QROfferDialog';
// ----------------------------------------------------------------------
import { useSelector, useDispatch } from "react-redux";
import { selectAccountData, updateAccountData } from "../../../redux/statusSlice";
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

const ConnectWalletContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '30vh'
});

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function OpenOrders({pair}) {
    const theme = useTheme();
    const dispatch = useDispatch();
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const accountData = useSelector(selectAccountData);
    
    const { accountProfile, setLoading } = useContext(Context);
    const [exchs, setExchs] = useState([]);
    
    const [tabValue, setTabValue] = useState(0);

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [cancelSeq, setCancelSeq] = useState(0);

    const accountAddress = accountProfile?.account;

    const curr1 = pair.curr1;
    const curr2 = pair.curr2;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCancel = (event, seq) => {
        onOfferCancelXumm(seq);
    }

    useEffect(() => {
        function getExchanges(profile, pair) {
            if (!profile || !profile.account) return;
            if (!pair) return;
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            const account = profile.account;
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
        if (tabValue === 1)
            getExchanges(accountProfile, pair);

    }, [accountProfile, pair, tabValue]);

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
                        let newOffers = [];
                        for (var o of accountData.offers) {
                            if (o.seq !== cancelSeq)
                                newOffers.push(o);
                        }
                        const newAccountData = {
                            account: accountData.account,
                            pair: accountData.pair,
                            offers: newOffers
                        };
                        dispatch(updateAccountData(newAccountData));
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
                setCancelSeq(seq);
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
            <QROfferDialog
                open={openScanQR}
                handleClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
                offerType='Cancel'
            />
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example" sx={{mb: 3}}>
                <Tab label="OPEN ORDERS" {...a11yProps(0)} />
                <Tab label="TRADE HISTORY" {...a11yProps(1)} />
            </Tabs>
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

                                    const gets = taker_gets.value || taker_gets / 1000000;
                                    const pays = taker_pays.value || taker_pays / 1000000;

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
                                        exch = gets / pays;
                                    } else {
                                        // SELL
                                        buy = false;
                                        exch = pays / gets;
                                    }

                                    return (
                                        <TableRow
                                            hover
                                            key={_id}
                                            tabIndex={-1}
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
                                            <TableCell align="left">{fNumber(exch)}</TableCell>
                                            <TableCell align="left">
                                                {fNumber(gets)} <Typography variant="caption">{name_gets}</Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                {fNumber(pays)} <Typography variant="caption">{name_pays}</Typography>
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
                                const {
                                    _id,
                                    // dir,
                                    hash,
                                    maker,
                                    taker,
                                    //ledger,
                                    //seq,
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
                                    exch = vGot / vPaid;
                                } else {
                                    exch = vPaid / vGot;
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
                                    // <CopyToClipboard
                                    //     key={`id${_id}`}
                                    //     text={hash}
                                    //     onCopy={() => setCopied(true)}>
                                        <TableRow
                                            hover
                                            key={_id}
                                            tabIndex={-1}
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
                                            <TableCell align="left"><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                            
                                            <TableCell align="left">
                                                {new BigNumber(vPaid).decimalPlaces(6).toNumber()} <Typography variant="caption">{namePaid}</Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                {new BigNumber(vGot).decimalPlaces(6).toNumber()} <Typography variant="caption">{nameGot}</Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                <Stack>
                                                    <Typography variant="subtitle2">{strDate} {strTime}</Typography>
                                                    {/* <Typography variant="caption">{strDate}</Typography> */}
                                                </Stack>
                                            </TableCell>
                                            
                                            <TableCell align="left">
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${maker}`}
                                                    rel="noreferrer noopener"
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
                                                    rel="noreferrer noopener"
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
                                                        rel="noreferrer noopener"
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
                                                        rel="noreferrer noopener"
                                                    >
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="livenetxrplorg" src="/static/livenetxrplorg.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Link>
                                                </Stack>
                                            </TableCell>
                                            
                                        </TableRow>
                                    // </CopyToClipboard>
                                );
                            })}
                        </TableBody>
                    </Table>
                )
            }
            {!accountAddress &&
                <ConnectWalletContainer>
                    <Typography variant='subtitle2' color='error'>Connect your wallet to access data</Typography>
                </ConnectWalletContainer>
            }
        </StackStyle>
    );
}
