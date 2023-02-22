// Material
import {
    alpha,
    styled,
    Box,
    Container,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";
import useWebSocket, { ReadyState } from 'react-use-websocket';
// ----------------------------------------------------------------------

// Iconify Icons
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
// import postageStamp from '@iconify/icons-mdi/postage-stamp';
// import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
// import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

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

const ContentWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: 1,
    py: 1,
    overflow: "auto",
    width: "100%",
    justifyContent: 'space-between',
    "& > *": {
        scrollSnapAlign: "center",
    },
    "::-webkit-scrollbar": { display: "none" },
}));

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

// ----------------------------------------------------------------------

function Rate(num) {
    if (num === 0)
        return 0;
    return fCurrency3(1 / num);
}

export default function Topbar() {
    const metrics = useSelector(selectMetrics);

    return (
        <TopWrapper>
            <Container maxWidth="xl">
                <ContentWrapper>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="small">Tokens: </Typography>
                        <Typography variant="small">{fIntNumber(metrics.count)}</Typography>
                        <H24Style>
                            <Tooltip title="Metrics on 24 hours">
                                <Stack spacing={0} alignItems='center'>
                                    <Typography align="center" style={{ wordWrap: "break-word" }} variant="small" >
                                        24h
                                    </Typography>
                                </Stack>
                            </Tooltip>
                        </H24Style>
                        <Typography variant="small">Trades:</Typography>
                        <Typography align="center" color="#74CAFF" variant="small">{fIntNumber(metrics.H24.transactions24H)}</Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small">Vol:</Typography>
                        <Typography align="center" color="#FF6C40" variant="small">
                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                <Icon icon={rippleSolid} color="#54D62C"/>
                                <Typography align="center" color="#54D62C" variant="small">
                                    {fNumber(metrics.H24.tradedXRP24H)}
                                </Typography>
                            </Stack>
                        </Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small" noWrap>Tokens Traded:</Typography>
                        <Typography align="center" color="#3366FF" variant="small">{fIntNumber(metrics.H24.tradedTokens24H)}</Typography>
                        <Typography variant="small" noWrap>Active Addresses:</Typography>
                        <Typography align="center" color="#3366FF" variant="small">{fIntNumber(metrics.H24.activeAddresses24H)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ml:5, mr:2}}>
                        <Stack direction="row" spacing={0.5} alignItems='center'>
                            <Icon icon={rippleSolid} width='12' height='12'/>
                            <Typography variant="small">1</Typography>
                        </Stack>
                        <Separator>|</Separator>
                        <Typography variant="small" noWrap>$ {Rate(metrics.USD)}</Typography>
                        <Separator>|</Separator>
                        <Typography variant="small" noWrap>€ {Rate(metrics.EUR)}</Typography>
                        <Separator>|</Separator>
                        <Typography variant="small" noWrap>¥ {Rate(metrics.JPY)}</Typography>
                    </Stack>
                </ContentWrapper>
            </Container>
        </TopWrapper>
    );
}

