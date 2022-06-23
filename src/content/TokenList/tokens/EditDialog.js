import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import {
    Edit as EditIcon
} from '@mui/icons-material';

import {
    IconButton
} from '@mui/material';

export default function EditDialog({label, value, setValue}) {
    const [val, setVal] = useState(value?value:'');
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setVal(value);
        setOpen(false);
    };

    const handleOK = () => {
        setValue(val);
        setOpen(false);
    };

    const onChangeValue = (event) => {
        setVal(event.target.value);
    };

    return (
        <div>
            <IconButton onClick={handleClickOpen} edge="end" aria-label="edit" size="small">
                <EditIcon fontSize="inherit"/>
            </IconButton>
            {/* hideBackdrop={true} */}
            <Dialog open={open} onClose={handleClose}>
                {/* <DialogTitle>{label}</DialogTitle> */}
                <DialogContent>
                    {/* <DialogContentText>
                        Please enter the value here.
                    </DialogContentText> */}
                    <TextField
                        value={val}
                        onChange={onChangeValue}
                        autoFocus
                        margin="dense"
                        id="name"
                        label={label}
                        variant="standard"
                        style ={{width: '300px'}}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleOK}>OK</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
