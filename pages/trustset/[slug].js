import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import Decimal from 'decimal.js';

// Material
import {
    alpha,
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Container,
    Grid,
    Link,
    Slide,
    Snackbar,
    Stack,
    styled,
    Typography
} from '@mui/material';

import LoadingButton from '@mui/lab/LoadingButton';

import {
    Token as TokenIcon
} from '@mui/icons-material';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import LogoTrustline from 'src/components/LogoTrustline';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

const OverviewWrapper = styled(Box) (
  ({ theme }) => `
    align-items: center;
    justify-content: center;
    display: flex;
    background: '${theme.palette.common.white}';
    flex: 1;
    overflow-x: hidden;
`
);

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const MSG_COPIED = 1;
const ERR_INVALID_VALUE = 2;
const ERR_NETWORK = 3;
const ERR_TIMEOUT = 4;
const ERR_REJECTED = 5;
const MSG_SUCCESSFUL = 6;

function TrustLine(props) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const QR_BLUR = '/static/blurqr.png';

    let data = {};
    if (props && props.data) data = props.data;
    const token = data.token;

    const metrics = useSelector(selectMetrics);

    const [state, setState] = useState({
        openSnack: false,
        message: ERR_NONE
    });

    const { message, openSnack } = state;

    const [qrUrl, setQrUrl] = useState(QR_BLUR);
    const [uuid, setUuid] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);

    const [loading, setLoading] = useState(false);

    const [counter, setCounter] = useState(150);

    const {
        id,
        issuer,
        currency,
        amount,
        date,
        exch,
        name,
        domain,
        whitepaper,
        kyc,
        holders,
        offers,
        trustlines,
        imgExt,
        md5,
        tags,
        social
    } = token;

    let user = token.user;
    if (!user) user = name;

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

    const marketcap = amount * exch / metrics.USD;

    let date_fixed = '';
    try {
        if (date) {
            date_fixed = date.split('T')[0];
        }
    } catch (e) { }

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var count = counter;
        async function getPayload() {
            // console.log(count + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
                const res = ret.data.data.response;
                // const account = res.account;
                const resolved_at = res.resolved_at;
                const dispatched_result = res.dispatched_result;
                if (resolved_at) {
                    setQrUrl(QR_BLUR); setUuid(null); setNextUrl(null);
                    if (dispatched_result && dispatched_result === 'tesSUCCESS') {
                        showAlert(MSG_SUCCESSFUL);
                    }
                    else
                        showAlert(ERR_REJECTED);

                    return;
                }
            } catch (err) {
            }
            isRunning = false;
            count--;
            setCounter(count);
            if (count <= 0) {
                showAlert(ERR_TIMEOUT);
                handleScanQRClose();
            }
        }
        if (uuid) {
            timer = setInterval(getPayload, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [uuid]);

    const onTrustSetXumm = async () => {
        /*{
            "TransactionType": "TrustSet",
            "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            "Fee": "12",
            "Flags": 262144,
            "LastLedgerSequence": 8007750,
            "LimitAmount": {
              "currency": "USD",
              "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
              "value": "100"
            },
            "Sequence": 12
        }*/
        setCounter(150);
        setLoading(true);
        try {
            // message: "Error: Payload encoding error: Decimal precision out of range"
            let LimitAmount = {};
            LimitAmount.issuer = issuer;
            LimitAmount.currency = currency;
            LimitAmount.value = new Decimal(amount).toDP(0, Decimal.ROUND_DOWN).toNumber();
            
            const body={ LimitAmount };

            const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

            if (res.status === 200) {
                const uuid = res.data.data.uuid;
                const qrlink = res.data.data.qrUrl;
                const nextlink = res.data.data.next;

                setUuid(uuid);
                setQrUrl(qrlink);
                setNextUrl(nextlink);
            }
        } catch (err) {
            console.log(err);
            showAlert(ERR_NETWORK);
        }
        setLoading(false);
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
            if (res.status === 200) {
                setUuid(null);
            }
        } catch(err) {
        }
        setQrUrl(QR_BLUR); setUuid(null); setNextUrl(null);
        setLoading(false);
    };

    const handleScanQRClose = () => {
        onDisconnectXumm(uuid);
    };

    const handleDelete = () => {
    }

    const handleTrustSet = () => {
        if (uuid)
            onDisconnectXumm(uuid);
        else
            onTrustSetXumm();
    }

    const handleCloseSnack = () => {
        setState({ openSnack: false, message: message });
    };

    const showAlert = (msg) => {
        setState({ openSnack: true, message: msg });
    }

    return (
        <OverviewWrapper>
            <Snackbar
                autoHideDuration={2000}
                anchorOrigin={{ vertical:'top', horizontal:'right' }}
                open={openSnack}
                onClose={handleCloseSnack}
                TransitionComponent={TransitionLeft}
                key={'TransitionLeft'}
            >
                <Alert variant="filled" severity={message === MSG_SUCCESSFUL || message === MSG_COPIED?"success":"error"} sx={{ m: 2, mt:0 }}>
                    {message === ERR_REJECTED && 'Operation rejected!'}
                    {message === MSG_SUCCESSFUL && 'Successfully set trustline!'}
                    {message === ERR_INVALID_VALUE && 'Invalid value!'}
                    {message === ERR_NETWORK && 'Network error!'}
                    {message === ERR_TIMEOUT && 'Timeout!'}
                    {message === MSG_COPIED && 'Copied!'}
                </Alert>
            </Snackbar>

            <Container maxWidth="sm" sx={{ ml:5, mr: 3, mt: 0, mb: 10 }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
            >
                <LogoTrustline />
                <Typography variant='h1_trustline' sx={{pt:2}}>Set {name} TrustLine</Typography>
            </Stack>
            <Card sx={{ mt: 1, p: 1, pt:2 }}>
                <Stack alignItems='center'>
                    <Stack direction="row" spacing={1} alignItems='center'>
                        <Avatar
                            alt={user}
                            src={imgUrl}
                            sx={{ width: 64, height: 64 }}
                        />
                        <Stack spacing={1}>
                            <Typography variant="h2" color='#22B14C' fontSize='1.2rem'>{user}</Typography>
                            <Stack direction='row'>
                                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} size='small'/>
                            </Stack>
                        </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{mt:2}}>
                        {domain && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://${domain}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Chip label={domain} sx={{pl:0.5, pr:0.5}}
                                    size='small'
                                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                    onDelete={handleDelete} onClick={handleDelete}
                                    icon={<Icon icon={link45deg} width="16" height="16" />} />
                            </Link>
                        )}
                        
                        {whitepaper && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`${whitepaper}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Chip label={'Whitepaper'} sx={{pl:0.5,pr:0.5}}
                                    size='small'
                                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                    onDelete={handleDelete} onClick={handleDelete}
                                    icon={<Icon icon={paperIcon} width="16" height="16" />} />
                            </Link>
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{mt:2}}>
                        <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                        <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                        <Chip label={trustlines + " TrustLines"} color="info" variant="outlined" size="small"/>
                        {kyc && <Chip label={'KYC'} color="primary" variant="outlined" size="small"/>}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{mt:2}}>
                        {social && social.telegram && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://t.me/${social.telegram}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="telegram" src="/static/telegram.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.discord && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://discord.gg/${social.discord}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="discord" src="/static/discord.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.twitter && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://twitter.com/${social.twitter}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="twitter" src="/static/twitter.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.facebook && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://facebook.com/${social.facebook}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="facebook" src="/static/facebook.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.linkedin && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://linkedin.com/${social.linkedin}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="linkedin" src="/static/linkedin.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.instagram && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://instagram.com/${social.instagram}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="instagram" src="/static/instagram.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.youtube && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://youtube.com/${social.youtube}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="youtube" src="/static/youtube.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.medium && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://medium.com/${social.medium}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="medium" src="/static/medium.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.twitch && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://twitch.tv/${social.twitch}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="twitch" src="/static/twitch.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.tiktok && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://tiktok.com/${social.tiktok}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="tiktok" src="/static/tiktok.png" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                        {social && social.reddit && (
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://www.reddit.com/${social.reddit}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Avatar alt="reddit" src="/static/reddit.svg" sx={{ mr:1, width: 24, height: 24 }} />
                            </Link>
                        )}
                    </Stack>

                    <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start" sx={{mt:3, mb:3}}>
                        <Grid item sm={6} sx={{pl:5, pt:2}}>
                            <Stack>
                                <Label>CREATED ON</Label>
                                <Typography variant='subtitle1' color='primary' sx={{mb:1}}>
                                    {date_fixed}
                                </Typography>
                                <Label>TOTAL SUPPLY</Label>
                                <Typography variant='subtitle1' color='primary' sx={{mb:1}}>
                                    {fNumber(amount)}
                                </Typography>
                                <Label>MARKET CAP</Label>
                                <Typography variant='subtitle1' color='primary' sx={{mb:1}}>
                                    ${fNumber(marketcap)}
                                </Typography>
                            </Stack>
                        </Grid>
                        
                        <Grid item sm={6}>
                            <Stack alignItems='center'>
                                <Box
                                    component="img"
                                    alt="QR"
                                    src={qrUrl}
                                    sx={{width:200,height:200}}
                                />
                                <Stack direction='row' spacing={1} alignItems='center'>
                                <LoadingButton
                                    size="small"
                                    onClick={handleTrustSet}
                                    loading={loading}
                                    variant="outlined"
                                    color={uuid?"error":"success"}
                                    sx={{mt:1}}
                                >
                                    {uuid ? `Cancel (${counter})`:`Generate QR`}
                                </LoadingButton>

                                {nextUrl && 
                                    <Link
                                        underline="none"
                                        color="inherit"
                                        target="_blank"
                                        href={nextUrl}
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{mt:1}}
                                        >Open in XUMM</Button>
                                    </Link>
                                }
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                    
                </Stack>
                </Card>
            </Container>

            {/* <Container maxWidth="xl" sx={{ ml:5, mr: 3, mt: 2, mb: 8 }}>
                <Typography textAlign="left" variant="subtitle1">
                    &copy; 2022 XRPL.TO
                </Typography>
            </Container> */}
        </OverviewWrapper>
    );
}

export default TrustLine;

export async function getServerSideProps(ctx) {
    const BASE_URL = 'http://135.181.118.217/api';

    let data = null;
    try {
        const slug = ctx.params.slug;
        var t1 = performance.now();

        // https://api.xrpl.to/api/detail/bitstamp-usd
        const res = await axios.get(`${BASE_URL}/token/${slug}`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`3. getServerSideProps(trustline) slug: ${slug} took: ${dt}ms`);
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

        ogp.canonical = `https://xrpl.to/trustset/${urlSlug}`;
        ogp.title = `${name} Trustline On The XRP Ledger`;
        ogp.url = `https://xrpl.to/trustset/${urlSlug}`;
        ogp.imgUrl = `https://xrpl.to/static/tokens/${md5}.${imgExt}`;
        ogp.desc = `Setup ${name} Trustline On The XRPL.`;

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
