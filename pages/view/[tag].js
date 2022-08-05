import axios from 'axios'
import dynamic from 'next/dynamic';
import { performance } from 'perf_hooks';
import { useState, useEffect, useRef } from 'react';

// Material
import {
    Box,
    Container,
    Grid,
    styled,
    Toolbar
} from '@mui/material';

// Components
import Topbar from 'src/layouts/Topbar';
import Header from 'src/TokenTagList/Header';

import TokenList from 'src/TokenTagList';
import ScrollToTop from 'src/layouts/ScrollToTop';
import Summary from 'src/TokenTagList/Summary';
import Footer from 'src/layouts/Footer';

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

function getInitialTokens(data) {
    if (data)
        return data.tokens;
    return [];
}

function Overview({data}) {
    const [tokens, setTokens] = useState(() => getInitialTokens(data));

    const tMap = new Map();
    for (var t of tokens) {
        tMap.set(t.md5, t);
    }

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar />
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
                        <Summary tagName={data.tagName}/>
                    </Grid>
                    <Grid item xs={12} md={12} lg={12} >
                        <TokenList
                            tag={data.tag}
                            tokens={tokens}
                            tMap={tMap}
                            setTokens={setTokens}
                        />
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

export async function getServerSideProps(ctx) {
    // https://api.xrpl.to/api/tokensbytag?tag=collectables-and-nfts&start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=
    let data = null;
    try {
        const tag = ctx.params.tag;

        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/tokensbytag?tag=${tag}&start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=`);

        data = res.data;

        data.tag = tag;

        const time = Date.now();
        for (var token of data.tokens) {
            token.bearbull = token.pro24h < 0 ? -1:1;
            token.time = time;
        }

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`5. getStaticProps tokensbytag: ${data.tokens.length} took: ${dt}ms`);
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
