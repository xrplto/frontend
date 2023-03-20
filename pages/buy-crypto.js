import axios from 'axios'
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';

// Material
import {
    styled,
    Box,
    Container,
    Grid
} from '@mui/material';

// Components
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

import BuyCrypto from 'src/BuyCrypto';

// const DynamicTokenList = dynamic(() => import('src/TokenList'));

// overflow: scroll;
// overflow: auto;
// overflow: hidden;
const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

function Overview({data}) {

    return (
        <OverviewWrapper>
            <Topbar />
            <Header />
            
            <Container maxWidth="sm">
                <BuyCrypto
                    fiats={data.fiats}
                    coins={data.coins}
                />
                <Grid
                    container
                    direction="row"
                    justifyContent="left"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12} md={12} lg={12} >
                        
                    </Grid>
                </Grid>
            </Container>

            <Footer />

        </OverviewWrapper>
    );
}

export default Overview;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    // https://api.xrpl.to/api/banxa/currencies
    const BASE_URL = 'http://135.181.118.217/api';
    let data = null;
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/banxa/currencies`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
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
