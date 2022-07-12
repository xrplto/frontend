import axios from 'axios'
import PropTypes from 'prop-types';
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    Container,
    Divider,
    Grid,
    Tab,
    Tabs,
    Typography
} from '@mui/material';

// Components
import ScrollToTop from 'src/layouts/ScrollToTop';
import {UserDesc, PriceDesc, ExtraDesc} from "./common"
import {PriceChart, PriceStatistics, Description} from './overview';
import {RichListData} from './richlist';
import {HistoryData} from './history';
import {MarketData} from './market';
import {TradeData} from './trade';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

// ---------------------------------------------------

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

const FooterContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '30vh'
});

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function TokenDetail({data}) {
    const router = useRouter();
    const { slug } = router.query;

    const WSS_URL = 'wss://ws.xrpl.to';
    const BASE_URL = 'https://api.xrpl.to/api';
    const dispatch = useDispatch();
    const [history, setHistory] = useState(data.history||[]);
    const [range, setRange] = useState('1D');
    const [token, setToken] = useState(data.token);
    const [value, setValue] = useState(0);
    const [pairs, setPairs] = useState([]);
    const [pair, setPair] = useState(null);
    const [bids, setBids] = useState([]); // Orderbook Bids
    const [asks, setAsks] = useState([]); // Orderbook Asks

    const [wsReady, setWsReady] = useState(false);
    const [clearNewFlag, setClearNewFlag] = useState(false);

    const [tradeExchs, setTradeExchs] = useState([]);

    const {
        md5
    } = token;

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

    useEffect(() => {
        function getPairs() {
            // https://api.xrpl.to/api/pairs?md5=0413ca7cfc258dfaf698c02fe304e607
            axios.get(`${BASE_URL}/pairs?md5=${md5}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        /*{
                            "pair": "fa99aff608a10186d3b1ff33b5cd665f",
                            "curr1": {
                                "currency": "534F4C4F00000000000000000000000000000000",
                                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                                "value": 460186.2755587654,
                                "md5": "0413ca7cfc258dfaf698c02fe304e607",
                                "name": "SOLO",
                                "user": "Sologenic",
                                "domain": "sologenic.com",
                                "verified": true,
                                "twitter": "realSologenic"
                            },
                            "curr2": {
                                "currency": "XRP",
                                "value": 328571.7821960003,
                                "md5": "71dbd3aabf2d99d205e0e2556ae4cf55",
                                "name": "XRP"
                            },
                            "count": 1697,
                            "id": 1
                        }*/
                        const newPairs = ret.pairs;
                        setPairs(newPairs);
                        if (!pair) {
                            setPair(newPairs[0]);
                        } else {
                            const check = newPairs.find(e => e.pair === pair.pair);
                            if (!check) {
                                setPair(newPairs[0]);
                            }
                        }
                    }
                }).catch(err => {
                    console.log("Error on getting pairs!!!", err);
                }).then(function () {
                    // always executed
                });
        }

        if (!pair && pairs.length === 0) {
            getPairs();
        }

        const timer = setInterval(getPairs, 10000);

        return () => {
            clearInterval(timer);
        }

    }, [token, pair, pairs]);

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

    const { sendJsonMessage/*, getWebSocket*/ } = useWebSocket(WSS_URL, {
        onOpen: () => {setWsReady(true);},
        onClose: () => {setWsReady(false);},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) => processMessages(event)
    });

    // Orderbook related useEffect - Start
    useEffect(() => {
        let reqID = 1;
        function sendRequest() {
            if (!wsReady) return;
            if (!pair) return;
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
            reqID += 2;
        }

        sendRequest();

        const timer = setInterval(() => sendRequest(), 5000);

        return () => {
            clearInterval(timer);
        }

    }, [wsReady, pair, sendJsonMessage]);
    // Orderbook related useEffect - END

    // web socket process messages for orderbook
    const processMessages = (event) => {
        const orderBook = JSON.parse(event.data);

        if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
            const req = orderBook.id % 2;
            //console.log(`Received id ${orderBook.id}`)
            if (req === 1) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS, asks);
                setAsks(parsed);
            }
            if (req === 0) {
                const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS, bids);
                setBids(parsed);
                setTimeout(() => {
                    setClearNewFlag(true);
                }, 2000);
            }
        }
    };

    useEffect(() => {
        function getTradeExchanges() {
            if (!pair) return;
            const page = 0;
            const rows = 30;
            // SOLO
            // https://api.xrpl.to/api/exchs?pair=fa99aff608a10186d3b1ff33b5cd665f&page=0&limit=5
            axios.get(`${BASE_URL}/exchs?pair=${pair.pair}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTradeExchs(ret.exchs);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getTradeExchanges();

        const timer = setInterval(getTradeExchanges, 10000);

        return () => {
            clearInterval(timer);
        }
    }, [pair]);

    useEffect(() => {
        function getGraph () {
            // https://api.xrpl.to/api/detail/bitstamp-usd?range=1D
            axios.get(`${BASE_URL}/graph/${md5}?range=${range}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        const items = ret.history;
                        setHistory(items);
                    }
                }).catch(err => {
                    console.log("Error on getting graph data.", err);
                }).then(function () {
                    // always executed
                });
        }

        getGraph();

    }, [range]);

    const updateRange = (val) => {
        setRange(val);
    }

    return (
        <>
            <Container maxWidth="xl">
                <Grid container direction="row" justify="center" alignItems="stretch">
                    <Grid item xs={12} md={6} lg={5} sx={{ mt: 3 }}>
                        <UserDesc token={token} />
                    </Grid>
                    
                    <Grid item xs={12} md={6} lg={7} sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <PriceDesc token={token} />
                            </Grid>
                            <Grid item xs={12}>
                                <ExtraDesc token={token} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Divider orientation="horizontal" sx={{mt:2,mb:2}} variant="middle" flexItem />
                <div id="back-to-top-tab-anchor" />
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Overview" {...a11yProps(0)} />
                    <Tab label="Market" {...a11yProps(1)} />
                    <Tab label="Trade" {...a11yProps(2)} />
                    <Tab label="Historical Data" {...a11yProps(3)} />
                    <Tab label="Rich List" {...a11yProps(4)} />
                </Tabs>
                <TabPanel value={value} index={0}>
                    <Grid container spacing={3} sx={{p:0}}>
                        <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                            <PriceChart history={history} token={token} range={range} setRange={updateRange} />
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
                    <TradeData token={token} pairs={pairs} pair={pair} setPair={setPair} asks={asks} bids={bids} tradeExchs={tradeExchs}/>
                </TabPanel>
                <TabPanel value={value} index={3}>
                    <HistoryData token={token} pairs={pairs} pair={pair} setPair={setPair}/>
                </TabPanel>
                <TabPanel value={value} index={4}>
                    <RichListData token={token}/>
                </TabPanel>
            </Container>
            
            <ScrollToTop />
        </>
    );
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers) => {
    // { ASK
    //     "Account": "rsoLoDTcxn9wCEHHBR7enMhzQMThkB2w28",
    //     "BookDirectory": "5C8970D155D65DB8FF49B291D7EFFA4A09F9E8A68D9974B25A1997F7E14CDA39",
    //     "BookNode": "0",
    //     "Expiration": 705140180,
    //     "Flags": 0,
    //     "LedgerEntryType": "Offer",
    //     "OwnerNode": "0",
    //     "PreviousTxnID": "541552841A1ADB8BEA4329DE435F4A9C10C6A0E90626CE1B4AF4D64C8FE26C19",
    //     "PreviousTxnLgrSeq": 71465030,
    //     "Sequence": 67605605,
    //     "TakerGets": {
    //         "currency": "534F4C4F00000000000000000000000000000000",
    //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
    //         "value": "124.9311956987916"
    //     },
    //     "TakerPays": "90000000",
    //     "index": "C45796CA3444AB63E507582300662E080E393C40D447C530A435CE8BA86AC6A1",
    //     "owner_funds": "487.6093571004488",
    //     "quality": "720396.5310392889"
    // }

    // { BID
    //     "Account": "rUATLa1awouAR8jS1DwtsXuy8EXCjdktgU",
    //     "BookDirectory": "C73FAC6C294EBA5B9E22A8237AAE80725E85372510A6CA794F04F44BA5C57321",
    //     "BookNode": "0",
    //     "Flags": 131072,
    //     "LedgerEntryType": "Offer",
    //     "OwnerNode": "15",
    //     "PreviousTxnID": "545EB169E174D5BF05F59124B7CCC44BF32BC2DA72A7463459E6CF33121143F0",
    //     "PreviousTxnLgrSeq": 71464668,
    //     "Sequence": 66420966,
    //     "TakerGets": "358550000",
    //     "TakerPays": {
    //         "currency": "534F4C4F00000000000000000000000000000000",
    //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
    //         "value": "500"
    //     },
    //     "index": "6857750D3847B6A0D40CCCA1A0FDA609DD54CEECAB088A7A94BD6B65A4834E26",
    //     "owner_funds": "952667088",
    //     "quality": "0.000001394505647747873"
    // }

    if (offers.length < 1) return []

    const getCurrency = offers[0].TakerGets?.currency || 'XRP'
    const payCurrency = offers[0].TakerPays?.currency || 'XRP'
    
    let multiplier = 1
    const isBID = orderType === ORDER_TYPE_BIDS

    // It's the same on each condition?
    if (isBID) {
        if (getCurrency === 'XRP')
            multiplier = 1_000_000
        else if (payCurrency === 'XRP')
            multiplier = 0.000_001
    } else {
        if (getCurrency === 'XRP')
            multiplier = 1_000_000
        else if (payCurrency === 'XRP')
            multiplier = 0.000_001
    }

    // let precision = maxDecimals(isBID ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

    // let index = 0
    const array = []
    let sumAmount = 0;
    let sumValue = 0;

    let mapOldOffers = new Map();
    for (var offer of arrOffers) {
        mapOldOffers.set(offer.id, true);
    }

    for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const obj = {
            id: '',
            price: 0,
            amount: 0,
            value: 0,
            sumAmount: 0, // SOLO
            sumValue: 0, // XRP
            avgPrice: 0,
            sumGets: 0,
            sumPays: 0,
            isNew: false
        }

        const id = `${offer.Account}:${offer.Sequence}`;
        const gets = offer.taker_gets_funded || offer.TakerGets;
        const pays = offer.taker_pays_funded || offer.TakerPays;
        // const partial = (offer.taker_gets_funded || offer.taker_pays_funded) ? true: false;

        const takerPays = pays.value || pays;
        const takerGets = gets.value || gets;

        const amount = Number(isBID ? takerPays : takerGets)
        const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier
        const value = amount * price;

        // const quantity = Number(isBID ? (offer.TakerPays?.value || offer.TakerPays) : (offer.TakerGets?.value || offer.TakerGets))
        // const price = round(isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)

        // if (i === 0) {
        //     obj.price = price
        //     obj.quantity = quantity
        //     obj.total = quantity
        // } else {
        //     if (array[index].price === price) {
        //         array[index].quantity += quantity
        //         array[index].total += quantity
        //         continue
        //     } else {
        //         obj.price = price
        //         obj.quantity = quantity
        //         obj.total = array[index].total + quantity
        //         index++
        //     }
        // }
        sumAmount += amount;
        sumValue += value;
        obj.id = id;
        obj.price = price
        obj.amount = amount // SOLO
        obj.value = value // XRP
        obj.sumAmount = sumAmount
        obj.sumValue = sumValue

        if (sumAmount > 0)
            obj.avgPrice = sumValue / sumAmount
        else
            obj.avgPrice = 0

        obj.isNew = !mapOldOffers.has(id)
        //obj.partial = partial

        if (amount > 0)
            array.push(obj)

        // if (i === 0 && isBID)
        //    console.log(offer)

        /*{ BID Offer
            "Account": "rsoLoDTcxn9wCEHHBR7enMhzQMThkB2w28",
            "BookDirectory": "C73FAC6C294EBA5B9E22A8237AAE80725E85372510A6CA794F05DD7327B65E9E",
            "BookNode": "0",
            "Expiration": 705752036,
            "Flags": 0,
            "LedgerEntryType": "Offer",
            "OwnerNode": "0",
            "PreviousTxnID": "8380F74C503D629EE39908E58E702252FE048BFB8FCA3331ED084915EDEB1DDE",
            "PreviousTxnLgrSeq": 71621302,
            "Sequence": 67629249,
            "TakerGets": "90000000",
            "TakerPays": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "148.5775386714613"
            },
            "index": "862539A8D6773FB25965D788DA7313A11BA2C52535DCA05859149A3A0F8BD565",
            "owner_funds": "524244729",
            "quality": "0.000001650861540794014"
        }*/
    }

    const sortedArrayByPrice = [ ...array ].sort(
        (a, b) => {
            let result = 0;
            if (orderType === ORDER_TYPE_BIDS) {
                result = b.price - a.price;
            } else {
                result = a.price - b.price;
            }
            return result;
        }
    );

    return sortedArrayByPrice;
}

// const round = (value, decimals) => {
//     value = Number(value)
//     if(value < 1) return value.toPrecision(decimals)
//     const integerLength = (value.toFixed(0)).length
//     return value.toPrecision(decimals + integerLength)
//     // return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
// }

// const maxDecimals = (float) => {
//     const value = Math.trunc(float)
//     const length = value.toString().length
//     if(length > 1) {
//         return 2
//     } else {
//         if(value < 1) {
//             return 4
//         } else {
//             return 3
//         }
//     }
// }
