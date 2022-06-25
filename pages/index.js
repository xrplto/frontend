import axios from 'axios'
import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
import { NextSeo } from 'next-seo';
import { performance } from 'perf_hooks';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    IconButton,
    styled,
    Stack,
    Typography
} from '@mui/material';
import BaseLayout from 'src/layouts/BaseLayout';

import Link from 'src/components/Link';
import Head from 'next/head';

import Logo from 'src/components/LogoSign';
import Account from 'src/components/Account';

import TopMark from 'src/layouts/TopMark';
import TokenList from 'src/content/TokenList';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

// Iconify Icons
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

// Utils

// Components
import Topbar from 'src/layouts/Topbar';

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
        <OverviewWrapper>
            <Topbar/>
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
            
            <TopMark md5={'NONE'}/>

            <TokenList data={data}/>

            {/* <Container maxWidth="xl" sx={{ ml:5, mr: 3, mt: 2, mb: 8 }}>
                <Typography textAlign="left" variant="subtitle1">
                    &copy; 2022 XRPL.TO
                </Typography>
            </Container> */}
        </OverviewWrapper>
    );
}

export default Overview;

Overview.getLayout = function getLayout(page) {
    return <BaseLayout>{page}</BaseLayout>;
};

const BASE_URL = 'https://api.xrpl.to/api';

export async function getServerSideProps(ctx) {
    // https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false
    let data = null;
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`1. getServerSideProps tokens: ${data.tokens.length} took: ${dt}ms`);
    } catch (e) {
        console.log(e);
    }
    let ret = {};
    if (data) {
        let ogp = {};

        ogp.title = 'XRPL Token Prices, Charts, Market Volume And Activity';
        ogp.ogTitle = 'XRPL Token Prices, Charts, Market Volume And Activity | XRPL.TO';
        ogp.url = 'https://xrpl.to/';
        ogp.imgUrl = '/static/ogp.png';
        ogp.imgUrlTwitter = 'http://xrpl.to/static/ogp.png';
        ogp.desc = 'Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed.';

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
    }
}
