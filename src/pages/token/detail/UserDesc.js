import { useState } from 'react';
//import { withStyles } from '@mui/styles';
//import { styled } from '@mui/material/styles';

import {
    Token as TokenIcon
} from '@mui/icons-material';

import { Icon } from '@iconify/react';
//import linkChain from '@iconify/icons-akar-icons/link-chain';
import link45deg from '@iconify/icons-bi/link-45deg';
import chatIcon from '@iconify/icons-bi/chat';
import linkExternal from '@iconify/icons-charm/link-external';
import zoomIcon from '@iconify/icons-cil/zoom';
import codeIcon from '@iconify/icons-bytesize/code';
import personFill from '@iconify/icons-bi/person-fill';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
import twitterFill from '@iconify/icons-akar-icons/twitter-fill';

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

/* success 3366FF  secondary FF6C40 */

/*const CustomChip = styled(Chip)(({ theme }) => ({
    color: '#3366FF'
}));

const HoldersChip = withStyles({
    root: {
        "&&:hover": {
            backgroundColor: "purple"
        },
        "&&:focus": {
            backgroundColor: "green"
        }
    }
})(Chip);

const OffersChip = withStyles({
    root: {
        "&&:hover": {
            backgroundColor: "purple"
        },
        "&&:focus": {
            backgroundColor: "green"
        }
    }
})(Chip);*/

export default function TokenDetail({token}) {
    const [rating, setRating] = useState(2);

    const {
        id,
        name,
        domain,
        kyc,
        twitter,
        holders,
        offers,
        acct,
        /*code,
        date,
        amt,
        trline,        
        exch*/
    } = token;

    const imgUrl = `/static/tokens/${name}.jpg`;
  
    let user = token.user;
    if (!user) user = name;

    const handleDelete = () => {
    }

    return (
        <Stack sx={{mt:1}}>
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
                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body1">Rank by Market Cap</Typography>}>
                    <Chip label={'Rank #' + id} color="primary" variant="outlined" size="small"/>
                </Tooltip>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="success" variant="outlined" size="small"/>
            </Stack>
            <Grid container spacing={1} sx={{p:0,mt:2}} >
                {domain && (
                    <Grid item>
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
                    <Grid item>
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
                <Grid item>
                    <ExplorersMenu acct={acct}/>
                </Grid>
                <Grid item>
                    <Chip label="Chat" sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleDelete}
                        icon={<Icon icon={chatIcon} width="16" height="16" />} />
                </Grid>
                <Grid item>
                    <Chip label="Source code" sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleDelete}
                        icon={<Icon icon={codeIcon} width="16" height="16" />} />
                </Grid>
                <Grid item>
                    <Chip label="Community" sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleDelete}
                        icon={<Icon icon={personFill} width="16" height="16" />} />
                </Grid>
            </Grid>
        </Stack>
    );
}
