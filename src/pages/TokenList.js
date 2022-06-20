//import { filter } from 'lodash';
import axios from 'axios'
import { useState, useEffect } from 'react';
import { BeatLoader } from "react-spinners";
import { fNumber } from '../utils/formatNumber';
import { withStyles } from '@mui/styles';
import InfiniteScroll from "react-infinite-scroll-component";
import { alpha, styled, useTheme } from '@mui/material/styles';
import BearBullTypography from '../layouts/BearBullTypography';
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

import ScrollToTop from '../layouts/ScrollToTop';
import TopMark from '../layouts/TopMark';
import EditToken from './tokens/EditToken';

// Material
import {
    Avatar,
    Box,
    Container,
    Link,
    Stack,
    Table,
    TableRow,
    TableBody,
    TableCell,
    Typography
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";
// components
import PageList from '../layouts/PageList';
//import SearchNotFound from '../../components/SearchNotFound';
import { TokenListHead, TokenListToolbar, SearchToolbar, TokenMoreMenu, WidgetNew, WidgetSlug } from './tokens';
// ----------------------------------------------------------------------
import { useSelector, useDispatch } from "react-redux";
import { selectStatus, update_status } from "../redux/statusSlice";

import { useContext } from 'react'
import Context from '../Context'
// ----------------------------------------------------------------------

const ContentTypography = withStyles({
    root: {
        color: alpha('#919EAB', 0.99)
    }
})(Typography);

const TitleTypography = withStyles({
    root: {
        fontSize: '1.2rem'
    }
})(Typography);

const CoinNameTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

const CoinNameTypography1 = withStyles({
    root: {
        color: "#B72136"
    }
})(Typography);

const KYCTypography = withStyles({
    root: {
        color: "#34B60C",
        borderRadius: '6px',
        border: '0.05em solid #34B60C',
        fontSize: '0.6rem',
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const TokenImage = styled(Avatar)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
        opacity: 0.6
    },
}));

//    { id: 'holders', label: 'Holders', align: 'left', order: true },
//    { id: 'offers', label: 'Offers', align: 'left', order: true },

const TABLE_HEAD = [
    { no: 0, id: 'id', label: '#', align: 'left', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'left', order: true },
    { no: 3, id: 'pro24h', label: '24h (%)', align: 'left', order: true },
    { no: 4, id: 'pro7d', label: '7d (%)', align: 'left', order: true },
    { no: 5, id: 'vol24hxrp', label: 'Volume(24h)', align: 'left', order: true },
    { no: 6, id: 'vol24htx', label: 'Tx(24h)', align: 'left', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'left', order: true },
    { no: 8, id: 'trustlines', label: 'Trust Lines', align: 'left', order: true },
    { no: 9, id: 'amount', label: 'Total Supply', align: 'left', order: true },
];

function Rate(num, exch) {
    if (num === 0 || exch === 0)
        return 0;
    return fNumber(num / exch);
}

export default function TokenList() {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api'; // 'http://localhost/api';
    const { accountProfile } = useContext(Context);
    const dispatch = useDispatch();
    const [filterName, setFilterName] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    // -----------------------------------------------
    const [orderBy, setOrderBy] = useState('vol24hxrp');
    // -----------------------------------------------
    const [rows, setRows] = useState(100);
    const [showNew, setShowNew] = useState(false);
    const [showSlug, setShowSlug] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [offset, setOffset] = useState(0);
    const [load, setLoad] = useState(true);
    const [hasMore, setHasMore] = useState(false);

    const status = useSelector(selectStatus);

    const [editToken, setEditToken] = useState(null);

    const [showContent, setShowContent] = useState(false);

    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    useEffect(() => {
        const loadTokens=() => {
            // https://livenet.xrpl.org/api/v1/token/top
            // https://api.xrpl.to/api/tokens/-1
            // https://github.com/WietseWind/fetch-xrpl-transactions
            // https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24h&sortType=desc
            const start = page * rows + offset * 20;
            //console.log(`${offset} Load tokens from ${start+1}`);
            axios.get(`${BASE_URL}/tokens?start=${start}&limit=20&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}`)
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
                            filter_count: ret.filter_count,
                            transactions24H: ret.transactions24H,
                            tradedXRP24H: ret.tradedXRP24H,
                            tradedTokens24H: ret.tradedTokens24H,
                            timeCalc24H: ret.timeCalc24H,
                            timeSchedule: ret.timeSchedule,
                            countApiCall: ret.countApiCall,
                            timeTokens: ret.took
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
                // Always executed
                setSearch(filterName);
                setLoad(false);
            });
        };
        if (load) {
            loadTokens();
        } else {
            if (search !== filterName)
                loadTokens();
        }
    }, [load]);

    const handleRequestSort = (event, id, no) => {
        const isDesc = orderBy === id && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(id);
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

    const updateShowNew = (val) => {
        setShowNew(val);
        setPage(0);
        setOffset(0);
        setLoad(true);
    }

    const updateShowSlug = (val) => {
        setShowSlug(val);
        setPage(0);
        setOffset(0);
        setLoad(true);
    }

    const fetchMoreData = () => {
        if (tokens.length >= rows) {
            setHasMore(false);
            return;
        }
        setOffset(offset + 1);
        setLoad(true);
    };

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
        setPage(0);
        setOffset(0);
        setLoad(true);
    };

    return (
        <PageList title="XRPL Token Prices, Charts, Market Volume And Activity">
            {isAdmin &&
                <WidgetNew showNew={showNew} setShowNew={updateShowNew}/>
            }

            {isAdmin &&
                <WidgetSlug showSlug={showSlug} setShowSlug={updateShowSlug}/>
            }

            <Container maxWidth="xl">

            <TopMark md5={'NONE'}/>

            <Stack sx={{pl:2, pr:50, pt:4, pb:4}}>
                <TitleTypography variant='h1'>Today's XRPL Token Prices by Volume</TitleTypography>
                <Stack direction="row" sx={{mt:2}}>
                    <ContentTypography variant='subtitle1'>The global token market cap is $0.0B, a 0.0% decrease over the last day.</ContentTypography>
                    <Link
                        component="button"
                        underline="always"
                        variant="body2"
                        color="#637381"
                        onClick={() => {
                            setShowContent(!showContent);
                        }}
                    >
                        <ContentTypography variant='subtitle1' sx={{ml:1}}>{showContent?'Read Less':'Read More'}</ContentTypography>
                    </Link>
                </Stack>

                <div
                    style={{
                        display: showContent?"flex":"none",
                        flexDirection: "column",
                    }}
                >
                    <ContentTypography variant='subtitle1'>The total XRPL Dex volume over the last 24 hours is ${Rate(status.tradedXRP24H, status.USD)}, which makes a -% decrease. The total volume in DeFi is currently $-, -% of the total crypto market 24-hour volume. The volume of all stable coins is now $-, which is -% of the total token market 24-hour volume.</ContentTypography>
                    <ContentTypography variant='subtitle1'>XRP price is currently ${Rate(1, status.USD)}.</ContentTypography>
                    <ContentTypography variant='subtitle1'>XRP dominance is currently ---%, a decrease of -% over the day.</ContentTypography>
                </div>
                {/* Today's XRPL Token Prices by Volume
                The global token market cap is $890.88B, a 1.08% decrease over the last day.Read Less
                The total XRPL  Dex volume over the last 24 hours is $72.75B, which makes a 29.79% decrease. The total volume in DeFi is currently $5.21B, 7.16% of the total crypto market 24-hour volume. The volume of all stable coins is now $64.66B, which is 88.87% of the total token market 24-hour volume.
                XRP price is currently .30c
                XRP dominance is currently 99.01%, a decrease of 0.42% over the day.

                we won't be able to do some of these metrics

                Might be able to do "The volume of all stable coins is now $64.66B, which is 88.87% of the total token market 24-hour volume."

                by using the tag that I place on stablecoin tokens

                which is named "Stablecoin"

                eventually we're moving the search bar 

                to the NAV bar like CMC also. */}
            </Stack>

            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
            />

            <EditToken token={editToken} setToken={setEditToken}/>

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
                {/* <SearchStyle
                    value={filterName}
                    onChange={handleFilterByName}
                    placeholder="Search ..."
                    size="small"
                    startAdornment={
                        <InputAdornment position="start">
                            <Box component={Icon} icon={searchFill} sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                    }
                    sx={{pb:0.3}}
                /> */}
                <TokenListHead
                    order={order}
                    orderBy={orderBy}
                    headLabel={TABLE_HEAD}
                    onRequestSort={handleRequestSort}
                    rows={rows}
                    setRows={updateRows}
                />
                <TableBody>
                    {
                    //filteredTokens.slice(page * rows, page * rows + rows)
                    tokens.slice(0, rows)
                        .map((row) => {
                            const {
                                id,
                                // issuer,
                                name,
                                // currency,
                                date,
                                amount,
                                trustlines,
                                vol24hxrp, // XRP amount with pair token
                                vol24hx, // Token amount with pair XRP
                                //vol24h,
                                vol24htx,
                                //holders,
                                //offers,
                                kyc,
                                md5,
                                urlSlug,
                                user,
                                pro7d,
                                pro24h,
                                exch,
                                imgExt
                            } = row;

                            const imgUrl = `/static/tokens/${md5}.${imgExt}`;

                            const marketcap = amount * exch / status.USD;

                            let date_fixed = '';
                            try {
                                if (date) {
                                    date_fixed = date.split('T')[0];
                                }
                            } catch (e) { }

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
                                >
                                    <TableCell align="left">{id}</TableCell>
                                    <TableCell component="th" scope="row" padding="none">
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            {isAdmin ? (
                                                <TokenImage alt={name} src={imgUrl} onClick={() => setEditToken(row)} />
                                            ):(
                                                <Avatar alt={name} src={imgUrl} />
                                            )}
                                            <Stack>
                                            
                                                <Link
                                                    underline="none"
                                                    color="inherit"
                                                    href={`token/${urlSlug}`}
                                                >
                                                    {isAdmin && urlSlug === md5 ? (
                                                        <CoinNameTypography1 variant="h6" noWrap>{name}</CoinNameTypography1>
                                                    ):(
                                                        <CoinNameTypography variant="h6" noWrap>{name}</CoinNameTypography>
                                                    )
                                                    }
                                                </Link>
                                                <Stack direction="row" alignItems="center" spacing={0.2}>
                                                    <Typography variant="caption">
                                                        {user}
                                                        {kyc && (
                                                            <KYCTypography variant="caption">
                                                            KYC
                                                            </KYCTypography>
                                                        )}
                                                    </Typography>
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
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                <Icon icon={rippleSolid} />
                                                <Typography variant="subtitle1" noWrap>{fNumber(vol24hxrp)}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                {/* <Icon icon={outlineToken} color="#0C53B7"/> */}
                                                <Icon icon={arrowsExchange} color="#0C53B7" width="16" height="16"/>
                                                <Typography variant="subtitle1" color="#0C53B7">{fNumber(vol24hx)}</Typography>
                                            </Stack>
                                            
                                            {/* <Typography variant="caption">
                                                <Stack direction="row" alignItems='center'>
                                                    {name}
                                                    <Icon icon={arrowsExchange} width="16" height="16"/>
                                                    XRP
                                                </Stack>
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
                                    <TableCell align="left">{trustlines}</TableCell>
                                    <TableCell align="left">{fNumber(amount)} <Typography variant="caption" noWrap>{name}</Typography></TableCell>
                                    <TableCell align="left">
                                        {/* {Str(issuer).limit(10, '...').get()} */}
                                        <Box
                                            component="img"
                                            alt=""
                                            sx={{ maxWidth: 'none' }}
                                            src={`${BASE_URL}/sparkline/${md5}`}
                                        />
                                    </TableCell>
                                    {/*
                                    <a href={`https://bithomp.com/explorer/${issuer}`} target="_blank" rel="noreferrer noopener"> 
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
                                        <TokenMoreMenu token={row} setEditToken={setEditToken} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    {/* {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )} */}
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
        </PageList>
    );
}
