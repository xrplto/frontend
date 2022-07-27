import axios from 'axios'
import dynamic from 'next/dynamic';
import { performance } from 'perf_hooks';
import useWebSocket from "react-use-websocket";
import { useState, useEffect, useRef } from 'react';

// Material
import {
    Box,
    Container,
    Grid,
    styled,
    Toolbar
} from '@mui/material';

// Redux
import { useDispatch } from "react-redux";
import { update_metrics } from "src/redux/statusSlice";

// Components
import Topbar from 'src/layouts/Topbar';
import Header from 'src/TokenList/Header';

import TokenList from 'src/TokenList';
import ScrollToTop from 'src/layouts/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import HowWeWork from 'src/TokenList/HowWeWork';
import Footer from 'src/layouts/Footer';

// const DynamicTokenList = dynamic(() => import('src/TokenList'));

// overflow: scroll;
// overflow: auto;
// overflow: hidden;
const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    background: ${theme.palette.common.white};
    flex: 1;
`
);

function Overview({data}) {
    const dispatch = useDispatch();
    const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
    const didUnmount = useRef(false);

    useEffect(() => {
        const websocket = new WebSocket(WSS_FEED_URL)
        websocket.onopen = () => {
            console.log('connected')
        }

        websocket.onmessage = (event) => {
            processMessages(event);
        }
    
        return () => {
            websocket.close()
        }
      }, [])

    // const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
    //     onOpen: () => console.log('WebSocket connection opened.'),
    //     onClose: () => console.log('WebSocket connection closed.'),
    //     shouldReconnect: (closeEvent) => true,
    //     onMessage: (event) =>  processMessages(event),
    //     // reconnectAttempts: 10,
    //     // reconnectInterval: 3000,
    // });
    
    const processMessages = (event) => {
        try {
            // [transactions24H, tradedXRP24H, tradedTokens24H, timeCalc24H, timeSchedule, CountApiCall];
            var t1 = Date.now();

            const json = JSON.parse(event.data);

            dispatch(update_metrics(json));

            console.log(json.tokens);

            // let cMap = new Map();
            // for (var nt of json.tokens) {
            //     cMap.set(nt.md5, nt);
            // }

            // let newTokens = [];
            // let changed = false;
            // for (var token of tokens) {
            //     const md5 = token.md5;
            //     const nt = cMap.get(md5);
            //     token.bearbull = 0;
            //     if (nt) {
            //         if (token.exch > nt.exch)
            //             token.bearbull = -1;
            //         else
            //             token.bearbull = 1;
            //     }
            //     newTokens.push(token);
            // }
            // setTokens(newTokens);

            var t2 = Date.now();
            var dt = (t2 - t1).toFixed(2);

            console.log(`${dt} ms`);

            
        } catch(err) {
            console.error(err);
        }
    };

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar md5={'NONE'}/>
            <Header />
            
            <Container maxWidth="xl">
                <Grid
                    container
                    direction="row"
                    justifyContent="left"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12} md={12} lg={8} >
                        <Summary />
                    </Grid>
                    <Grid item xs={12} md={12} lg={12} >
                        {/* <DynamicTokenList data={data}/> */}
                        <TokenList data={data}/>
                    </Grid>
                    <Grid item xs={12} md={12} lg={12} >
                        <HowWeWork />
                    </Grid>
                </Grid>
            </Container>

            <ScrollToTop />

            <Footer />

        </OverviewWrapper>
    );
}

export default Overview;

const BASE_URL = 'http://135.181.118.217/api';

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    // https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false
    // https://api.xrpl.to/api/initial
    let data = null;
    try {
        var t1 = performance.now();

        // const res = await axios.get(`${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false`);
        const res = await axios.get(`${BASE_URL}/initial`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`1. getStaticProps tokens: ${data.tokens.length} took: ${dt}ms`);
    } catch (e) {
        console.log(e);
    }
    let ret = {};
    if (data) {
        let ogp = {};

        ogp.canonical = 'https://xrpl.to';
        ogp.title = 'XRPL Token Prices, Charts, Market Volume And Activity';
        ogp.url = 'https://xrpl.to/';
        ogp.imgUrl = 'https://xrpl.to/static/ogp.png';
        ogp.desc = 'Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed.';

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
        // Next.js will attempt to re-generate the page:
        // - When a request comes in
        // - At most once every 10 seconds
        revalidate: 10, // In seconds
    }
}

// export async function getServerSideProps(ctx) {
//     // https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false
//     let data = null;
//     try {
//         var t1 = performance.now();

//         const res = await axios.get(`${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false`);

//         data = res.data;

//         var t2 = performance.now();
//         var dt = (t2 - t1).toFixed(2);

//         console.log(`1. getServerSideProps tokens: ${data.tokens.length} took: ${dt}ms`);
//     } catch (e) {
//         console.log(e);
//     }
//     let ret = {};
//     if (data) {
//         let ogp = {};

//         ogp.title = 'XRPL Token Prices, Charts, Market Volume And Activity';
//         ogp.url = 'https://xrpl.to/';
//         ogp.imgUrl = 'https://xrpl.to/static/ogp.png';
//         ogp.desc = 'Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed.';

//         ret = {data, ogp};
//     }

//     return {
//         props: ret, // will be passed to the page component as props
//     }
// }
