import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
import Head from 'next/head';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router'
import { performance } from 'perf_hooks';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Button,
    Card,
    Container,
    IconButton,
    styled,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import BaseLayout from 'src/layouts/BaseLayout';

// import Link from 'src/components/Link';
// import Head from 'next/head';

import Logo from 'src/components/LogoSign';
import Account from 'src/components/Account';
import Hero from 'src/content/Overview';

import TopMark from 'src/layouts/TopMark';
import TokenDetail from 'src/content/TokenDetail';

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

function Detail(props) {
    const { toggleTheme, darkMode } = useContext(AppContext);
    let data = {};
    if (props && props.data) data = props.data;
    const token = data.token;

    return (
        <OverviewWrapper>
            <Head>
            {/* <!-- HTML Meta Tags --> */}
            {/* <title>{title}</title> */}
            {/* <meta name="description" content={desc}/> */}

            {/* <!-- Facebook Meta Tags --> */}
            {/* <meta property="og:url" content={url}/> */}
            {/* <meta property="og:type" content="website"/> */}
            {/* <meta property="og:title" content={`${title} | XRPL.TO`}/> */}
            {/* <meta property="og:description" content={desc}/> */}
            {/* <meta property="og:image" content={imgUrl}/> */}
            {/* <!-- Twitter Meta Tags --> */}
            {/* <meta name="twitter:card" content="summary_large_image"/> */}
            {/* <meta property="twitter:domain" content="xrpl.to"/> */}
            {/* <meta property="twitter:url" content={url}/> */}
            {/* <meta name="twitter:title" content={`${title} | XRPL.TO`}/> */}
            {/* <meta name="twitter:description" content={desc}/> */}
            {/* <!-- <meta name="twitter:image" content="/static/ogp.png"/> --> */}
            {/* <meta name="twitter:image" content={`http://xrpl.to/static/tokens/${md5}.${imgExt}`}/> */}
            {/* <meta name="twitter:image:src" content={`http://xrpl.to/static/tokens/${md5}.${imgExt}`}/> */}
            {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}

            </Head>
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
            
            <TokenDetail data={data}/>

            {/* <Container maxWidth="xl" sx={{ ml:5, mr: 3, mt: 2, mb: 8 }}>
                <Typography textAlign="left" variant="subtitle1">
                    &copy; 2022 XRPL.TO
                </Typography>
            </Container> */}
        </OverviewWrapper>
    );
}

export default Detail;

Detail.getLayout = function getLayout(page) {
    return <BaseLayout>{page}</BaseLayout>;
};

const BASE_URL = 'https://api.xrpl.to/api';

export async function getServerSideProps(ctx) {
    let data = null;
    try {
        const slug = ctx.params.slug;
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/detail/${slug}?range=1D`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`2. getServerSideProps slug: ${slug} took: ${dt}ms`);
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

        ogp.title = `${user} price today, ${name} to USD live, volume, trading history, markets and chart`;
        ogp.ogTitle = `${user} price today, ${name} to USD live, volume, trading history, markets and chart | XRPL.TO`;
        ogp.url = `https://xrpl.to/token/${urlSlug}`;
        ogp.imgUrl = `/static/tokens/${md5}.${imgExt}`;
        ogp.imgUrlTwitter = `http://xrpl.to/static/tokens/${md5}.${imgExt}`;
        ogp.desc = `Get the latest ${user} price, ${name} market cap, trading pairs, charts and data today from the world's number one XRP Ledger token price-tracking website`;

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
    }
}
