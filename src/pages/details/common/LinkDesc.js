import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import chatIcon from '@iconify/icons-bi/chat';
import linkExternal from '@iconify/icons-charm/link-external';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
import twitterFill from '@iconify/icons-akar-icons/twitter-fill';
import paperIcon from '@iconify/icons-akar-icons/paper';


import {
    Chip,
    Grid,
    Link
} from '@mui/material';

import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';

export default function LinkDesc({token}) {
    const {
        name,
        domain,
        whitepaper,
        social,
        issuer,
    } = token;

    let user = token.user;
    if (!user) user = name;

    const isCommunity = true; /*social && (social.twitter || social.facebook || social.linkedin 
        || social.instagram || social.youtube || social.medium || social.twitch || social.tiktok || social.reddit);*/
    const isChat = social && (social.telegram || social.discord);

    const handleDelete = () => {
    }

    return (
        <Grid container spacing={1} sx={{p:0,mt:0}} >
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
    );
}
