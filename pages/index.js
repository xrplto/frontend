import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
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

import Link from 'src/components/Link';
import Head from 'next/head';

import Logo from 'src/components/LogoSign';
import Account from 'src/components/Account';
import Hero from 'src/content/Overview';

import TopMark from 'src/layouts/TopMark';
import TokenList from 'src/content/TokenList';

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

const HeaderWrapper = styled(Card)(
  ({ theme }) => `
  width: 100%;
  display: flex;
  align-items: center;
  height: ${theme.spacing(10)};
  margin-bottom: ${theme.spacing(0)};
  border-radius: 0px;
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

function Overview() {
    const { toggleTheme, darkMode } = useContext(AppContext);
    // const status = useSelector(selectStatus);
    return (
        <OverviewWrapper>
            <Head>
                <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
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
            
            <TopMark md5={'NONE'}/>

            <TokenList />

            <Container maxWidth="xl" sx={{ mt: 8 }}>
                <Typography textAlign="center" variant="subtitle1">
                    &copy; 2022 XRPL.TO
                </Typography>
            </Container>
        </OverviewWrapper>
    );
}

export default Overview;

Overview.getLayout = function getLayout(page) {
  return <BaseLayout>{page}</BaseLayout>;
};
