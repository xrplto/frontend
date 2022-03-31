import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import ScrollToTop from '../layouts/ScrollToTop';

import Content from "./Content";
import UserDesc from "./detail/UserDesc";
import PriceDesc from "./detail/PriceDesc";
import LinkDesc from "./detail/LinkDesc";
import ExtraDesc from "./detail/ExtraDesc";
import PriceChart from './detail/PriceChart';
import PriceStatistics from './detail/PriceStatistics';
import Description from './detail/Description';

import {
    Container,
    Divider,
    Grid,
    Toolbar
} from '@mui/material';

// ----------------------------------------------------------------------
import axios from 'axios'
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useSelector, useDispatch } from "react-redux";
import { selectStatus, update_status } from "../redux/statusSlice";
// ----------------------------------------------------------------------

import Page from '../layouts/Page';

export default function TokenDetail(props) {
    const BASE_URL = 'https://ws.xrpl.to/api'; // 'http://localhost/api';
    const [history, setHistory] = useState([]);
    const [range, setRange] = useState('1D');
    const [token, setToken] = useState(null); // JSON.parse(localStorage.getItem('selectToken')));

    const { md5 } = useParams();

    //const status = useSelector(selectStatus);
    const dispatch = useDispatch();

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket('wss://ws.xrpl.to/api/ws/detail');

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    } [readyState];

    useEffect(() => {
        try {
            const res = lastMessage.data;
            const json = JSON.parse(res);
            console.log(json);
            const status = {
                session: json.session,
                USD: json.exch.USD,
                EUR: json.exch.EUR,
                JPY: json.exch.JPY,
                CNY: json.exch.CNY,
                token_count: json.token_count
            };
            dispatch(update_status(status));
            setToken(json.token);
        } catch(err) {}
    }, [lastMessage]);

    useEffect(() => {
        console.log(connectionStatus);

        function getStatus() {
            //if (connectionStatus === 'open')
            sendMessage(md5);
        }
        
        const timer = setInterval(() => getStatus(), 5000)

        return () => {
            clearInterval(timer);
        }
    }, [readyState]);

    useEffect(() => {
        function getDetail() {
            // https://ws.xrpl.to/api/detail/0413ca7cfc258dfaf698c02fe304e607?range=1D
            axios.get(`${BASE_URL}/detail/${md5}?range=${range}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        console.log(ret);
                        const status = {
                            session: 0,
                            USD: ret.exch.USD,
                            EUR: ret.exch.EUR,
                            JPY: ret.exch.JPY,
                            CNY: ret.exch.CNY,
                            token_count: ret.token_count
                        };
                        dispatch(update_status(status));
                        setHistory(ret.history);
                        setToken(ret.token);
                    }
                }).catch(err => {
                    console.log("error on getting details!!!", err);
                }).then(function () {
                    // always executed
                    // console.log("Heartbeat!");
                });
        }
        if (md5)
            getDetail();

    }, [md5, range]);

    if (!token) {
        return (
            <Content>
                {/* <CircularProgress /> */}
            </Content>
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

        // sx={{borderRight: '1px solid #323546'}}
        return (
            <Page title={`${user} price today, ${name} to USD live, marketcap and chart `}>
                <Toolbar id="back-to-top-anchor" />
                <Container maxWidth="xl">
                    <Grid item container direction="row" >
                        <Grid item xs={5} md={6} lg={5} sx={{ mt: 3 }}>
                            <UserDesc token={token} />
                        </Grid>
                        
                        <Grid item xs={7} md={6} lg={7} sx={{ mt: 3 }}>
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

                    <Grid container spacing={3} sx={{p:0}}>
                        <Grid item xs={12} md={6} lg={8} sx={{pl:0}}>
                            <PriceChart history={history} token={token} range={range} setRange={setRange} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={4}>
                            {/* <Holders token={token} /> */}
                            <PriceStatistics token={token} />
                        </Grid>

                        <Grid item xs={12} md={6} lg={8}>
                            <Description token={token} />
                        </Grid>

                        {/* <Grid item xs={12} md={6} lg={4}>
                            <RadialChart />
                        </Grid> */}
                    </Grid>
                </Container>
                <ScrollToTop />
            </Page>
        );
    }
}
