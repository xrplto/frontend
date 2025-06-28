import { Alert, AlertTitle, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
      content: <Typography>Please sign the transaction in your wallet.</Typography>,
      icon: <CircularProgress size={20} />,
      severity: 'info',
      autoHideDuration: null,
      showClose: false
    },
    2: {
      title: 'Transaction Confirmed',
      content: (
        <a
          href={`https://bithomp.com/explorer/${txHash}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          <Typography>View on explorer</Typography>
        </a>
      ),
      icon: <TaskAltIcon />,
      severity: 'success',
      autoHideDuration: 5000,
      showClose: true
    },
    3: {
      title: 'Transaction Cancelled',
      content: <Typography>The transaction was cancelled.</Typography>,
      icon: <WarningAmberIcon />,
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
    >
      <Alert
        severity={severity}
        sx={{ width: '100%' }}
        icon={icon}
        onClose={showClose ? handleClose : null}
        variant="filled"
      >
        <AlertTitle sx={{ textTransform: 'capitalize' }}>{title}</AlertTitle>

        <Stack mt={1} direction="row" spacing={1} alignItems="center">
          {content}
        </Stack>
      </Alert>
    </Snackbar>
  );
};

export default TransactionAlert;
