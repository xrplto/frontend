import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FacebookShareButton, TwitterShareButton } from "react-share";
import { FacebookIcon, TwitterIcon } from "react-share";
import {CopyToClipboard} from 'react-copy-to-clipboard';

// Material
import {
    styled, useTheme, useMediaQuery,
    Avatar,
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Slide,
    Snackbar,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import {
    Share as ShareIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Iconify
import { Icon } from '@iconify/react';
import copyIcon from '@iconify/icons-fad/copy';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------

const ShareDialog = styled(Dialog) (({ theme }) => ({
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));
  
const ShareDialogTitle = (props) => {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};

ShareDialogTitle.propTypes = {
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
};

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const MSG_COPIED = 1;
const ERR_INVALID_VALUE = 2;
const ERR_NETWORK = 3;
const ERR_TIMEOUT = 4;
const ERR_REJECTED = 5;
const MSG_SUCCESSFUL = 6;

export default function Share({token}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const metrics = useSelector(selectMetrics);
    const [open, setOpen] = useState(false);
    const [state, setState] = useState({
        openSnack: false,
        message: ERR_NONE
    });

    const {
        name,
        imgExt,
        md5,
        exch,
    } = token;

    let user = token.user;
    if (!user) user = name;

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;
    const title = `${user} price today, ${name} to USD live, volume, trading history, markets and chart`;
    const desc = `Get the latest ${user} price, ${name} market cap, trading pairs, charts and data today from the world's number one XRP Ledger token price-tracking website`;
    const url = window.location.href;

    const { message, openSnack } = state;

    const handleCloseSnack = () => {
        setState({ openSnack: false, message: message });
    };

    const showAlert = (msg) => {
        setState({ openSnack: true, message: msg });
    }

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Snackbar
                autoHideDuration={2000}
                anchorOrigin={{ vertical:'top', horizontal:'right' }}
                open={openSnack}
                onClose={handleCloseSnack}
                TransitionComponent={TransitionLeft}
                key={'TransitionLeft'}
            >
                <Alert variant="filled" severity={message === MSG_SUCCESSFUL || message === MSG_COPIED?"success":"error"} sx={{ m: 2, mt:0 }}>
                    {message === ERR_REJECTED && 'Operation rejected!'}
                    {message === MSG_SUCCESSFUL && 'Successfully set trustline!'}
                    {message === ERR_INVALID_VALUE && 'Invalid value!'}
                    {message === ERR_NETWORK && 'Network error!'}
                    {message === ERR_TIMEOUT && 'Timeout!'}
                    {message === MSG_COPIED && 'Copied!'}
                </Alert>
            </Snackbar>

            <Chip variant={"outlined"} icon={<ShareIcon fontSize="small" />} label={'Share'} onClick={handleClickOpen} />

            <ShareDialog
                fullScreen={fullScreen}
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
                sx={{zIndex: 1302}}
            >
                {/* <ShareDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    {user}
                </ShareDialogTitle> */}

                {/* <DialogContent dividers> */}

                <DialogContent>
                    <Stack alignItems="center">
                        <Avatar
                            alt={user}
                            src={imgUrl}
                            sx={{ width: 64, height: 64, mt: 2 }}
                        />
                        <Typography variant="desc">{user}</Typography>
                        <Typography variant="desc" sx={{mt:2}} noWrap>Share it with your friends</Typography>
                        <Typography variant="subtitle1" sx={{mt:1, mb:2}}>The price of {user} is $ {fNumber(exch / metrics.USD)}!</Typography>
                        <Stack direction="row" spacing={2}>
                            <FacebookShareButton
                                url={url}
                                quote={title}
                                hashtag={"#"}
                                description={desc}
                            >
                                <FacebookIcon size={32} round />
                            </FacebookShareButton>
                            <TwitterShareButton
                                title={title}
                                url={url}
                                hashtag={"#"}
                            >
                                <TwitterIcon size={32} round />
                            </TwitterShareButton>
                        </Stack>

                        <Stack direction="row" alignItems="center">
                            <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={url}
                                rel="noreferrer noopener nofollow"
                            >
                                {url}
                            </Link>
                            <CopyToClipboard text={url} onCopy={()=>showAlert(MSG_COPIED)}>
                                <Tooltip title={'Click to copy'}>
                                    <IconButton>
                                        <Icon icon={copyIcon} />
                                    </IconButton>
                                </Tooltip>
                            </CopyToClipboard>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={handleClose}>
                        Close
                    </Button>
                </DialogActions>
            </ShareDialog>

            {/* {token && <ShareDialog token={token} setToken={setToken} showAlert={showAlert}/>} */}
        </>
    );
}
