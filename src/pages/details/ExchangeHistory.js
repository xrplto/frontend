// material
import axios from 'axios'
import { withStyles } from '@mui/styles';
import { useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {
    CardHeader,
    Stack,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import ExchHistToolbar from './ExchHistToolbar';
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
export default function ExchangeHistory({token}) {
    const BASE_URL = 'https://ws.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(5);
    const [count, setCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [exchs, setExchs] = useState([]);
    const theme = useTheme();
    const {md5} = token;

    useEffect(() => {
        function getExchanges() {
            // https://ws.xrpl.to/api/exchanges?md5=8c1e704bfcf7fd53e9d3b00eab33fc86&page=0&limit=5
            // https://ws.xrpl.to/api/exchanges?md5=6f1c543940088df14d343b2648b656a2&page=0&limit=5
            axios.get(`${BASE_URL}/exchanges?md5=${md5}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        setExchs(ret.exchs);
                    }
                }).catch(err => {
                    console.log("error on getting details!!!", err);
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
                                amount,
                                exch,
                                time,
                                hash,
                                /*account,
                                dest,
                                code,
                                amt,                                
                                xusd,
                                issuer,
                                seq,
                                md5,*/
                                } = row;
                            const date = new Date(time);
                            //const year = date.getFullYear();
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const hour = date.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const min = date.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});
                            const sec = date.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2,useGrouping: false});

                            //const strTime = (new Date(time)).toLocaleTimeString('en-US', { hour12: false });
                            //const strTime = date.toISOString(); //date.format("YYYY-MM-DDTHH:mm:ss");
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
                                    >
                                        <TableCell align="left">{fNumber(exch)}</TableCell>
                                        <TableCell align="left">{fNumber(amount)}</TableCell>
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
