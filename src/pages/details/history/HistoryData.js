// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    Alert,
    FormControl,
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
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import HistoryToolbar from './HistoryToolbar';
import HistoryMoreMenu from './HistoryMoreMenu';
import { MD5 } from 'crypto-js';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../../utils/formatNumber';
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

export default function HistoryData({token, pairs}) {
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [exchs, setExchs] = useState([]);
    const [pair, setPair] = useState('');
    const [vol, setVol] = useState(0);
    const theme = useTheme();
    const {
        acct,
        code,
        // md5
    } = token;

    const setPairVolume = (p) => {
        setPair(p);
        for (var pi of pairs) {
            if (pi.pair === p) {
                if (pi.curr1.currency === code)
                    setVol(pi.curr1.value);
                if (pi.curr2.currency === code)
                    setVol(pi.curr2.value);
                break;
            }
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setCopied(false);
    };

    const handleChangePair = (event, value) => {
        setPairVolume(event.target.value);
    }

    useEffect(() => {
        function getExchanges() {
            if (!pair) {
                setPairVolume(getPair(acct, code));
                //console.log(pair);
                return;
            }
            // XPUNK
            // https://ws.xrpl.to/api/exchanges?pair=d12119be3c1749470903414dff032761&page=0&limit=5
            // SOLO
            // https://ws.xrpl.to/api/exchanges?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchanges?pair=${pair}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        let exs = [];
                        let i = 0;
                        for (var ex of ret.exchs) {
                            ex.id = i + page * rows + 1;
                            exs.push(ex);
                            i++;
                        }
                        setExchs(exs);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getExchanges();
    }, [page, rows, pair]);

    return (
        <StackStyle>
             <Snackbar open={copied} autoHideDuration={800} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    Copied
                </Alert>
            </Snackbar>
            <Stack direction="row" alignItems="center">
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="demo-select-small">Pairs</InputLabel>
                    <CustomSelect
                        labelId="demo-select-small"
                        id="demo-select-small"
                        value={pair}
                        label="Pair"
                        onChange={handleChangePair}
                    >
                        {
                        pairs.map((row) => {
                                const {
                                    pair,
                                    curr1,
                                    curr2
                                } = row;

                                const name1 = curr1.name;
                                const name2 = curr2.name;

                                return (
                                    <MenuItem key={pair} value={pair}>
                                        <Stack direction="row" alignItems='center'>
                                            <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{name1}</Typography>
                                            <Icon icon={arrowsExchange} width="16" height="16"/>
                                            <Typography variant="subtitle2" sx={{ color: '#007B55' }}>{name2}</Typography>
                                            <span style={badge24hStyle}>24h</span>
                                            <Typography variant="subtitle2" sx={{ color: '#B72136' }}>{fNumber(curr1.value)}</Typography>
                                        </Stack>
                                    </MenuItem>
                                );
                            })
                        }
                    </CustomSelect>
                </FormControl>
                {/* <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">24H Volume:</Typography>
                    <Typography variant="h5" sx={{ color: '#B72136' }}>{fNumber(vol)}</Typography>
                </Stack> */}
            </Stack>
            <Table stickyHeader sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TableHead>
                    <TableRow>
                        <TableCell align="left">#</TableCell>
                        <TableCell align="left">Price</TableCell>
                        <TableCell align="left">Volume</TableCell>
                        <TableCell align="left"></TableCell>
                        <TableCell align="left">Time</TableCell>
                        <TableCell align="left">Ledger</TableCell>
                        <TableCell align="left">Sequence</TableCell>
                        <TableCell align="left">From</TableCell>
                        <TableCell align="left">To</TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    // exchs.slice(page * rows, page * rows + rows)
                    exchs.map((row) => {
                            const {
                                id,
                                _id,
                                hash,
                                maker,
                                taker,
                                ledger,
                                seq,
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
                            return (
                                <CopyToClipboard
                                    key={`id${_id}`}
                                    text={hash}
                                    onCopy={() => setCopied(true)}>
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
                                        <TableCell align="left"><Typography variant="subtitle2">{id}</Typography></TableCell>
                                        <TableCell align="left"><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                        <TableCell align="left"><Typography variant="subtitle2">{fNumber(value)}</Typography></TableCell>
                                        <TableCell align="left">
                                            {cancel && (
                                                <CancelTypography variant="caption">
                                                cancel
                                                </CancelTypography>
                                            )}
                                        </TableCell>
                                        <TableCell align="left">
                                            <Stack>
                                                <Typography variant="subtitle2">{strTime}</Typography>
                                                <Typography variant="caption">{strDate}</Typography>
                                            </Stack>
                                            
                                        </TableCell>
                                        <TableCell align="left">{ledger}</TableCell>
                                        <TableCell align="left">{seq}</TableCell>
                                        <TableCell align="left">
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${maker}`}
                                                rel="noreferrer noopener"
                                            >
                                                {maker}
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
                                                {taker}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="right">
                                            <HistoryMoreMenu hash={hash} />
                                        </TableCell>
                                    </TableRow>
                                </CopyToClipboard>
                            );
                        })}
                </TableBody>
            </Table>
            <HistoryToolbar
                count={count}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />
        </StackStyle>
    );
}
