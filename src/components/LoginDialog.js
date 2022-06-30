import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import {
    Box,
    Dialog,
    Link,
    Typography,
    // DialogTitle, 
    //Divider
} from '@mui/material';

const QRDialog = styled(Dialog)(({ theme }) => ({
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

    const onClose = () => {
        props.handleClose();
    };

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
                >
                    <LinkTypography variant="h4" color='primary'>Open in XUMM</LinkTypography>
                </Link>
            </div>
        </QRDialog>
    );
}
