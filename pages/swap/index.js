import axios from 'axios';
import { performance } from 'perf_hooks';

// Material
import {
    styled,
    Box,
    Container,
    Stack,
    Toolbar,
    Typography
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Components
import Logo from 'src/components/Logo';
import Swap from 'src/swap';

import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const OverviewWrapper = styled(Box)(
    ({ theme }) => `
        overflow: hidden;
        flex: 1;
  `
);

const SwapWrapper = styled(Box) (
    ({ theme }) => `
        align-items: center;
        justify-content: center;
        -webkit-box-pack: center;
        display: flex;
        flex: 1;
        overflow-x: hidden;
        height: 100%;
  `
);

const ContainerWrapper = styled(Container) (
    ({ theme }) => `
    width: 100%;
    margin-left: auto;
    box-sizing: border-box;
    margin-right: auto;
    display: block;
    padding-left: 16px;
    padding-right: 16px;
    height: 70%;

    @media (max-width: 600px) {
        padding-left: 0px;
        padding-right: 0px;
    }
  `
);

function Overview({data}) {
    const { accountProfile, openSnackbar } = useContext(AppContext);

    const tokens = data.tokens;

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar />
            <Header />

            <ContainerWrapper maxWidth="sm">
                <SwapWrapper>
                    <Swap tokens={tokens} />
                </SwapWrapper>
            </ContainerWrapper>

        </OverviewWrapper>
    );
}

export default Overview;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    const BASE_URL = 'http://135.181.118.217/api';

    // https://api.xrpl.to/api/simple/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=
    let data = null;
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/simple/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=`);

        data = res.data;

        const time = Date.now();
        for (var token of data.tokens) {
            token.bearbull = token.pro24h < 0 ? -1:1;
            token.time = time;
        }

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
