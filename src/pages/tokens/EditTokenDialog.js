import { withStyles } from '@mui/styles';
import { useRef, useState, useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    ThumbUpOffAlt as ThumbUpOffAltIcon
} from '@mui/icons-material';

import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography    
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
//import { useContext } from 'react'
//import Context from '../Context'
//import { ImageSelect } from './ImageSelect';

const QRDialog = styled(Dialog)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
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

export default function EditTokenDialog({open, token, onCloseEditToken}) {
    const theme = useTheme();
    const fileRef = useRef();

    const {
        issuer,
        name,
        currency,
        md5,
        dateon
    } = token;

    const [kyc, setKYC] = useState(token.kyc);

    const [file, setFile] = useState(null);

    const [imgExt, setImgExt] = useState(token.imgExt);

    const [imgUrl, setImgUrl] = useState(`/static/tokens/${md5}.${imgExt}`);

    const [user, setUser] = useState(token.user);

    const [domain, setDomain] = useState(token.domain);

    const [date, setDate] = useState(getDate(token.date));

    const [urlSlug, setUrlSlug] = useState(token.urlSlug);

    const [twitter, setTwitter] = useState(token.social?.twitter);

    const [facebook, setFacebook] = useState(token.social?.facebook);

    const [linkedin, setLinkedIn] = useState(token.social?.linkedin);

    const [instagram, setInstagram] = useState(token.social?.instagram);

    const [telegram, setTelegram] = useState(token.social?.telegram);

    const [youtube, setYoutube] = useState(token.social?.youtube);

    const onClose = () => {
        onCloseEditToken();
    };

    const handleSave = () => {

    }

    const handleCancel = () => {
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
                    setImgUrl(reader.result); // data:image/jpeg;base64
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
        <QRDialog onClose={onClose} open={open} sx={{p:5}}>
            <DialogTitle sx={{pl:4,pr:4,pt:1,pb:1}}>
                <input
                    ref={fileRef}
                    style={{ display: 'none' }}
                    // accept='image/*,video/*,audio/*,webgl/*,.glb,.gltf'
                    //accept='image/*'
                    accept='.png, .jpg'
                    id='contained-button-file'
                    multiple
                    type='file'
                    onChange={handleFileSelect}
                />
                <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                    <Stack direction='row' alignItems='center'>
                        <TokenImage alt={name} src={imgUrl}
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
                        <TableCell align="right" sx={{pt:1, pb:0}}>
                            <Label variant="subtitle2" noWrap>Issuer</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:1, pb:0}}>
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
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0.5, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>MD5</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0.5, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>{md5}</Label>
                        </TableCell>
                    </TableRow>

                    {/* <TableRow>
                        <TableCell align="right" sx={{pt:0.5, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Image Type</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0.5, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>{imgExt.toUpperCase()}</Label>
                        </TableCell>
                    </TableRow> */}

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Domain</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" noWrap color='primary'>{domain}</Typography>
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>User</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" noWrap color='primary'>{user}</Typography>
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
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
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Created Date</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" color='primary'>{date}</Typography>
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Discovered Date</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Label variant="subtitle2" noWrap>{new Date(dateon).toISOString().split('.')[0].replace('T', ' ')}</Label>
                                <Tooltip title={'Token discovered date by the Ledger Scanner.'}>
                                    <Icon icon={infoFilled} />
                                </Tooltip>
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
                            <Label variant="subtitle2" noWrap>URL Slug</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Typography variant="subtitle2" color='primary'>{urlSlug}</Typography>
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:1, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>Twitter</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:1, pb:0.2}}>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell align="right" sx={{pt:0, pb:0.2}}>
                            <Label variant="subtitle2" noWrap>YouTube</Label>
                        </TableCell>
                        <TableCell align="left" sx={{pt:0, pb:0.2}}>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
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
                                <IconButton edge="end" aria-label="edit" size="small">
                                    <EditIcon fontSize="inherit"/>
                                </IconButton>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    <Stack direction='row' sx={{p:1}} spacing={2} justifyContent="flex-end" alignItems="flex-end">

                    </Stack>

                </TableBody>
            </Table>
            
            
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
            </div>
        </QRDialog>
    );
}
