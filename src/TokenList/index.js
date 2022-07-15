import axios from 'axios'
import { useState, useEffect } from 'react';
import { BeatLoader } from "react-spinners";
import InfiniteScroll from "react-infinite-scroll-component";

// Material
import { styled, useTheme } from '@mui/material/styles';
import {
    Table,
    TableBody,
} from '@mui/material';

// Components
import EditToken from './EditToken';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import WidgetNew from './WidgetNew';
import WidgetSlug from './WidgetSlug';
import TokenRow from './TokenRow';
import TrustSet from './TrustSet';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

// ----------------------------------------------------------------------

//    { id: 'holders', label: 'Holders', align: 'left', order: true },
//    { id: 'offers', label: 'Offers', align: 'left', order: true },

const TABLE_HEAD = [
    { no: 0, id: 'id', label: '#', align: 'left', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'left', order: true },
    { no: 3, id: 'pro24h', label: '24h (%)', align: 'left', order: true },
    { no: 4, id: 'pro7d', label: '7d (%)', align: 'left', order: true },
    { no: 5, id: 'vol24hxrp', label: 'Volume(24h)', align: 'left', order: true },
    { no: 6, id: 'vol24htx', label: 'Trades', align: 'left', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'left', order: true },
    { no: 8, id: 'trustlines', label: 'TrustLines', align: 'left', order: true },
    { no: 9, id: 'amount', label: 'Total Supply', align: 'left', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false },
    { id: '' }
];

export default function TokenList({data}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile } = useContext(AppContext);
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
    const [tokens, setTokens] = useState(data?data.tokens:[]); // useState(data?data.tokens.slice(0, 20):[]);
    // const [allTokens, setAllTokens] = useState(data?data.tokens:[]);
    const [load, setLoad] = useState(false);
    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    // const [hasMore, setHasMore] = useState(true);

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
                        //console.log(ret);
                        const metrics = {
                            count: ret.count,
                            length: ret.length,
                            USD: ret.exch.USD,
                            EUR: ret.exch.EUR,
                            JPY: ret.exch.JPY,
                            CNY: ret.exch.CNY,
                            H24: ret.H24,
                            global: ret.global
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
        // if (tokens.length < newRows)
        //     setHasMore(true);
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

    // const addMoreData = () => {
    //     setTokens(allTokens.slice(0, rows));
    //     setHasMore(false);
    // };

    return (
        <>
            {isAdmin && <WidgetNew showNew={showNew} setShowNew={updateShowNew}/>}
            {isAdmin && <WidgetSlug showSlug={showSlug} setShowSlug={updateShowSlug}/>}
            {isAdmin && <EditToken token={editToken} setToken={setEditToken}/>}

            <TrustSet token={trustToken} setToken={setTrustToken}/>
            
            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
                rows={rows}
                setRows={updateRows}
            />
            {/* <InfiniteScroll
                style={{overflow: "inherit"}}
                dataLength={allTokens.length}
                next={addMoreData}
                hasMore={hasMore}
                loader={
                    <div style={{display: "flex",justifyContent:"center",paddingTop:"10px"}}>
                        <BeatLoader color={"#00AB55"} size={10} />
                    </div>
                }
            > */}
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
                        tokens.map((row, idx) => {
                                return (
                                    <TokenRow key={idx} token={row} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
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
            {/* </InfiniteScroll> */}
            <TokenListToolbar
                rows={rows}
                setRows={updateRows}
                page={page}
                setPage={updatePage}
            />
        </>
    );
}
