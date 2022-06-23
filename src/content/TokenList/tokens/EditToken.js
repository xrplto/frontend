import { useState } from 'react';

import {
    Alert,
    Slide,
    Snackbar
} from '@mui/material';
import EditTokenDialog from './EditTokenDialog';

function TransitionLeft(props) {
    return <Slide {...props} direction="left" />;
}

const ERR_NONE = 0;
const ERR_TRANSFER = 1;
const ERR_NOT_VALID = 2;
const ERR_URL_SLUG_DUPLICATED  = 3;
const ERR_INVALID_URL_SLUG  = 4;
const ERR_INTERNAL  = 5;
const MSG_SUCCESSFUL = 6;

export default function EditToken({token, setToken}) {

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

    const onCloseEditToken = () => {
        setToken(null);
    }

    return (
        <>
        <Snackbar
            autoHideDuration={3000}
            anchorOrigin={{ vertical:'top', horizontal:'right' }}
            open={openSnack}
            onClose={handleCloseSnack}
            TransitionComponent={TransitionLeft}
            key={'TransitionLeft'}
        >
            <Alert variant="filled" severity={message === MSG_SUCCESSFUL?"success":"error"} sx={{ m: 2, mt:0 }}>
                {message === ERR_TRANSFER && 'Upload image error, please try again'}
                {message === ERR_NOT_VALID && 'Invalid data, please check again'}
                {message === ERR_URL_SLUG_DUPLICATED && 'Duplicated URL Slug'}
                {message === ERR_INVALID_URL_SLUG && 'Invalid URL Slug, only alphabetic(A-Z, a-z, 0-9, -) allowed'}
                {message === ERR_INTERNAL && 'Internal error occured'}
                {message === MSG_SUCCESSFUL && 'Successfully changed the token info'}
            </Alert>
        </Snackbar>

        { token &&
            <EditTokenDialog token={token} onCloseEditToken={onCloseEditToken} showAlert={showAlert}/>
        }
        </>
    );
}
