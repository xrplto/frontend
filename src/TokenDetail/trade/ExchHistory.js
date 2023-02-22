import axios from 'axios';
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
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

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

export default function ExchHistory({pair}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const theme = useTheme();
    const EPOCH_OFFSET = 946684800;

    const [tradeExchs, setTradeExchs] = useState([]);

    useEffect(() => {
        function getTradeExchanges() {
            if (!pair) return;
            const page = 0;
            const rows = 30;
            // SOLO
            // https://api.xrpl.to/api/exchs?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchs?pair=${pair.pair}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTradeExchs(ret.exchs);
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

    // {
    //     "pair": "fa99aff608a10186d3b1ff33b5cd665f",
    //     "curr1": {
    //         "currency": "534F4C4F00000000000000000000000000000000",
    //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
    //         "value": 1170095.762918316,
    //         "md5": "0413ca7cfc258dfaf698c02fe304e607",
    //         "name": "SOLO"
    //     },
    //     "curr2": {
    //         "currency": "XRP",
    //         "issuer": "XRPL",
    //         "value": 873555.2630949989,
    //         "md5": "84e5efeb89c4eae8f68188982dc290d8",
    //         "name": "XRP"
    //     },
    //     "count": 2678,
    //     "id": 1
    // }

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
                                date,
                                cancel,
                                // pair,
                                // xUSD
                            } = row;
                            const curr1 = pair.curr1;
                            const curr2 = pair.curr2;
                            
                            const vPaid = takerPaid.value;
                            const vGot = takerGot.value;

                            let exch;
                            let amount;
                            // let buy;
                            if (takerPaid.issuer === curr1.issuer && takerPaid.currency === curr1.currency) {
                                // SELL, Red
                                exch = vGot / vPaid;
                                amount = vPaid;
                                // buy = false;
                            } else {
                                // BUY, Green
                                exch = vPaid / vGot;
                                amount = vGot;
                                // buy = true;
                            }

                            amount = fmNumber(amount, 2);

                            // if (sumAmount.toString().length > 8)
                            //     sumAmount = expo(sumAmount, 2);
                            
                            const nDate = new Date((date + EPOCH_OFFSET) * 1000);
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

                            const namePaid = normalizeCurrencyCodeXummImpl(takerPaid.currency);
                            const nameGot = normalizeCurrencyCodeXummImpl(takerGot.currency);

                            //const namePaid = '';
                            //const nameGot = '';

                            return (
                                <TableRow
                                    hover
                                    key={_id}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            color: (cancel ? '#FFC107': (dir === 'sell' ? '#007B55' : '#B72136'))
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
