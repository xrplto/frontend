import { useState } from 'react';

// Material
import {
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    Link,
    Rating,
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
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import listCheck from '@iconify/icons-ci/list-check';

// Components
import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
export default function UserDesc({token}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const [rating, setRating] = useState(2);
    const [trustToken, setTrustToken] = useState(null);

    const metrics = useSelector(selectMetrics);

    const {
        id,
        issuer,
        name,
        exch,
        pro7d,
        pro24h,
        domain,
        whitepaper,
        kyc,
        holders,
        offers,
        trustlines,
        imgExt,
        md5,
        tags,
        social,
        richlist,
        urlSlug
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
        <Stack>
            <Stack direction="row" spacing={1} alignItems='center'>
                <Avatar
                    alt={user}
                    src={imgUrl}
                    sx={{ width: 56, height: 56 }}
                />
                <Stack spacing={0.2}>
                    <Typography variant="h2" color='#22B14C' fontSize='1.1rem'>{user}</Typography>
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <Rating
                            name="simple-controlled"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                            }}
                        />
                        <Stack>
                            {kyc && (<Typography variant='kyc2'>KYC</Typography>)}
                        </Stack>
                    </Stack>
                </Stack>
                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} />
            </Stack>

            <Stack direction="row" spacing={2} sx={{mt:2, ml:1}} alignItems='center'>
                <Stack direction="row" spacing={1} alignItems='center'>
                    <Typography variant="price" noWrap>
                        $ {fNumber(exch / metrics.USD)}
                    </Typography>
                    <Typography variant="subtitle1" style={{marginTop:8}}>
                        {fNumber(exch)} XRP
                    </Typography>
                </Stack>
                <BearBullChip value={pro24h} tooltip='24h(%)'/>
                <BearBullChip value={pro7d} tooltip={
                    <Stack alignItems='center'>
                        7d (%)
                        <Box
                            component="img"
                            alt=""
                            sx={{ width: 135, height: 50, mt: 2 }}
                            src={`${BASE_URL}/sparkline/${md5}`}
                        />
                    </Stack>
                }/>
            </Stack>

            <LowHighBar24H token={token}/>

            <Stack direction="row" spacing={1} sx={{mt:2}}>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                <Chip label={trustlines + " TrustLines"} color="info" variant="outlined" size="small"/>
                <Chip label='Sponsored' icon={<Avatar sx={{ width: 24, height: 24 }} alt="xumm" src="/static/sponsor.png"/>} variant={"outlined"} size="small"/>
            </Stack>
            
            <Grid container spacing={1} alignItems='center' sx={{mt:2}}>
                {tags && tags.map((tag, idx) => {
                    return (
                        <Grid item key={md5 + idx + tag}>
                            <Chip
                                size="small"
                                label={tag}
                            />
                        </Grid>
                    );
                })}
            </Grid>
            <Grid container spacing={1} sx={{p:0,mt:2}} >
                {domain && (
                    <Grid item sx={{pb:1}}>
                        <Link
                            underline="none"
                            color="inherit"
                            target="_blank"
                            href={`https://${domain}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Chip label={domain} sx={{pl:0.5,pr:0.5}}
                                deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                onDelete={handleDelete} onClick={handleDelete}
                                icon={<Icon icon={link45deg} width="16" height="16" />} />
                        </Link>
                    </Grid>
                )}
                {whitepaper && (
                    <Grid item sx={{pb:1}}>
                        <Link
                            underline="none"
                            color="inherit"
                            target="_blank"
                            href={`${whitepaper}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Chip label={'Whitepaper'} sx={{pl:0.5,pr:0.5}}
                                deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                onDelete={handleDelete} onClick={handleDelete}
                                icon={<Icon icon={paperIcon} width="16" height="16" />} />
                        </Link>
                    </Grid>
                )}

                <Grid item sx={{pb:1}}>
                    <ExplorersMenu issuer={issuer}/>
                </Grid>

                {isChat && (
                    <Grid item sx={{pb:1}}>
                        <ChatMenu token={token}/>
                    </Grid>
                )}

                {isCommunity && (
                    <Grid item sx={{pb:1}}>
                        <CommunityMenu token={token}/>
                    </Grid>
                )}
            </Grid>
        </Stack>
    );
}
