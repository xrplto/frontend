import axios from 'axios'
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import {MD5} from "crypto-js";

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

// Loader
import { PuffLoader } from "react-spinners";

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { formatDateTime } from 'src/utils/formatTime';

// Components
import HistoryToolbar from './HistoryToolbar';

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

const ConnectWalletContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '10vh'
});

// ----------------------------------------------------------------------

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

function getMD5(issuer, currency) {
    return MD5(issuer  + '_' +  currency).toString();
}

export default function History({token}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';

    const { accountProfile } = useContext(AppContext);
    const accountAddress = accountProfile?.account;

    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [hists, setHists] = useState([]);

    useEffect(() => {
        function getHistories() {
            const accountAddress = accountProfile?.account;
            if (!accountAddress) return;
            setLoading(true);
            // https://api.xrpl.to/api/history?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&page=0&limit=10
            axios.get(`${BASE_URL}/history?account=${accountAddress}&md5=${token.md5}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        setHists(ret.hists);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getHistories();
    }, [accountProfile, page, rows]);

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
                            <TableCell align="left">Dir</TableCell>
                            <TableCell align="left">Price</TableCell>
                            {/* <TableCell align="left">Volume</TableCell> */}
                            <TableCell align="left">Taker Paid</TableCell>
                            <TableCell align="left">Taker Got</TableCell>
                            <TableCell align="left">Taker</TableCell>
                            <TableCell align="left">Maker</TableCell>
                            <TableCell align="left">Time</TableCell>
                            <TableCell align="left">Ledger</TableCell>
                            <TableCell align="left">Account</TableCell>
                            <TableCell align="left">Hash</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // {
                        //     "_id": "23304962_1",
                        //     "dir": "buy",
                        //     "account": "rHmaZbZGqKWN7D45ue7J5cRu8yxyNdHeN2",
                        //     "paid": {
                        //         "issuer": "XRPL",
                        //         "currency": "XRP",
                        //         "name": "XRP",
                        //         "value": "179999.9982"
                        //     },
                        //     "got": {
                        //         "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                        //         "currency": "USD",
                        //         "name": "USD",
                        //         "value": "1096.755823946603"
                        //     },
                        //     "pair": "21e8e9b61d766f6187cb9009fda56e9e",
                        //     "hash": "98229608E154559663CBA8A78AF42AF7E803B40E5814CFABC639CA238A9E8DFE",
                        //     "ledger": 23304962,
                        //     "time": 1471034710000
                        // },
                        hists.map((row, idx) => {

                                const {
                                    _id,
                                    dir,
                                    account,
                                    maker,
                                    taker,
                                    seq,
                                    takerPaid,
                                    takerGot,
                                    ledger,
                                    hash,
                                    time
                                } = row;

                                
                                const paidName = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                                const gotName = normalizeCurrencyCodeXummImpl(takerGot.currency);
                                const md51 = getMD5(takerPaid.issuer, takerPaid.currency);
                                // const md52 = getMD5(takerGot.issuer, takerGot.currency);
                                
                                let exch;
                                let name;
                                let type;
                                
                                if (md51 === token.md5) {
                                    // volume = got.value;
                                    exch = Decimal.div(takerGot.value, takerPaid.value).toNumber();
                                    name = gotName;
                                    type = dir==='buy'?'buy':'sell';
                                } else {
                                    // volume = paid.value;
                                    exch = Decimal.div(takerPaid.value, takerGot.value).toNumber();
                                    name = paidName;
                                    type = dir==='buy'?'sell':'buy';
                                }

                                const strDateTime = formatDateTime(time);

                                return (
                                    <TableRow
                                        hover
                                        key={_id}
                                        sx={{
                                            [`& .${tableCellClasses.root}`]: {
                                                color: (type === 'sell' ? '#B72136' : '#007B55')
                                            }
                                        }}
                                    >
                                        <TableCell align="left"><Typography variant="subtitle2">{idx + page * rows + 1}</Typography></TableCell>
                                        <TableCell align="left">
                                            <Stack spacing={1}>
                                                {dir==='sell' && (
                                                    <Stack direction="row">
                                                        <SellTypography variant="caption">
                                                        sell
                                                        </SellTypography>
                                                    </Stack>
                                                )}
                                                
                                                {dir==='buy' && (
                                                    <Stack direction="row">
                                                        <BuyTypography variant="caption">
                                                        buy
                                                        </BuyTypography>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="left"><Typography variant="caption">{fNumber(exch)} {name}</Typography></TableCell>
                                        {/* <TableCell align="left"><Typography variant="subtitle2">{fNumber(volume)}</Typography></TableCell> */}
                                        
                                        <TableCell align="left">
                                            {fNumber(takerPaid.value)} <Typography variant="caption">{paidName}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            {fNumber(takerGot.value)} <Typography variant="caption">{gotName}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Link
                                                // underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${taker}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                {truncate(taker, 12)}
                                            </Link>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Link
                                                // underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${maker}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                {truncate(maker, 12)}
                                            </Link>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Typography variant="caption">{strDateTime}</Typography>
                                        </TableCell>
                                        <TableCell align="left">{ledger}</TableCell>
                                        <TableCell align="left">
                                            <Link
                                                // underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                {truncate(account, 12)}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Stack direction="row" alignItems='center'>
                                                <Link
                                                    // underline="none"
                                                    color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${hash}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <Stack direction="row" alignItems='center'>
                                                        {truncate(hash, 16)}
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </Link>

                                                <Link
                                                    // underline="none"
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
            {!accountAddress ?
                <ConnectWalletContainer>
                    <Typography variant='subtitle2' color='error'>Connect your wallet to access data</Typography>
                </ConnectWalletContainer>
                :
                count > 0 ?
                    <HistoryToolbar
                        count={count}
                        rows={rows}
                        setRows={setRows}
                        page={page}
                        setPage={setPage}
                    />
                    :
                    loading ?
                        <Stack alignItems="center" sx={{mt: 5, mb: 5}}>
                            <PuffLoader color={"#00AB55"} size={35} sx={{mt:5, mb:5}}/>
                        </Stack>
                        :
                        <ConnectWalletContainer>
                            <Typography variant='subtitle2' color='error'>No Trading History</Typography>
                        </ConnectWalletContainer>
            }
        </>
    );
}
