import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';

// Material
import { withStyles } from '@mui/styles';
import {
    alpha, useTheme, useMediaQuery,
    styled,
    Backdrop,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Select,
    Stack,
    Typography,
    TextField,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Loader
import { PulseLoader } from "react-spinners";

// Utils
import { XRP_TOKEN } from 'src/utils/constants';

// Components
import QRDialog from 'src/components/QRDialog';
import { isValidClassicAddress } from 'ripple-address-codec';
import { configureMemos } from 'src/utils/parse/OfferChanges';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from "@crossmarkio/sdk";
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------
const OfferDialog = styled(Dialog)(({ theme }) => ({
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const OfferDialogTitle = (props) => {
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
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};


export default function TransferDialog({ open, setOpen, nft }) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpnft.com/api';
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const dispatch = useDispatch();
    const isProcessing = useSelector(selectProcess);

    const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    const [destination, setDestination] = useState('');

    const [openScanQR, setOpenScanQR] = useState(false);
    const [uuid, setUuid] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        var timer = null;
        var isRunning = false;
        var counter = 150;
        var dispatchTimer = null;
    
        async function getDispatchResult() {
          try {
            const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, { headers: { 'x-access-token': accountToken } });
            const res = ret.data.data.response;
            // const account = res.account;
            const dispatched_result = res.dispatched_result;
    
            return dispatched_result;
          } catch (err) {}
        }
    
        const startInterval = () => {
          let times = 0;
    
          dispatchTimer = setInterval(async () => {
            const dispatched_result = await getDispatchResult();
    
            if (dispatched_result && dispatched_result === 'tesSUCCESS') {
              setSync(sync + 1);
              openSnackbar('Create Offer successful!', 'success');
              stopInterval();
              return;
            }
    
            times++;
    
            if (times >= 10) {
              openSnackbar('Create Offer rejected!', 'error');
              stopInterval();
              return;
            }
          }, 1000);
        };
    
        // Stop the interval
        const stopInterval = () => {
          clearInterval(dispatchTimer);
          handleClose();
          handleScanQRClose();
        };

        async function getPayload() {
            console.log(counter + " " + isRunning, uuid);
            if (isRunning) return;
            isRunning = true;
            try {
                const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, { headers: { 'x-access-token': accountToken } });
                const resolved_at = ret.data?.resolved_at;
                // const dispatched_result = ret.data?.dispatched_result;
                if (resolved_at) {
                    startInterval();
                    return;
                }
            } catch (err) {
                console.log(err);
            }
            isRunning = false;
            counter--;
            if (counter <= 0) {
                openSnackbar('Create Offer timeout!', 'error');
                handleScanQRClose();
            }
        }
        if (openScanQR) {
            timer = setInterval(getPayload, 2000);
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        };
    }, [openScanQR, uuid, sync]);

    const onCreateOfferXumm = async () => {
        if (!account || !accountToken) {
            openSnackbar('Please login', 'error');
            return;
        }

        setLoading(true);
        try {
            const user_token = accountProfile?.user_token;
            const wallet_type = accountProfile?.wallet_type;
            
            const uuid = nft.uuid;

            const NFTokenID = nft.NFTokenID;
            const owner = nft.account;

            const transferTxData = {
                TransactionType: "NFTokenCreateOffer",
                Account: account,
                NFTokenID,
                // Expiration:
                Amount: "0",
                Flags: 1,
                Destination: destination,
                Memos: configureMemos('XRPNFT-nft-create-sell-offer', '', `https://xrpnft.com/nft/${NFTokenID}`)
            };

            switch(wallet_type) {
                case "xaman":
                    const body = { account, NFTokenID, owner, user_token, destination };
        
                    const res = await axios.post(`${BASE_URL}/offers/transfer`, body, { headers: { 'x-access-token': accountToken } });
        
                    if (res.status === 200) {
                        const uuid = res.data.data.uuid;
                        const qrlink = res.data.data.qrUrl;
                        const nextlink = res.data.data.next;
        
                        setUuid(uuid);
                        setQrUrl(qrlink);
                        setNextUrl(nextlink);
                        setOpenScanQR(true);
                    }
                    break;
                case "gem":
                    isInstalled().then(async (response) => {
                        if (response.result.isInstalled) {
                            
                            dispatch(updateProcess(1));
                            await submitTransaction({
                                transaction: transferTxData
                            }).then(({ type, result }) => {
                                if (type == "response") {
                                    dispatch(updateProcess(2));
                                    dispatch(updateTxHash(result?.hash));
                                }

                                else {
                                    dispatch(updateProcess(3));
                                }
                            });
                        }
                    });
                    break;
                case "crossmark":
                    dispatch(updateProcess(1));
                    await sdk.methods.signAndSubmitAndWait(transferTxData)
                        .then(({ response }) => {
                            if (response.data.meta.isSuccess) {
                                dispatch(updateProcess(2));
                                dispatch(updateTxHash(response.data.resp.result?.hash));

                            } else {
                                dispatch(updateProcess(3));
                            }
                        });
                    break;
            }
        } catch (err) {
            console.error(err);
            openSnackbar('Network error!', 'error');
            dispatch(updateProcess(0));
        }
        setLoading(false);
    };

    const onDisconnectXumm = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${BASE_URL}/offers/create/${uuid}`, { headers: { 'x-access-token': accountToken } });
            if (res.status === 200) {
                setUuid(null);
            }
        } catch (err) {
        }
        setLoading(false);
    };

    const handleScanQRClose = () => {
        setOpenScanQR(false);
        onDisconnectXumm(uuid);
    };

    const handleClose = () => {
        setOpen(false);
        setDestination('');
    }

    const handleChangeAccount = (e) => {
        setDestination(e.target.value);
    }

    const handleTransferNFT = () => {
        const isValid = isValidClassicAddress(destination) && account !== destination
        if (isValid) {
            onCreateOfferXumm();
        } else {
            openSnackbar('Invalid value!', 'error');
        }
    }

    const handleMsg = () => {
        if (isProcessing == 1) return "Pending Transferring";
        if (!destination) return "Enter an Account";
        else return "Transfer";
    }

    return (
        <>
            <Backdrop
                sx={{ color: "#000", zIndex: 1303 }}
                open={loading}
            >
                <PulseLoader color={"#FF4842"} size={10} />
            </Backdrop>

            <OfferDialog
                fullScreen={fullScreen}
                onClose={handleClose}
                fullWidth
                maxWidth='xs'
                open={open}
                // sx={{zIndex: 1302}}
                hideBackdrop={true}
                disableScrollLock
                disablePortal
                keepMounted
            >
                <OfferDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    <Typography variant="p4">Transfer</Typography>
                </OfferDialogTitle>

                <DialogContent>
                    <Typography >For this transfer to be completed, the recipient must accept it through their wallet.</Typography>
                    <Stack spacing={2} mt={1}>
                        {/* <Typography variant='p2'>Destination</Typography> */}
                        <TextField
                            id='receive-account'
                            // autoFocus
                            variant='outlined'
                            placeholder='Destination'
                            onChange={handleChangeAccount}
                            value={destination}
                            onFocus={event => {
                                event.target.select();
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                        // sx={{width: 100}}
                        />
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent="center" sx={{ mt: 3, mb: 3 }}>
                        <Button
                            variant="outlined"
                            startIcon={
                                isProcessing == 1 ? <CircularProgress
                                    disableShrink
                                    size={20}
                                    color="primary"
                                /> : <SendIcon />}
                            // size="small"
                            onClick={handleTransferNFT}
                            disabled={isProcessing == 1}
                        >
                            {handleMsg()}
                        </Button>
                    </Stack>
                    {/* </Stack> */}
                </DialogContent>
            </OfferDialog>

            <QRDialog
                open={openScanQR}
                type="NFTokenCreateOffer"
                onClose={handleScanQRClose}
                qrUrl={qrUrl}
                nextUrl={nextUrl}
            />
        </>
    );
}
