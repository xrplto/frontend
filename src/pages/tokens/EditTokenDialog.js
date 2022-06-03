import { withStyles } from '@mui/styles';
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';

import {
    Avatar,
    Box,
    Dialog,
    Link,
    Stack,
    Typography,
    DialogTitle, 
    Divider
} from '@mui/material';
//import { useContext } from 'react'
//import Context from '../Context'

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
        lineHeight: '1',
        paddingLeft: '3px',
        paddingRight: '3px',
    }
})(Typography);

export default function EditTokenDialog({open, token, onCloseEditToken}) {

    const {
        issuer,
        name,
        currency,
        date,
        amount,
        trustlines,
        vol24h,
        vol24hamt,
        vol24htx,
        holders,
        offers,
        pairXRP,
        kyc,
        md5,
        urlSlug,
        user,
        pro7d,
        pro24h,
        exch
    } = token;

    const imgUrl = `/static/tokens/${name.replace(/[^a-zA-Z0-9]/g, "")}.jpg`;

    const onClose = () => {
        onCloseEditToken();
    };

    return (
        <QRDialog onClose={onClose} open={open} sx={{p:5}}>
            <DialogTitle>Edit Token</DialogTitle>
            <Divider />
            <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar alt={name} src={imgUrl} />
                <Stack>
                    <Typography variant="h6" noWrap>{name}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.2}>
                        <Typography variant="h6">
                            {user}
                        </Typography>
                        {kyc ? (
                            <KYCTypography variant="h6">
                            KYC
                            </KYCTypography>
                        ):(
                            <KYCTypography variant="h6">
                            KYC
                            </KYCTypography>
                        )}
                    </Stack>
                    <Typography variant="caption">
                        {date}
                    </Typography>
                </Stack>
            </Stack>
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
