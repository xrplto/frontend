import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Button,
    Card,
    Container,
    Divider,
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
import TokenList from 'src/content/TokenList';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectStatus, update_status } from "src/redux/statusSlice";

// Iconify Icons
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
import postageStamp from '@iconify/icons-mdi/postage-stamp';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

// Utils
import { fIntNumber, fCurrency3, fNumber } from 'src/utils/formatNumber';

const TopWrapper = styled(Box)(({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(3)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`);

const H24Style = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    paddingTop: theme.spacing(0.07),
    paddingBottom: theme.spacing(0.07),
    // boxShadow: theme.customShadows.z20,
    // color: theme.palette.text.widget,
    backgroundColor: '#0C53B7',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
}));

const Separator = styled('span')(({ theme }) => ({
    fontSize: '0.4rem'
}));

// const ContentTypography = withStyles({
//     root: {
//         color: alpha('#919EAB', 0.99)
//     }
// })(Typography);
// ----------------------------------------------------------------------

function Rate(num) {
    if (num === 0)
        return 0;
    return fCurrency3(1 / num);
}

function Overview() {
    const { toggleTheme, darkMode } = useContext(AppContext);
    const status = useSelector(selectStatus);
    return (
        <TopWrapper>
            <Container maxWidth="xl">
                <Box display="flex" alignItems="center" justifyContent="space-between" flex={1} sx={{pl:2.5, pr:3}}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="small">Tokens: </Typography>
                        <Typography variant="small">{fIntNumber(status.token_count)}</Typography>
                        <H24Style>
                            <Tooltip title="Metrics on 24 hours">
                                <Stack spacing={0} alignItems='center'>
                                    <Typography align="center" style={{ wordWrap: "break-word" }} variant="small" >
                                        24h
                                    </Typography>
                                </Stack>
                            </Tooltip>
                        </H24Style>
                        <Typography variant="small">Tx:</Typography>
                        <Typography align="center" color="#74CAFF" variant="small">{fIntNumber(status.transactions24H)}</Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small">Vol:</Typography>
                        <Typography align="center" color="#FF6C40" variant="small">
                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                <Icon icon={rippleSolid} color="#54D62C"/>
                                <Typography align="center" color="#54D62C" variant="small">
                                    {fNumber(status.tradedXRP24H)}
                                </Typography>
                            </Stack>
                        </Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small">Tokens Traded:</Typography>
                        <Typography align="center" color="#3366FF" variant="small">{fIntNumber(status.tradedTokens24H)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems='center'>
                            <Icon icon={rippleSolid} width='12' height='12'/>
                            <Typography variant="small">1</Typography>
                        </Stack>
                        <Separator>|</Separator>
                        <Typography variant="small">$ {Rate(status.USD)}</Typography>
                        <Separator>|</Separator>
                        <Typography variant="small">€ {Rate(status.EUR)}</Typography>
                        <Separator>|</Separator>
                        <Typography variant="small">¥ {Rate(status.JPY)}</Typography>
                    </Stack>
                </Box>
            </Container>
        </TopWrapper>
    );
}

export default Overview;

Overview.getLayout = function getLayout(page) {
    return <BaseLayout>{page}</BaseLayout>;
};
