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
import ChatNFTPicker from './ChatNFTPicker';

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
  const [pickerType, setPickerType] = useState('emoji');

  const emojiPickerRef = useRef(null);

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
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

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

  const addNFT = (nftLink) => {
    setMessage((prevMessage) => prevMessage + ` ${nftLink}`);
    setShowEmojiPicker(false);
  };

  const closeChat = () => {
    dispatch(toggleChatOpen());
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: 'text.primary' }}>Chat</Typography>
          <IconButton onClick={closeChat} edge="end" sx={{ color: 'text.primary' }}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <ChatPanel 
          chats={chatHistory}
          onStartPrivateMessage={startPrivateMessage}
        />
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {recipient && (
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            To: {recipient}
            <IconButton size="small" onClick={() => setRecipient(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Box sx={{ position: 'relative' }}>
            <IconButton 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ color: 'text.secondary' }}
            >
              😊
            </IconButton>
            {showEmojiPicker && (
              <Box
                ref={emojiPickerRef}
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: 'background.paper',
                  borderRadius: '4px',
                  boxShadow: 3,
                  p: 1,
                }}
              >
                <Tabs 
                  value={pickerType} 
                  onChange={(e, newValue) => setPickerType(newValue)}
                  sx={{ minHeight: 32 }}
                >
                  <Tab label="Emoji" value="emoji" sx={{ minHeight: 32, fontSize: '0.75rem' }} />
                  <Tab label="NFT" value="nft" sx={{ minHeight: 32, fontSize: '0.75rem' }} />
                </Tabs>
                {pickerType === 'emoji' ? (
                  <EmojiPicker onSelect={addEmoji} />
                ) : (
                  <ChatNFTPicker onSelect={addNFT} />
                )}
              </Box>
            )}
          </Box>
          <IconButton onClick={sendMessage} color="primary">
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <SwipeableDrawer
      anchor="right"
      open={chatOpen}
      onClose={() => {}}
      onOpen={() => {}}
      disableSwipeToOpen={true}
      sx={{
        '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: 'background.default' },
      }}
    >
      {drawer}
    </SwipeableDrawer>
  );
}

export default Chatbox;