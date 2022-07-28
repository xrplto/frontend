import axios from 'axios'
// import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AutoSizer } from 'react-virtualized';
// import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// import { extractExchanges } from 'src/utils/tx';
// import { BeatLoader } from "react-spinners";

import { FixedSizeList } from 'react-window';

// Material
import {
    styled,
    Box,
    Table,
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
import MuiTable from './MuiTable';

// const DynamicTokenRow = dynamic(() => import('./TokenRow'));
// import WidgetNew from './WidgetNew';
// import WidgetSlug from './WidgetSlug';
// import WidgetDate from './WidgetDate';

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

function createPersonData(count = 5) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            id: random.number(),
            firstName: name.firstName(),
            lastName: name.lastName(),
            jobTitle: name.jobTitle(),
            jobArea: name.jobArea(),
            jobType: name.jobType(),
        })
    }
  
    return data;
}
  
function createDessertData() {
    const data = [
        { id: 1, name: 'Cupcake', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
        { id: 2, name: 'Donut', calories: 452, fat: 25.0, carbs: 51, protein: 4.9 },
        { id: 3, name: 'Eclair', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
        { id: 4, name: 'Frozen yogurt', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
        { id: 5, name: 'Gingerbread', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
        { id: 6, name: 'Honeycomb', calories: 408, fat: 3.2, carbs: 87, protein: 6.5 },
        { id: 7, name: 'Ice cream sandwich', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
        { id: 8, name: 'Jelly Bean', calories: 375, fat: 0.0, carbs: 94, protein: 0.0 },
        { id: 9, name: 'KitKat', calories: 518, fat: 26.0, carbs: 65, protein: 7.0 },
        { id: 10, name: 'Lollipop', calories: 392, fat: 0.2, carbs: 98, protein: 0.0 },
        { id: 11, name: 'Marshmallow', calories: 318, fat: 0.0, carbs: 81, protein: 2.0 },
        { id: 12, name: 'Nougat', calories: 360, fat: 19.0, carbs: 9, protein: 37.0 },
        { id: 13, name: 'Oreo', calories: 437, fat: 18.0, carbs: 63, protein: 4.0 }
    ];
    return data;
}

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

    // Web socket process messages for tx
    const processMessages = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log(data);
            // const tx = JSON.parse(event.data);
            // const type = tx.TransactionType;
            // console.log(type);
            // if (['OfferCreate', 'Payment'].includes(type)) {
            //     const exchanges = extractExchanges(tx);
            //     if (exchanges.length === 0) return;
            //     console.log(exchanges);
            // }
        } catch(err) {

        }

        // if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
        //     const req = orderBook.id % 2;
        //     //console.log(`Received id ${orderBook.id}`)
        //     if (req === 1) {
        //         const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS, asks);
        //         setAsks(parsed);
        //     }
        //     if (req === 0) {
        //         const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS, bids);
        //         setBids(parsed);
        //         setTimeout(() => {
        //             setClearNewFlag(true);
        //         }, 2000);
        //     }
        // }
    };

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

    const tableData = createPersonData(100);

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
            {/* <div style={{ height: (tableData.length + 2) * 56 }}>
                <AutoSizer>
                {({ width, height }) => (
                    <MuiTable
                        data={tableData}
                        columns={[
                            {
                            name: 'fullName',
                            header: 'Name',
                            width: 180,
                            cell: d => `${d.firstName} ${d.lastName}`,
                            cellProps: { style: { paddingRight: 0 } }
                            },
                            { name: 'jobTitle', header: 'Job Title', width: 400 },
                            { name: 'jobArea', header: 'Job Area', width: 400 },
                            { name: 'jobType', header: 'Job Type', width: 400 }
                        ]}
                        width={width}
                        maxHeight={height}
                        includeHeaders={true}
                        fixedRowCount={1}
                        fixedColumnCount={1}
                        // style={{ backgroundColor: 'white' }}
                    />
                )}
                </AutoSizer>
            </div> */}
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
                            // tokens.slice(0, rows).map((row, idx) => {
                            //         return (
                            //             <TokenRow key={idx} token={row} admin={admin} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
                            //         );
                            //     })
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
