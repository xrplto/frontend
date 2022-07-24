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

const ExDialog = styled(Dialog) (({ theme }) => ({
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

const LinkTypography = styled(Typography)(({ theme }) => ({
    // backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '2px',
    border: '0px solid #00AB88',
    padding: '0.5em',
    // backgroundColor: alpha("#00AB88", 0.99),
}));
  
const ExDialogTitle = (props) => {
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

export default function QRDialog({open, type, qrUrl, nextUrl, onClose}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        setShowQR(false);
    }, [open]);

    return (
        <ExDialog
            fullScreen={fullScreen}
            fullWidth={true}
            maxWidth='xs'
            onClose={onClose}
            open={open}
            sx={{ zIndex: 1303 }}
        >
            <ExDialogTitle textAlign="center" onClose={onClose}>
                Sign Transaction
            </ExDialogTitle>

            <DialogContent dividers>
                <Stack alignItems='center' spacing={2}>
                    <Typography variant='subtitle1'>{type}</Typography>
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
                        sx={{mb:2}}
                    />
                    
                    <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={nextUrl}
                        rel="noreferrer noopener nofollow"
                    >
                        <LinkTypography variant="subtitle2" color='primary'>Open in XUMM</LinkTypography>
                    </Link>
                </div>
            </DialogContent>
        </ExDialog>
    );
}
