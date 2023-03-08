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

export default function ExchHistory({pair, md5}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();

    const [tradeExchs, setTradeExchs] = useState([]);

    useEffect(() => {
        function getTradeExchanges() {
            if (!pair) return;
            const page = 0;
            const rows = 30;
            // SOLO
            // https://api.xrpl.to/api/last_trades?md5=ekfjlk&pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/last_trades?md5=${md5}&issuer=${pair.curr2.issuer}&currency=${pair.curr2.currency}&limit=30`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTradeExchs(ret.trades);
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
                    tradeExchs.map((row) => {
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
                                time,
                                cancel,
                                // pair,
                                // xUSD
                            } = row;

                            const paidName = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                            const gotName = normalizeCurrencyCodeXummImpl(takerGot.currency);
                            const md51 = getMD5(takerPaid.issuer, takerPaid.currency);
                            
                            let exch;
                            let name;
                            let amount;
                            let type;
                            // const md52 = getMD5(got.issuer, got.currency);
                            if (md5 === md51) {
                                // volume = got.value;
                                exch = Decimal.div(takerGot.value, takerPaid.value).toNumber();
                                name = gotName;
                                amount = fmNumber(takerPaid.value, 2);
                                type = dir==='buy'?'buy':'sell';
                            } else {
                                // volume = paid.value;
                                exch = Decimal.div(takerPaid.value, takerGot.value).toNumber();
                                name = paidName;
                                amount = fmNumber(takerGot.value, 2);
                                type = dir==='buy'?'sell':'buy';
                            }
                            
                            const nDate = new Date(time);
                            // const year = nDate.getFullYear();
                            // const month = nDate.getMonth() + 1;
                            // const day = nDate.getDate();
                            const hour = nDate.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const min = nDate.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const sec = nDate.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});

                            // const strTime = (new Date(date)).toLocaleTimeString('en-US', { hour12: false });
                            // const strTime = nDate.format("YYYY-MM-DD HH:mm:ss");
                            // const strDate = `${year}-${month}-${day}`;
                            const strTime = `${hour}:${min}:${sec}`;

                            // const namePaid = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                            // const nameGot = normalizeCurrencyCodeXummImpl(takerGot.currency);

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
                                    <TableCell align="left" sx={{ p:0 }}>
                                        <Typography variant="subtitle2">{fNumber(exch)}</Typography>
                                    </TableCell>
                                    <TableCell align="left" colSpan={2} sx={{ p:0 }}>
                                        {amount}
                                    </TableCell>

                                    {/* <TableCell align="left" sx={{ p:0 }}>
                                        {new Decimal(vPaid).toFixed(2, Decimal.ROUND_DOWN)} <Typography variant="small">{namePaid}</Typography>
                                    </TableCell>

                                    <TableCell align="left" sx={{ p:0 }}>
                                        {new Decimal(vGot).toFixed(2, Decimal.ROUND_DOWN)} <Typography variant="small">{nameGot}</Typography>
                                    </TableCell> */}

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
