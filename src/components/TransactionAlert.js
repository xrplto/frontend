import { Alert, AlertTitle, CircularProgress, Snackbar, Stack, Typography, Box, Fade } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LaunchIcon from '@mui/icons-material/Launch';

import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, selectTxHash, updateProcess } from 'src/redux/transactionSlice';

const TransactionAlert = () => {
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const txHash = useSelector(selectTxHash);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(updateProcess(0));
  };

  const alertConfig = {
    1: {
      title: 'Waiting for Signature',
      content: (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Please review and sign the transaction in your wallet
        </Typography>
      ),
      icon: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
          <CircularProgress size={16} thickness={4} sx={{ color: 'inherit' }} />
        </Box>
      ),
      severity: 'info',
      autoHideDuration: null,
      showClose: false
    },
    2: {
      title: 'Transaction Confirmed',
      content: (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Transaction successfully submitted
          </Typography>
          <Box
            component="a"
            href={`https://bithomp.com/explorer/${txHash}`}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              textDecoration: 'none',
              ml: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 500 }}>
              View
            </Typography>
            <LaunchIcon sx={{ fontSize: 14 }} />
          </Box>
        </Stack>
      ),
      icon: <TaskAltIcon sx={{ fontSize: 20 }} />,
      severity: 'success',
      autoHideDuration: 6000,
      showClose: true
    },
    3: {
      title: 'Transaction Cancelled',
      content: (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          The transaction was cancelled or rejected
        </Typography>
      ),
      icon: <WarningAmberIcon sx={{ fontSize: 20 }} />,
      severity: 'error',
      autoHideDuration: 5000,
      showClose: true
    }
  };

  const currentConfig = alertConfig[isProcessing];

  if (!isProcessing || !currentConfig) {
    return null;
  }

  const { title, content, icon, severity, autoHideDuration, showClose } = currentConfig;

  return (
    <Snackbar
      open={isProcessing > 0}
      autoHideDuration={autoHideDuration}
      key={isProcessing}
      onClose={showClose ? handleClose : null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      TransitionComponent={Fade}
      sx={{
        '& .MuiSnackbar-root': {
          boxShadow: 'none'
        }
      }}
    >
      <Alert
        severity={severity}
        icon={icon}
        onClose={showClose ? handleClose : null}
        variant="filled"
        sx={{
          minWidth: 350,
          maxWidth: 500,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiAlert-icon': {
            alignItems: 'center',
            padding: 0
          },
          '& .MuiAlert-action': {
            alignItems: 'flex-start',
            paddingTop: '2px'
          },
          '& .MuiAlert-message': {
            padding: 0,
            width: '100%'
          }
        }}
      >
        <AlertTitle 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.925rem',
            mb: 0.5,
            lineHeight: 1.3
          }}
        >
          {title}
        </AlertTitle>

        <Box sx={{ mt: 0.5 }}>
          {content}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default TransactionAlert;
