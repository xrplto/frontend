//import { filter } from 'lodash';
import { useState, useEffect } from 'react';
import { BeatLoader } from "react-spinners";
import { fNumber } from '../utils/formatNumber';
import { withStyles } from '@mui/styles';
import { Link } from 'react-router-dom'
import InfiniteScroll from "react-infinite-scroll-component";
import ScrollToTop from '../layouts/ScrollToTop';
import TopMark from '../layouts/TopMark';
import {/*styled, alpha,*/ useTheme } from '@mui/material/styles';
import BearBullTypography from '../layouts/BearBullTypography';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// material
import {
    Avatar,
    Box,
    Container,
    Stack,
    Table,
    TableRow,
    TableBody,
    TableCell,
    Typography
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";
// components
import Page from '../layouts/Page';
//import SearchNotFound from '../../components/SearchNotFound';
import { TokenListHead, TokenListToolbar, SearchToolbar, TokenMoreMenu } from './tokens';

// ----------------------------------------------------------------------
import axios from 'axios'

import { useSelector, useDispatch } from "react-redux";
import { selectStatus, update_status } from "../redux/statusSlice";
// ----------------------------------------------------------------------

const CoinNameTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

const KYCTypography = withStyles({
    root: {
        color: "#34B60C",
        borderRadius: '6px',
        border: '0.05em solid #34B60C',
        //fontSize: '0.5rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

//    { id: 'holders', label: 'Holders', align: 'left', order: true },
//    { id: 'offers', label: 'Offers', align: 'left', order: true },

const TABLE_HEAD = [
    { no: 0, id: 'id', label: '#', align: 'left', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'left', order: true },
    { no: 3, id: 'pro24h', label: '24h (%)', align: 'left', order: true },
    { no: 4, id: 'pro7d', label: '7d (%)', align: 'left', order: true },
    { no: 5, id: 'vol24h', label: 'Volume(24h)', align: 'left', order: true },
    { no: 6, id: 'vol24htx', label: 'Tx(24h)', align: 'left', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'left', order: true },
    { no: 8, id: 'trline', label: 'Trust Lines', align: 'left', order: true },
    { no: 9, id: 'amt', label: 'Total Supply', align: 'left', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false },
    { id: '' }
];

// ----------------------------------------------------------------------
// function descendingComparator(a, b, orderBy) {
//     if (b[orderBy] < a[orderBy]) {
//         return -1;
//     }
//     if (b[orderBy] > a[orderBy]) {
//         return 1;
//     }
//     return 0;
// }

// function getComparator(order, orderBy) {
//     return order === 'desc'
//         ? (a, b) => descendingComparator(a, b, orderBy)
//         : (a, b) => -descendingComparator(a, b, orderBy);
// }

// function applySortFilter(array, comparator, query) {
//     const stabilizedThis = array.map((el, index) => [el, index]);
//     stabilizedThis.sort((a, b) => {
//         const order = comparator(a[0], b[0]);
//         if (order !== 0) return order;
//         return a[1] - b[1];
//     });
//     if (query) {
//         return filter(array, (_token) => _token.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
//     }
//     /*let idx = 1;
//     const res = stabilizedThis.map((el) => {
//         el[0].id = idx++;
//         return el[0];
//     });
//     return res;*/
//     return stabilizedThis.map((el) => el[0]);
// }

export default function Token() {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api'; // 'http://localhost/api';
    const dispatch = useDispatch();
    const [filterName, setFilterName] = useState('');
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    // -----------------------------------------------
    const [orderBy, setOrderBy] = useState('vol24h');
    const [selHead, setSelHead] = useState(5);
    // -----------------------------------------------
    const [rows, setRows] = useState(100);
    const [tokens, setTokens] = useState([]);
    const [offset, setOffset] = useState(0);
    const [load, setLoad] = useState(true);
    const [hasMore, setHasMore] = useState(false);

    const status = useSelector(selectStatus);

    useEffect(() => {
        const loadTokens=() => {
            // https://livenet.xrpl.org/api/v1/token/top
            // https://api.xrpl.to/api/tokens/-1
            // https://github.com/WietseWind/fetch-xrpl-transactions
            // https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24h&sortType=desc
            const start = page * rows + offset * 20;
            //console.log(`${offset} Load tokens from ${start+1}`);
            axios.get(`${BASE_URL}/tokens?start=${start}&limit=20&sortBy=${orderBy}&sortType=${order}&filter=${filterName}`)
            .then(res => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        const exch = ret.exch;
                        //console.log(ret);
                        const status = {
                            session: 0,
                            USD: exch.USD,
                            EUR: exch.EUR,
                            JPY: exch.JPY,
                            CNY: exch.CNY,
                            token_count: ret.token_count,
                            transactions24H: ret.transactions24H,
                            tradedUSD24H: ret.tradedUSD24H,
                            tradedXRP24H: ret.tradedXRP24H,
                            tradedTokens24H: ret.tradedTokens24H,
                        };
                        dispatch(update_status(status));
                        let newTokens;
                        if (offset === 0) {
                            newTokens = ret.tokens;
                            setHasMore(true);
                        } else {
                            newTokens = tokens.concat(ret.tokens);
                        }
                        setTokens(newTokens);
    
                        if (ret.tokens.length < 20)
                            setHasMore(false);
    
                        if (newTokens.length >= rows)
                            setHasMore(false);
                    }
                } catch (error) {
                    console.log(error);
                }
            }).catch(err => {
                console.log("err->>", err);
            }).then(function () {
                // always executed
            });
        };
        if (load) {
            setLoad(false);
            loadTokens();
        }
    }, [load]);
    
    const handleRequestSort = (event, id, no) => {
        const isDesc = orderBy === id && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(id);
        setSelHead(no);
        setOffset(0);
        setPage(0);
        setLoad(true);
    };

    const updatePage = (newPage)  => {
        if (newPage === page) return;
        setOffset(0);
        setPage(newPage);
        setLoad(true);
    }

    const updateRows = (newRows) => {
        if (newRows === rows) return;
        setRows(newRows);
        if (tokens.length < newRows)
            setHasMore(true);
    }

    const fetchMoreData = () => {
        if (tokens.length >= rows) {
            setHasMore(false);
            return;
        }
        setOffset(offset + 1);
        setLoad(true);
    };

    const emptyRows = 0;//Math.max(0, rows - tokens.length);//page > 0 ? Math.max(0, (1 + page) * rows - tokens.length) : 0;

    const filteredTokens = tokens; // applySortFilter(tokens, getComparator(order, orderBy), filterName);

    //const isTokenNotFound = filteredTokens.length === 0;

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
        setPage(0);
        setOffset(0);
        setLoad(true);
    };

    // style={{border: '1px solid red'}}

    return (
        <Page title="XRPL Token Prices, Charts, Market Volume And Transaction Activity">
            <Container maxWidth="xl">

            <TopMark md5={'NONE'}/>

            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
                rows={rows}
                setRows={updateRows}
            />
            <InfiniteScroll
                style={{overflow: "inherit"}}
                dataLength={tokens.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={
                    <div style={{display: "flex",justifyContent:"center",paddingTop:"10px"}}>
                        <BeatLoader color={"#00AB55"} size={10} />
                    </div>
                }
            >
                {/* 1px solid rgba(46, 50, 54, 1) 2E3236*/}
            <Table stickyHeader sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "1px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TokenListHead
                    order={order}
                    orderBy={orderBy}
                    headLabel={TABLE_HEAD}
                    onRequestSort={handleRequestSort}
                />
                <TableBody>
                    {
                    //filteredTokens.slice(page * rows, page * rows + rows)
                    filteredTokens.slice(0, rows)
                        .map((row) => {
                            const {
                                id,
                                acct,
                                name,
                                code,
                                date,
                                amt,
                                trline,
                                vol24h,
                                //vol24hamt,
                                vol24htx,
                                //holders,
                                //offers,
                                pairXRP,
                                kyc,
                                md5,
                                user,
                                pro7d,
                                pro24h,
                                exch } = row;

                            const imgUrl = `/static/tokens/${name.replace(/[^a-zA-Z0-9]/g, "")}.jpg`;

                            const isItemSelected = false;//selected.indexOf(id) !== -1;

                            const marketcap = amt * exch / status.USD;

                            const detail = id.toString(16).padStart(5, '0') + selHead.toString(16).padStart(2, '0');
                            
                            let date_fixed = '';
                            try {
                                if (date) {
                                    date_fixed = date.split('T')[0];
                                }
                            } catch (e) { }

                            /* "pairXRP": [1494231.0359380918, 1152170.3078069987] */

                            let tradedAmountWithXRP = 0;
                            if (pairXRP)
                                tradedAmountWithXRP = pairXRP[0];

                            /*const uri = [id, orderBy];
                            const encodedUri = Buffer.from(encode(uri)).toString('hex');
                            console.log("encodedUri", encodedUri);
                            const decoded = decode(Buffer.from(encodedUri, 'hex'))
                            console.log('decoded:', decoded)
                            //console.log('encoded:', encode(decoded))
                            //console.log('encoded (string):', Buffer.from(encode(decoded)).toString())*/
                            return (
                                <TableRow
                                    hover
                                    key={id}
                                    tabIndex={-1}
                                    role="checkbox"
                                    selected={isItemSelected}
                                    aria-checked={isItemSelected}
                                >
                                    {/* <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={isItemSelected}
                                        onChange={(event) => handleClick(event, id)}
                                    />
                                    </TableCell> */}
                                    <TableCell align="left">{id}</TableCell>
                                    <TableCell component="th" scope="row" padding="none">
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar alt={name} src={imgUrl} />
                                            <Stack>
                                                <Link
                                                    style={{ textDecoration: 'none' }}
                                                    underline="hover"
                                                    color="inherit"
                                                    to={`detail/${detail}${md5}`}
                                                    onClick={() => { localStorage.setItem("selectToken", JSON.stringify(row)); }}
                                                >
                                                    <CoinNameTypography variant="h6" noWrap>
                                                        {name}
                                                    </CoinNameTypography>
                                                </Link>
                                                <Stack direction="row" alignItems="center" spacing={0.2}>
                                                    <Typography variant="caption">
                                                        {user}
                                                    </Typography>
                                                    {kyc && (
                                                        <KYCTypography variant="caption">
                                                        KYC
                                                        </KYCTypography>
                                                    )}
                                                </Stack>
                                                <Typography variant="caption">
                                                    {date_fixed}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                            <Typography variant="subtitle1" noWrap>
                                                $ {fNumber(exch / status.USD)}
                                            </Typography>
                                            <Typography variant="caption">
                                                {fNumber(exch)} XRP
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <BearBullTypography value={pro24h} variant="subtitle1" />
                                    </TableCell>
                                    <TableCell align="left">
                                        <BearBullTypography value={pro7d} variant="subtitle1" />
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                            <Typography variant="subtitle1" noWrap>
                                                ${fNumber(vol24h)}
                                            </Typography>
                                            <Typography variant="subtitle1" color="#0C53B7">
                                                <Stack>
                                                    {fNumber(tradedAmountWithXRP)}
                                                    <Typography variant="caption">
                                                        <Stack direction="row" alignItems='center'>
                                                            {name}
                                                            <Icon icon={arrowsExchange} width="16" height="16"/>
                                                            XRP
                                                        </Stack>
                                                    </Typography>
                                                </Stack>
                                            </Typography>
                                            {/* <Typography variant="caption">
                                                {fNumber(vol24hamt)} {name}
                                            </Typography> */}
                                            {/* <Typography variant="caption">
                                                {fNumber(vol24htx)} tx
                                            </Typography> */}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">{fNumber(vol24htx)}</TableCell>
                                    <TableCell align="left">$ {fNumber(marketcap)}</TableCell>
                                    {/* <TableCell align="left">{holders}</TableCell>
                                    <TableCell align="left">{offers}</TableCell> */}
                                    <TableCell align="left">{trline}</TableCell>
                                    <TableCell align="left">{fNumber(amt)} <Typography variant="caption" noWrap>{name}</Typography></TableCell>
                                    <TableCell align="left">
                                        {/* {Str(acct).limit(10, '...').get()} */}
                                        <Box
                                            component="img"
                                            alt=""
                                            sx={{ maxWidth: 'none' }}
                                            src={`${BASE_URL}/sparkline/${md5}`}
                                        />
                                    </TableCell>
                                    {/*
                                    <a href={`https://bithomp.com/explorer/${acct}`} target="_blank" rel="noreferrer noopener"> 
                                    </a>
                                    <TableCell align="left">{price}</TableCell>
                                    <TableCell align="left">{dailypercent}</TableCell>
                                    <TableCell align="left">{marketcap}</TableCell>
                                    <TableCell align="left">{holders}</TableCell>
                                    <TableCell align="left">{role}</TableCell>
                                    <TableCell align="left">{isVerified ? 'Yes' : 'No'}</TableCell>
                                    <TableCell align="left">
                                    <Label
                                        variant="ghost"
                                        color={(status === 'kyc' && 'error') || 'success'}
                                    >
                                        {sentenceCase(status)}
                                    </Label>
                                    </TableCell> */}

                                    <TableCell align="right">
                                        <TokenMoreMenu acct={acct} currency={code} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                </TableBody>
                {/*isTokenNotFound && (
                    <TableBody>
                        <TableRow>
                            <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                                    <SearchNotFound searchQuery={filterName} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                )*/}
            </Table>
            </InfiniteScroll>
            <TokenListToolbar
                rows={rows}
                setRows={updateRows}
                page={page}
                setPage={updatePage}
            />
            <ScrollToTop />
            </Container>
        </Page>
    );
}
