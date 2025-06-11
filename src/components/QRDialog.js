import React, { useState, useEffect } from 'react';
import {
  alpha,
  styled,
  useTheme,
  useMediaQuery,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const CustomDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  borderRadius: '0px',
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3)
  },
  '& .MuiPaper-root': {
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`
  }
}));

const StyledLinkTypography = styled(Typography)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  border: `2px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  animation: `${fadeIn} 0.3s ease-in-out`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateY(-2px)'
  }
}));

const CustomDialogTitle = (props) => {
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
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

export default function CustomQRDialog({ open, type, qrUrl, nextUrl, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [showQR, setShowQR] = useState(false);
  const [notificationClicked, setNotificationClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setShowQR(false);
      setNotificationClicked(false);
      setIsLoading(true);
    }
  }, [open]);

  const handleQRButtonClick = () => {
    setShowQR(true);
    setNotificationClicked(true);
  };

  const handleQRImageLoad = () => {
    setIsLoading(false);
  };

  // Get user-friendly transaction info
  const getTransactionInfo = (transactionType) => {
    switch (transactionType) {
      case 'TrustSet':
        return {
          title: 'Set Trustline',
          description: 'Approve the trustline setup on your Xaman App'
        };
      case 'Payment':
        return {
          title: 'Complete Swap',
          description: 'Sign the swap transaction on your Xaman App'
        };
      case 'OfferCreate':
        return {
          title: 'Create Offer',
          description: 'Sign the offer creation on your Xaman App'
        };
      default:
        return {
          title: transactionType,
          description: 'Sign the transaction on your Xaman App'
        };
    }
  };

  const transactionInfo = getTransactionInfo(type);

  return (
    <CustomDialog
      fullScreen={fullScreen}
      fullWidth={true}
      maxWidth="xs"
      onClose={onClose}
      open={open}
      sx={{ zIndex: 1305 }}
    >
      <DialogContent dividers>
        <Stack alignItems="center" spacing={3}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.main
            }}
          >
            {transactionInfo.title}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            {transactionInfo.description}
          </Typography>
          {!notificationClicked && (
            <Link
              component="button"
              underline="none"
              variant="body2"
              onClick={handleQRButtonClick}
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Typography
                variant="body2"
                color="error"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                Didn't receive a notification? Click here to scan QR!
              </Typography>
            </Link>
          )}
        </Stack>

        {showQR && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 4,
              mb: 2,
              position: 'relative',
              animation: `${fadeIn} 0.3s ease-in-out`
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <CircularProgress size={40} />
              </Box>
            )}

            <Box
              component="img"
              alt="Xaman QR"
              src={qrUrl}
              onLoad={handleQRImageLoad}
              sx={{
                mb: 3,
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
                maxWidth: '100%',
                height: 'auto'
              }}
            />

            <Link
              underline="none"
              color="inherit"
              target="_blank"
              href={nextUrl}
              rel="noreferrer noopener nofollow"
            >
              <StyledLinkTypography variant="h6" color="primary">
                Open in Xaman
              </StyledLinkTypography>
            </Link>
          </Box>
        )}
      </DialogContent>
    </CustomDialog>
  );
}
