import {
    alpha,
    styled,
    Box,
    Dialog as MuiDialog,
    Link,
    Typography,
    // DialogTitle, 
    //Divider
} from '@mui/material';
import { useRouter } from 'next/router';

import { isMobile } from 'react-device-detect';
import Dialog from './Dialog';
import { useState } from 'react';

const QRDialog = styled(MuiDialog)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    // backdropFilter: 'blur(2px)',
    // WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    // backgroundColor: alpha(theme.palette.background.paper, 0.0),
    // borderRadius: '0px',
    // padding: '0.5em'
    // backgroundColor: alpha("#00AB88", 0.99),
}));

const LinkTypography = styled(Typography)(({ theme }) => ({
    // backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '2px',
    border: '0px solid #00AB88',
    padding: '0.5em',
    // backgroundColor: alpha("#00AB88", 0.99),
}));

export default function LoginDialog(props) {
    const qrUrl = props.qrUrl;
    const nextUrl = props.nextUrl;

    const [openDialog, setOpenDialog] = useState(false);

    const history = useRouter();

    const onClose = () => {
        props.handleClose();
    };

    const handleClick = (e) => {
        e.preventDefault();
        
        if (!isMobile) {
            history.push(nextUrl);
        } else {
            setOpenDialog(true);
        }
    }

    const handleClose = () => {
        setOpenDialog(false);
    }

    const handleRedirect = () => {
        history.push(nextUrl);
    }

    return (
        <QRDialog onClose={onClose} open={props.open}>
            {/* <DialogTitle>Scan the QR code from your XUMM app</DialogTitle> */}
            {/* <Divider /> */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >

                <Box
                    component="img"
                    sx={{
                    }}
                    alt="QR"
                    src={qrUrl}
                />
                
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={nextUrl}
                    rel="noreferrer noopener nofollow"
                    onClick={handleClick}
                >
                    <LinkTypography variant="h4" color='primary'>Open in XUMM</LinkTypography>
                </Link>
            </div>

            <Dialog
                open={openDialog}
                handleClose={handleClose}
                handleRedirect={handleRedirect}
            />
        </QRDialog>
    );
}
