import { useEffect } from 'react';

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
import useWebSocket/*, { ReadyState }*/ from 'react-use-websocket';
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

// const ContentWrapper = styled(Box)(({ theme }) => `
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     flex: 1;
//     overflow-x: auto;
//     "::-webkit-scrollbar": { display: "none" }
// `);

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

function Topbar({md5}) {
    const dispatch = useDispatch();
    const metrics = useSelector(selectMetrics);

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(`wss://api.xrpl.to/ws/detail/${md5}`);

    /*const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    } [readyState];*/

    useEffect(() => {
        try {
            // [transactions24H, tradedXRP24H, tradedTokens24H, timeCalc24H, timeSchedule, CountApiCall];
            const res = lastMessage.data;
            const json = JSON.parse(res);
            const metrics = {
                count: json.count,
                USD: json.exch.USD,
                EUR: json.exch.EUR,
                JPY: json.exch.JPY,
                CNY: json.exch.CNY,
                H24: json.H24,
                global: json.global
            };
            dispatch(update_metrics(metrics));
        } catch(err) {}
    }, [lastMessage, dispatch]);

    useEffect(() => {
        function getStatus() {
            //if (connectionStatus === 'open')
            if (md5)
                sendMessage(md5);
            else
                sendMessage('Hello');
        }
        
        const timer = setInterval(() => getStatus(), 10000)

        return () => {
            clearInterval(timer);
        }
    }, [readyState, sendMessage, md5]);
    
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
                        <Typography align="center" color="#74CAFF" variant="small">{fIntNumber(metrics.H24[0])}</Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small">Vol:</Typography>
                        <Typography align="center" color="#FF6C40" variant="small">
                            <Stack direction="row" spacing={0.5} alignItems='center'>
                                <Icon icon={rippleSolid} color="#54D62C"/>
                                <Typography align="center" color="#54D62C" variant="small">
                                    {fNumber(metrics.H24[1])}
                                </Typography>
                            </Stack>
                        </Typography>
                        {/* <Typography variant="small">|</Typography> */}
                        <Typography variant="small" noWrap>Tokens Traded:</Typography>
                        <Typography align="center" color="#3366FF" variant="small">{fIntNumber(metrics.H24[2])}</Typography>
                        <Typography variant="small" noWrap>Active Addresses:</Typography>
                        <Typography align="center" color="#3366FF" variant="small">{fIntNumber(metrics.H24[3])}</Typography>
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

export default Topbar;

