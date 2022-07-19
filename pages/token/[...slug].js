import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Head from 'next/head';
import { performance } from 'perf_hooks';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    IconButton,
    styled,
    Stack,
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
import TokenDetail from 'src/TokenDetail';
import Footer from 'src/layouts/Footer';

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
    overflow: hidden;
    background: ${theme.palette.common.white};
    flex: 1;
`
);

function Detail(props) {
    const { toggleTheme, darkMode } = useContext(AppContext);
    let data = {};
    if (props && props.data) data = props.data;
    const token = data.token;

    return (
        <OverviewWrapper>
            <Topbar md5={token.md5}/>
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

            <Footer />
        </OverviewWrapper>
    );
}

export default Detail;

const BASE_URL = 'http://135.181.118.217/api';

export async function getServerSideProps(ctx) {
    let data = null;
    try {

        const params = ctx.params.slug;

        const slug = params[0];
        const tab = params[1];

        var t1 = performance.now();

        // https://api.xrpl.to/api/richlist/xrdoge-classic-xrdc?start=0&limit=10&freeze=false
        const res = await axios.get(`${BASE_URL}/richlist/${slug}?start=0&limit=10&freeze=false`);

        // https://api.xrpl.to/api/detail/bitstamp-usd
        // const res = await axios.get(`${BASE_URL}/token/${slug}`);

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
