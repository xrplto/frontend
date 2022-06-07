import axios from 'axios'
import { withStyles } from '@mui/styles';
import { useRef, useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
// Loader
import { PulseLoader } from "react-spinners";

import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    ThumbUpOffAlt as ThumbUpOffAltIcon,
    AddCircle as AddCircleIcon
} from '@mui/icons-material';

import {
    Alert,
    Avatar,
    Backdrop,
    Chip,
    Dialog,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    ListItem,
    Paper,
    Slide,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import { useContext } from 'react'
import Context from '../../Context'
//import { ImageSelect } from './ImageSelect';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';

const AdminDialog = styled(Dialog)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

const LinkTypography = styled(Typography)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '2px',
    border: '0px solid #00AB88',
    padding: '0.5em',
    // backgroundColor: alpha("#00AB88", 0.99),
}));

const KYCTypography = withStyles({
    root: {
        color: "#34B60C",
        borderRadius: '6px',
        border: '0.05em solid #34B60C',
        //fontSize: '0.5rem',
        lineHeight: '1.2',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const NoneKYCTypography = withStyles({
    root: {
        color: "#454F5B",
        borderRadius: '6px',
        border: '0.05em solid #454F5B',
        //fontSize: '0.5rem',
        lineHeight: '1.2',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

const CoinNameTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

const TokenImage = styled(Avatar)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
        opacity: 0.6
    },
}));

const Input = styled('input')({
    display: 'none',
});

function getDate(date) {
    let date_fixed = 'undefined';
    try {
        if (date) {
            date_fixed = date.split('T')[0];
        }
    } catch (e) { }
    
    return date_fixed;
}

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const ERR_NOT_VALID = 1;
const ERR_URL_SLUG_DUPLICATED  = 2;
const ERR_INVALID_URL_SLUG  = 3;
const ERR_INTERNAL  = 4;
const MSG_SUCCESSFUL = 5;

export default function EditTokenDialog({open, token, onCloseEditToken}) {
    const theme = useTheme();
    const fileRef = useRef();

    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile } = useContext(Context);
    const [loading, setLoading] = useState(false);

    const {
        issuer,
        name,
        currency,
        md5,
        dateon
    } = token;

    const [file, setFile] = useState(null);

    const [kyc, setKYC] = useState(token.kyc);

    const [imgExt, setImgExt] = useState(token.imgExt);

    const [imgData, setImgData] = useState(`/static/tokens/${md5}.${token.imgExt}`);

    const [user, setUser] = useState(token.user);

    const [domain, setDomain] = useState(token.domain);

    const [date, setDate] = useState(getDate(token.date));

    const [urlSlug, setUrlSlug] = useState(token.urlSlug);

    const [whitepaper, setWhitePaper] = useState(token.whitepaper);

    const [twitter, setTwitter] = useState(token.social?.twitter);
    const [facebook, setFacebook] = useState(token.social?.facebook);
    const [linkedin, setLinkedIn] = useState(token.social?.linkedin);
    const [instagram, setInstagram] = useState(token.social?.instagram);
    const [telegram, setTelegram] = useState(token.social?.telegram);
    const [discord, setDiscord] = useState(token.social?.discord);
    const [youtube, setYoutube] = useState(token.social?.youtube);
    const [medium, setMedium] = useState(token.social?.medium); // medium.com
    const [twitch, setTwitch] = useState(token.social?.medium); // twitch.tv
    const [tiktok, setTiktok] = useState(token.social?.medium); // tiktok
    const [reddit, setReddit] = useState(token.social?.medium); // reddit

    const [tags, setTags] = useState(token.tags);

    const [state, setState] = useState({
        openSnack: false,
        message: ERR_NONE
    });

    const { message, openSnack } = state;

    const handleDeleteTags = (tagToDelete) => () => {
        setTags((tags) => tags.filter((tag) => tag !== tagToDelete));
    };

    const onAddTag = (val) => {
        let newTags = [];
        const found = tags?tags.find(t => t === val):undefined;
        if (found) {
            return;
        }
        if (tags) {
            newTags.push(...tags);
            newTags.push(val);
            console.log(newTags);
            setTags(newTags);
        } else {
            setTags([val]);
        }
    };

    const handleCloseSnack = () => {
        setState({ openSnack: false, message: message });
    };

    const showAlert = (msg) => {
        setState({ openSnack: true, message: msg });
    }

    const setInitialState = () => {
        setKYC(token.kyc);
        setImgExt(token.imgExt);
        setFile(null);
        setImgData(`/static/tokens/${md5}.${token.imgExt}`)
        setUser(token.user);
        setDomain(token.domain);
        setDate(getDate(token.date));
        setUrlSlug(token.urlSlug);
        setWhitePaper(token.whitepaper);
        setTags(token.tags);
        setTwitter(token.social?.twitter);
        setFacebook(token.social?.facebook);
        setLinkedIn(token.social?.linkedin);
        setInstagram(token.social?.instagram);
        setTelegram(token.social?.telegram);
        setDiscord(token.social?.discord);
        setYoutube(token.social?.youtube);
        setMedium(token.social?.medium);
        setTwitch(token.social?.twitch);
        setTiktok(token.social?.tiktok);
        setReddit(token.social?.reddit);
    }

    const onUpdateToken = async (data) => {
        setLoading(true);
        try {
            let res;

            const account = accountProfile.account;

            const formdata = new FormData();
            formdata.append('avatar', file);
            formdata.append('account', account);
            formdata.append('data', JSON.stringify(data));
            
            /*const res = await axios.post(`${BASE_URL}/admin/update_token`, formdata, {
                headers: { "Content-Type": "multipart/form-data" }
            });*/
            
            /*const body = {account, data};

            res = await axios.post(`${BASE_URL}/admin/update_token`, body);*/

            res = await axios.post(`${BASE_URL}/admin/update_token`, formdata, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.status === 200) {
                const ret = res.data;
                if (ret.status) {
                    // Update myself
                    Object.assign(token, data);
                    setFile(null);
                    showAlert(MSG_SUCCESSFUL);
                    onCloseEditToken();
                } else {
                    // { status: false, data: null, err: 'ERR_URL_SLUG' }
                    // ERR_GENERAL
                    // ERR_URL_SLUG
                    // ERR_INTERNAL
                    const err = ret.err;
                    if (err === 'ERR_GENERAL')
                        showAlert(ERR_NOT_VALID);
                    else if (err === 'ERR_URL_SLUG')
                        showAlert(ERR_URL_SLUG_DUPLICATED);
                    else
                        showAlert(ERR_INTERNAL);
                }
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    const handleSave = () => {
        const slug = urlSlug?urlSlug.replace(/[^a-zA-Z0-9-]/g, ""):null;
        if (!slug || slug !== urlSlug) {
            showAlert(ERR_INVALID_URL_SLUG);
            return;
        }
        /*
        amount: 9989.174941923571,
        holders: 15415,
        kyc: true,
        offers: 57,
        trustlines: 18771,
        urlSlug: "47c6a1d2de5ad3391a58e4f0523c16a3",
        verified: false,
        imgExt: "jpg"
        */

        const newToken = {};
        newToken.md5 = md5;
        newToken.domain = domain;
        newToken.user = user;
        newToken.kyc = kyc;
        newToken.imgExt = imgExt;
        newToken.date = date;

        if (urlSlug)
            newToken.urlSlug = urlSlug;
        else
            newToken.urlSlug = md5;

        newToken.whitepaper = whitepaper;
        if (tags)
            newToken.tags = tags;

        const social = {};
        if (twitter)
            social.twitter = twitter;
        if (facebook)
            social.facebook = facebook;
        if (linkedin)
            social.linkedin = linkedin;
        if (instagram)
            social.instagram = instagram;
        if (telegram)
            social.telegram = telegram;
        if (discord)
            social.discord = discord;
        if (youtube)
            social.youtube = youtube;
        if (medium)
            social.medium = medium;
        if (twitch)
            social.twitch = twitch;
        if (tiktok)
            social.tiktok = tiktok;
        if (reddit)
            social.reddit = reddit;
        
        // if (Object.keys(social).length !== 0)
        newToken.social = social;

        onUpdateToken(newToken);
    }

    const handleCancel = () => {
        setInitialState();
        onCloseEditToken();
    }

    const handleFileSelect = (e) => {
        const pickedFile = e.target.files[0];
        if (pickedFile) {
            const fileName = pickedFile.name;
            var re = /(?:\.([^.]+))?$/;
            var ext = re.exec(fileName)[1];
            if (ext)
                ext = ext.toLowerCase();

            if (ext === 'jpg' || ext === 'png') {
                setImgExt(ext);
                setFile(pickedFile);
                // This is used as src of image
                const reader = new FileReader();
                reader.readAsDataURL(pickedFile)
                reader.onloadend = function (e) {
                    setImgData(reader.result); // data:image/jpeg;base64
                }
            }
        }
    }

    /*
        React js Resize Image Before Upload
        https://www.tutsmake.com/react-js-resize-image-before-upload/
        
        Uploading and Resizing Images with React JS
        https://github.com/CodeAT21/React-image-resize-before-upload
    */

    return (
        <>
        <Snackbar
            autoHideDuration={3000}
            anchorOrigin={{ vertical:'top', horizontal:'right' }}
            open={openSnack}
            onClose={handleCloseSnack}
            TransitionComponent={TransitionLeft}
            key={'TransitionLeft'}
        >
            <Alert variant="filled" severity={message === MSG_SUCCESSFUL?"success":"error"} sx={{ m: 2, mt:0 }}>
                {message === ERR_NOT_VALID && 'Invalid data, please check again'}
                {message === ERR_URL_SLUG_DUPLICATED && 'Duplicated URL Slug'}
                {message === ERR_INVALID_URL_SLUG && 'Invalid URL Slug, only alphabetic(A-Z, a-z, 0-9, -) allowed'}
                {message === ERR_INTERNAL && 'Internal error occured'}
                {message === MSG_SUCCESSFUL && 'Successfully changed the token info'}
            </Alert>
        </Snackbar>

        <Backdrop
            sx={{ color: "#000", zIndex: (theme) => theme.zIndex.modal + 1 }}
            open={loading}
        >
            {/* <HashLoader color={"#00AB55"} size={50} /> */}
            <PulseLoader color={"#FF4842"} size={10} />
        </Backdrop>
        
        <AdminDialog onClose={handleCancel} open={open} sx={{p:5}} hideBackdrop={true} fullWidth={true} maxWidth={'md'}>
            <DialogTitle sx={{pl:4,pr:4,pt:1,pb:1}}>
                <input
                    ref={fileRef}
                    style={{ display: 'none' }}
                    // accept='image/*,video/*,audio/*,webgl/*,.glb,.gltf'
                    // accept='image/*'
                    accept='.png, .jpg'
                    id='contained-button-file'
                    multiple={false}
                    type='file'
                    onChange={handleFileSelect}
                />
                <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                    <Stack direction='row' alignItems='center'>
                        <TokenImage alt={name} src={imgData}
                            sx={{ mr: 1, width: 56, height: 56 }}
                            onClick={() => fileRef.current.click()}
                        />
                        <CoinNameTypography variant="h5" noWrap>
                            {name}
                        </CoinNameTypography>
                    </Stack>

                    <Stack direction='row' sx={{p:0}} spacing={2} alignItems='center'>
                        <Tooltip title={'Save'}>
                            <IconButton color='primary' onClick={handleSave} size="large" edge="end" aria-label="save">
                                <CheckIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Cancel'}>
                            <IconButton color='error' onClick={handleCancel} size="large" edge="end" aria-label="save">
                                <CloseIcon fontSize="inherit"/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </DialogTitle>
            <Divider />
            <Table sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "0px solid",
                    borderBottomColor: theme.palette.divider
                }
            }}>
                <TableBody>
                    <TableRow>
                        <TableCell align="right" sx={{pt:1, pb:0, width: '15%'}}>
                            <Label variant="subtitle2" noWrap>Issuer</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:1, pb:0, width: '40%'}}>
                            <Stack direction="row" spacing={1} alignItems='center' sx={{mr:2}}>
                                <Label variant="subtitle2" noWrap>{issuer}</Label>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://bithomp.com/explorer/${issuer}`}
                                    rel="noreferrer noopener"
                                >
                                    <IconButton edge="end" aria-label="bithomp">
                                        <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                    </IconButton>
                                </Link>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2, width: '15%'}}></TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2, width: '30%'}}></TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Currency</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction="row" spacing={1} alignItems='center'>
                                <Label variant="subtitle2" noWrap>{name}</Label>
                                <Label variant="caption" noWrap>({currency})</Label>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0.5, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>MD5</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0.5, pb:0.2}}>
                            <Stack direction='row' spacing={1}>
                                <Label variant="subtitle2" noWrap>{md5}</Label>
                                <Label variant="subtitle2" noWrap>{imgExt.toUpperCase()}</Label>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Domain</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" noWrap color='primary'>{domain}</Typography>
                                <EditDialog label='Domain' value={domain} setValue={setDomain}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>User</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" noWrap color='primary'>{user}</Typography>
                                <EditDialog label='User' value={user} setValue={setUser}/>
                                <Tooltip title={'Click to toggle'}>
                                    {kyc ? (
                                        <Link
                                            component="button"
                                            underline="none"
                                            variant="body2"
                                            color="inherit"
                                            onClick={() => {
                                                setKYC(false);
                                            }}
                                        >
                                            <KYCTypography variant="subtitle2">KYC</KYCTypography>
                                        </Link>
                                    ):(
                                        <Link
                                            component="button"
                                            underline="none"
                                            variant="body2"
                                            color="inherit"
                                            onClick={() => {
                                                setKYC(true);
                                            }}
                                        >
                                            <NoneKYCTypography variant="subtitle2">KYC</NoneKYCTypography>
                                        </Link>
                                    )}
                                </Tooltip>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Created Date</Label>
                        </TableCell>
                        <TableCell align="left" colSpan={3} sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" color='primary'>{date}</Typography>
                                <EditDialog label='Date' value={date} setValue={setDate}/>
                                <Label variant="caption" noWrap>{new Date(dateon).toISOString().split('.')[0].replace('T', ' ')}</Label>
                                <Tooltip title={'Token discovered date by the Ledger Scanner.'}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>URL Slug</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" color='primary'>{urlSlug}</Typography>
                                <EditDialog label='URL Slug' value={urlSlug} setValue={setUrlSlug}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}></TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Whitepaper</Label>
                        </TableCell>
                        <TableCell align="left" colSpan={3} sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`${whitepaper}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{whitepaper}</Typography>
                                </Link>
                                <EditDialog label='Whitepaper URL' value={whitepaper} setValue={setWhitePaper}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: "1px solid",
                            borderBottomColor: theme.palette.divider
                        }
                    }}>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Tags</Label>
                        </TableCell>
                        <TableCell align="left" colSpan={3} sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                {tags && tags.map((tag, idx) => {
                                    return (
                                        <Chip
                                            key={md5 + idx}
                                            size="small"
                                            label={tag}
                                            onDelete={handleDeleteTags(tag)}
                                        />
                                    );
                                })}
                                <AddDialog label='Tag' onAddTag={onAddTag}/>
                            </Stack>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <Table sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "0px solid",
                    borderBottomColor: theme.palette.divider
                },
                tableLayout: 'fixed',
                width: '100%'
            }}>
                <TableBody>

                    <TableRow>
                        <TableCell align="right" sx={{pt:1, pb:0.2, width: '15%'}}>
                            <Label variant="subtitle2" noWrap>Twitter</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:1, pb:0.2, width: '25%'}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://twitter.com/${twitter}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{twitter}</Typography>
                                </Link>
                                <EditDialog label='Twitter' value={twitter} setValue={setTwitter}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:1, pb:0.2, width: '15%'}}>
                            <Label variant="subtitle2" noWrap>YouTube</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:1, pb:0.2, width: '45%'}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://www.youtube.com/${youtube}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{youtube}</Typography>
                                </Link>
                                <EditDialog label='YouTube' alue={youtube} setValue={setYoutube}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Facebook</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://www.facebook.com/${facebook}/`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{facebook}</Typography>
                                </Link>
                                <EditDialog label='Facebook' value={facebook} setValue={setFacebook}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Medium</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://medium.com/${medium}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{medium}</Typography>
                                </Link>
                                <EditDialog label='Medium' alue={medium} setValue={setMedium}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>LinkedIn</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://www.linkedin.com/company/${linkedin}/`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{linkedin}</Typography>
                                </Link>
                                <EditDialog label='LinkedIn' value={linkedin} setValue={setLinkedIn}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Twitch</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://twitch.tv/${twitch}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{twitch}</Typography>
                                </Link>
                                <EditDialog label='Twitch' alue={twitch} setValue={setTwitch}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Instagram</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://www.instagram.com/${instagram}/`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{instagram}</Typography>
                                </Link>
                                <EditDialog label='Instagram' value={instagram} setValue={setInstagram}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Tiktok</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://tiktok.com/${tiktok}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{tiktok}</Typography>
                                </Link>
                                <EditDialog label='Tiktok' alue={tiktok} setValue={setTiktok}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Discord</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" color='primary'>{discord}</Typography>
                                <EditDialog label='Discord' value={discord} setValue={setDiscord}/>
                            </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Reddit</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://reddit.com/${reddit}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{reddit}</Typography>
                                </Link>
                                <EditDialog label='Reddit' alue={reddit} setValue={setReddit}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Telegram</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    target="_blank"
                                    href={`https://t.me/${telegram}`}
                                    rel="noreferrer noopener"
                                >
                                    <Typography variant="subtitle2" color='primary'>{telegram}</Typography>
                                </Link>
                                <EditDialog label='Telegram' value={telegram} setValue={setTelegram}/>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <Stack direction='row' sx={{p:1}} spacing={2} justifyContent="flex-end" alignItems="flex-end">

                    </Stack>

                </TableBody>
            </Table>
        </AdminDialog>
        </>
    );
}
