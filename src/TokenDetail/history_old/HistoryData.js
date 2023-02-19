import axios from 'axios'
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
    styled, useTheme,
    Avatar,
    Box,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Components
import HistoryToolbar from './HistoryToolbar';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';

// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function HistoryData({token, pair}) {
    const theme = useTheme();
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://api.xrpl.to/api';

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [exchs, setExchs] = useState([]);
    
    const {
        issuer,
        currency,
        // md5
    } = token;

    useEffect(() => {
        function getExchanges() {
            if (!pair) return;
            // XPUNK
            // https://api.xrpl.to/api/exchs?pair=d12119be3c1749470903414dff032761&page=0&limit=5
            // SOLO
            // https://api.xrpl.to/api/exchs?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchs?pair=${pair.pair}&page=${page}&limit=${rows}`)
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

        const timer = setInterval(() => getExchanges(), 10000);

        return () => {
            clearInterval(timer);
        }
    }, [page, rows, pair]);

    return (
        <>
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
                            <TableCell align="left">Flag</TableCell>
                            <TableCell align="left">Taker Paid</TableCell>
                            <TableCell align="left">Taker Got</TableCell>
                            <TableCell align="left">Time</TableCell>
                            <TableCell align="left">Ledger</TableCell>
                            <TableCell align="left">Sequence</TableCell>
                            <TableCell align="left">Maker</TableCell>
                            <TableCell align="left">Taker</TableCell>
                            <TableCell align="left">Hash</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // exchs.slice(page * rows, page * rows + rows)
                        exchs.map((row) => {
                                const {
                                    id,
                                    _id,
                                    dir,
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
                                // let buy;
                                if (takerPaid.issuer === issuer && takerPaid.currency === currency) {
                                    // SELL, Red
                                    const t = parseFloat(takerGot.value);
                                    value = parseFloat(takerPaid.value);
                                    exch = t / value;
                                    // buy = false;
                                } else {
                                    // BUY, Green
                                    const t = parseFloat(takerPaid.value);
                                    value = parseFloat(takerGot.value);
                                    exch = t / value;
                                    // buy = true;
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

                                const tMaker = truncate(maker, 12);
                                const tTaker = truncate(taker, 12);
                                const tHash = truncate(hash, 16);

                                const namePaid = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                                const nameGot = normalizeCurrencyCodeXummImpl(takerGot.currency);

                                return (
                                    <TableRow
                                        hover
                                        key={_id}
                                        sx={{
                                            [`& .${tableCellClasses.root}`]: {
                                                color: (/*buy*/dir === 'sell' ? '#007B55' : '#B72136')
                                            }
                                        }}
                                    >
                                        <TableCell align="left"><Typography variant="subtitle2">{id}</Typography></TableCell>
                                        <TableCell align="left"><Typography variant="subtitle2">{fNumber(exch)}</Typography></TableCell>
                                        <TableCell align="left"><Typography variant="subtitle2">{fNumber(value)}</Typography></TableCell>
                                        <TableCell align="left">
                                            <Stack spacing={1}>
                                                {dir==='sell' && (
                                                    <Stack direction="row">
                                                        <BuyTypography variant="caption">
                                                        buy
                                                        </BuyTypography>
                                                    </Stack>
                                                )}
                                                
                                                {dir==='buy' && (
                                                    <Stack direction="row">
                                                        <SellTypography variant="caption">
                                                        sell
                                                        </SellTypography>
                                                    </Stack>
                                                )}
                                                {cancel && (
                                                    <Stack direction="row">
                                                        <CancelTypography variant="caption">
                                                        cancel
                                                        </CancelTypography>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell align="left">
                                            {fNumber(takerPaid.value)} <Typography variant="caption">{namePaid}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            {fNumber(takerGot.value)} <Typography variant="caption">{nameGot}</Typography>
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
            </Box>
            <HistoryToolbar
                count={count}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />
        </>
    );
}
