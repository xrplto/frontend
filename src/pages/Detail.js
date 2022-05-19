import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useParams/*, useSearchParams*/ } from "react-router-dom";
import ScrollToTop from '../layouts/ScrollToTop';
import TopMark from '../layouts/TopMark';
import useWebSocket from "react-use-websocket";

import formatOrderBook from './details/trade/formatOrderBook';
import {UserDesc, PriceDesc, LinkDesc, ExtraDesc} from "./details/common"
import {PriceChart, PriceStatistics, Description} from './details/overview';
import {HistoryData} from './details/history';
import {MarketData} from './details/market';
import {TradeData} from './details/trade';
// import DocumentMeta from 'react-document-meta';

import {
    Box,
    Container,
    Divider,
    Grid,
    Tab,
    Tabs
} from '@mui/material';

// ----------------------------------------------------------------------
import axios from 'axios'
import { useDispatch } from "react-redux";
import { update_status } from "../redux/statusSlice";
// ----------------------------------------------------------------------

import Page from '../layouts/Page';

const TABLE_HEAD = [
    { no: 0, id: 'id', label: '#', align: 'left', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'left', order: true },
    { no: 3, id: 'percent_24h', label: '24h (%)', align: 'left', order: false },
    { no: 4, id: 'percent_7d', label: '7d (%)', align: 'left', order: false },
    { no: 5, id: 'vol24h', label: 'Volume(24h)', align: 'left', order: true },
    { no: 6, id: 'vol24htx', label: 'Tx(24h)', align: 'left', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'left', order: true },
    { no: 8, id: 'trline', label: 'Trust Lines', align: 'left', order: true },
    { no: 9, id: 'amt', label: 'Total Supply', align: 'left', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'left', order: false },
    { id: '' }
];

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
            )}
        </div>
    );
}
  
TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function Detail(props) {
    const WSS_FEED_URL = 'wss://ws.xrpl.to';
    const BASE_URL = 'https://api.xrpl.to/api'; // 'http://localhost/api';
    const [history, setHistory] = useState([]);
    const [range, setRange] = useState('1D');
    const [token, setToken] = useState(null); // JSON.parse(localStorage.getItem('selectToken')));
    const [value, setValue] = useState(0);
    const [pairs, setPairs] = useState([]);
    const [pair, setPair] = useState(null);

    const [bids, setBids] = useState([]); // Orderbook Bids
    const [asks, setAsks] = useState([]); // Orderbook Asks
    const [ready, setReady] = useState(false);
    const [reqID, setReqID] = useState(1);
    const [clearNewFlag, setClearNewFlag] = useState(false);

    const gotoTabView = (event) => {
        const anchor = (event.target.ownerDocument || document).querySelector(
            '#back-to-top-tab-anchor',
        );
    
        if (anchor) {
            anchor.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const handleChange = (event, newValue) => {
        setValue(newValue);
        gotoTabView(event);
    };
    // const [searchParams, setSearchParams] = useSearchParams();
    // const id = searchParams.get("id");
    // const sort = searchParams.get("sort");

    const { exMD5 } = useParams();

    let md5 = null;
    let id = 0;
    let sort = null;

    if (exMD5 && exMD5.length > 10) {
        try {
            id = parseInt(exMD5.substring(0, 5), 16);
            const sortInt = parseInt(exMD5.substring(5, 7), 16);
            if (sortInt < TABLE_HEAD.length) {
                sort = TABLE_HEAD[sortInt].label;
                md5 = exMD5.substring(7);
            }
        } catch(err) {
            md5 = null;
            id = 0;
            sort = null;
        }
    }

    //const status = useSelector(selectStatus);
    const dispatch = useDispatch();

    useEffect(() => {
        function getDetail() {
            // https://api.xrpl.to/api/detail/0413ca7cfc258dfaf698c02fe304e607?range=1D
            axios.get(`${BASE_URL}/detail/${md5}?range=${range}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
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
                        setHistory(ret.history);
                        setToken(ret.token);
                    }
                }).catch(err => {
                    console.log("Error on getting details!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        if (md5)
            getDetail();

    }, [md5, range, dispatch]);

    useEffect(() => {
        function getPairs() {
            if (!md5) return;
            if (!token) return;
            // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/pairs?md5=${md5}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const newPairs = ret.pairs;
                        setPairs(newPairs);
                        if (!pair)
                            setPair(newPairs[0])
                    }
                }).catch(err => {
                    console.log("Error on getting pairs!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        getPairs();

        const timer = setInterval(() => getPairs(), 10000);

        return () => {
            clearInterval(timer);
        }

    }, [md5, token]);

    useEffect(() => {
        let arr = [];
        if (clearNewFlag) {
            setClearNewFlag(false);
            for (let o of asks) {
                o.isNew = false;
                arr.push(o);
            }
            setAsks(arr);

            arr = [];
            for (let o of bids) {
                o.isNew = false;
                arr.push(o);
            }
            setBids(arr);
        }
    }, [clearNewFlag, asks, bids]);

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {console.log('wss://ws.xrpl.to opened');setReady(true);},
        onClose: () => {console.log('wss://ws.xrpl.to closed');setReady(false);},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event)
    });

    // Orderbook related useEffect - Start
    useEffect(() => {
        function setRequestID() {
            if (!ready) return;
            if (!pair) return;
            setReqID(reqID + 2);
            /*{
                "id":17,
                "command":"book_offers",
                "taker_gets":{
                    "currency":"534F4C4F00000000000000000000000000000000",
                    "issuer":"rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz"
                },
                "taker_pays":{
                    "currency":"XRP"
                },
                "ledger_index":"validated",
                "limit":200
            }

            {
                "id":20,
                "command":"book_offers",
                "taker_gets":{"currency":"XRP"},
                "taker_pays":{
                    "currency":"534F4C4F00000000000000000000000000000000",
                    "issuer":"rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz"
                },
                "ledger_index":"validated",
                "limit":200
            }*/
            const curr1 = pair.curr1;
            const curr2 = pair.curr2;
            const cmdAsk = {
                id: reqID,
                command: 'book_offers',
                taker_gets: {
                    currency: curr1.currency,
                    issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
                },
                taker_pays: {
                    currency: curr2.currency,
                    issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
                },
                ledger_index: 'validated',
                limit: 200
            }
            const cmdBid = {
                id: reqID+1,
                command: 'book_offers',
                taker_gets: {
                    currency: curr2.currency,
                    issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
                },
                taker_pays: {
                    currency: curr1.currency,
                    issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
                },
                ledger_index: 'validated',
                limit: 200
            }
            sendJsonMessage(cmdAsk);
            sendJsonMessage(cmdBid);
        }

        if (reqID === 1)
            setRequestID();

        const timer = setInterval(() => setRequestID(), 5000);

        return () => {
            clearInterval(timer);
        }

    }, [reqID, ready, pair, sendJsonMessage]);
    // Orderbook related useEffect - END

    // web socket process messages for orderbook
    const processMessages = (event) => {
        const orderBook = JSON.parse(event.data);

        if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
            const r = orderBook.id % 2;
            //console.log(`Received id ${orderBook.id}`)
            if (r === 1) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS, asks);
                setAsks(parsed);
            }
            if (r === 0) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS, bids);
                setBids(parsed);
                setTimeout(() => {
                    setClearNewFlag(true);
                }, 2000);
            }
        }
    };


    if (!token) {
        return (
            <>
                {/* <CircularProgress /> */}
            </>
        );
    } else {
        const {
            name,
            /*id,
            acct,
            code,
            date,
            amt,
            trline,
            holders,
            offers,
            exch*/
        } = token;

        let user = token.user;
        if (!user) user = name;

        // const meta = {
        //     title: `${user} price today, ${name} to USD live, volume, trading history, markets and chart`,
        //     description: `Get the latest XRPL DEX ${user} price, 24-hour volume, trading pairs, history, charts, and data today in real-time.`,
        //     canonical: `https://xrpl.to/${exMD5}`,
        //     'og:image': `/static/tokens/${name.replace(/[^a-zA-Z]/g, "")}.jpg`,
        //     meta: {
        //         'og:image': `/static/tokens/${name.replace(/[^a-zA-Z]/g, "")}.jpg`,
        //         charset: 'utf-8',
        //         name: {
        //             keywords: 'react,meta,document,html,tags'
        //         }
        //     }
        // }

        // sx={{borderRight: '1px solid #323546'}}
        return (
            <Page title={`${user} price today, ${name} to USD live, volume, trading history, markets and chart `}>
                {/* <DocumentMeta {...meta} > */}
                    <TopMark md5={md5}/>
                    <Container maxWidth="xl">
                        <Grid item container direction="row" >
                            <Grid item xs={12} md={6} lg={5} sx={{ mt: 3 }}>
                                <UserDesc token={token} id={id} sort={sort} />
                            </Grid>
                            
                            <Grid item xs={12} md={6} lg={7} sx={{ mt: 3 }}>
                                <PriceDesc token={token} />
                            </Grid>

                            <Grid item xs={12} md={12} lg={5} sx={{ mt: 2 }}>
                                <LinkDesc token={token} />
                            </Grid>

                            <Grid item xs={12} md={12} lg={7} sx={{ mt: 2 }}>
                                <ExtraDesc token={token} />
                            </Grid>
                        </Grid>

                        <Divider orientation="horizontal" sx={{mt:2,mb:2}} variant="middle" flexItem />
                        <div id="back-to-top-tab-anchor" />
                        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                            <Tab label="Overview" {...a11yProps(0)} />
                            <Tab label="Market" {...a11yProps(1)} />
                            <Tab label="Trade" {...a11yProps(2)} />
                            <Tab label="Historical Data" {...a11yProps(3)} />
                        </Tabs>
                        <TabPanel value={value} index={0}>
                            <Grid container spacing={3} sx={{p:0}}>
                                <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                                    <PriceChart history={history} token={token} range={range} setRange={setRange} />
                                </Grid>

                                <Grid item xs={12} md={6} lg={4}>
                                    <PriceStatistics token={token} />
                                </Grid>

                                <Grid item xs={12} md={6} lg={8}>
                                    <Description token={token} />
                                </Grid>

                                <Grid item xs={12} md={6} lg={4}>
                                </Grid>
                            </Grid>
                        </TabPanel>
                        <TabPanel value={value} index={1}>
                            <MarketData token={token} pairs={pairs}/>
                        </TabPanel>
                        <TabPanel value={value} index={2}>
                            <TradeData token={token} pairs={pairs} pair={pair} setPair={setPair} asks={asks} bids={bids}/>
                        </TabPanel>
                        <TabPanel value={value} index={3}>
                            <HistoryData token={token} pairs={pairs}/>
                        </TabPanel>
                    </Container>
                    <ScrollToTop />
                {/* </DocumentMeta> */}
            </Page>
        );
    }
}
