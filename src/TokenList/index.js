import axios from 'axios';
import { useState, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

// Material
import {
    Box,
    Table,
    TableBody
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useDispatch, useSelector } from "react-redux";
import { update_metrics, update_filteredCount, selectMetrics } from "src/redux/statusSlice";

// Components
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import {TokenRow} from './TokenRow';
import EditTokenDialog from 'src/components/EditTokenDialog';
import TrustSetDialog from 'src/components/TrustSetDialog';
import { useRef } from 'react';

// ----------------------------------------------------------------------
export default function TokenList({showWatchList, tag, tagName, tags, tokens, setTokens, tMap}) {
    const dispatch = useDispatch();
    const metrics = useSelector(selectMetrics);

    // const WSS_URL = 'wss://ws.xrpl.to';
    const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const [filterName, setFilterName] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    
    const [orderBy, setOrderBy] = useState('vol24hxrp');

    const [sync, setSync] = useState(showWatchList?1:0);
    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    
    // -----------------------------------------------
    const [rows, setRows] = useState(100);
    const [showNew, setShowNew] = useState(false);
    const [showSlug, setShowSlug] = useState(false);
    const [showDate, setShowDate] = useState(false);
    // -----------------------------------------------

    const tableRef = useRef(null);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollLeft(tableRef?.current?.scrollLeft > 0);
        };

        tableRef.current.addEventListener('scroll', handleScroll);

        return () => {
            tableRef.current.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

    const [watchList, setWatchList] = useState([]);

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {},
        onClose: () => {},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event),
        // reconnectAttempts: 10,
        // reconnectInterval: 3000,
    });

    const applyTokenChanges = (newTokens) => {
        for (var t of newTokens) {
            const token = tMap.get(t.md5);
            if (token) {
                let bearbull = 1;
                if (token.exch > t.exch)
                    bearbull = -1;
                
                token.time = Date.now();
                token.bearbull = bearbull;

                Object.assign(token, t);
            }
        }
    }
    
    const processMessages = (event) => {
        try {
            var t1 = Date.now();

            const json = JSON.parse(event.data);

            dispatch(update_metrics(json));

            // json.tokens = [
            //     {
            //         "md5": "0413ca7cfc258dfaf698c02fe304e607",
            //         "exch": 0.023699995994735382,
            //         "pro24h": -6.674273598810572,
            //         "p24h": -0.000557907346761026,
            //         "pro7d": 23.136049129452402,
            //         "p7d": 0.0015705872139334812,
            //         "vol24h": 3275628.9955383483,
            //         "vol24htx": 964,
            //         "vol24hx": 3275628.9955383483,
            //         "vol24hxrp": 82279.51683999998
            //     }
            // ]

            if (json.tokens && json.tokens.length > 0) {
                applyTokenChanges(json.tokens);
            }

            var t2 = Date.now();
            var dt = (t2 - t1).toFixed(2);

            // console.log(`${dt} ms`);
        } catch(err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const loadTokens=() => {
            // https://livenet.xrpl.org/api/v1/token/top
            // https://api.xrpl.to/api/tokens/-1
            // https://github.com/WietseWind/fetch-xrpl-transactions
            // https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc
            const start = page * rows;

            let ntag = '';
            if (tag)
                ntag = tag;

            let watchAccount = '';
            if (showWatchList)
                watchAccount = accountProfile?.account || '';

            axios.get(`${BASE_URL}/tokens?tag=${ntag}&watchlist=${watchAccount}&start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}`)
            .then(res => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        dispatch(update_metrics(ret));
                        dispatch(update_filteredCount(ret));
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
            });
        };
        if (sync > 0)
            loadTokens();
    }, [accountProfile, sync]);

    useEffect(() => {
        function getWatchList() {
            const account = accountProfile?.account;
            if (!account) {
                setWatchList([]);
                return;
            }
            // https://api.xrpl.to/api/watchlist/get_list?account=r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
            axios.get(`${BASE_URL}/watchlist/get_list?account=${account}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setWatchList(ret.watchlist);
                    }
                }).catch(err => {
                    console.log("Error on getting watchlist!", err);
                }).then(function () {
                    // always executed
                });
        }
        getWatchList();
    }, [sync, accountProfile]);

    const onChangeWatchList = async (md5) => {
        const account = accountProfile?.account;
        const accountToken = accountProfile?.token;

        if (!account || !accountToken) {
            openSnackbar('Please login!', 'error');
            return;
        }

        setLoading(true);
        try {
            let res;

            let action = 'add';

            if (watchList.includes(md5)) {
                action = 'remove';
            }

            const body = {md5, account, action};

            res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
                headers: { 'x-access-token': accountToken }
            });

            if (res.status === 200) {
                const ret = res.data;
                if (ret.status) {
                    setWatchList(ret.watchlist);
                    openSnackbar('Successful!', 'success');
                    if (showWatchList) {
                        setSync(sync + 1);
                    }
                } else {
                    const err = ret.err;
                    openSnackbar(err, 'error');
                }
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    }

    const handleRequestSort = (event, id, no) => {
        const isDesc = orderBy === id && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(id);
        setPage(0);
        setSync(sync + 1);
    };

    const updatePage = (newPage)  => {
        if (newPage === page) return;
        setPage(newPage);
        setSync(sync + 1);
    }

    const updateRows = (newRows) => {
        if (newRows === rows) return;
        setRows(newRows);
        if (tokens.length < newRows)
            setSync(sync + 1);
    }

    const updateShowNew = (val) => {
        setShowNew(val);
        setPage(0);
        setSync(sync + 1);
    }

    const updateShowSlug = (val) => {
        setShowSlug(val);
        setPage(0);
        setSync(sync + 1);
    }

    const updateShowDate = (val) => {
        setShowDate(val);
        setPage(0);
        setSync(sync + 1);
    }

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
        setPage(0);
        setSync(sync + 1);
    };


    return (
        <>
            {editToken && <EditTokenDialog token={editToken} setToken={setEditToken}/> }

            {trustToken && <TrustSetDialog token={trustToken} setToken={setTrustToken} /> }
            
            <SearchToolbar
                tags={tags}
                tagName={tagName}
                filterName={filterName}
                onFilterName={handleFilterByName}
                rows={rows}
                setRows={updateRows}
                showNew={showNew} setShowNew={updateShowNew}
                showSlug={showSlug} setShowSlug={updateShowSlug}
                showDate={showDate} setShowDate={updateShowDate}
            />

            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
                ref={tableRef}
            >
                <Table sx={{
                    "& .MuiTableCell-root": {
                        borderBottom: "none",
                        boxShadow: "inset 0 -1px 0 rgba(68 67 67), inset 0 -1px 0 rgba(255, 255, 255, 0.1)"
                    }
                }}>
                    <TokenListHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                        scrollLeft={scrollLeft}
                    />
                    <TableBody>
                        {
                            tokens.slice(0, rows).map((row, idx) => {
                                return (
                                    <TokenRow
                                        key={idx}
                                        mUSD = {metrics.USD}
                                        time={row.time}
                                        token={row}
                                        setEditToken={setEditToken}
                                        setTrustToken={setTrustToken}
                                        watchList={watchList}
                                        onChangeWatchList={onChangeWatchList}
                                        scrollLeft={scrollLeft}
                                    />
                                );
                            })
                        }
                        {/* {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )} */}
                    </TableBody>
                </Table>
            </Box>
            <TokenListToolbar
                rows={rows}
                setRows={updateRows}
                page={page}
                setPage={updatePage}
            />
        </>
    );
}
