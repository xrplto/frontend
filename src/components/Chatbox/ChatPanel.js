import { Stack, Avatar, styled, Paper, Typography, Tooltip, Box, Button, Grid } from "@mui/material";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Send as SendIcon, SwapHoriz as TradeIcon } from '@mui/icons-material'; // Import icons for the buttons

const chats = [
    {
        username: "@XRPAddress1",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-10T12:00:00Z",
        rank: "Member",
        group: "Member",
        activePosts: 120,
        memberSince: "Jan 01, 2020",
        lastActive: "Today, 12:00 PM",
        currently: "Viewing Chat",
        profitLoss: "+10%",
        topNftCollections: ["Bored Ape", "CryptoPunks"],
        topTokensOwned: ["XRP", "BTC", "ETH"],
    },
    {
        username: "@XRPAddress2",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-10T11:59:00Z",
        rank: "VIP",
        group: "VIP",
        activePosts: 340,
        memberSince: "Feb 15, 2019",
        lastActive: "Today, 11:45 AM",
        currently: "Viewing Profile",
        profitLoss: "-5%",
        topNftCollections: ["Meebits"],
        topTokensOwned: ["XRP", "ETH"],
    },
    {
        username: "@XRPAddress3",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-09T12:00:00Z",
        rank: "AQUA",
        group: "AQUA",
        activePosts: 200,
        memberSince: "Mar 03, 2018",
        lastActive: "Today, 10:30 AM",
        currently: "Viewing Dashboard",
        profitLoss: "+15%",
        topNftCollections: ["Cool Cats"],
        topTokensOwned: ["XRP", "SOL"],
    },
    {
        username: "@XRPAddress4",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-08T12:00:00Z",
        rank: "NOVA",
        group: "NOVA",
        activePosts: 480,
        memberSince: "Apr 22, 2017",
        lastActive: "Today, 09:00 AM",
        currently: "Viewing Analytics",
        profitLoss: "0%",
        topNftCollections: ["Art Blocks"],
        topTokensOwned: ["XRP", "DOT"],
    },
    {
        username: "@XRPAddress5",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-08T12:00:00Z",
        rank: "Moderator",
        group: "Moderator",
        activePosts: 1500,
        memberSince: "May 11, 2016",
        lastActive: "Today, 08:00 AM",
        currently: "Managing Users",
        profitLoss: "+25%",
        topNftCollections: ["Mutant Ape"],
        topTokensOwned: ["XRP", "ADA"],
    },
    {
        username: "@XRPAddress6",
        text: "Xrpl.to is so cool platform",
        time: "2024-08-08T12:00:00Z",
        rank: "Admin",
        group: "Administrator",
        activePosts: 3000,
        memberSince: "Jun 06, 2015",
        lastActive: "Today, 07:00 AM",
        currently: "Viewing System Logs",
        profitLoss: "-10%",
        topNftCollections: ["Pudgy Penguins"],
        topTokensOwned: ["XRP", "LTC"],
    },
];

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary,
    maxWidth: '100%',
    flexGrow: 1,
}));

const rankColors = {
    Member: '#ffffff',  // Default white
    VIP: '#FFD700',      // Gold
    AQUA: '#00FFFF',     // Cyan
    NOVA: '#FF69B4',     // Hot Pink
    Moderator: '#8A2BE2', // BlueViolet
    Admin: '#FF4500'     // OrangeRed
};

const rankGlowEffect = {
    Member: 'none',       // No effect for Member
    VIP: '0 0 5px #FFD700',
    AQUA: '0 0 5px #00FFFF',
    NOVA: '0 0 5px #FF69B4',
    Moderator: '0 0 5px #000000', // Dark shadow for Moderator
    Admin: '0 0 5px #000000'      // Dark shadow for Admin
};

const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 0) {
        return "Just now";
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

const UserSummary = ({ user }) => {
    const getPLColor = (pl) => {
        if (!pl || pl === "0%") return "inherit";  // Default color if P/L is null or 0%
        return pl.startsWith("+") ? "green" : "red";
    };

    return (
        <Box p={2} sx={{ minWidth: 250, maxWidth: 500 }}> {/* Adjusted width */}
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar alt={user.username} src="/static/crossmark.webp" sx={{ width: 50, height: 50 }} />
                <Box>
                    <Typography 
                        variant="subtitle1" 
                        sx={{ 
                            fontWeight: 'bold', 
                            color: rankColors[user.rank] || '#ffffff',
                            textShadow: rankGlowEffect[user.rank] || 'none'
                        }}
                    >
                        {user.username}
                    </Typography>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Group:</strong> 
                                <span style={{ color: rankColors[user.rank] || '#ffffff', textShadow: rankGlowEffect[user.rank] || 'none', marginLeft: 4 }}>
                                    {user.group}
                                </span>
                            </Typography>
                        </Grid>

                        {/* P/L Section */}
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>P/L:</strong> <span style={{ color: getPLColor(user.profitLoss) }}>{user.profitLoss || 'N/A'}</span>
                            </Typography>
                        </Grid>

                        {/* Top NFT Collections Section */}
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>NFTs:</strong> {user.topNftCollections?.join(', ') || 'None'}
                            </Typography>
                        </Grid>

                        {/* Top Tokens Owned Section */}
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Tokens:</strong> {user.topTokensOwned?.join(', ') || 'None'}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Chats:</strong> {user.activePosts}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Joined XRPL:</strong> {user.memberSince}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Last Active:</strong> {user.lastActive}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                <strong>Currently:</strong> {user.currently}
                            </Typography>
                        </Grid>
                        
                    </Grid>
                </Box>
            </Stack>

            <Box mt={2} textAlign="center">
                <Stack direction="row" spacing={1} justifyContent="center"> {/* Reduced spacing */}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SendIcon />}
                        sx={{
                            backgroundColor: rankColors[user.rank],
                            '&:hover': {
                                backgroundColor: rankColors[user.rank],
                                opacity: 0.9,
                            },
                            textShadow: rankGlowEffect[user.rank] || 'none',
                            height: '40px',  // Set fixed height
                            width: '100px', // Fixed width for consistency
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
                            height: '40px',  // Set fixed height to match
                            width: '100px',  // Fixed width for consistency
                        }}
                        onClick={() => handleTrade(user)}
                    >
                        Trade
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};

const handleSendTip = (user) => {
    // Handle the logic to send a tip in XRP to the user
    console.log(`Sending tip to ${user.username}`);
    // Add your tipping logic here
};

const handleTrade = (user) => {
    // Handle the logic to initiate a trade with the user
    console.log(`Initiating trade with ${user.username}`);
    // Add your trade initiation logic here
};

const ChatPanel = () => {
    return (
        <Stack gap={2}>
            {
                chats.map((chat, index) => {
                    const parsedTime = parseISO(chat.time);
                    const timeAgo = formatTimeAgo(parsedTime);

                    return (
                        <Stack key={index} direction="row" spacing={1} alignItems="center">
                            <Avatar alt={chat.username} src="/static/crossmark.webp" sx={{ width: 36, height: 36 }} />
                            <Stack sx={{ flexGrow: 1 }}>
                                <Tooltip 
                                    title={<UserSummary user={chat} />} 
                                    arrow
                                    placement="right"
                                >
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            fontWeight: 'bold', 
                                            color: rankColors[chat.rank] || '#ffffff',
                                            textShadow: rankGlowEffect[chat.rank] || 'none',
                                            cursor: 'pointer' // Indicates it's interactable
                                        }}
                                    >
                                        {chat.username}
                                    </Typography>
                                </Tooltip>
                                <Item>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography>{chat.text}</Typography>
                                        <Tooltip title={new Date(chat.time).toLocaleString()} arrow>
                                            <Typography variant="caption" sx={{ marginLeft: 2, whiteSpace: 'nowrap' }}>
                                                {timeAgo}
                                            </Typography>
                                        </Tooltip>
                                    </Stack>
                                </Item>
                            </Stack>
                        </Stack>
                    );
                })
            }
        </Stack>
    )
}

export default ChatPanel;
