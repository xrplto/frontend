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
    TableSortLabel,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Components
import HistoryToolbar from './HistoryToolbar';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
import checkIcon from '@iconify/icons-akar-icons/check';

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
    const metrics = useSelector(selectMetrics);
    const BASE_URL = 'https://api.xrpl.to/api';
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [frozen, setFrozen] = useState(false);
    const [count, setCount] = useState(0);
    const [richList, setRichList] = useState([]);
    const theme = useTheme();
    const {
        issuer,
        currency,
        name,
        exch,
        urlSlug
    } = data.token;

    useEffect(() => {
        function getRichList() {
            console.log('getRichList');
            // https://api.xrpl.to/api/richlist/xrdoge-classic-xrdc?start=0&limit=100&freeze=false
            axios.get(`${BASE_URL}/richlist/${urlSlug}?start=${page * rows}&limit=${rows}&freeze=${frozen}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.length);
                        setRichList(ret.richList);
                    }
                }).catch(err => {
                    console.log("Error on getting richlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getRichList();
    }, [page, rows, frozen]);

    const onChangeFrozen = (e) => {
        setFrozen(!frozen);
    }

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
                        <TableCell align="left">
                            <Link
                                component="button"
                                underline="hover"
                                variant="body2"
                                color="inherit"
                                onClick={onChangeFrozen}
                            >
                                Frozen ({frozen?'YES':'ALL'})
                            </Link>
                        </TableCell>
                        <TableCell align="left">Balance({name})</TableCell>
                        <TableCell align="left">Holding</TableCell>
                        <TableCell align="left">Value</TableCell>
                        <TableCell align="left"></TableCell>
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
                                    <TableCell align="left">
                                        <Typography variant="subtitle1">{id}</Typography>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Link
                                            underline="none"
                                            color="inherit"
                                            target="_blank"
                                            href={`https://bithomp.com/explorer/${account}`}
                                            rel="noreferrer noopener nofollow"
                                        >
                                            <Typography variant="subtitle1">{truncate(account, 20)}</Typography>
                                        </Link>
                                    </TableCell>
                                    <TableCell align="left">
                                        {freeze && <Icon icon={checkIcon}/>}
                                    </TableCell>
                                    <TableCell align="left">
                                        <Typography variant="subtitle1">{fNumber(Balance)}</Typography>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Typography variant="subtitle1">{fPercent(holding)} %</Typography>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                        <Typography variant="h4" noWrap>$ {fNumber(exch * Balance / metrics.USD)}</Typography>
                                        <Stack direction="row" spacing={0.5} alignItems='center'>
                                            <Icon icon={rippleSolid} width='12' height='12'/>
                                            <Typography variant="subtitle1" noWrap>{fNumber(exch * Balance)}</Typography>
                                        </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" alignItems='center' spacing={2}>
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="bithomp">
                                                    <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 20, height: 20 }} />
                                                </IconButton>
                                            </Link>

                                            <Link
                                                underline="none"
                                                color="inherit"
                                                target="_blank"
                                                href={`https://livenet.xrpl.org/accounts/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <IconButton edge="end" aria-label="livenetxrplorg">
                                                    <Avatar alt="livenetxrplorg" src="/static/livenetxrplorg.ico" sx={{ width: 20, height: 20 }} />
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
