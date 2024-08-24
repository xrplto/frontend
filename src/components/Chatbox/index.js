import { useContext, useEffect, useRef, useState } from 'react';
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
import { Button, Stack, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Tabs, Tab } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { selectChatOpen, toggleChatOpen } from 'src/redux/chatSlice';
import { io } from 'socket.io-client';
import { AppContext } from 'src/AppContext';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';

const drawerWidth = 400;
const chatURL = "http://65.108.136.237:5000";
const socket = io(chatURL, {
  path: "/chat"
});

function EmojiPicker({ onSelect }) {
  const theme = useTheme();
  const backgroundColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff';
  const hoverColor = theme.palette.mode === 'dark' ? '#333' : '#f0f0f0';

  const emojis = ["😀", "😂", "😍", "👍", "🙏", "🔥", "🎉", "❤️", "😎", "🤔", "🥳", "😇", "😭", "💪", "😜", "🥰", "🤩", "👏"];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '8px',
        backgroundColor: backgroundColor,
        boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
        borderRadius: '10px',
        padding: '10px',
        maxWidth: '240px',
        zIndex: 1000,
      }}
    >
      {emojis.map((emoji, index) => (
        <Box
          key={index}
          sx={{
            fontSize: '24px',
            padding: '5px',
            cursor: 'pointer',
            userSelect: 'none',
            textAlign: 'center',
            '&:hover': {
              backgroundColor: hoverColor,
              borderRadius: '5px',
            },
          }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </Box>
      ))}
    </Box>
  );
}

function NftPicker() {
  const theme = useTheme();
  const backgroundColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff';
  const hoverColor = theme.palette.mode === 'dark' ? '#333' : '#f0f0f0';

  const nfts = ["[NFT 1]", "[NFT 2]", "[NFT 3]", "[NFT 4]", "[NFT 5]", "[NFT 6]"];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '8px',
        backgroundColor: backgroundColor,
        boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
        borderRadius: '10px',
        padding: '10px',
        maxWidth: '240px',
        zIndex: 1000,
      }}
    >
      {nfts.map((nft, index) => (
        <Box
          key={index}
          sx={{
            fontSize: '18px',
            padding: '5px',
            cursor: 'pointer',
            userSelect: 'none',
            textAlign: 'center',
            '&:hover': {
              backgroundColor: hoverColor,
              borderRadius: '5px',
            },
          }}
          onClick={() => console.log(nft)}
        >
          {nft}
        </Box>
      ))}
    </Box>
  );
}

function Chatbox() {
  const theme = useTheme();
  const backgroundColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff';
  const iconBackgroundColor = theme.palette.mode === 'dark' ? '#333' : '#e0e0e0';
  const iconColor = theme.palette.mode === 'dark' ? '#fff' : '#000';
  
  const dispatch = useDispatch();
  const chatOpen = useSelector(selectChatOpen);
  const { accountProfile } = useContext(AppContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOption, setSelectedOption] = useState('Chatbox');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); 
  const [recipient, setRecipient] = useState(null);

  const chatboxRef = useRef(null);
  const emojiPickerRef = useRef(null);

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

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleClickOutside = (event) => {
    if (chatboxRef.current && !chatboxRef.current.contains(event.target)) {
      closeChat();
    }
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    if (chatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatOpen, showEmojiPicker]);

  useEffect(() => {
    socket.on('init', (msg) => {
      console.log("init", msg);
      setChatHistory((previousHistory) => [...previousHistory, ...msg]);
    });

    socket.on("chat message", (msg) => {
      console.log("chat message", msg);
      setChatHistory((previousHistory) => [...previousHistory, msg]);
    });

    socket.on("private message", (msg) => {
      console.log("private message", msg);
      setChatHistory((previousHistory) => [...previousHistory, msg]);
    });

    return () => {
      socket.off("init");
      socket.off("chat message");
      socket.off("private message");
    };
  }, []);

  const sendMessage = () => {
    if (accountProfile?.account) {
      if (recipient) {
        socket.emit("private message", {
          to: recipient,
          message: message,
          username: accountProfile.account,
          isPrivate: true
        });
      } else {
        socket.emit("chat message", {
          message,
          username: accountProfile.account,
          rank: "Member",
          group: "Member"
        });
      }

      setMessage('');
      setRecipient(null);
    }
  }

  const startPrivateMessage = (username) => {
    setRecipient(username);
  };

  const addEmoji = (emoji) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  const drawer = (
    <Box ref={chatboxRef}>
      <AppBar position="static" sx={{ backgroundColor: backgroundColor }}>
        <Toolbar sx={{ justifyContent: "space-between", padding: "10px !important" }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ marginRight: '4px', color: theme.palette.text.primary }}>
              {selectedOption}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleMenuClick}
              sx={{ padding: 0 }}
            >
              <ArrowDropDownIcon sx={{ color: theme.palette.text.primary }} />
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
            <CloseIcon sx={{ color: theme.palette.text.primary }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Divider />
      <Stack p={1} overflow="auto" height="calc(100vh - 135px)">
        <ChatPanel 
          chats={chatHistory}
          onStartPrivateMessage={startPrivateMessage}
        />
      </Stack>
      <AppBar sx={{ position: "absolute", bottom: "0px", width: "100%", top: "auto", backgroundColor: backgroundColor }}>
        <Toolbar sx={{ flexDirection: "column" }}>
          <Divider width="100%" />
          {recipient && (
            <Typography variant="caption" sx={{ alignSelf: 'flex-start', mb: 1, color: theme.palette.text.primary }}>
              Private message to: {recipient}
              <IconButton size="small" onClick={() => setRecipient(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Typography>
          )}
          <Stack direction="row" mt={1} gap={1} px={1} justifyContent="space-between" width="100%" pb={1}>
            <TextField
              fullWidth
              placeholder="Your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                borderRadius: '4px',
                input: {
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                }
              }}
            />
            <Box sx={{ position: 'relative' }}>
              <IconButton 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                sx={{
                  minWidth: '40px',
                  minHeight: '40px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: iconBackgroundColor,
                  color: iconColor,
                  borderRadius: '8px',
                }}
              >
                😊
              </IconButton>
              {showEmojiPicker && (
                <Box
                  ref={emojiPickerRef}
                  sx={{
                    position: 'absolute',
                    bottom: '60px',
                    right: '5px',
                    zIndex: 1000,
                    backgroundColor: backgroundColor,
                    borderRadius: '10px',
                    boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
                    padding: '10px',
                  }}
                >
                  <Tabs value={tabIndex} onChange={handleTabChange}>
                    <Tab label="Emojis" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }} />
                    <Tab label="NFTs" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }} />
                  </Tabs>
                  <Divider />
                  {tabIndex === 0 && <EmojiPicker onSelect={addEmoji} />}
                  {tabIndex === 1 && <NftPicker />}
                </Box>
              )}
            </Box>
            <IconButton 
              variant='contained' 
              onClick={sendMessage} 
              sx={{
                minWidth: '40px',
                minHeight: '40px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: iconBackgroundColor,
                color: iconColor,
                borderRadius: '8px',
              }}>
              <SendIcon sx={{ color: iconColor }} />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );

  return (
    <SwipeableDrawer
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': { width: drawerWidth, backgroundColor: backgroundColor },
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