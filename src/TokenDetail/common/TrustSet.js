import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import { withStyles } from '@mui/styles';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    Alert,
    Avatar,
    Backdrop,
    Button,
    Dialog,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    Slide,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    TextField
} from '@mui/material';

import { tableCellClasses } from "@mui/material/TableCell";

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext'

// Redux
import { useDispatch } from "react-redux";
import { refreshAccountData } from "src/redux/statusSlice";

// Components
import TrustSetDialog from './TrustSetDialog';

// Loader
import { PulseLoader } from "react-spinners";

// Utils
import { fNumber } from 'src/utils/formatNumber';
import Decimal from 'decimal.js';
// ----------------------------------------------------------------------
function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const ERR_INVALID_VALUE = 1;
const ERR_NETWORK = 2;
const ERR_TIMEOUT = 3;
const ERR_REJECTED = 4;
const MSG_SUCCESSFUL = 5;

export default function TrustSet({token, setToken}) {

    const [state, setState] = useState({
        openSnack: false,
        message: ERR_NONE
    });

    const { message, openSnack } = state;

    const handleCloseSnack = () => {
        setState({ openSnack: false, message: message });
    };

    const showAlert = (msg) => {
        setState({ openSnack: true, message: msg });
    }

    return (
        <>
            <Snackbar
                autoHideDuration={2000}
                anchorOrigin={{ vertical:'top', horizontal:'right' }}
                open={openSnack}
                onClose={handleCloseSnack}
                TransitionComponent={TransitionLeft}
                key={'TransitionLeft'}
            >
                <Alert variant="filled" severity={message === MSG_SUCCESSFUL?"success":"error"} sx={{ m: 2, mt:0 }}>
                    {message === ERR_REJECTED && 'Operation rejected!'}
                    {message === MSG_SUCCESSFUL && 'Successfully set trustline!'}
                    {message === ERR_INVALID_VALUE && 'Invalid value!'}
                    {message === ERR_NETWORK && 'Network error!'}
                    {message === ERR_TIMEOUT && 'Timeout!'}
                </Alert>
            </Snackbar>

            {token && <TrustSetDialog token={token} setToken={setToken} showAlert={showAlert}/>}
        </>
    );
}
