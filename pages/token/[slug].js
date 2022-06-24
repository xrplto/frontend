import axios from 'axios'
import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
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
import { selectStatus, update_status } from "src/redux/statusSlice";

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
    const { toggleTheme, darkMode, setLoading } = useContext(AppContext);
    let data = {};
    if (props && props.data) data = props.data;

    return (
        <OverviewWrapper>
            {/* <Head>
            <title>2XRPL Token Prices, Charts, Market Volume And Activity</title>
            </Head> */}
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

            <Container maxWidth="xl" sx={{ mt: 8 }}>
                <Typography textAlign="center" variant="subtitle1">
                    &copy; 2022 XRPL.TO
                </Typography>
            </Container>
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

        console.log(`getServerSideProps slug: ${slug} took: ${dt}ms`);
    } catch (e) {

    }
    let ret = {};
    if (data) ret = {data};

    return {
        props: ret, // will be passed to the page component as props
    }
}
