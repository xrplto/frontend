// material
import axios from 'axios'
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
// import { withStyles } from '@mui/styles';
import {
    Box,
    IconButton,
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
// import { MD5 } from 'crypto-js';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import CancelIcon from '@mui/icons-material/Cancel';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../../utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from '../../../utils/normalizers';
// ----------------------------------------------------------------------
import { useContext } from 'react'
import Context from '../../../Context'
import QROfferCancelDialog from './QROfferCancelDialog';
// ----------------------------------------------------------------------
import { useSelector, useDispatch } from "react-redux";
import { selectAccount, update_account } from "../../../redux/statusSlice";
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

export default function OpenOrders({pair}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const EPOCH_OFFSET = 946684800;
    const theme = useTheme();
    const account = useSelector(selectAccount);
    const dispatch = useDispatch();
    const { accountProfile, setAccountProfile, setLoading } = useContext(Context);
    const [exchs, setExchs] = useState([]);
    
    const [tabValue, setTabValue] = useState(0);

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [cancelSeq, setCancelSeq] = useState(0);

    const curr1 = pair.curr1;
    const curr2 = pair.curr2;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCancel = (event, seq) => {
        onOfferCancelXumm(seq);
    }

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        if (openScanQR) {
            timer = setInterval(async () => {
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

                    const account = res.account;
                    const resolved_at = res.resolved_at;
                    const dispatched_result = res.dispatched_result;
                    if (resolved_at) {
                        setOpenScanQR(false);
                        if (dispatched_result === 'tesSUCCESS') {
                            let newOffers = [];
                            for (var o of account.offers) {
                                if (o.seq !== cancelSeq)
                                    newOffers.push(o);
                            }
                            const newAccount = {
                                account: account.account,
                                pair: account.pair,
                                offers: newOffers
                            };
                            dispatch(update_account(newAccount));
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
            }, 2000);
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
            
            const body={OfferSequence};

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
                //setLog(res.data.status ? "disconnect success" : "disconnect failed");
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
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example" sx={{mb: 3}}>
                <Tab label="OPEN ORDERS" {...a11yProps(0)} />
                <Tab label="TRADE HISTORY" {...a11yProps(1)} />
            </Tabs>
            {/* <Account sx={{m:30}} /> */}
            {tabValue === 0 ? 
                (
                    <>
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
                                {/* <TableCell align="left">Side</TableCell> */}
                                <TableCell align="left">Price</TableCell>
                                <TableCell align="left">Taker Gets</TableCell>
                                <TableCell align="left">Taker Pays</TableCell>
                                <TableCell align="left">Cancel</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {
                            account.offers?.map((row) => {
                                    const {
                                        flags,
                                        quality,
                                        seq,
                                        taker_gets,
                                        taker_pays
                                    } = row;
                                    let exch = quality;
                                    const _id = seq;
                                    const takerPays = taker_pays.value || taker_pays / 1000000;
                                    const takerGets = taker_gets.value || taker_gets / 1000000;

                                    let name_pays;
                                    let name_gets;

                                    if (!taker_pays.value) {
                                        name_pays = 'XRP';
                                        exch /= 1000000;
                                    } else
                                        name_pays = normalizeCurrencyCodeXummImpl(taker_pays.currency);

                                    
                                    if (!taker_gets.value)
                                        name_gets = 'XRP';
                                    else
                                        name_gets = normalizeCurrencyCodeXummImpl(taker_gets.currency);

                                    return (
                                        <TableRow
                                            hover
                                            key={_id}
                                            tabIndex={-1}
                                        >
                                            <TableCell align="left">{exch}</TableCell>
                                            <TableCell align="left">
                                                {fNumber(takerGets)} <Typography variant="caption">{name_gets}</Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                {fNumber(takerPays)} <Typography variant="caption">{name_pays}</Typography>
                                            </TableCell>

                                            <TableCell align="left">
                                                <IconButton color='error' onClick={e=>handleCancel(e, seq)} aria-label="cancel">
                                                    <CancelIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                    <QROfferCancelDialog
                        open={openScanQR}
                        handleClose={handleScanQRClose}
                        qrUrl={qrUrl}
                        nextUrl={nextUrl}
                    />
                    </>
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
                                <TableCell align="left">Time</TableCell>
                                <TableCell align="left">
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Typography variant="body2">Paid</Typography>
                                        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Paid Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                            <Icon icon={infoFilled} />
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                                <TableCell align="left">
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Typography variant="body2">Got</Typography>
                                        <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Got Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                            <Icon icon={infoFilled} />
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                                <TableCell align="left">Price</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {
                            exchs.map((row) => {
                                    const {
                                        _id,
                                        dir,
                                        //hash,
                                        //maker,
                                        //taker,
                                        //ledger,
                                        //seq,
                                        takerPaid,
                                        takerGot,
                                        date,
                                        cancel,
                                        // pair,
                                        // xUSD
                                        } = row;
                                    let value;
                                    let exch;
                                    let buy;
                                    if (takerPaid.issuer === curr1.issuer && takerPaid.currency === curr1.currency) {
                                        // SELL, Red
                                        const t = parseFloat(takerGot.value);
                                        value = parseFloat(takerPaid.value);
                                        exch = t / value;
                                        buy = false;
                                    } else {
                                        // BUY, Green
                                        const t = parseFloat(takerPaid.value);
                                        value = parseFloat(takerGot.value);
                                        exch = t / value; 
                                        buy = true;
                                    }
                                    const nDate = new Date((date + EPOCH_OFFSET) * 1000); 
                                    const year = nDate.getFullYear();
                                    const month = nDate.getMonth() + 1;
                                    const day = nDate.getDate();
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
                                                        color: (cancel ? '#FFC107': (dir === 'buy' ? '#007B55' : '#B72136'))
                                                    }
                                                }}
                                            >
                                                <TableCell align="left">
                                                    <Stack>
                                                        <Typography variant="subtitle2">{strTime}</Typography>
                                                        {/* <Typography variant="caption">{strDate}</Typography> */}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="left">
                                                    {fNumber(takerPaid.value)} <Typography variant="caption">{namePaid}</Typography>
                                                </TableCell>

                                                <TableCell align="left">
                                                    {fNumber(takerGot.value)} <Typography variant="caption">{nameGot}</Typography>
                                                </TableCell>
                                                <TableCell align="left"><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                            </TableRow>
                                        // </CopyToClipboard>
                                    );
                                })}
                        </TableBody>
                    </Table>
                )
            }
        </StackStyle>
    );
}
