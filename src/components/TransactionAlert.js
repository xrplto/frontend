import { Alert, AlertTitle, CircularProgress, IconButton, Snackbar, Stack, Typography } from "@mui/material";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from "react-redux";
import { selectProcess, selectTxHash, updateProcess } from "src/redux/transactionSlice";

const TransactionAlert = () => {

    const dispatch =  useDispatch();
    const isProcessing = useSelector(selectProcess);
    const txHash = useSelector(selectTxHash);

    const handleClose = (_, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        dispatch(updateProcess(0));
    }

    return (
        <Snackbar
            open={isProcessing > 0}
            autoHideDuration={isProcessing == 2 ? 15000 : null}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            key="key_self_snackbar"
        >
            <Alert
                severity="tx"
                sx={{ width: '100%' }}
                icon={
                    isProcessing == 1 ?
                        <CircularProgress
                            disableShrink
                            size={20}
                            color="primary"
                        /> : <TaskAltIcon color="primary" />
                }
                onClose={isProcessing == 2 ? handleClose : null}
                variant="filled"
            >
                <AlertTitle sx={{ textTransform: "capitalize" }} color="primary">
                    {
                        isProcessing == 1 ? "waiting for wallet to sign transaction" : "Transaction Confirmed"
                    }
                </AlertTitle>

                <Stack mt={1} direction="row" spacing={1} alignItems="center">
                    {
                        isProcessing == 1 ? <Typography color="primary" sx={{ textTransform: "capitalize" }}>pending wallet to sign</Typography>
                            : <a href={`https://bithomp.com/explorer/${txHash}`} target="_blank" rel="noreferrer"><Typography sx={{ textTransform: "capitalize" }}>view transaction</Typography></a>
                    }
                </Stack>

            </Alert>
        </Snackbar>
    )
}

export default TransactionAlert;