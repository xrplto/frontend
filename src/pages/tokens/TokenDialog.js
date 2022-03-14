import React from "react";
//import { add, update } from "../ReduxTable/peopleSlice";
import { useDispatch } from "react-redux";
//import { nextID } from "../ReduxTable/peopleSlice";

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField
} from '@mui/material';

export default function PeopleDialog({ data, render, onSave }) {
    const [open, setOpen] = React.useState(false);
    const dispatch = useDispatch();

    const defaultImg = data && data.img;
    const defaultName = data && data.name;
    // Existing ID or random ID
    const id = data && data.id;

    const [img, setImg] = React.useState(defaultImg);
    const [name, setName] = React.useState(defaultName);

    const handleClickOpen = () => {
        setOpen(true);
        setName(defaultName);
        setImg(defaultImg);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        //const action = data ? update : add;
        //dispatch(action({ name, id: id || nextID(), img }));
        onSave && onSave();
        handleClose();
    };

    return (
        <>
            {render(handleClickOpen)}
            <Dialog
              open={open}
              onClose={handleClose}
              aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">
                    {data ? "Edit" : "Add"} Token{" "}
                </DialogTitle>
                <DialogContent>
                    <TextField
                      autoFocus
                      margin="dense"
                      id="name"
                      label="Name"
                      fullWidth
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                    />
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Image URL"
                      fullWidth
                      value={img}
                      onChange={(e) => {
                        setImg(e.target.value);
                      }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
