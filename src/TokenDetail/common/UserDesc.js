import { useState } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import {
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Link,
    Rating,
    Stack,
    styled,
    Tooltip,
    Typography
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import LocalFloristTwoToneIcon from '@mui/icons-material/LocalFloristTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import copyIcon from '@iconify/icons-ph/copy';
// import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
// import listCheck from '@iconify/icons-ci/list-check';
import blackholeIcon from '@iconify/icons-arcticons/blackhole';
import currencyRipple from '@iconify/icons-tabler/currency-ripple';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import ExplorersMenu from './ExplorersMenu';
import CommunityMenu from './CommunityMenu';
import ChatMenu from './ChatMenu';
import Watch from './Watch';
import Share from './Share';
import IssuerInfoDialog from './IssuerInfoDialog';
import EditTokenDialog from 'src/components/EditTokenDialog';

const IconCover = styled('div')(
    ({ theme }) => `
        width: 56px;
        height: 56px;
        border-radius: 50%;
        position: relative;
        overflow: hidden;
        transition: width 1s ease-in-out, height .5s ease-in-out !important;
        -webkit-tap-highlight-color: transparent;
        &:hover, &.Mui-focusVisible {
            z-index: 1;
            & .MuiImageBackdrop-root {
                opacity: 0.9;
            }
            & .MuiIconEditButton-root {
                opacity: 1;
            }
        }
    `
);

const IconWrapper = styled('div')(
    ({ theme }) => `
        box-sizing: border-box;
        display: inline-block;
        position: relative;
        width: 56px;
        height: 56px;
  `
);

const IconImage = styled('img')(
    ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 0px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.white,
    opacity: 0,
    transition: theme.transitions.create('opacity'),
}));

const CardOverlay = styled('div')(
    ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0;
`
);

const AdminImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden',
    '&:hover': {
        cursor: 'pointer',
        opacity: 0.6
    },
}));

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

function normalizeTag(tag) {
    if (tag && tag.length > 0) {
        const tag1 = tag.split(' ').join('-');  // Replace space
        const tag2 = tag1.replace(/&/g, "and"); // Replace &
        const tag3 = tag2.toLowerCase(); // Make lowercase
        const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
        return final;
    }
    return '';
}

// ----------------------------------------------------------------------
export default function UserDesc({token}) {
    const { darkMode, accountProfile, openSnackbar } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const [rating, setRating] = useState(2);
    // const [trustToken, setTrustToken] = useState(null);
    const [openIssuerInfo, setOpenIssuerInfo] = useState(false);
    const [editToken, setEditToken] = useState(null);

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
        ext,
        md5,
        slug,
        tags,
        social,
        issuer_info,
        assessment,
        date
    } = token;

    const info = issuer_info || {};

    let user = token.user;
    if (!user) user = name;

    const isCommunity = true; /*social && (social.twitter || social.facebook || social.linkedin 
        || social.instagram || social.youtube || social.medium || social.twitch || social.tiktok || social.reddit);*/
    const isChat = social && (social.telegram || social.discord);

    // const imgUrl = `/static/tokens/${md5}.${ext}`;
    const imgUrl = `https://s1.xrpl.to/token/${md5}`;

    const img_xrplf_black = "/static/xrplf_black.svg";
    const img_xrplf_white = "/static/xrplf_white.svg";
    
    const img_xrplf = darkMode?img_xrplf_white:img_xrplf_black;

    const handleDelete = () => {
    }

    const handleOpenIssuerInfo = () => {
        setOpenIssuerInfo(true);
    }

    return (
        <Stack>
            {editToken && <EditTokenDialog token={editToken} setToken={setEditToken}/> }

            <IssuerInfoDialog
                open={openIssuerInfo}
                setOpen={setOpenIssuerInfo}
                token={token}
            />
            
            <Stack direction="row" spacing={1} alignItems='center'>
                {isAdmin ?
                    <div>
                        <IconCover>
                            <IconWrapper>
                                <IconImage src={imgUrl}/>
                            </IconWrapper>
                            <IconButton
                                className="MuiIconEditButton-root"
                                aria-label='edit'
                                sx={{ position: 'absolute', left: '0vw', top: '0vh', opacity: 0, zIndex: 1, width: '56px', height: '56px' }}
                                onClick={()=>setEditToken(token)}
                            >
                                <EditIcon />
                            </IconButton>
                            <ImageBackdrop className="MuiImageBackdrop-root" />
                        </IconCover>
                    </div>
                    :
                    <Avatar
                        alt={user}
                        src={imgUrl}
                        sx={{ width: 56, height: 56 }}
                    />
                }
                <Stack spacing={0.2}>
                    <Typography variant="h2" color='#22B14C' fontSize='1.1rem'>{user}</Typography>
                    <Stack direction='row' alignItems='center' spacing={0.5}>
                        <TokenIcon fontSize="small" color="disabled" />
                        <Typography variant="s17">{name}</Typography>
                        <Stack>
                            {kyc && (<Typography variant='kyc2'>KYC</Typography>)}
                        </Stack>
                    </Stack>
                    {date &&
                        <Typography variant="s7">{date}</Typography>
                    }
                </Stack>
                <Grid container direction="row" spacing={1} sx={{mt: 2}}>
                    <Grid item>
                        <Watch token={token}/>
                    </Grid>
                    <Grid item>
                        <Share token={token}/>
                    </Grid>
                </Grid>
            </Stack>
            <Box
                sx={{
                    display: "flex",
                    gap: 0.5,
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
                    <Chip label={<Typography variant="s16">Rank # {id}</Typography>} color="primary" variant="outlined" size="small"/>
                </Tooltip>
                <Chip label={<Typography variant="s16">{holders} Holders</Typography>} color="error" variant="outlined" size="small"/>
                <Chip label={<Typography variant="s16">{offers} Offers</Typography>} color="warning" variant="outlined" size="small"/>
                <Chip label={<Typography variant="s16">{trustlines} TrustLines</Typography>} color="info" variant="outlined" size="small"/>
                {/* <Chip label='Sponsored' color="primary" variant={"outlined"} size="small" icon={<Avatar sx={{ width: 16, height: 16 }} src="/static/sponsor.png"/>}  /> */}
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
                            <Link
                                href={`/view/${normalizeTag(tag)}`}
                                sx={{ pl: 0, pr: 0, display: 'inline-flex' }}
                                underline="none"
                                rel="noreferrer noopener nofollow"
                            >
                                <Chip
                                    size="small"
                                    label={tag}
                                    onClick={handleDelete}
                                />
                            </Link>
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

                {/* <Grid item sx={{pb:1}}>
                    <Chip label={'TrustSet'} sx={{pl:0.5,pr:0.5}}
                        deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                        onDelete={handleDelete} onClick={handleSetTrust}
                        icon={<Icon icon={arrowsExchange} width="18" height="18"/>} />
                </Grid> */}

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
                        <CommunityMenu token={token} />
                    </Grid>
                )}
            </Grid>

            <Stack direction="row" sx={{mt: 3}}>
                <Chip label={<Typography variant="s7">Issuer: <Typography variant="s8">{truncate(issuer, 16)}</Typography></Typography>} sx={{pl:0.5,pr:0}}
                    deleteIcon={
                        <Stack direction="row" spacing={0} alignItems="center">
                            <Tooltip title={'Copy Address'}>
                                <IconButton size="small">
                                    <CopyToClipboard text={issuer} onCopy={()=>openSnackbar("Copied!", "success")}>
                                        <Icon icon={copyIcon} width="16" height="16"/>
                                    </CopyToClipboard>
                                </IconButton>
                            </Tooltip>
                            {info.blackholed &&
                                <Tooltip title={'Blackholed'}>
                                    <Icon icon={blackholeIcon} width="24" height="24" style={{color: "#ff0000"}} />
                                </Tooltip>
                            }
                            {assessment &&
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={assessment}
                                    rel="noreferrer noopener nofollow"
                                >
                                    <Tooltip title={'Assessment'}>
                                        <IconButton size="small">
                                            <LazyLoadImage
                                                src={img_xrplf}
                                                width={16}
                                                height={16}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                </Link>
                            }
                        </Stack>
                    }
                    onDelete={handleDelete} onClick={handleOpenIssuerInfo}
                    icon={<Avatar alt="xrpl" src="/static/livenetxrplorg.png" sx={{ mr:1, width: 16, height: 16 }} />} 
                />
            </Stack>
        </Stack>
    );
}
