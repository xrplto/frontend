import React from 'react';
import { Stack, Avatar, Typography, Box, Button, Grid, useTheme, styled, Tooltip } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
  Bot: theme.palette.info.main,
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
  Bot: `0 0 5px ${theme.palette.info.main}`,
});

const UserSummary = ({ user }) => {
  const theme = useTheme();
  const [tokenCount, setTokenCount] = useState(0);
  const [nft, setNFT] = useState(0);
  const [userImage, setUserImage] = useState(null);
  const [joinedDate, setJoinedDate] = useState(null);
  const [issuedTokens, setIssuedTokens] = useState([]);
  const [lastActive, setLastActive] = useState(null);

  useEffect(() => {
    const fetchAssets = () => {
      axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}/trustlines2`)
        .then((res) => {
          const tokenLines = res.data.lines.filter(line => parseFloat(line.balance) > 0);
          setTokenCount(tokenLines.length);
        })
        .catch(() => setTokenCount(0));

      axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}/nfts`)
        .then((res) => setNFT(res.data.length))
        .catch(() => setNFT(0));
    };

    const fetchUserImage = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/set-user-image?account=${user.username}`);
        setUserImage(response.data.user?.imageUrl ? `https://s2.xrpnft.com/d1/${response.data.user.imageUrl}` : null);
      } catch {
        setUserImage(null);
      }
    };

    const fetchAccountInfo = async () => {
      try {
        const response = await axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}`);
        if (response.data && response.data.inception) {
          const date = new Date(response.data.inception);
          setJoinedDate(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        } else {
          setJoinedDate('N/A');
        }
      } catch (error) {
        console.error('Error fetching account info:', error);
        setJoinedDate('Error');
      }
    };

    const fetchIssuedTokens = async () => {
      try {
        const response = await axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}/obligations`);
        setIssuedTokens(response.data);
      } catch (error) {
        console.error('Error fetching issued tokens:', error);
        setIssuedTokens([]);
      }
    };

    const fetchLastActive = async () => {
      try {
        const response = await axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}/transactions?limit=1`);
        if (response.data.transactions && response.data.transactions.length > 0) {
          const lastTx = response.data.transactions[0];
          const lastActiveDate = new Date(lastTx.date);
          setLastActive(lastActiveDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        } else {
          setLastActive('No transactions found');
        }
      } catch (error) {
        console.error('Error fetching last active:', error);
        setLastActive('Error fetching data');
      }
    };

    fetchAssets();
    fetchUserImage();
    fetchAccountInfo();
    fetchIssuedTokens();
    fetchLastActive();
  }, [user]);

  const getPLColor = (pl) => (pl?.startsWith('+') ? 'green' : 'red');

  return (
    <Box p={4} sx={{ maxWidth: 1000, width: 'fit-content' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar alt={user.username} src={userImage || "/static/crossmark.webp"} sx={{ width: 50, height: 50 }} />
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold',
              color: rankColors(theme)[user.rank] || theme.palette.text.primary,
              textShadow: rankGlowEffect(theme)[user.rank] || 'none',
              animation: user.rank === 'Titan' || user.rank === 'Legendary' ? 'lightning 5s linear infinite' : 'none',
            }}
          >
            {user.username}
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}><strong>Rank:</strong> {user.group}</Grid>
            <Grid item xs={12}><strong>Joined Date:</strong> {joinedDate || 'Loading...'}</Grid>
            <Grid item xs={12}><strong>Last Active:</strong> {lastActive || 'Loading...'}</Grid>
            <Grid item xs={12}><strong>P/L:</strong> <span style={{ color: getPLColor(user.profitLoss) }}>{user.profitLoss || 'N/A'}</span></Grid>
            <Grid item xs={12}><strong>NFTs:</strong> {nft || 'None'}</Grid>
            <Grid item xs={12}><strong>Tokens:</strong> {tokenCount || 'None'}</Grid>
            <Grid item xs={12}><strong>Chats:</strong> {user.activePosts}</Grid>
            <Grid item xs={12}><strong>Currently:</strong> {user.currently}</Grid>
            <Grid item xs={12}>
              <strong>Issued Tokens:</strong>
              {issuedTokens.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {issuedTokens.map((token, index) => (
                    <li key={index}>
                      {token.currency}: {parseFloat(token.value).toFixed(2)}
                    </li>
                  ))}
                </ul>
              ) : (
                'None'
              )}
            </Grid>
          </Grid>
        </Box>
      </Stack>
      <Box mt={2} textAlign="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" color="primary" onClick={() => handleSendTip(user)}>Tip</Button>
          <Button variant="outlined" color="secondary" onClick={() => handleTrade(user)}>Trade</Button>
          <Button variant="contained" color="secondary" onClick={() => handleSendMessage(user)}>Message</Button>
        </Stack>
      </Box>
    </Box>
  );
};

const handleSendTip = (user) => {
  console.log(`Sending tip to ${user.username}`);
};

const handleTrade = (user) => {
  console.log(`Initiating trade with ${user.username}`);
};

const handleSendMessage = (user) => {
  console.log(`Sending message to ${user.username}`);
};

export default UserSummary;
