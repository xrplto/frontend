import axios from 'axios'
import { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import { styled, useTheme } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Components
import EditToken from './EditToken';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import TokenMoreMenu from './TokenMoreMenu';
import WidgetNew from './WidgetNew';
import WidgetSlug from './WidgetSlug';
import BearBullLabel from 'src/layouts/BearBullLabel';


// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';
// ----------------------------------------------------------------------

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
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
    { no: 8, id: 'trustlines', label: 'TrustLines', align: 'left', order: true },
    { no: 9, id: 'amount', label: 'Total Supply', align: 'left', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false },
    { id: '' }
];

export default function TokenTable({data}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile } = useContext(AppContext);
    const metrics = useSelector(selectMetrics);
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
    const [tokens, setTokens] = useState(data?data.tokens:[]);
    const [load, setLoad] = useState(false);
    const [editToken, setEditToken] = useState(null);

    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    useEffect(() => {
        const loadTokens=() => {
            // https://livenet.xrpl.org/api/v1/token/top
            // https://api.xrpl.to/api/tokens/-1
            // https://github.com/WietseWind/fetch-xrpl-transactions
            // https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc
            const start = page * rows;
            axios.get(`${BASE_URL}/tokens?start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}`)
            .then(res => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        const exch = ret.exch;
                        //console.log(ret);
                        const metrics = {
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
                        dispatch(update_metrics(metrics));
                        setTokens(ret.tokens);
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
        setPage(0);
        setLoad(true);
    };

    const updatePage = (newPage)  => {
        if (newPage === page) return;
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
        setLoad(true);
    }

    const updateShowSlug = (val) => {
        setShowSlug(val);
        setPage(0);
        setLoad(true);
    }

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
        setPage(0);
        setLoad(true);
    };

    return (
        <>
            {isAdmin && <WidgetNew showNew={showNew} setShowNew={updateShowNew}/>}
            {isAdmin && <WidgetSlug showSlug={showSlug} setShowSlug={updateShowSlug}/>}
            <EditToken token={editToken} setToken={setEditToken}/>

            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
                rows={rows}
                setRows={updateRows}
            />
            <Table stickyHeader sx={{pl:2.3, pr:2.3}}>
                <TokenListHead
                    order={order}
                    orderBy={orderBy}
                    headLabel={TABLE_HEAD}
                    onRequestSort={handleRequestSort}
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

                            const marketcap = amount * exch / metrics.USD;

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
                                            <Avatar sx={{ width: 56, height: 56 }}>
                                            {isAdmin ? (
                                                <TokenImage
                                                    alt={name}
                                                    src={imgUrl} // use normal <img> attributes as props
                                                    width={56}
                                                    height={56}
                                                    onClick={() => setEditToken(row)}
                                                />
                                            ):(
                                                <LazyLoadImage
                                                    alt={name}
                                                    src={imgUrl} // use normal <img> attributes as props
                                                    width={56}
                                                    height={56}
                                                />                                                
                                            )}
                                            </Avatar>
                                            
                                            <Link
                                                underline="none"
                                                color="inherit"
                                                href={`token/${urlSlug}`}
                                            >
                                            <Stack>
                                                {isAdmin && urlSlug === md5 ? (
                                                    <Typography variant="token" color='#B72136' noWrap>{name}</Typography>
                                                ):(
                                                    <Typography variant="token" noWrap>{name}</Typography>
                                                )
                                                }
                                                <Stack direction="row" alignItems="center" spacing={0.1}>
                                                    <Typography variant="caption">
                                                        {user}
                                                        {kyc && (<Typography variant='kyc'>KYC</Typography>)}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="small">
                                                    {date_fixed}
                                                </Typography>
                                            </Stack>
                                            </Link>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                            <Typography variant="h4" noWrap>
                                                $ {fNumber(exch / metrics.USD)}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                <Icon icon={rippleSolid} width={12} height={12}/>
                                                <Typography variant="h6" noWrap>{fNumber(exch)}</Typography>
                                            </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <BearBullLabel value={pro24h} variant="h4" />
                                    </TableCell>
                                    <TableCell align="left">
                                        <BearBullLabel value={pro7d} variant="h4" />
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack>
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                <Icon icon={rippleSolid} />
                                                <Typography variant="h4" noWrap>{fNumber(vol24hxrp)}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                                {/* <Icon icon={outlineToken} color="#0C53B7"/> */}
                                                <Icon icon={arrowsExchange} color="#0C53B7" width="16" height="16"/>
                                                <Typography variant="h5" color="#0C53B7">{fNumber(vol24hx)}</Typography>
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
                                    <TableCell align="left">{fNumber(amount)} <Typography variant="small" noWrap>{name}</Typography></TableCell>
                                    <TableCell align="left">
                                        {/* {Str(issuer).limit(10, '...').get()} */}
                                        {/* <Box
                                            component="img"
                                            alt=""
                                            sx={{ maxWidth: 'none' }}
                                            src={`${BASE_URL}/sparkline/${md5}`}
                                        /> */}
                                        <LazyLoadImage
                                            alt=''
                                            src={`${BASE_URL}/sparkline/${md5}`}
                                            width={135}
                                            height={50}
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
            <TokenListToolbar
                rows={rows}
                setRows={updateRows}
                page={page}
                setPage={updatePage}
            />
        </>
    );
}
