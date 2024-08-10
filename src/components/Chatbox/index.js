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
import { Button, Stack, TextField, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { selectChatOpen, toggleChatOpen } from 'src/redux/chatSlice';

const drawerWidth = 400;

function Chatbox() {
  const chatOpen = useSelector(selectChatOpen);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedOption, setSelectedOption] = React.useState('Chatbox'); // Default selected option
  
  const closeChat = () => {
    dispatch(toggleChatOpen());
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    console.log(`${option} option selected`);
    handleMenuClose();
  };

  const drawer = (
    <Box>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: "space-between", padding: "10px !important" }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ marginRight: '4px' }}>
              {selectedOption}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleMenuClick}
              sx={{ padding: 0 }}
            >
              <ArrowDropDownIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <MenuItem onClick={() => handleOptionSelect('Chatbox')}>
                <ListItemIcon>
                  {selectedOption === 'Chatbox' ? <CheckCircleIcon color="primary" /> : null}
                </ListItemIcon>
                <ListItemText primary="Chatbox" secondary="Main chat interface" />
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Terminal')}>
                <ListItemIcon>
                  {selectedOption === 'Terminal' ? <CheckCircleIcon color="primary" /> : null}
                </ListItemIcon>
                <ListItemText primary="Terminal" secondary="Command-line interface" />
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Mailbox')}>
                <ListItemIcon>
                  {selectedOption === 'Mailbox' ? <CheckCircleIcon color="primary" /> : null}
                </ListItemIcon>
                <ListItemText primary="Mailbox" secondary="Manage conversations" />
              </MenuItem>
            </Menu>
          </Box>
          <IconButton color="inherit" onClick={closeChat}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Divider />
      <Stack p={1} overflow="auto" height="calc(100vh - 135px)">
        <ChatPanel />
      </Stack>
      <AppBar sx={{ position: "absolute", bottom: "0px", width: "100%", top: "auto" }}>
        <Toolbar sx={{ flexDirection: "column" }}>
          <Divider width="100%" />
          <Stack direction="row" mt={1} gap={1} px={1} justifyContent="space-between" width="100%" pb={1}>
            <TextField
              fullWidth
              placeholder="Your message"
            />
            <Button variant='contained'><SendIcon /></Button>
          </Stack>
        </Toolbar>
      </AppBar>
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
