import * as React from 'react';
import Button from '@mui/material/Button';
import { Dialog as MuiDialog } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Dialog({ open, handleRedirect, handleClose }) {
  return (
    <div>
      <MuiDialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        maxWidth={'xl'}
        fullWidth={true}
      >
        <DialogTitle>{'Open in XUMM?'}</DialogTitle>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleRedirect}>Open</Button>
        </DialogActions>
      </MuiDialog>
    </div>
  );
}
