import { useState, useEffect } from 'react';
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import {
    Box,
    Dialog,
    Divider,
    DialogTitle,
    Link,
    Stack,
    Typography,
} from '@mui/material';

const QRDialog = styled(Dialog)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

// const LinkTypography = styled(Typography)(({ theme }) => ({
//     backgroundColor: alpha(theme.palette.background.paper, 0.0),
//     borderRadius: '2px',
//     border: '0px solid #00AB88',
//     padding: '0.5em',
//     // backgroundColor: alpha("#00AB88", 0.99),
// }));

const ContentContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '60vh',
    height: '28vh',
});

export default function QROfferDialog(props) {
    const open = props.open;
    const qrUrl = props.qrUrl;
    const offerType = props.offerType;
    // const nextUrl = props.nextUrl;
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        setShowQR(false);
    }, [open]);

    const onClose = () => {
        props.handleClose();
    };

    return (
        <QRDialog onClose={onClose} open={open}>
            <DialogTitle textAlign="center">Sign Transaction</DialogTitle>
            <Divider />
            <Stack alignItems='center' spacing={2} pb={7} pl={10} pr={10} pt={5}>
                <Typography variant='subtitle1'>{offerType==='Create'?'OfferCreate':'OfferCancel'}</Typography>
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
                    paddingBottom: 50
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
                    rel="noreferrer noopener"
                >
                    <LinkTypography variant="subtitle2" color='primary'>Open in XUMM</LinkTypography>
                </Link> */}
            </div>
        </QRDialog>
    );
}
