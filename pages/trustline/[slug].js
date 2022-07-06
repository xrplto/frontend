import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Head from 'next/head';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';

// Material
import { alpha } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Container,
    Grid,
    IconButton,
    Link,
    Rating,
    styled,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import {
    Token as TokenIcon,
    SyncAlt as SyncAltIcon
} from '@mui/icons-material';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';

// Utils

// Components
import ExplorersMenu from 'src/TokenDetail/common/ExplorersMenu';
import CommunityMenu from 'src/TokenDetail/common/CommunityMenu';
import ChatMenu from 'src/TokenDetail/common/ChatMenu';
import LogoTrustline from 'src/components/LogoTrustline';

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

function TrustLine(props) {
    let data = {};
    if (props && props.data) data = props.data;
    const token = data.token;

    const [qrUrl, setQrUrl] = useState('/static/blurqr.png');

    const {
        id,
        issuer,
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

    const isCommunity = true; /*social && (social.twitter || social.facebook || social.linkedin 
        || social.instagram || social.youtube || social.medium || social.twitch || social.tiktok || social.reddit);*/
    const isChat = social && (social.telegram || social.discord);

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

    const handleDelete = () => {
    }

    return (
        <OverviewWrapper>
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
            <Card sx={{ textAlign: 'center', mt: 1, p: 1, pt:2 }}>
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
                        <Stack direction="row" spacing={1} sx={{mt:2}}>
                            {domain && (
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://${domain}`}
                                    rel="noreferrer noopener nofollow"
                                >
                                    <Chip label={domain} sx={{pl:0.5, pr:0.5}} size='small'
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
                                    <Chip label={'Whitepaper'} sx={{pl:0.5,pr:0.5}} size='small'
                                        deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                        onDelete={handleDelete} onClick={handleDelete}
                                        icon={<Icon icon={paperIcon} width="16" height="16" />} />
                                </Link>
                            )}
                        </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{mt:2}}>
                        <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                        <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                        <Chip label={trustlines + " TrustLines"} color="info" variant="outlined" size="small"/>
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

                    <Stack direction="row" spacing={1} sx={{mt:5, mb:7}}>
                        <Box
                            component="img"
                            alt="QR"
                            src={qrUrl}
                            sx={{width:200,height:200}}
                        />
                    </Stack>
                    
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

const BASE_URL = 'http://135.181.118.217/api';

export async function getServerSideProps(ctx) {
    let data = null;
    try {
        const slug = ctx.params.slug;
        var t1 = performance.now();

        // https://api.xrpl.to/api/detail/bitstamp-usd
        const res = await axios.get(`${BASE_URL}/token/${slug}`);

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
