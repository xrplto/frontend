import axios from 'axios'
import React, { Suspense } from "react";
import { TableVirtuoso } from 'react-virtuoso'
// import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    Table,
    TableBody
} from '@mui/material';

// Loader
import { PulseLoader } from "react-spinners";

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useDispatch } from "react-redux";
import { update_metrics, update_filteredCount } from "src/redux/statusSlice";

// Components
import EditToken from './EditToken';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import {TokenRow} from './TokenRow';
import TrustSet from 'src/components/TrustSet';

// const DynamicTokenRow = dynamic(() => import('./TokenRow'));

// ----------------------------------------------------------------------
const ContentWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: 1,
    py: 1,
    overflow: "auto",
    width: "100%",
    "& > *": {
        scrollSnapAlign: "center",
    },
    "::-webkit-scrollbar": { display: "none" },
}));


function getInitialTokens(data) {
    console.log('getInitialTokens is called!');
    if (data)
        return data.tokens;
    return [];
}

// max-height: 440px;
// https://codesandbox.io/s/q2xmq7?module=/src/App.tsx&file=/package.json:362-373
// usehooks-ts npm
export default function TokenList({data}) {
    const dispatch = useDispatch();

    const WSS_URL = 'wss://ws.xrpl.to';
    const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const [filterName, setFilterName] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    
    const [orderBy, setOrderBy] = useState('vol24hxrp');
    
    const [tokens, setTokens] = useState(() => getInitialTokens(data)); // useState(data?data.tokens.slice(0, 20):[]);
    const [load, setLoad] = useState(false);
    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    
    const [sync, setSync] = useState(0);

    // -----------------------------------------------
    const [rows, setRows] = useState(100);
    const [showNew, setShowNew] = useState(false);
    const [showSlug, setShowSlug] = useState(false);
    const [showDate, setShowDate] = useState(false);
    // -----------------------------------------------

    const { accountProfile } = useContext(AppContext);
    const admin = accountProfile && accountProfile.account && accountProfile.admin;

    // useEffect(() => {
    //     const websocket = new WebSocket(WSS_FEED_URL)
    //     websocket.onopen = () => {
    //         console.log('connected')
    //     }

    //     websocket.onmessage = (event) => {
    //         processMessages(event);
    //     }
    
    //     return () => {
    //         websocket.close()
    //     }
    // }, [])

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => console.log('WS opened.'),
        onClose: () => console.log('WS closed.'),
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event),
        // reconnectAttempts: 10,
        // reconnectInterval: 3000,
    });
    
    const processMessages = (event) => {
        try {
            // [transactions24H, tradedXRP24H, tradedTokens24H, timeCalc24H, timeSchedule, CountApiCall];
            var t1 = Date.now();

            const json = JSON.parse(event.data);

            dispatch(update_metrics(json));

            // console.log(json.tokens);

            t1 = Date.now();

            json.tokens = [
                {
                    "md5": "0413ca7cfc258dfaf698c02fe304e607",
                    "exch": 0.023699995994735382,
                    "pro24h": -6.674273598810572,
                    "p24h": -0.000557907346761026,
                    "pro7d": 23.136049129452402,
                    "p7d": 0.0015705872139334812,
                    "vol24h": 3275628.9955383483,
                    "vol24htx": 964,
                    "vol24hx": 3275628.9955383483,
                    "vol24hxrp": 82279.51683999998
                }
            ]

            let cMap = new Map();
            for (var nt of json.tokens) {
                cMap.set(nt.md5, nt);
            }

            //let newTokens = [];
            let changed = false;
            for (var token of tokens) {
                const md5 = token.md5;
                const nt = cMap.get(md5);
                let original = token.bearbull;
                let bearbull = 0;
                if (nt) {
                    if (token.exch > nt.exch)
                        bearbull = -1;
                    else
                        bearbull = 1;
                    Object.assign(token, nt);
                    token.time = Date.now();
                    token.bearbull = bearbull;
                }
                if (bearbull !== original) {
                    changed = true;
                    token.time = Date.now();
                    token.bearbull = bearbull;
                }
                //newTokens.push(token);
            }
            if (changed) {
                //setTokens(newTokens);
                setSync(sync + 1);
            }

            var t2 = Date.now();
            var dt = (t2 - t1).toFixed(2);

            console.log(`${dt} ms`);
        } catch(err) {
            console.error(err);
        }
    };

    // useEffect(() => {
    //     function clearSyncColors() {
    //         const newTokens = [];
    //         for (var token of tokens) {
    //             // Object.assign(token, {bearbull:0});
    //             token.changed = Date.now();
    //             token.bearbull = 0;
    //             newTokens.push(token);
    //         }
    //         setTokens(newTokens);
    //         console.log(`Clear bearbull ${sync}`);
    //     }
    //     setTimeout(() => {
    //         clearSyncColors();
    //     }, 2000);
    // }, [sync]);

    // useEffect(() => {
    //     function clearSyncColors() {
    //         // const newTokens = [];
    //         for (var token of tokens) {
    //             // Object.assign(token, {bearbull:0});
    //             token.changed = Date.now();
    //             token.bearbull = 0;
    //             // newTokens.push(token);
    //         }
    //         setTokens(tokens);
    //         console.log(`Clear bearbull ${sync}`);
    //     }
    //     setTimeout(() => {
    //         clearSyncColors();
    //     }, 2000);
    // }, [tokens]);

    useEffect(() => {
        const loadTokens=() => {
            // https://livenet.xrpl.org/api/v1/token/top
            // https://api.xrpl.to/api/tokens/-1
            // https://github.com/WietseWind/fetch-xrpl-transactions
            // https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc
            const start = page * rows;
            axios.get(`${BASE_URL}/tokens?start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}`)
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
            setLoad(true);
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

    const updateShowDate = (val) => {
        setShowDate(val);
        setPage(0);
        setLoad(true);
    }

    const handleFilterByName = (event) => {
        setFilterName(event.target.value);
        setPage(0);
        setLoad(true);
    };


    // This example works fine, but ours???
    // https://codesandbox.io/s/wkxolyrpo5?file=/realTimeTable.js:0-4076

    return (
        <>
            {/* {admin &&
                <Stack sx={{ mt:2, mb:2, display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' } }}>
                    <WidgetNew showNew={showNew} setShowNew={updateShowNew}/>
                    <WidgetSlug showSlug={showSlug} setShowSlug={updateShowSlug}/>
                    <WidgetDate showDate={showDate} setShowDate={updateShowDate}/>
                    <EditToken token={editToken} setToken={setEditToken}/>
                </Stack>
            } */}

            <EditToken token={editToken} setToken={setEditToken}/>

            <TrustSet token={trustToken} setToken={setTrustToken}/>
            
            <SearchToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
                rows={rows}
                setRows={updateRows}
                admin={admin}
                showNew={showNew} setShowNew={updateShowNew}
                showSlug={showSlug} setShowSlug={updateShowSlug}
                showDate={showDate} setShowDate={updateShowDate}
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

            {/* <Virtuoso
                tokens={tokens}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}

                admin={admin}
                setEditToken={setEditToken}
                setTrustToken={setTrustToken}
            /> */}

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
            >
                {/* <LazyLoad height={200}> */}
                <Table>
                    <TokenListHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {
                            tokens.slice(0, rows).map((row, idx) => {
                                    // console.log(idx);
                                    return (
                                        <TokenRow
                                            key={idx}
                                            time={row.time}
                                            token={row}
                                            admin={admin}
                                            setEditToken={setEditToken}
                                            setTrustToken={setTrustToken}
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
            </Box>
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
