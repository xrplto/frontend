import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import chatIcon from '@iconify/icons-bi/chat';
import linkExternal from '@iconify/icons-charm/link-external';
import codeIcon from '@iconify/icons-bytesize/code';
import personFill from '@iconify/icons-bi/person-fill';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
import twitterFill from '@iconify/icons-akar-icons/twitter-fill';

import {
    Chip,
    Grid,
    Link
} from '@mui/material';

import ExplorersMenu from './ExplorersMenu';

export default function LinkDesc({token}) {
    const {
        name,
        domain,
        twitter,
        acct,
        /*
        id,
        kyc,
        holders,
        offers,
        code,
        date,
        amt,
        trline,        
        exch*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const handleDelete = () => {
    }

    return (
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
            {twitter && (
                <Grid item sx={{pb:1}}>
                    <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={`https://twitter.com/${twitter}`}
                        rel="noreferrer noopener"
                    >
                        <Chip label={twitter} sx={{pl:0.5,pr:0.5}}
                            deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                            onDelete={handleDelete} onClick={handleDelete}
                            icon={<Icon icon={twitterFill} width="16" height="16" />} />
                    </Link>
                </Grid>
            )}
            <Grid item sx={{pb:1}}>
                <ExplorersMenu acct={acct}/>
            </Grid>
            <Grid item sx={{pb:1}}>
                <Chip label="Chat" sx={{pl:0.5,pr:0.5}}
                    deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={chatIcon} width="16" height="16" />} />
            </Grid>
            <Grid item sx={{pb:1}}>
                <Chip label="Source code" sx={{pl:0.5,pr:0.5}}
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={codeIcon} width="16" height="16" />} />
            </Grid>
            <Grid item sx={{pb:1}}>
                <Chip label="Community" sx={{pl:0.5,pr:0.5}}
                    deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={personFill} width="16" height="16" />} />
            </Grid>
        </Grid>
    );
}
