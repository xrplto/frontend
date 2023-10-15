import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
  CircularProgress,
  styled
} from '@mui/material';
import { isMobile } from 'react-device-detect';
import { useRouter } from "next/router";

const QRDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 1302
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2)
}));

const StyledQRImage = styled('img')({
  maxWidth: '100%',
  height: 'auto'
});

const StyledLinkTypography = styled(Typography)(({ theme }) => ({
  borderRadius: '2px',
  border: `1px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(1),
  marginTop: theme.spacing(2),
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.primary.light
  }
}));

export default function LoginDialog(props) {
  const { qrUrl, nextUrl, open, handleClose } = props;
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  const handleClick = async (e) => { 
    return true; //webxtor: disable this function because it doesn't open anything on mobile
    e.preventDefault();

    if (!isMobile) {
      router.push(nextUrl);
    } else {
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleRedirect = () => {
    setLoading(true);

    // Simulating an API request delay
    setTimeout(() => {
      setLoading(false);
      router.push(nextUrl);
    }, 1500);
  };
  return (
    <QRDialog onClose={handleClose} open={open}>
      <DialogTitle>
      <Typography variant="h3" align="center" gutterBottom>
          {/* Connect Wallet */}
        {router.locale === 'en' ? 'Connect Wallet' : router.locale === 'es' ? 'Conectar billetera' : 'Connect Wallet'}
        </Typography>
        </DialogTitle>
        <Typography variant="subtitle1" align="center"> 
        {/* Scan the QR code from your Xaman app  */}
        {router.locale === 'en' ? 'Scan the QR code from your Xaman app ' : router.locale === 'es' ? 'Escanea el código QR desde tu aplicación Xaman' : 'Scan the QR code from your Xaman app '}
        </Typography>
      <StyledDialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <StyledQRImage alt="QR" src={qrUrl} />
        </Box>
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={nextUrl}
          rel="noreferrer noopener nofollow"
          onClick={handleClick}
        >
          <StyledLinkTypography variant="h4" color="primary">
            {/* Open in Xaman */}
        {router.locale === 'en' ? 'Open in Xaman' : router.locale === 'es' ? 'Abierto en Xaman' : 'Open in Xaman'}
          </StyledLinkTypography>
        </Link>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Typography variant="body2" color="error" align="center" sx={{ marginTop: 2 }}>
            {error}
          </Typography>
        )}
      </StyledDialogContent>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        onBackdropClick={handleCloseDialog}
        disableEscapeKeyDown={loading}
      >
        <StyledDialogContent>
          <Typography variant="body1" align="center" gutterBottom>
            {/* Confirm your action in the Xaman app. */}
        {router.locale === 'en' ? 'Confirm your action in the Xaman app.' : router.locale === 'es' ? 'Confirma tu acción en la aplicación Xaman.' : 'Confirm your action in the Xaman app.'}
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <StyledLinkTypography variant="h6" color="primary" onClick={handleRedirect}>
              {/* Continue in Xaman */}
        {router.locale === 'en' ? 'Continue in Xaman' : router.locale === 'es' ? 'Continuar en Xaman' : 'Continue in Xaman'}
            </StyledLinkTypography>
          )}
        </StyledDialogContent>
      </Dialog>
    </QRDialog>
  );
}
