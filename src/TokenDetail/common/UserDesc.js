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
    styled,
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
import TrustSet from './TrustSet';

const ContentWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: '0.3em',
    py: 1.5,
    overflow: "auto",
    width: "100%",
    "& > *": {
        scrollSnapAlign: "center",
    },
    "::-webkit-scrollbar": { display: "none" },
}));

// ----------------------------------------------------------------------
export default function UserDesc({token}) {
    const [rating, setRating] = useState(2);
    const [trustToken, setTrustToken] = useState(null);

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
        social,
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

    const handleSetTrust = (e) => {
        setTrustToken(token);
    }
  
    return (
        <Stack>
            <TrustSet token={trustToken} setToken={setTrustToken}/>
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
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Rank by Volume(24h)</Typography>}>
                    <Chip label={'Rank #' + id} color="primary" variant="outlined" size="small"/>
                </Tooltip>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                <Chip label={trustlines + " TrustLines"} color="info" variant="outlined" size="small"/>
                <Chip label='Sponsored' color="primary" variant={"outlined"} size="small" icon={<Avatar sx={{ width: 16, height: 16 }} src="/static/sponsor.png"/>}  />
            </Box>

            {/* <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
            >
                {tags && tags.map((tag, idx) => {
                    return (
                        <Chip
                            size="small"
                            label={tag}
                        />
                    );
                })}
            </Box> */}

            <Grid container spacing={1} alignItems='center' sx={{mt:1}}>
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

            <Grid container spacing={1} sx={{p:0,mt:1}} >
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
                    <Chip label={'TrustSet'} sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleSetTrust}
                        icon={<Icon icon={arrowsExchange} width="18" height="18"/>} />
                </Grid>

                <Grid item sx={{pb:1}}>
                    <ExplorersMenu issuer={issuer}/>
                </Grid>
                {isChat && (
                    <Grid item sx={{pb:1}}>
                        <ChatMenu token={token}/>
                    </Grid>
                )}
                {/* <Grid item sx={{pb:1}}>
                    <Chip label="Source code" sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleDelete}
                        icon={<Icon icon={codeIcon} width="16" height="16" />} />
                </Grid> */}
                {isCommunity && (
                    <Grid item sx={{pb:1}}>
                        <CommunityMenu token={token}/>
                    </Grid>
                )}
            </Grid>
        </Stack>
    );
}
