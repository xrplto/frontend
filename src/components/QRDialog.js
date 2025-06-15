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
  from { 
    opacity: 0; 
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
  }
`;

// Create a function that returns keyframes based on theme
const createPulseAnimation = (theme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${alpha(theme?.palette?.primary?.main || '#1976d2', 0.7)};
  }
  70% {
    box-shadow: 0 0 0 4px ${alpha(theme?.palette?.primary?.main || '#1976d2', 0)};
  }
  100% {
    box-shadow: 0 0 0 0 ${alpha(theme?.palette?.primary?.main || '#1976d2', 0)};
  }
`;

const CustomDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  '& .MuiDialogContent-root': {
    padding: 0,
    background: 'transparent'
  },
  '& .MuiPaper-root': {
    borderRadius: '24px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -1,
      left: -1,
      right: -1,
      height: '3px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
      opacity: 0.8,
      borderRadius: '24px 24px 0 0',
      zIndex: 10
    }
  }
}));

const DialogContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  position: 'relative',
  background: 'transparent'
}));

const StyledLinkTypography = styled(Typography)(({ theme }) => ({
  borderRadius: '16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
    theme.palette.primary.main,
    0.04
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  padding: theme.spacing(2, 3),
  marginTop: theme.spacing(3),
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${fadeIn} 0.3s ease-in-out`,
  position: 'relative',
  overflow: 'hidden',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  backdropFilter: 'blur(10px)',
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(
      theme.palette.primary.main,
      0.2
    )}, transparent)`,
    transition: 'left 0.5s'
  },

  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
      theme.palette.primary.main,
      0.06
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}, 0 4px 12px ${alpha(
      theme.palette.common.black,
      0.1
    )}`,

    '&::before': {
      left: '100%'
    }
  },

  '&:active': {
    transform: 'translateY(0) scale(1)',
    transition: 'transform 0.1s'
  }
}));

const QRContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
  position: 'relative',
  animation: `${fadeIn} 0.3s ease-in-out`,

  '& img': {
    borderRadius: '16px',
    background: theme.palette.background.paper,
    padding: theme.spacing(2),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
        theme.palette.primary.main,
        0.08
      )}`
    }
  }
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  position: 'relative',

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -theme.spacing(1.5),
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
    borderRadius: '2px',
    opacity: 0.6
  }
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  padding: theme.spacing(2),
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`
}));

const NotificationPrompt = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(
    theme.palette.warning.main,
    0.04
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
  marginTop: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  backdropFilter: 'blur(10px)',

  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(
      theme.palette.warning.main,
      0.06
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
    transform: 'scale(1.02)'
  }
}));

const CustomDialogTitle = (props) => {
  const { children, onClose, ...other } = props;
  const theme = useTheme();

  return (
    <DialogTitle
      sx={{
        m: 0,
        p: 3,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
        position: 'relative'
      }}
      {...other}
    >
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: theme.palette.text.secondary,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              transform: 'scale(1.1)'
            }
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
          description: 'Approve the trustline setup on your Xaman App',
          color: theme.palette.warning.main,
          gradient: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.success.main})`
        };
      case 'Payment':
        return {
          title: 'Complete Swap',
          description: 'Sign the swap transaction on your Xaman App',
          color: theme.palette.success.main,
          gradient: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
        };
      case 'OfferCreate':
        return {
          title: 'Create Offer',
          description: 'Sign the offer creation on your Xaman App',
          color: theme.palette.info.main,
          gradient: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.primary.main})`
        };
      default:
        return {
          title: transactionType,
          description: 'Sign the transaction on your Xaman App',
          color: theme.palette.primary.main,
          gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
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
      <DialogContainer>
        <TitleContainer>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: transactionInfo.gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.8rem',
              letterSpacing: '-0.02em',
              textShadow: `0 4px 8px ${alpha(transactionInfo.color, 0.25)}`,
              mb: 1
            }}
          >
            {transactionInfo.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.6,
              letterSpacing: '-0.01em'
            }}
          >
            {transactionInfo.description}
          </Typography>
        </TitleContainer>

        {!notificationClicked && (
          <NotificationPrompt onClick={handleQRButtonClick}>
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: theme.palette.warning.main,
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.warning.main,
                  animation: `${createPulseAnimation(theme)} 2s infinite`
                }}
              />
              Didn't receive a notification? Click here to scan QR!
            </Typography>
          </NotificationPrompt>
        )}

        {showQR && (
          <QRContainer>
            {isLoading && (
              <LoadingContainer>
                <CircularProgress
                  size={32}
                  sx={{
                    color: theme.palette.primary.main,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round'
                    }
                  }}
                />
              </LoadingContainer>
            )}

            <Box
              component="img"
              alt="Xaman QR"
              src={qrUrl}
              onLoad={handleQRImageLoad}
              sx={{
                mb: 3,
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.5s ease-in-out',
                maxWidth: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
            />

            <Link
              underline="none"
              color="inherit"
              target="_blank"
              href={nextUrl}
              rel="noreferrer noopener nofollow"
              sx={{ width: '100%' }}
            >
              <StyledLinkTypography
                variant="h6"
                color="primary"
                sx={{
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                Open in Xaman
              </StyledLinkTypography>
            </Link>
          </QRContainer>
        )}
      </DialogContainer>
    </CustomDialog>
  );
}
