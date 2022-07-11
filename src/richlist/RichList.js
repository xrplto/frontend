import axios from 'axios'
import { useState, useEffect } from 'react';

// Material
import { /*alpha,*/ styled, useTheme } from '@mui/material/styles';
import { withStyles } from '@mui/styles';
import {
    Avatar,
    FormControl,
    IconButton,
    InputLabel,
    Link,
    MenuItem,
    Select,
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

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';

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

// function getPair(issuer, currency) {
//     // issuer, currency, 'XRP', undefined
//     const t1 = 'undefined_XRP';
//     const t2 = issuer  + '_' +  currency;
//     let pair = t1 + t2;
//     if (t1.localeCompare(t2) > 0)
//         pair = t2 + t1;
//     return MD5(pair).toString();
// }

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

export default function RichList({data}) {
    const EPOCH_OFFSET = 946684800;
    const BASE_URL = 'https://api.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [richList, setRichList] = useState(data?data.richList:[]);
    const theme = useTheme();
    const {
        issuer,
        currency,
        // md5
    } = data.token;

    // useEffect(() => {
    //     function getExchanges() {
    //         if (!pair) return;
    //         // XPUNK
    //         // https://api.xrpl.to/api/exchs?pair=d12119be3c1749470903414dff032761&page=0&limit=5
    //         // SOLO
    //         // https://api.xrpl.to/api/exchs?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
    //         axios.get(`${BASE_URL}/exchs?pair=${pair.pair}&page=${page}&limit=${rows}`)
    //             .then(res => {
    //                 let ret = res.status === 200 ? res.data : undefined;
    //                 if (ret) {
    //                     //setCount(ret.count);
    //                     let exs = [];
    //                     let i = 0;
    //                     for (var ex of ret.exchs) {
    //                         ex.id = i + page * rows + 1;
    //                         //exs.push(ex);
    //                         i++;
    //                     }
    //                     //setExchs(exs);
    //                 }
    //             }).catch(err => {
    //                 console.log("Error on getting exchanges!!!", err);
    //             }).then(function () {
    //                 // always executed
    //             });
    //     }
    //     getExchanges();

    //     const timer = setInterval(() => getExchanges(), 10000);

    //     return () => {
    //         clearInterval(timer);
    //     }
    // }, [page, rows]);

    return (
        <StackStyle>
            <Table stickyHeader sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TableHead>
                    <TableRow>
                        <TableCell align="left">#</TableCell>
                        <TableCell align="left">Address</TableCell>
                        <TableCell align="left">Frozen</TableCell>
                        <TableCell align="left">Balance</TableCell>
                        <TableCell align="left">Holding</TableCell>
                        <TableCell align="left">Value</TableCell>
                        <TableCell align="left">LINKS</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    // exchs.slice(page * rows, page * rows + rows)
                    richList.map((row) => {
                            const {
                                id,
                                account,
                                freeze,
                                Balance,
                                holding,
                            } = row;
                            
                            return (
                                <TableRow
                                    hover
                                    key={id}
                                    tabIndex={-1}
                                    // sx={{
                                    //     [`& .${tableCellClasses.root}`]: {
                                    //         color: (/*buy*/dir === 'sell' ? '#007B55' : '#B72136')
                                    //     }
                                    // }}
                                >
                                    <TableCell align="left"><Typography variant="subtitle2">{id}</Typography></TableCell>
                                    <TableCell align="left"><Typography variant="subtitle2">{account}</Typography></TableCell>
                                    <TableCell align="left"><Typography variant="subtitle2">{freeze?'YES':''}</Typography></TableCell>
                                    <TableCell align="left"><Typography variant="subtitle2">{fNumber(Balance)}</Typography></TableCell>
                                    <TableCell align="left"><Typography variant="subtitle2">{fPercent(holding)} %</Typography></TableCell>
                                    <TableCell align="left"><Typography variant="subtitle2">AV</Typography></TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" alignItems='center'>
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="bithomp">
                                                    <Avatar alt="livenetxrplorg" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                </IconButton>
                                            </Link>

                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://livenet.xrpl.org/accounts/${account}`}
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
