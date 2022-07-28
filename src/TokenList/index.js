import axios from 'axios'
// import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import LazyLoad from 'react-lazyload';
import VisibilitySensor from "react-visibility-sensor";
import TrackVisibility from 'react-on-screen';
// import { extractExchanges } from 'src/utils/tx';
// import { BeatLoader } from "react-spinners";

// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    Table,
    TableCell,
    TableBody
} from '@mui/material';

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
import TokenRow from './TokenRow';
import TrustSet from 'src/components/TrustSet';

import ReactVirtualizedTable from './ReactVirtualizedTable';

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

// max-height: 440px;
// https://codesandbox.io/s/q2xmq7?module=/src/App.tsx&file=/package.json:362-373
// usehooks-ts npm
export default function TokenList({data}) {
    const WSS_URL = 'wss://ws.xrpl.to';
    const BASE_URL = 'https://api.xrpl.to/api';
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
    const [showDate, setShowDate] = useState(false);
    const [tokens, setTokens] = useState(data?data.tokens:[]); // useState(data?data.tokens.slice(0, 20):[]);
    // const [allTokens, setAllTokens] = useState(data?data.tokens:[]);
    const [load, setLoad] = useState(false);
    const [editToken, setEditToken] = useState(null);
    const [trustToken, setTrustToken] = useState(null);
    // const [hasMore, setHasMore] = useState(true);

    const { accountProfile } = useContext(AppContext);
    const admin = accountProfile && accountProfile.account && accountProfile.admin;

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
                                    return (
                                        <TokenRow
                                            key={idx}
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
