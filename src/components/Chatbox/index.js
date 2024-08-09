import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ChatPanel from "./ChatPanel";
import { Button, Stack, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectChatOpen, toggleChatOpen } from 'src/redux/chatSlice';

const drawerWidth = 400;

function Chatbox() {
  const chatOpen = useSelector(selectChatOpen);
  const dispatch = useDispatch();
  const closeChat = () => {
    dispatch(toggleChatOpen());
  }

  const drawer = (
    <Box>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: "space-between", padding: "10px !important" }}>
            <Typography >
              Chatbox
            </Typography>
            <IconButton color="inherit" onClick={closeChat}>
              <CloseIcon/>
            </IconButton>
          </Toolbar>
      </AppBar>
      <Divider />
      <Stack p={1}>
        <ChatPanel/>
      </Stack>
      <Toolbar sx={{ position: "absolute", bottom: "10px", width: "100%", flexDirection: "column" }}>
        <Divider width="100%"/>
        <Stack direction="row" mt={1} gap={1} px={1} justifyContent="space-between" width="100%">
          <TextField
            fullWidth
            placeholder="Your message"
          />
          <Button variant='contained'><SendIcon/></Button>
        </Stack>
      </Toolbar>
    </Box>
  );

  return (
    <SwipeableDrawer
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': { width: drawerWidth },
      }}
      open={chatOpen}
      onOpen={console.log}
      onClose={console.log}
      anchor="right"
    >
      {drawer}
    </SwipeableDrawer>
  );
}
export default Chatbox;
