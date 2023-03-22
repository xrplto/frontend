import axios from 'axios';
import {MD5} from "crypto-js";
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';

// Material
import {
    useTheme,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
// ----------------------------------------------------------------------

const expo = (x, f) => {
    return Number.parseFloat(x).toExponential(f);
}

const fmNumber = (value, len) => {
    const amount = new Decimal(value).toNumber();
    if ((amount.toString().length > 8 && amount < 0.001) || amount > 1000000000)
        return expo(amount, 2);
    else
        return new Decimal(amount).toFixed(len, Decimal.ROUND_DOWN);
}

function getMD5(issuer, currency) {
    return MD5(issuer  + '_' +  currency).toString();
}

function convertTrade(md5, trades) {
    if (!trades || trades.length < 1) return [];
    /*
    {
        "_id": "78545243_2",
        "maker": "rMM1zmsQ5dA2932mXpFV3vTa6QoU681AYa",
        "taker": "ra1x1s3qdFqbSZLbdMkLWJRKMDPzgxycN3",
        "seq": 77099195,
        "pair": "5a1b51eae66799a2359f810696bd3291",
        "takerPaid": {
            "currency": "XRP",
            "issuer": "XRPL",
            "value": "39"
        },
        "takerGot": {
            "currency": "434F524500000000000000000000000000000000",
            "issuer": "rcoreNywaoz2ZCQ8Lg2EbSLnGuRBmun6D",
            "value": "26.6994848127106"
        },
        "ledger": 78545243,
        "hash": "15C378C6EDBCB61ACA84D0486A4EF34252750F149EAAD1A92FBFBF372A752571",
        "time": 1679326790000
    },
    */
    let prevLedger = 0;
    let prevExch = 0;
    let ctrades = [];

    let d1 = 0;
    let d2 = 0;

    for (var i = trades.length - 1; i >= 0; i--) {
        const t = trades[i];

        const {
            _id,
            takerPaid,
            takerGot,
            time,
            ledger
        } = t;

        const md51 = getMD5(takerPaid.issuer, takerPaid.currency);
        
        let exch;
        let amount;
        let color = undefined;

        if (ledger !== prevLedger) {
            if (ledger > 0) {
                prevExch = Decimal.div(d1, d2).toNumber();
            }
            d1 = 0;
            d2 = 0;
        }
        
        if (md5 === md51) {
            // volume = got.value;
            exch = Decimal.div(takerGot.value, takerPaid.value).toNumber();
            amount = fmNumber(takerPaid.value, 2);

            d1 = Decimal.add(takerGot.value, d1).toString();
            d2 = Decimal.add(takerPaid.value, d2).toString();
        } else {
            // volume = paid.value;
            exch = Decimal.div(takerPaid.value, takerGot.value).toNumber();
            amount = fmNumber(takerGot.value, 2);

            d1 = Decimal.add(takerPaid.value, d1).toString();
            d2 = Decimal.add(takerGot.value, d2).toString();
        }

        if (exch > prevExch) {
            color = '#007B55';
        } else {
            color = '#B72136';
        }

        prevLedger = ledger;

        const data = {
            _id,
            exch,
            amount,
            color,
            time
        };

        ctrades.push(data)
    }

    return ctrades.reverse();
}

export default function ExchHistory({pair, md5}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();

    const [tradeExchs, setTradeExchs] = useState([]);

    useEffect(() => {
        function getTradeExchanges() {
            if (!pair) return;
            // https://api.xrpl.to/api/last_trades?md5=b56a99b1c7d21a2bd621e3a2561f596b&issuer=XRPL&currency=XRP&limit=40
            axios.get(`${BASE_URL}/last_trades?md5=${md5}&issuer=${pair.curr2.issuer}&currency=${pair.curr2.currency}&limit=40`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTradeExchs(convertTrade(md5, ret.trades));
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getTradeExchanges();

        const timer = setInterval(getTradeExchanges, 10000);

        return () => {
            clearInterval(timer);
        }
    }, [pair]);

    return (
        <Stack>
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
                        <TableCell align="left" sx={{ p:0 }}>Price ({pair.curr2.name})</TableCell>
                        <TableCell align="left" colSpan={2} sx={{ p:0 }}>Amount ({pair.curr1.name})</TableCell>
                        <TableCell align="left" sx={{ p:0 }}>Time</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    tradeExchs.slice(0, 30).map((row) => {
                            const {
                                _id,
                                exch,
                                amount,
                                color,
                                time
                            } = row;

                            const nDate = new Date(time);

                            const hour = nDate.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
                            const min = nDate.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
                            const sec = nDate.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});

                            const strTime = `${hour}:${min}:${sec}`;
                            return (
                                <TableRow
                                    hover
                                    key={_id}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            color
                                        }
                                    }}
                                >
                                    <TableCell align="left" sx={{ p:0 }}>
                                        <Typography variant="subtitle2">{fNumber(exch)}</Typography>
                                    </TableCell>
                                    <TableCell align="left" colSpan={2} sx={{ p:0 }}>
                                        {amount}
                                    </TableCell>

                                    <TableCell align="left" sx={{ p:0 }}>
                                        <Stack>
                                            <Typography variant="subtitle2">{strTime}</Typography>
                                            {/* <Typography variant="caption">{strDate}</Typography> */}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        </Stack>
    );
}
