import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';
import useWebSocket from "react-use-websocket";

// Material
import {
    Box,
    Container,
    styled,
    Toolbar
} from '@mui/material';

// Redux
import { useDispatch } from "react-redux";
import { update_metrics } from "src/redux/statusSlice";

// Components
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header'
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenDetail from 'src/TokenDetail';


// overflow: hidden;
const OverviewWrapper = styled(Box)(
    ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

function Detail({data}) {
    const dispatch = useDispatch();
    const [token, setToken] = useState(() => data.token);
    const WSS_FEED_URL = `wss://api.xrpl.to/ws/token/${token.md5}`;

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

            setToken(json.token);

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
            <Topbar />
            <Header />

            <Container maxWidth="xl">
                <TokenDetail token={token} tab={data.tab}/>
            </Container>

            <ScrollToTop />

            <Footer />

        </OverviewWrapper>
    );
}

export default Detail;

export async function getServerSideProps(ctx) {
    const BASE_URL = 'http://135.181.118.217/api';

    let data = null;
    try {

        const params = ctx.params.slug;

        const slug = params[0];
        const tab = params[1];

        var t1 = performance.now();

        // https://api.xrpl.to/api/token/bitstamp-usd
        const res = await axios.get(`${BASE_URL}/token/${slug}`);

        data = res.data;
        if (tab)
            data.tab = tab;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`2. getServerSideProps slug: ${slug}/${tab} took: ${dt}ms`);
    } catch (e) {
        console.log(e);
    }
    let ret = {};
    if (data && data.token) {
        let ogp = {};
        const token = data.token;
        const {
            name,
            imgExt,
            md5,
            urlSlug
        } = token;

        let user = token.user;
        if (!user) user = name;

        ogp.canonical = `https://xrpl.to/token/${urlSlug}`;
        ogp.title = `${user} price today, ${name} to USD live, volume, trading history, markets and chart`;
        ogp.url = `https://xrpl.to/token/${urlSlug}`;
        ogp.imgUrl = `https://xrpl.to/static/tokens/${md5}.${imgExt}`;
        ogp.desc = `Get the latest ${user} price, ${name} market cap, trading pairs, charts and data today from the world's number one XRP Ledger token price-tracking website`;

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
    }
}

// This function gets called at build time
// export async function getStaticPaths() {
//     // Call an external API endpoint to get posts
//     const res = await fetch('https://.../posts')
//     const posts = await res.json()
  
//     // Get the paths we want to pre-render based on posts
//     const paths = posts.map((post) => ({
//       params: { id: post.id },
//     }))
  
//     // We'll pre-render only these paths at build time.
//     // { fallback: false } means other routes should 404.
//     return { paths, fallback: false }
// }
