import {
  Stack,
  Avatar,
  styled,
  Paper,
  Typography,
  Tooltip,
  Box,
  Button,
  Grid,
  useTheme,
  tooltipClasses,
  IconButton,
  Link,
  Divider
} from '@mui/material';
import { parseISO } from 'date-fns';
import {
  Send as SendIcon,
  SwapHoriz as TradeIcon,
  Message as MessageIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Remove as RemoveIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import NFTPreview from 'src/nft/NFTPreview';

const CustomWidthTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500
  }
});

// const chats = [
//     {
//         username: "@XRPAddress1",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-10T12:00:00Z",
//         rank: "Member",
//         group: "Member",
//         activePosts: 120,
//         memberSince: "Jan 01, 2020",
//         lastActive: "Today, 12:00 PM",
//         currently: "Viewing Chat",
//         profitLoss: "+10%",
//         topNftCollections: ["Bored Ape", "CryptoPunks"],
//         topTokensOwned: ["XRP", "BTC", "ETH"],
//     },
//     {
//         username: "@XRPAddress2",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-10T11:59:00Z",
//         rank: "VIP",
//         group: "VIP",
//         activePosts: 340,
//         memberSince: "Feb 15, 2019",
//         lastActive: "Today, 11:45 AM",
//         currently: "Viewing Profile",
//         profitLoss: "-5%",
//         topNftCollections: ["Meebits"],
//         topTokensOwned: ["XRP", "ETH"],
//     },
//     {
//         username: "@XRPAddress3",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-09T12:00:00Z",
//         rank: "AQUA",
//         group: "AQUA",
//         activePosts: 200,
//         memberSince: "Mar 03, 2018",
//         lastActive: "Today, 10:30 AM",
//         currently: "Viewing Dashboard",
//         profitLoss: "+15%",
//         topNftCollections: ["Cool Cats"],
//         topTokensOwned: ["XRP", "SOL"],
//     },
//     {
//         username: "@XRPAddress4",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-08T12:00:00Z",
//         rank: "NOVA",
//         group: "NOVA",
//         activePosts: 480,
//         memberSince: "Apr 22, 2017",
//         lastActive: "Today, 09:00 AM",
//         currently: "Viewing Analytics",
//         profitLoss: "0%",
//         topNftCollections: ["Art Blocks"],
//         topTokensOwned: ["XRP", "DOT"],
//     },
//     {
//         username: "@XRPAddress5",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-08T12:00:00Z",
//         rank: "Moderator",
//         group: "Moderator",
//         activePosts: 1500,
//         memberSince: "May 11, 2016",
//         lastActive: "Today, 08:00 AM",
//         currently: "Managing Users",
//         profitLoss: "+25%",
//         topNftCollections: ["Mutant Ape"],
//         topTokensOwned: ["XRP", "ADA"],
//     },
//     {
//         username: "@XRPAddress6",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-08T12:00:00Z",
//         rank: "Admin",
//         group: "Administrator",
//         activePosts: 3000,
//         memberSince: "Jun 06, 2015",
//         lastActive: "Today, 07:00 AM",
//         currently: "Viewing System Logs",
//         profitLoss: "-10%",
//         topNftCollections: ["Pudgy Penguins"],
//         topTokensOwned: ["XRP", "LTC"],
//     },
//     {
//         username: "@XRPAddress7",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-10T12:00:00Z",
//         rank: "Titan",
//         group: "Titan",
//         activePosts: 5000,
//         memberSince: "Mar 01, 2010",
//         lastActive: "Today, 06:00 AM",
//         currently: "Overseeing Everything",
//         profitLoss: "+50%",
//         topNftCollections: ["CryptoPunks", "Bored Ape"],
//         topTokensOwned: ["XRP", "ETH", "BTC"],
//     },
//     {
//         username: "@XRPAddress8",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-10T12:00:00Z",
//         rank: "Legendary",
//         group: "Legendary",
//         activePosts: 7000,
//         memberSince: "Jan 01, 2008",
//         lastActive: "Today, 05:00 AM",
//         currently: "Advising Members",
//         profitLoss: "+75%",
//         topNftCollections: ["Moonbirds", "Azuki"],
//         topTokensOwned: ["XRP", "BTC", "LTC"],
//     },
//     {
//         username: "@XRPAddress9",
//         text: "Xrpl.to is so cool platform",
//         time: "2024-08-10T12:00:00Z",
//         rank: "Developer",
//         group: "Developer",
//         activePosts: 10000,
//         memberSince: "Jan 01, 2015",
//         lastActive: "Today, 03:00 AM",
//         currently: "Building Features",
//         profitLoss: "+100%",
//         topNftCollections: ["CryptoKitties", "Axie Infinity"],
//         topTokensOwned: ["XRP", "ETH", "SOL"],
//     },
//     {
//         username: "@XRPBot",
//         text: "XRP Price Soars on Ripple Victory: Should You Hold On or Take Profits?",
//         time: "2024-08-10T12:00:00Z",
//         rank: "Bot",
//         group: "Bot",
//         activePosts: 0,
//         memberSince: "N/A",
//         lastActive: "Now",
//         currently: "Monitoring System",
//         profitLoss: "N/A",
//         topNftCollections: [],
//         topTokensOwned: [],
//         sentiment: "Bullish",  // Adding a sentiment field (could be "Bearish", "Neutral", or "Bullish")
//     }
// ];

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  maxWidth: '100%',
  flexGrow: 1
}));

const rankColors = (theme) => ({
  Member: theme.palette.grey[500],
  VIP: theme.palette.mode === 'dark' ? '#FFD700' : '#DAA520',
  AQUA: theme.palette.mode === 'dark' ? '#00CED1' : '#20B2AA',
  NOVA: theme.palette.mode === 'dark' ? '#FF69B4' : '#DB7093',
  Moderator: theme.palette.mode === 'dark' ? '#9370DB' : '#8A2BE2',
  Admin: theme.palette.mode === 'dark' ? '#FF4500' : '#DC143C',
  Titan: 'linear-gradient(90deg, #4B0082 0%, #0000FF 50%, #800080 100%)',
  Legendary: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
  Developer: theme.palette.primary.dark,
  Bot: theme.palette.info.main
});

const rankGlowEffect = (theme) => ({
  Member: 'none',
  VIP: `0 0 5px ${theme.palette.mode === 'dark' ? '#FFD700' : '#DAA520'}`,
  AQUA: `0 0 5px ${theme.palette.mode === 'dark' ? '#00CED1' : '#20B2AA'}`,
  NOVA: `0 0 5px ${theme.palette.mode === 'dark' ? '#FF69B4' : '#DB7093'}`,
  Moderator: `0 0 5px ${theme.palette.mode === 'dark' ? '#9370DB' : '#8A2BE2'}`,
  Admin: `0 0 5px ${theme.palette.mode === 'dark' ? '#FF4500' : '#DC143C'}`,
  Titan: '0 0 8px #0000FF',
  Legendary: '0 0 8px #FFA500',
  Developer: `0 0 5px ${theme.palette.primary.dark}`,
  Bot: `0 0 5px ${theme.palette.info.main}`
});

const lightningEffect = `
  @keyframes lightning {
    0% { background-position: 0 0, 0 0, 0 0, 0 0; }
    50% { background-position: 100% 100%, 100% 100%, 100% 100%, 100% 100%; }
    100% { background-position: 0 0, 0 0, 0 0, 0 0; }
  }
`;

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

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 350,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

const NFTDisplay = ({ nftLink }) => {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const theme = useTheme();
  const [nft, setNFT] = useState(null);
  const match = nftLink.match(/\[NFT: (.*?) #(\d+) \((.*?)\)\]/);

  if (!match) return null;

  const [_, name, number, tokenId] = match;

  useEffect(() => {
    async function fetchNFT() {
      const res = await axios.get(`${BASE_URL}/nft/${tokenId}`);
      console.log('xrpnft API response:', res.data.nft);
      setNFT(res.data.nft);
    }
    if (tokenId) fetchNFT();
  }, [tokenId]);

  const getMediaPreview = () => {
    if (!nft) return null;
    if (nft.dfile.video) {
      return (
        <video 
          width="100%" 
          height="auto" 
          controls 
          loop 
          muted
          style={{ maxWidth: '200px', maxHeight: '200px' }}
        >
          <source src={`https://gateway.xrpnft.com/ipfs/${nft.ufileIPFSPath.video}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (nft.dfile.image) {
      return (
        <img 
          src={`https://gateway.xrpnft.com/ipfs/${nft.ufileIPFSPath.image}`} 
          alt={nft.name}
          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
        />
      );
    }
    return null;
  };

  return (
    <StyledTooltip
      title={
        <Paper elevation={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{nft ? nft.name : `${name} #${number}`}</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Collection:</Typography>
              <Typography variant="body2" fontWeight="bold">{nft?.collection}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Rarity Rank:</Typography>
              <Typography variant="body2" fontWeight="bold">{nft?.rarity_rank} / {nft?.total}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Royalty:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {nft ? `${(nft.royalty / 1000).toFixed(2)}%` : 'N/A'}
              </Typography>
            </Box>
            {nft?.props && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Properties:</Typography>
                {nft.props.map((prop, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{prop.type}:</Typography>
                    <Typography variant="body2" fontWeight="bold">{prop.value}</Typography>
                  </Box>
                ))}
              </>
            )}
            {nft?.cfloor && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Floor Price:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {nft.cfloor.amount} {nft.cfloor.currency}
                  </Typography>
                </Box>
              </>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="textSecondary">
              Token ID: {tokenId}
            </Typography>
          </Box>
        </Paper>
      }
      arrow
      placement="right"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 1, gap: 1 }}>
        {getMediaPreview()}
        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
          {nft ? nft.name : `${name} #${number}`}
        </Typography>
      </Box>
    </StyledTooltip>
  );
};

const UserSummary = ({ user }) => {
  const theme = useTheme();
  const [token, setToken] = useState(0);
  const [nft, setNFT] = useState(0);

  useEffect(() => {
    const fetchAssets = () => {
      axios
        .get(`https://api.xrpl.to/api/account/lines/${user.username}?page=0&limit=10`)
        .then((res) => {
          const { total } = res.data;
          setToken(total);
        })
        .catch((error) => {});

      axios
        .post(`https://api.xrpnft.com/api/account/collectedCreated`, {
          account: user.username,
          filter: 0,
          limit: 32,
          page: 0,
          search: '',
          subFilter: 'pricexrpasc',
          type: 'collected'
        })
        .then((res) => {
          const { nfts } = res.data;
          let total = 0;
          nfts.map((nft) => {
            total += nft.nftCount;
          });
          setNFT(total);
        })
        .catch((error) => {});
    };

    if (user.username) {
      fetchAssets();
    }
  }, [user]);

  const getPLColor = (pl) => {
    if (!pl || pl === '0%') return 'inherit'; // Default color if P/L is null or 0%
    return pl.startsWith('+') ? 'green' : 'red';
  };

  return (
    <Box p={4} sx={{ width: 500, maxWidth: 1000, width: 'fit-content', marginLeft: 0 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ marginLeft: 0 }}>
        <Avatar
          alt={user.username}
          src="/static/crossmark.webp"
          sx={{ width: 50, height: 50, marginLeft: 0 }}
        />
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold',
              color: rankColors(theme)[user.rank] || theme.palette.text.primary,
              textShadow: rankGlowEffect(theme)[user.rank] || 'none',
              marginBottom: 1,
              animation:
                user.rank === 'Titan' || user.rank === 'Legendary'
                  ? 'lightning 5s linear infinite'
                  : 'none',
              backgroundImage:
                user.rank === 'Titan'
                  ? `url(https://static.nulled.to/public/assets/whitebg.gif),
                                   radial-gradient(circle,#1436a1 8%,#1071fa 19%,#1071fa 35%,#1071fa 60%,#1071fa 70%,#970f4a 87%,#fff 100%),
                                   url(https://static.nulled.to/public/assets/white-lightning.gif),
                                   url(https://static.nulled.to/public/assets/blue-comet.gif)`
                  : user.rank === 'Legendary'
                  ? `url(https://static.nulled.to/public/assets/whitebg.gif),
                                                   radial-gradient(circle,#1436a1 8%,#1071fa 19%,#1071fa 35%,#1071fa 60%,#1071fa 70%,#970f4a 87%,#fff 100%),
                                                   url(https://static.nulled.to/public/assets/white-lightning.gif)`
                  : 'none',
              backgroundSize: user.rank === 'Legendary' ? 'cover' : '5em, 15% 800%, 10em, 25em',
              WebkitTextFillColor:
                user.rank === 'Titan' || user.rank === 'Legendary' ? 'transparent' : 'inherit',
              WebkitBackgroundClip:
                user.rank === 'Titan' || user.rank === 'Legendary' ? 'text' : 'unset',
              filter: user.rank === 'Titan' ? 'brightness(1.5)' : 'none'
            }}
          >
            {user.username}
          </Typography>
          <Grid container spacing={1}>
            {/* Rank Section */}
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Rank:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                <span
                  style={{
                    color: rankColors(theme)[user.rank] || theme.palette.text.primary,
                    textShadow: rankGlowEffect(theme)[user.rank] || 'none'
                  }}
                >
                  {user.group}
                </span>
              </Typography>
            </Grid>

            {/* P/L Section */}
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>P/L:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2, color: getPLColor(user.profitLoss) }}>
                {user.profitLoss || 'N/A'}
              </Typography>
            </Grid>

            {/* Top NFT Collections Section */}
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>NFTs:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {nft || 'None'}
              </Typography>
            </Grid>

            {/* Top Tokens Owned Section */}
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Tokens:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {token || 'None'}
              </Typography>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Chats:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {user.activePosts}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Joined XRPL:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {user.memberSince}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Last Active:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {user.lastActive}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>Currently:</strong>
              </Typography>
              <Typography variant="body2" sx={{ flex: 2 }}>
                {user.currently}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Stack>

      <Box mt={2} textAlign="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            sx={{
              backgroundColor: rankColors(theme)[user.rank],
              '&:hover': {
                backgroundColor: rankColors(theme)[user.rank],
                opacity: 0.9
              },
              textShadow: rankGlowEffect(theme)[user.rank] || 'none',
              height: '40px',
              width: '100px'
            }}
            onClick={() => handleSendTip(user)}
          >
            Tip
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<TradeIcon />}
            sx={{
              height: '40px',
              width: '100px'
            }}
            onClick={() => handleTrade(user)}
          >
            Trade
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<MessageIcon />}
            sx={{
              height: '40px',
              width: '130px'
            }}
            onClick={() => handleSendMessage(user)}
          >
            Message
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

const handleSendTip = (user) => {
  console.log(`Sending tip to ${user.username}`);
  // Add your tipping logic here
};

const handleTrade = (user) => {
  console.log(`Initiating trade with ${user.username}`);
  // Add your trade initiation logic here
};

const handleSendMessage = (user) => {
  console.log(`Sending message to ${user.username}`);
  // Add your message sending logic here
};

const ChatPanel = ({ chats, onStartPrivateMessage }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const chatContainerRef = useRef(null);

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

  return (
    <Stack
      ref={chatContainerRef}
      gap={1}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse'
      }}
    >
      {chats
        .filter(
          (chat) =>
            !chat.isPrivate ||
            chat.username === accountProfile?.account ||
            chat.recipient === accountProfile?.account
        )
        .reverse() // Reverse the order of messages
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
                src="/static/crossmark.webp"
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
                      color: chat.isPrivate ? theme.palette.secondary.main : theme.palette.text.primary
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
        })}
    </Stack>
  );
};

export default ChatPanel;
