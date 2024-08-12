import { useContext, useEffect, useState } from 'react';
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
import { io } from 'socket.io-client';
import { AppContext } from 'src/AppContext';

const drawerWidth = 400;
const chatURL = "http://65.108.136.237:5000";
const socket = io(chatURL, {
  path: "/chat"
});

function Chatbox() {
  const dispatch = useDispatch();
  const chatOpen = useSelector(selectChatOpen);
  const { accountProfile } = useContext(AppContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOption, setSelectedOption] = useState('Chatbox'); // Default selected option
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
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

  useEffect(() => {
    socket.on('init', (msg) => {
      console.log("iun", msg)
      setChatHistory((previousHistory) => [...previousHistory, ...msg]);
    });

    socket.on("chat message", (msg) => {
      console.log("chat message", msg);
      setChatHistory((previousHistory) => [...previousHistory, msg]);
    });

    return () => {
      socket.off("init");
      socket.off("chat message");
    };
  }, []);

  const sendMessage = () => {
    if (accountProfile?.account) {
      socket.emit("chat message", {
        message,
        username: accountProfile.account,
        rank: "Member",
        group: "Member"
      });

      setMessage('');
    }
  }

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
        <ChatPanel chats={chatHistory}/>
      </Stack>
      <AppBar sx={{ position: "absolute", bottom: "0px", width: "100%", top: "auto" }}>
        <Toolbar sx={{ flexDirection: "column" }}>
          <Divider width="100%" />
          <Stack direction="row" mt={1} gap={1} px={1} justifyContent="space-between" width="100%" pb={1}>
            <TextField
              fullWidth
              placeholder="Your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button variant='contained' onClick={sendMessage}><SendIcon /></Button>
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
