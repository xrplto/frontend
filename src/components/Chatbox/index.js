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
import ChatPanel from './ChatPanel';
import {
  Button,
  Stack,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  styled
} from '@mui/material';
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
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatSettings from './ChatSettings';
import StoreIcon from '@mui/icons-material/Store';
import Store from './Store';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Trades from './Trades';

// Styled component for custom scrollbar
const CustomScrollBox = styled(Box)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'dark' ? '#555' : '#a9a9a94d',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'dark' ? 'darkgrey' : 'darkgrey',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.mode === 'dark' ? '#a9a9a9d4' : '#a9a9a9d4',
    cursor: 'pointer'
  }
}));

const drawerWidth = 600;
const chatURL = 'http://37.27.134.126:5000'; //http://37.27.134.126:5000

// Initialize socket outside the component to avoid multiple connections
const socket = io(chatURL, {
  path: '/chat',
  autoConnect: false, // We'll handle connection manually
  reconnectionAttempts: 5, // Number of reconnection attempts
  reconnectionDelay: 1000 // Delay between reconnections
});

// Emoji Picker Component with Dynamic Styling
function EmojiPicker({ onSelect }) {
  const theme = useTheme();

  const emojis = [
    '😀',
    '😂',
    '😍',
    '👍',
    '🙏',
    '🔥',
    '🎉',
    '❤️',
    '😎',
    '🤔',
    '🥳',
    '😇',
    '😭',
    '💪',
    '😜',
    '🥰',
    '🤩',
    '👏',
    '👋',
    '🙌',
    '✨',
    '💯',
    '🤣',
    '😊'
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        padding: '8px',
        width: '290px',
        height: '300px',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: '4px',
          backgroundColor: theme.palette.primary.main
        }
      }}
    >
      {emojis.map((emoji, index) => (
        <Box
          key={index}
          sx={{
            fontSize: '18px',
            padding: '3px',
            cursor: 'pointer',
            userSelect: 'none',
            textAlign: 'center',
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              borderRadius: '4px'
            }
          }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </Box>
      ))}
    </Box>
  );
}

// Formatted NFT Chip Component
const FormattedNFT = ({ nftData, onRemove }) => {
  const theme = useTheme();

  // Handle both old string format and new object format for backward compatibility
  let name, tokenId, imageUrl;

  if (typeof nftData === 'string') {
    // Old format: "[NFT: name (tokenId)]"
    const match = nftData.match(/\[NFT: (.*?) \((.*?)\)\]/);
    if (match) {
      [, name, tokenId] = match;
      imageUrl = '/static/crossmark.webp'; // fallback to default
    } else {
      return null;
    }
  } else {
    // New format: object with name, tokenId, imageUrl
    name = nftData.name;
    tokenId = nftData.tokenId;
    imageUrl = nftData.imageUrl || '/static/crossmark.webp';
  }

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">{name}</Typography>
          <Typography variant="caption" color="textSecondary">
            {tokenId}
          </Typography>
        </Box>
      }
      arrow
    >
      <Chip
        icon={
          <img
            src={imageUrl}
            alt={name}
            style={{ width: '16px', height: '16px', borderRadius: '2px' }}
            onError={(e) => {
              // Fallback to crossmark if NFT image fails to load
              e.target.src = '/static/crossmark.webp';
            }}
          />
        }
        label={name}
        onDelete={onRemove}
        size="small"
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.main}`,
          '& .MuiChip-label': {
            color: theme.palette.primary.main
          },
          mr: 0.5,
          my: 0.25
        }}
      />
    </Tooltip>
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
  const [nfts, setNfts] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [pickerType, setPickerType] = useState('emoji');

  const emojiPickerRef = useRef(null);

  // Debugging: Clear localStorage and sessionStorage on mount
  useEffect(() => {
    // Uncomment the lines below to clear storage for debugging
    // localStorage.clear();
    // sessionStorage.clear();
  }, []);

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

  // Initialize and manage socket connection
  useEffect(() => {
    // Connect the socket
    socket.connect();

    // Socket event handlers
    const handleInit = (msg) => {
      console.log('init', msg);
      setChatHistory((previousHistory) => [...previousHistory, ...msg]);
    };

    const handleChatMessage = (msg) => {
      console.log('chat message received:', msg);
      setChatHistory((previousHistory) => [...previousHistory, msg]);
    };

    const handlePrivateMessage = (msg) => {
      console.log('private message received:', msg);
      setChatHistory((previousHistory) => [...previousHistory, msg]);
    };

    const handleSocketConnect = () => {
      console.log('Socket connected successfully');
      console.log('Socket ID:', socket.id);
      console.log('Socket connected status:', socket.connected);
    };

    const handleSocketDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      console.log('Socket connected status:', socket.connected);
      if (reason !== 'io client disconnect') {
        console.log('Attempting to reconnect...');
        socket.connect();
      }
    };

    const handleSocketError = (error) => {
      console.error('Socket encountered error:', error);
      console.log('Socket connected status:', socket.connected);
    };

    // Register socket event listeners
    socket.on('init', handleInit);
    socket.on('chat message', handleChatMessage);
    socket.on('private message', handlePrivateMessage);
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('error', handleSocketError);

    // Cleanup on unmount
    return () => {
      socket.off('init', handleInit);
      socket.off('chat message', handleChatMessage);
      socket.off('private message', handlePrivateMessage);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('error', handleSocketError);
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (accountProfile?.account && (message.trim().length > 0 || nfts.length > 0)) {
      // Extract NFT link text from NFT data for the message
      const nftLinks = nfts.map((nft) => (typeof nft === 'string' ? nft : nft.link)).join('');
      const fullMessage = nftLinks + message.trim();
      console.log('Sending message:', { fullMessage, recipient, account: accountProfile.account });

      // Create message object to match expected format
      const messageObj = {
        message: fullMessage,
        username: accountProfile.account,
        rank: 'Member',
        group: 'Member',
        timestamp: new Date().toISOString(),
        isPrivate: !!recipient,
        recipient: recipient
      };

      // Add message immediately to chat history (optimistic update)
      setChatHistory((previousHistory) => [...previousHistory, messageObj]);

      if (recipient) {
        socket.emit('private message', {
          to: recipient,
          message: fullMessage,
          username: accountProfile.account,
          isPrivate: true
        });
      } else {
        socket.emit('chat message', {
          message: fullMessage,
          username: accountProfile.account,
          rank: 'Member',
          group: 'Member'
        });
      }

      setMessage('');
      setNfts([]);
      setRecipient(null);
    } else {
      console.log('Message not sent - conditions not met:', {
        hasAccount: !!accountProfile?.account,
        messageLength: message.trim().length,
        nftsLength: nfts.length
      });
    }
  };

  const startPrivateMessage = (username) => {
    setRecipient(username);
  };

  const addEmoji = (emoji) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  const addNFT = (nftData) => {
    setNfts((prevNfts) => [...prevNfts, nftData]);
    setShowEmojiPicker(false);
  };

  const closeChat = () => {
    dispatch(toggleChatOpen());
  };

  const removeNFT = (index) => {
    setNfts((prevNfts) => prevNfts.filter((_, i) => i !== index));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={handleMenuClick}
              sx={{
                color: 'text.primary',
                textTransform: 'none',
                '&:active': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              {selectedOption}
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={() => handleOptionSelect('Chatbox')}>
                <ListItemIcon>
                  <ChatBubbleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Chatbox</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Trades')}>
                <ListItemIcon>
                  <SwapHorizIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Trades</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOptionSelect('Store')}>
                <ListItemIcon>
                  <StoreIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Store</ListItemText>
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
                backgroundColor: 'action.selected'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <CustomScrollBox sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedOption === 'Chatbox' && (
          <ChatPanel chats={chatHistory} onStartPrivateMessage={startPrivateMessage} />
        )}
        {selectedOption === 'Trades' && <Trades />}
        {selectedOption === 'Store' && <Store />}
        {selectedOption === 'Settings' && <ChatSettings />}
      </CustomScrollBox>
      {accountProfile?.account && selectedOption === 'Chatbox' && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {recipient && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                p: 1,
                borderRadius: 1,
                backgroundColor: theme.palette.action.selected
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  To: <span style={{ color: theme.palette.primary.main }}>{recipient}</span>
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setRecipient(null)}
                sx={{ color: theme.palette.text.secondary }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Box sx={{ flexGrow: 1 }}>
              {/* NFT chips displayed above input */}
              {nfts.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1, gap: 0.5 }}>
                  {nfts.map((nftData, index) => (
                    <FormattedNFT key={index} nftData={nftData} onRemove={() => removeNFT(index)} />
                  ))}
                </Box>
              )}

              {/* Simple, fast text input */}
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                multiline
                maxRows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '8px'
                  }
                }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  sx={{
                    color: showEmojiPicker ? 'primary.main' : 'text.secondary',
                    backgroundColor: showEmojiPicker ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
                {showEmojiPicker && (
                  <Box
                    ref={emojiPickerRef}
                    sx={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      zIndex: 1000,
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 3,
                      mb: 1
                    }}
                  >
                    <Tabs
                      value={pickerType}
                      onChange={(e, newValue) => setPickerType(newValue)}
                      sx={{
                        minHeight: 32,
                        '& .MuiTabs-flexContainer': {
                          justifyContent: 'center'
                        }
                      }}
                    >
                      <Tab
                        label="Emoji"
                        value="emoji"
                        sx={{ minHeight: 32, fontSize: '0.75rem', minWidth: 80 }}
                      />
                      <Tab
                        label="NFT"
                        value="nft"
                        sx={{ minHeight: 32, fontSize: '0.75rem', minWidth: 80 }}
                      />
                    </Tabs>
                    <Box sx={{ p: 1 }}>
                      {pickerType === 'emoji' ? (
                        <EmojiPicker onSelect={addEmoji} />
                      ) : (
                        <ChatNFTPicker onSelect={addNFT} />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
              <IconButton
                onClick={sendMessage}
                color="primary"
                disabled={message.trim().length === 0 && nfts.length === 0}
                sx={{
                  color:
                    message.trim().length === 0 && nfts.length === 0
                      ? 'action.disabled'
                      : 'primary.main',
                  '&.Mui-disabled': {
                    color: 'action.disabled'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      )}
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
        '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: 'background.default' }
      }}
    >
      {drawer}
    </SwipeableDrawer>
  );
}

export default Chatbox;
