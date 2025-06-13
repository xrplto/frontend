import {
  Stack,
  Avatar,
  styled,
  Paper,
  Typography,
  Tooltip,
  Box,
  useTheme,
  tooltipClasses,
  IconButton,
  Link,
  alpha,
  Fade
} from '@mui/material';
import { parseISO } from 'date-fns';
import {
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Verified as VerifiedIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import UserSummary from './UserSummary';
import { rankGlowEffect, lightningEffect, activeRankColors } from './RankStyles';
import NFTDisplay from './NFTDisplay';
import Trade from './Trade';

const CustomWidthTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500,
    padding: '0 !important'
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
    background: alpha(theme.palette.background.paper, 0.5),
    borderRadius: '12px',
    margin: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
      theme.palette.secondary.main,
      0.6
    )})`,
    borderRadius: '12px',
    border: `2px solid ${theme.palette.background.default}`
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(
      theme.palette.secondary.main,
      0.8
    )})`,
    cursor: 'pointer'
  }
}));

const ranks = {
  riddler: {
    id: 'riddler',
    name: 'Riddler',
    price: 5,
    description: 'Entry-level rank for XRP puzzle solvers',
    color: '#FFD700'
  },
  rippler: {
    id: 'rippler',
    name: 'Rippler',
    price: 0.0001,
    description: 'Intermediate rank for XRP enthusiasts',
    color: '#4CAF50'
  },
  validator: {
    id: 'validator',
    name: 'Validator',
    price: 0.0001,
    description: 'Advanced rank with enhanced features',
    color: '#2196F3'
  },
  escrow: {
    id: 'escrow',
    name: 'Escrow Master',
    price: 0.0001,
    description: 'Elite rank with exclusive XRP-themed perks',
    color: '#9C27B0'
  },
  ledger: {
    id: 'ledger',
    name: 'Ledger Guardian',
    price: 0.0001,
    description: 'Legendary rank for true XRP aficionados',
    color: '#F44336'
  },
  verified: {
    id: 'verified',
    name: 'Verified',
    price: 0.0001,
    description: 'Exclusive verified status with premium benefits',
    color: '#1DA1F2'
  }
};

const ChatPanel = ({ chats, onStartPrivateMessage }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const chatContainerRef = useRef(null);
  const [userImages, setUserImages] = useState({});
  const [activeRanks, setActiveRanks] = useState({});
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [trader, setTrader] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);

  // Inject lightningEffect into the document's head
  const styleElement = document.createElement('style');
  styleElement.textContent = lightningEffect;
  document.head.appendChild(styleElement);

  const truncateString = (str, isNFTLink = false) => {
    if (isNFTLink) return str;
    return str.slice(0, 12) + (str.length > 12 ? '...' : '');
  };

  // Improved scroll behavior
  useEffect(() => {
    if (chatContainerRef.current && autoScroll) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats, autoScroll]);

  // Handle scroll events to detect when user manually scrolls up
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // If user is near bottom, enable auto-scroll, otherwise disable it
      setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
    }
  };

  // Add this console.log to check if chats are being received
  console.log('Chats received in ChatPanel:', chats);

  useEffect(() => {
    const fetchUserImages = async () => {
      const uniqueUsers = [...new Set(chats.map((chat) => chat.username))];
      const imagePromises = uniqueUsers.map(async (account) => {
        try {
          const response = await axios.get(
            `http://37.27.134.126:5000/api/set-user-image?account=${account}` //http://37.27.134.126:5000
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

  useEffect(() => {
    async function fetchActiveRanks() {
      const res = await axios.get('http://37.27.134.126:5000/api/fetch-active-ranks'); //http://37.27.134.126:5000
      setActiveRanks(res.data);
    }

    fetchActiveRanks();
  }, []);

  return (
    <CustomScrollBox
      ref={chatContainerRef}
      gap={0.5}
      onScroll={handleScroll}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.5rem',
        backgroundColor: alpha(theme.palette.background.default, 0.95)
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
            const recipientRankColor =
              activeRankColors[activeRanks[privateMessageRecipient]] || '#808080';

            // Parse NewsBot message
            let newsData = null;
            if (chat.username === 'NewsBot') {
              try {
                newsData = JSON.parse(chat.message);
              } catch (error) {
                console.error('Error parsing NewsBot message:', error);
              }
            }

            const isVerified = activeRanks[chat.username] === 'verified';

            return (
              <Paper
                key={index}
                elevation={isCurrentUser ? 2 : 1}
                sx={{
                  background: isCurrentUser
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
                        theme.palette.primary.light,
                        0.08
                      )})`
                    : alpha(theme.palette.background.paper, 0.9),
                  borderRadius: '0.75rem',
                  p: 0.75,
                  transition: 'all 0.3s ease',
                  border: `1px solid ${alpha(
                    isCurrentUser ? theme.palette.primary.main : theme.palette.divider,
                    isCurrentUser ? 0.2 : 0.1
                  )}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: isCurrentUser
                      ? `0 6px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                      : `0 6px 18px ${alpha(theme.palette.common.black, 0.06)}`,
                    backgroundColor: isCurrentUser
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.background.paper, 1)
                  },
                  marginBottom: '6px'
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="flex-start">
                  <Avatar
                    alt={chat.username}
                    src={userImages[chat.username] || '/static/crossmark.webp'}
                    sx={{
                      width: 28,
                      height: 28,
                      border: `2px solid ${
                        activeRankColors[activeRanks[chat.username]] || '#808080'
                      }`,
                      boxShadow: `0 0 10px ${alpha(
                        activeRankColors[activeRanks[chat.username]] || '#808080',
                        0.3
                      )}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
                      <CustomWidthTooltip
                        title={
                          <UserSummary
                            user={chat}
                            activeColor={
                              activeRankColors[activeRanks[chat.username]] ||
                              theme.palette.text.primary
                            }
                            rankName={ranks[activeRanks[chat.username]]?.name}
                            rank={activeRanks[chat.username]}
                            handleTrade={() => {
                              setTrader(chat);
                              setTradeModalOpen(true);
                            }}
                          />
                        }
                        arrow
                        placement="right"
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: activeRankColors[activeRanks[chat.username]] || '#808080',
                            textShadow: rankGlowEffect(theme)[chat.rank] || 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              filter: 'brightness(1.2)'
                            }
                          }}
                        >
                          {displayUsername}
                          {isVerified && (
                            <VerifiedIcon
                              sx={{
                                fontSize: '0.9rem',
                                ml: 0.25,
                                color: '#1DA1F2'
                              }}
                            />
                          )}
                          {chat.isPrivate && (
                            <>
                              <Typography
                                component="span"
                                sx={{
                                  mx: 0.25,
                                  opacity: 0.7,
                                  fontSize: '0.7rem'
                                }}
                              >
                                →
                              </Typography>
                              <Typography
                                component="span"
                                sx={{
                                  color: recipientRankColor,
                                  fontWeight: 500
                                }}
                              >
                                {displayRecipient}
                              </Typography>
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
                              padding: '2px',
                              color: alpha(theme.palette.text.secondary, 0.7),
                              backgroundColor: alpha(theme.palette.background.paper, 0.5),
                              borderRadius: '6px',
                              width: '20px',
                              height: '20px',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <ChatBubbleOutlineIcon sx={{ fontSize: '0.7rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontStyle: 'italic',
                          fontSize: '0.65rem',
                          fontWeight: 500
                        }}
                      >
                        {timeAgo}
                      </Typography>
                    </Stack>
                    {newsData ? (
                      <Box
                        sx={{
                          mt: 0.5,
                          p: 1,
                          backgroundColor: alpha(theme.palette.info.main, 0.05),
                          borderRadius: '8px',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: theme.palette.info.main,
                            mb: 0.25
                          }}
                        >
                          {newsData.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.25,
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                            color: theme.palette.text.secondary
                          }}
                        >
                          {newsData.summary !== 'No summary available'
                            ? newsData.summary
                            : 'No summary available.'}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Link
                            href={newsData.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 500,
                                fontSize: '0.65rem'
                              }}
                            >
                              Read more at {newsData.sourceName}
                            </Typography>
                          </Link>
                          {newsData.sentiment !== 'Unknown' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  newsData.sentiment === 'Bullish'
                                    ? theme.palette.success.main
                                    : newsData.sentiment === 'Bearish'
                                    ? theme.palette.error.main
                                    : 'inherit',
                                fontWeight: 500,
                                fontSize: '0.6rem',
                                backgroundColor: alpha(
                                  newsData.sentiment === 'Bullish'
                                    ? theme.palette.success.main
                                    : newsData.sentiment === 'Bearish'
                                    ? theme.palette.error.main
                                    : theme.palette.grey[500],
                                  0.1
                                ),
                                padding: '1px 6px',
                                borderRadius: '8px'
                              }}
                            >
                              {newsData.sentiment}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.25,
                          color: chat.isPrivate
                            ? theme.palette.secondary.main
                            : theme.palette.text.primary,
                          lineHeight: 1.4,
                          fontSize: '0.8rem',
                          wordBreak: 'break-word',
                          fontWeight: 400
                        }}
                      >
                        {chat.message.split(/(\[NFT:.*?\])/).map((part, i) => {
                          if (part.startsWith('[NFT:')) {
                            const match = part.match(/\[NFT: (.*?) \((.*?)\)\]/);
                            if (match) {
                              const [_, name, tokenId] = match;
                              return <NFTDisplay key={i} nftLink={part} />;
                            }
                          }
                          return part;
                        })}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            );
          })
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            opacity: 0.7
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
              mb: 0.5,
              fontSize: '0.9rem'
            }}
          >
            No messages yet
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.7),
              fontSize: '0.75rem'
            }}
          >
            Start a conversation to see messages here
          </Typography>
        </Box>
      )}
      {!autoScroll && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            zIndex: 10
          }}
        >
          <Tooltip title="Scroll to latest messages" arrow>
            <IconButton
              onClick={() => {
                setAutoScroll(true);
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
              }}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                boxShadow: `0 3px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                width: 40,
                height: 40,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'scale(1.1)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              }}
            >
              <ArrowDownwardIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Trade open={tradeModalOpen} onClose={() => setTradeModalOpen(false)} tradePartner={trader} />
    </CustomScrollBox>
  );
};

export default ChatPanel;
