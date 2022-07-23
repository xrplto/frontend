import { useState, useEffect } from 'react';

// Material
import {
    alpha, styled, useTheme, useMediaQuery,
    Box,
    Dialog,
    Divider,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Stack,
    Typography
} from '@mui/material';

import {
    Close as CloseIcon
} from '@mui/icons-material';

const QRDialog = styled(Dialog) (({ theme }) => ({
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));
  
const QRDialogTitle = (props) => {
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

export default function QRTrustDialog(props) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const open = props.open;
    const qrUrl = props.qrUrl;
    // const nextUrl = props.nextUrl;
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        setShowQR(false);
    }, [open]);

    const onClose = () => {
        props.handleClose();
    };

    return (
        <QRDialog
            fullScreen={fullScreen}
            fullWidth={true}
            maxWidth='xs'
            onClose={onClose}
            open={open}
            sx={{ zIndex: 1303 }}
        >
            <QRDialogTitle textAlign="center" onClose={onClose}>
                Sign Transaction
            </QRDialogTitle>

            <DialogContent dividers>
                <Stack alignItems='center' spacing={2}>
                    <Typography variant='subtitle1'>Trust Set</Typography>
                    <Typography variant='subtitle1'>Sign the transaction on your XUMM App</Typography>
                    <Link
                        component="button"
                        underline="hover"
                        variant="body2"
                        color="inherit"
                        onClick={() => {
                            setShowQR(true);
                        }}
                    >
                        <Typography variant='caption' color='error'>Didn't receive a notification? Click here to scan QR!</Typography>
                    </Link>
                </Stack>
                <div
                    style={{
                        display: showQR?"flex":"none",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingBottom: 50,
                        marginTop: 50
                    }}
                >

                    <Box
                        component="img"
                        alt="QR"
                        src={qrUrl}
                    />
                    
                    {/* <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={nextUrl}
                        rel="noreferrer noopener nofollow"
                    >
                        <LinkTypography variant="subtitle2" color='primary'>Open in XUMM</LinkTypography>
                    </Link> */}
                </div>
            </DialogContent>
        </QRDialog>
    );
}
