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
import { Button, Stack, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Tabs, Tab, Tooltip, Chip } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { selectChatOpen, toggleChatOpen } from 'src/redux/chatSlice';
import { io } from 'socket.io-client';
import { AppContext } from 'src/AppContext';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import ChatNFTPicker from './ChatNFTPicker';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';

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

const FormattedNFT = ({ nftLink, onRemove }) => {
  const theme = useTheme();
  const match = nftLink.match(/\[NFT: (.*?) #(\d+) \((.*?)\)\]/);
  
  if (!match) return null;

  const [_, name, number, tokenId] = match;
  
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">{`${name} #${number}`}</Typography>
          <Typography variant="caption" color="textSecondary">{tokenId}</Typography>
        </Box>
      }
      arrow
    >
      <Chip
        icon={<img src="/static/crossmark.webp" alt={`${name} #${number}`} style={{ width: '16px', height: '16px' }} />}
        label={`${name} #${number}`}
        onDelete={onRemove}
        size="small"
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.main}`,
          '& .MuiChip-label': {
            color: theme.palette.primary.main,
          },
          mr: 0.5,
          my: 0.25,
        }}
      />
    </Tooltip>
  );
};

const CustomInput = ({ value, onChange, onNFTRemove }) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    const textParts = value.split(/(\[NFT:.*?\])/).filter(part => !part.startsWith('[NFT:'));
    setLocalValue(textParts.join(''));
  }, [value]);

  const handleChange = (e) => {
    const newTextValue = e.target.value;
    setLocalValue(newTextValue);
    
    const nftParts = value.match(/\[NFT:.*?\]/g) || [];
    const newFullValue = [...nftParts, newTextValue].join('');
    onChange(newFullValue);
  };

  const handleNFTRemove = (nftLink) => {
    const newValue = value.replace(nftLink, '');
    onChange(newValue);
    onNFTRemove && onNFTRemove(nftLink);
  };

  const renderNFTChips = () => {
    const nftMatches = value.match(/\[NFT:.*?\]/g) || [];
    return nftMatches.map((nftLink, index) => (
      <FormattedNFT key={index} nftLink={nftLink} onRemove={() => handleNFTRemove(nftLink)} />
    ));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        minHeight: 40,
      }}
      onClick={() => inputRef.current.focus()}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
        {renderNFTChips()}
      </Box>
      <textarea
        ref={inputRef}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          color: 'inherit',
          resize: 'none',
          minHeight: '20px',
          overflow: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        value={localValue}
        onChange={handleChange}
        rows={1}
        onInput={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />
    </Box>
  );
};

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
    event.preventDefault();
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

  const handleNFTRemove = (index) => {
    // You can add any additional logic here if needed
  };

  const handleMessageChange = (newMessage) => {
    setMessage(newMessage);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={handleMenuClick}
              sx={{ 
                color: 'text.primary', 
                textTransform: 'none',
                '&:active': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              {selectedOption}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleOptionSelect('Chatbox')}>
                <ListItemIcon>
                  <ChatBubbleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Chatbox</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Terminal')}>
                <ListItemIcon>
                  <TerminalIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Terminal</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Settings')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
          <IconButton 
            onClick={closeChat} 
            edge="end" 
            sx={{ 
              color: 'text.primary', 
              mr: 2,
              '&:active': {
                backgroundColor: 'action.selected',
              },
            }}
          >
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
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <Box sx={{ flexGrow: 1 }}>
            <CustomInput
              value={message}
              onChange={handleMessageChange}
              onNFTRemove={handleNFTRemove}
            />
          </Box>
          <Stack direction="row" spacing={1}>
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