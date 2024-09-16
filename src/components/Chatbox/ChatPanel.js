import {
  Stack,
  Avatar,
  styled,
  Paper,
  Typography,
  Tooltip,
  Box,
  Button,
  useTheme,
  tooltipClasses,
  IconButton,
  Link,
  Divider
} from '@mui/material';
import { parseISO } from 'date-fns';
import {
  ChatBubbleOutline as ChatBubbleOutlineIcon,
} from '@mui/icons-material';
import { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import UserSummary from './UserSummary';
import { rankColors, rankGlowEffect, lightningEffect } from './RankStyles';
import NFTDisplay from './NFTDisplay'; // Import the extracted component

const CustomWidthTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500
  }
});

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 0) {
    return 'Just now';
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}hr`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

const CustomScrollBox = styled(Stack)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#a9a9a94d',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'darkgrey',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a9a9a9d4',
    cursor: 'pointer'
  }
}));

const ChatPanel = ({ chats, onStartPrivateMessage }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const chatContainerRef = useRef(null);
  const [userImages, setUserImages] = useState({});

  // Inject lightningEffect into the document's head
  const styleElement = document.createElement('style');
  styleElement.textContent = lightningEffect;
  document.head.appendChild(styleElement);

  const truncateString = (str) => str.slice(0, 12) + (str.length > 12 ? '...' : '');

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  // Add this console.log to check if chats are being received
  console.log('Chats received in ChatPanel:', chats);

  useEffect(() => {
    const fetchUserImages = async () => {
      const uniqueUsers = [...new Set(chats.map((chat) => chat.username))];
      const imagePromises = uniqueUsers.map(async (account) => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/set-user-image?account=${account}`
          );
          if (response.data.user) {
            const user = response.data.user;
            return {
              [account]: user.imageUrl
                ? `https://s2.xrpnft.com/d1/${user.imageUrl}`
                : user.nftTokenId
                ? `https://s2.xrpnft.com/d1/${user.nftTokenId}`
                : null
            };
          } else {
            console.log(`No user data found for ${account}`);
            return { [account]: null };
          }
        } catch (error) {
          console.error(`Error fetching image for ${account}:`, error.message);
          return { [account]: null };
        }
      });

      const images = await Promise.all(imagePromises);
      setUserImages(Object.assign({}, ...images));
    };

    if (chats.length > 0) {
      fetchUserImages();
    }
  }, [chats]);

  return (
    <CustomScrollBox
      ref={chatContainerRef}
      gap={1}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse'
      }}
    >
      {Array.isArray(chats) && chats.length > 0 ? (
        chats
          .filter(
            (chat) =>
              !chat.isPrivate ||
              chat.username === accountProfile?.account ||
              chat.recipient === accountProfile?.account
          )
          .reverse()
          .map((chat, index) => {
            const parsedTime = parseISO(chat.timestamp);
            const timeAgo = formatTimeAgo(parsedTime);

            const privateMessageRecipient = chat.isPrivate
              ? chat.username === accountProfile?.account
                ? chat.recipient
                : chat.username
              : chat.username;

            const displayUsername = truncateString(chat.username);
            const displayRecipient = truncateString(privateMessageRecipient);

            const isCurrentUser = chat.username === accountProfile?.account;

            // Parse NewsBot message
            let newsData = null;
            if (chat.username === 'NewsBot') {
              try {
                newsData = JSON.parse(chat.message);
              } catch (error) {
                console.error('Error parsing NewsBot message:', error);
              }
            }

            return (
              <Stack
                key={index}
                direction="row"
                spacing={1}
                alignItems="flex-start"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 1,
                  p: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Avatar
                  alt={chat.username}
                  src={userImages[chat.username] || '/static/crossmark.webp'}
                  sx={{ width: 32, height: 32, marginTop: 0.5 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CustomWidthTooltip title={<UserSummary user={chat} />} arrow placement="right">
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 'bold',
                          color: rankColors(theme)[chat.rank] || theme.palette.text.primary,
                          textShadow: rankGlowEffect(theme)[chat.rank] || 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {displayUsername}
                        {chat.isPrivate && (
                          <>
                            {' → '}
                            <span style={{ color: theme.palette.text.secondary }}>
                              {displayRecipient}
                            </span>
                          </>
                        )}
                      </Typography>
                    </CustomWidthTooltip>
                    {chat.username !== accountProfile?.account && (
                      <Tooltip title="Send private message" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onStartPrivateMessage(privateMessageRecipient)}
                          sx={{
                            padding: 0,
                            color: theme.palette.text.secondary,
                            '&:hover': {
                              color: theme.palette.primary.main
                            }
                          }}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  {newsData ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {newsData.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {newsData.summary !== 'No summary available'
                          ? newsData.summary
                          : 'No summary available.'}
                      </Typography>
                      <Link href={newsData.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                          Read more at {newsData.sourceName}
                        </Typography>
                      </Link>
                      {newsData.sentiment !== 'Unknown' && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 1,
                            color:
                              newsData.sentiment === 'Bullish'
                                ? 'green'
                                : newsData.sentiment === 'Bearish'
                                ? 'red'
                                : 'inherit'
                          }}
                        >
                          • {newsData.sentiment}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: chat.isPrivate
                          ? theme.palette.secondary.main
                          : theme.palette.text.primary
                      }}
                    >
                      {chat.message.split(/(\[NFT:.*?\])/).map((part, i) => {
                        if (part.startsWith('[NFT:')) {
                          return <NFTDisplay key={i} nftLink={part} />;
                        }
                        return part;
                      })}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    opacity: 0.8
                  }}
                >
                  {timeAgo}
                </Typography>
              </Stack>
            );
          })
      ) : (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          No messages to display.
        </Typography>
      )}
    </CustomScrollBox>
  );
};

export default ChatPanel;
