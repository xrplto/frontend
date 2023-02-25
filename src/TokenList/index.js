import axios from 'axios'
import { useState, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

// Material
import { styled } from '@mui/material/styles';
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
import EditToken from './EditToken';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import {TokenRow} from './TokenRow';
import TrustSet from 'src/components/TrustSet';

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

export default function TokenList({tag, tokens, setTokens, tMap}) {
    const dispatch = useDispatch();
    const metrics = useSelector(selectMetrics);

    const WSS_URL = 'wss://ws.xrpl.to';
    const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
    const BASE_URL = 'https://api.xrpl.to/api';
    
    const [filterName, setFilterName] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [order, setOrder] = useState('desc');
    
    const [orderBy, setOrderBy] = useState('vol24hxrp');

    const [load, setLoad] = useState(false);
    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    
    // -----------------------------------------------
    const [rows, setRows] = useState(100);
    const [showNew, setShowNew] = useState(false);
    const [showSlug, setShowSlug] = useState(false);
    const [showDate, setShowDate] = useState(false);
    // -----------------------------------------------

    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

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
            if (tag) ntag = tag;
            axios.get(`${BASE_URL}/tokens?tag=${ntag}&start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}`)
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


    return (
        <>
            {/* {isAdmin &&
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
                isAdmin={isAdmin}
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
            >
                <Table>
                    <TokenListHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
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
                                            admin={isAdmin}
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
