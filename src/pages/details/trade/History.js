// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import {
    Alert,
    Avatar,
    FormControl,
    IconButton,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import { MD5 } from 'crypto-js';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../../utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from '../../../utils/normalizers';
// ----------------------------------------------------------------------
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

const CancelTypography = withStyles({
    root: {
        color: "#FF6C40",
        borderRadius: '6px',
        border: '0.05em solid #FF6C40',
        //fontSize: '0.5rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const BuyTypography = withStyles({
    root: {
        color: "#007B55",
        borderRadius: '6px',
        border: '0.05em solid #007B55',
        //fontSize: '0.5rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const SellTypography = withStyles({
    root: {
        color: "#B72136",
        borderRadius: '6px',
        border: '0.05em solid #B72136',
        //fontSize: '0.5rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const CustomSelect = styled(Select)(({ theme }) => ({
    // '& .MuiOutlinedInput-notchedOutline' : {
    //     border: 'none'
    // }
}));
// ----------------------------------------------------------------------

const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    //backgroundColor: '#323546',
    borderRadius: '4px',
    border: '1px solid #323546',
    padding: '1px 4px'
};

function getPair(issuer, code) {
    // issuer, currencyCode, 'XRP', undefined
    const t1 = 'undefined_XRP';
    const t2 = issuer  + '_' +  code;
    let pair = t1 + t2;
    if (t1.localeCompare(t2) > 0)
        pair = t2 + t1;
    return MD5(pair).toString();
}

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function HistoryData({token, pair}) {
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://api.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(30);
    const [exchs, setExchs] = useState([]);
    const theme = useTheme();
    const {
        acct,
        code,
        // md5
    } = token;

    useEffect(() => {
        function getExchanges() {
            // XPUNK
            // https://api.xrpl.to/api/exchanges?pair=d12119be3c1749470903414dff032761&page=0&limit=5
            // SOLO
            // https://api.xrpl.to/api/exchanges?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchanges?pair=${pair.pair}&page=${page}&limit=${rows}`)
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
        getExchanges();

        const timer = setInterval(() => getExchanges(), 10000);

        return () => {
            clearInterval(timer);
        }
    }, [page, rows, pair]);

    return (
        <StackStyle>
            <Typography variant='subtitle1' sx={{color:'#3366FF', textAlign: 'center', ml:2, mt:2, mb:1}}>Last Trades</Typography>
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
                        <TableCell align="left" sx={{ p:0 }}>Time</TableCell>
                        <TableCell align="left" sx={{ p:0 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="body2">Paid</Typography>
                                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Paid Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
                            </Stack>
                        </TableCell>
                        <TableCell align="left" sx={{ p:0 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="body2">Got</Typography>
                                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Taker Got Amount<br/>Cancelled offers are yellow colored.</Typography>}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
                            </Stack>
                        </TableCell>
                        <TableCell align="left" sx={{ p:0 }}>Price</TableCell>
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
                            if (takerPaid.issuer === acct && takerPaid.currency === code) {
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
                                        <TableCell align="left" sx={{ p:0 }}>
                                            <Stack>
                                                <Typography variant="subtitle2">{strTime}</Typography>
                                                {/* <Typography variant="caption">{strDate}</Typography> */}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="left" sx={{ p:0 }}>
                                            {fNumber(takerPaid.value)} <Typography variant="caption">{namePaid}</Typography>
                                        </TableCell>

                                        <TableCell align="left" sx={{ p:0 }}>
                                            {fNumber(takerGot.value)} <Typography variant="caption">{nameGot}</Typography>
                                        </TableCell>
                                        <TableCell align="left" sx={{ p:0 }}><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                    </TableRow>
                                // </CopyToClipboard>
                            );
                        })}
                </TableBody>
            </Table>
        </StackStyle>
    );
}
