// material
import axios from 'axios'
import { useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    CardHeader,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import ExchHistToolbar from './ExchHistToolbar';
import { MD5 } from 'crypto-js';
// ----------------------------------------------------------------------
// utils
import { fNumber } from '../../utils/formatNumber';
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    backgroundColor: alpha("#919EAB", 0.03),
}));
// ----------------------------------------------------------------------
const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    backgroundColor: '#323546',
    borderRadius: '4px',
    padding: '2px 4px'
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

export default function ExchangeHistory({token}) {
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(5);
    const [count, setCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [exchs, setExchs] = useState([]);
    const theme = useTheme();
    const {
        acct,
        code,
        // md5
    } = token;
    const pair = getPair(acct, code);
    console.log(pair);

    useEffect(() => {
        function getExchanges() {
            // XPUNK
            // https://ws.xrpl.to/api/exchanges?pair=d12119be3c1749470903414dff032761&page=0&limit=5
            // SOLO
            // https://ws.xrpl.to/api/exchanges?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchanges?pair=${pair}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        setExchs(ret.exchs);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getExchanges();
    }, [page]);

    return (
        <StackStyle>
            <CardHeader title={<>
                Exchange History
                <span style={badge24hStyle}>24h</span>
                </>}  subheader='' sx={{p:2}}/>
            <Table stickyHeader sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider,
                    backgroundColor: alpha("#919EAB", 0)
                }
            }}>
                <TableHead>
                    <TableRow>
                        <TableCell align="left">PRICE</TableCell>
                        <TableCell align="left">VOLUME</TableCell>
                        <TableCell align="left">TIME</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    // exchs.slice(page * rows, page * rows + rows)
                    exchs.map((row) => {
                            const {
                                _id,
                                hash,
                                takerPaid,
                                takerGot,
                                date,
                                // maker,
                                // taker,
                                // seq,                                
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
                            //const year = nDate.getFullYear();
                            //const month = nDate.getMonth() + 1;
                            const day = nDate.getDate();
                            const hour = nDate.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const min = nDate.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const sec = nDate.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});

                            //const strTime = (new Date(time)).toLocaleTimeString('en-US', { hour12: false });
                            //const strTime = nDate.toISOString(); //nDate.format("YYYY-MM-DDTHH:mm:ss");
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
                                        <TableCell align="left">{fNumber(exch)}</TableCell>
                                        <TableCell align="left">{fNumber(value)}</TableCell>
                                        <TableCell align="left">{strTime} <span style={badge24hStyle}>{day}</span></TableCell>
                                    </TableRow>
                                </CopyToClipboard>
                            );
                        })}
                </TableBody>
            </Table>
            <ExchHistToolbar
                count={count}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />
        </StackStyle>
    );
}
