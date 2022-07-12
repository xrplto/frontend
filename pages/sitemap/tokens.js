import axios from 'axios'
import dynamic from 'next/dynamic';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { performance } from 'perf_hooks';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    Grid,
    IconButton,
    Link,
    styled,
    Stack,
    Typography
} from '@mui/material';

// Iconify Icons
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

// Utils

// Components
import Topbar from 'src/layouts/Topbar';
import Logo from 'src/components/Logo';
import Account from 'src/components/Account';

import TokenList from 'src/TokenList';
import ScrollToTop from 'src/layouts/ScrollToTop';
import Summary from 'src/TokenList/Summary';

import Footer from 'src/layouts/Footer';

const DynamicTokenList = dynamic(() => import('src/TokenList'));

const HeaderWrapper = styled(Box)(
    ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`
);

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: auto;
    background: ${theme.palette.common.white};
    flex: 1;
    overflow-x: hidden;
`
);

function Overview(props) {
    const { toggleTheme, darkMode } = useContext(AppContext);
    const data = props.data;

    return (
        <>
        <OverviewWrapper>
            <Topbar md5={'NONE'}/>
            <HeaderWrapper>
                <Container maxWidth="xl">
                    <Box display="flex" alignItems="center" justifyContent="space-between" flex={2} sx={{pl:2, pr:2}}>
                        <Box>
                            <Logo />
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                            <Account />
                            <IconButton onClick={() => { toggleTheme() }} >
                                {darkMode ? (
                                    <Icon icon={baselineBrightnessHigh} />
                                ) : (
                                    <Icon icon={baselineBrightness4} />
                                )}
                            </IconButton>
                        </Stack>
                    </Box>
                </Container>
            </HeaderWrapper>
            
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
                </Grid>
                {/* <DynamicTokenList data={data}/> */}
                {/* <TokenList data={data}/> */}
            </Container>

            <ScrollToTop />

            <Footer />

        </OverviewWrapper>
        </>
    );
}

export default Overview;

const BASE_URL = 'http://135.181.118.217/api';

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    let slugs = [];
    let count = 0;
    const time = new Date().toISOString();
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/slugs`);

        count = res.data?.count;
        slugs = res.data?.slugs;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`6. sitemap/tokens count: ${count} took: ${dt}ms [${time}]`);
    } catch (e) {
        console.log(e);
    }
    
    let ret = {};
    let ogp = {};
    ogp.canonical = 'https://xrpl.to/sitemap/tokens';
    ogp.title = 'Tokens Sitemap';
    ogp.url = 'https://xrpl.to/sitemap/tokens';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.png';
    ogp.desc = 'Tokens Sitemap';

    ret = {data, ogp};

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
