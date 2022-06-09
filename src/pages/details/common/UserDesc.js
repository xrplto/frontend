import { useState } from 'react';

import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';

import {
    Token as TokenIcon
} from '@mui/icons-material';

import {
    Avatar,
    Chip,
    Grid,
    Link,
    Rating,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';

export default function UserDesc({token}) {
    const [rating, setRating] = useState(2);

    const {
        id,
        issuer,
        name,
        domain,
        whitepaper,
        kyc,
        holders,
        offers,
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
        <Stack>
            <Stack direction="row" spacing={1} alignItems='center'>
                <Avatar
                    alt={user}
                    src={imgUrl}
                    sx={{ width: 56, height: 56 }}
                />
                <Stack spacing={0.2}>
                    <Typography variant={"h4"}>{user}</Typography>
                    <Rating
                        name="simple-controlled"
                        value={rating}
                        onChange={(event, newValue) => {
                            setRating(newValue);
                        }}
                    />
                </Stack>
                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{mt:2}}>
                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Rank by Volume(24h)</Typography>}>
                    <Chip label={'Rank #' + id} color="primary" variant="outlined" size="small"/>
                </Tooltip>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                {kyc && (
                    <Chip label={'KYC'} color="success" variant="outlined" size="small"/>
                )}
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
                            rel="noreferrer noopener"
                        >
                            <Chip label={domain} sx={{pl:0.5,pr:0.5}}
                                deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                onDelete={handleDelete} onClick={handleDelete}
                                icon={<Icon icon={link45deg} width="16" height="16" />} />
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
                {whitepaper && (
                    <Grid item sx={{pb:1}}>
                        <Link
                            underline="none"
                            color="inherit"
                            target="_blank"
                            href={`${whitepaper}`}
                            rel="noreferrer noopener"
                        >
                            <Chip label={'Whitepaper'} sx={{pl:0.5,pr:0.5}}
                                deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                                onDelete={handleDelete} onClick={handleDelete}
                                icon={<Icon icon={paperIcon} width="16" height="16" />} />
                        </Link>
                    </Grid>
                )}
            </Grid>
        </Stack>
    );
}
