import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Stack,
  Avatar,
  Typography,
  Box,
  Button,
  Grid,
  useTheme,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { rankColors, rankGlowEffect } from './RankStyles';
import { Client } from 'xrpl';

const UserSummary = ({ user }) => {
  const theme = useTheme();
  let location;
  try {
    location = useLocation();
  } catch (error) {
    console.warn('useLocation is not available. Using fallback for current status.');
    location = null;
  }
  const [tokenCount, setTokenCount] = useState(0);
  const [nft, setNFT] = useState(0);
  const [nftCount, setNftCount] = useState(0);
  const [userImage, setUserImage] = useState(null);
  const [username, setUsername] = useState(user.username); // Initialize with prop, will be updated if available from API
  const [joinedDate, setJoinedDate] = useState(null);
  const [issuedTokens, setIssuedTokens] = useState([]);
  const [lastActive, setLastActive] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [rank, setRank] = useState('Member'); // Default rank
  const [xrpBalance, setXrpBalance] = useState(null);
  const [availableXrpBalance, setAvailableXrpBalance] = useState(null);
  const [reserveXrp, setReserveXrp] = useState(null);
  const [tokenLines, setTokenLines] = useState([]);

  useEffect(() => {
    const fetchTokenLines = async () => {
      const client = new Client('wss://s1.ripple.com'); // Use the appropriate server

      try {
        await client.connect();

        const response = await client.request({
          command: 'account_lines',
          account: user.username
        });

        if (response.result && response.result.lines) {
          const filteredLines = response.result.lines.filter(
            (line) => parseFloat(line.balance) > 0
          );
          setTokenCount(filteredLines.length);
        } else {
          setTokenCount(0);
        }
      } catch (error) {
        console.error('Error fetching account lines:', error);
        setTokenCount(0);
      } finally {
        client.disconnect();
      }
    };

    const fetchUserImage = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/set-user-image?account=${user.username}`
        );
        if (response.data.user) {
          setUserImage(
            response.data.user.imageUrl
              ? `https://s2.xrpnft.com/d1/${response.data.user.imageUrl}`
              : null
          );
          if (response.data.user.username) {
            setUsername(response.data.user.username);
          }
        }
      } catch (error) {
        console.error('Error fetching user image and username:', error);
        setUserImage(null);
      }
    };

    const fetchAccountInfo = async () => {
      try {
        const response = await axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}`);
        if (response.data) {
          if (response.data.inception) {
            const date = new Date(response.data.inception);
            setJoinedDate(
              date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            );
          }

          if (response.data.xrpBalance) {
            const totalBalance = parseFloat(response.data.xrpBalance);
            const ownerCount = response.data.ownerCount || 0;
            const baseReserve = 10; // XRP Ledger base reserve
            const ownerReserve = 2; // XRP Ledger owner reserve per object
            const totalReserve = baseReserve + ownerCount * ownerReserve;

            setReserveXrp(totalReserve.toFixed(2));
            const availableBalance = Math.max(0, totalBalance - totalReserve);
            setAvailableXrpBalance(availableBalance.toFixed(2));
          }
        } else {
          setJoinedDate('N/A');
          setReserveXrp('N/A');
          setAvailableXrpBalance('N/A');
        }
      } catch (error) {
        console.error('Error fetching account info:', error);
        setJoinedDate('Error');
        setReserveXrp('Error');
        setAvailableXrpBalance('Error');
      }
    };

    const fetchIssuedTokens = async () => {
      try {
        const response = await axios.get(
          `https://api.xrpscan.com/api/v1/account/${user.username}/obligations`
        );
        setIssuedTokens(response.data);
      } catch (error) {
        console.error('Error fetching issued tokens:', error);
        setIssuedTokens([]);
      }
    };

    const fetchLastActive = async () => {
      try {
        const response = await axios.get(
          `https://api.xrpscan.com/api/v1/account/${user.username}/transactions?limit=1`
        );
        if (response.data.transactions && response.data.transactions.length > 0) {
          const lastTx = response.data.transactions[0];
          const lastActiveDate = new Date(lastTx.date);
          setLastActive(
            lastActiveDate.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          );
        } else {
          setLastActive('No transactions found');
        }
      } catch (error) {
        console.error('Error fetching last active:', error);
        setLastActive('Error fetching data');
      }
    };

    const fetchKYCStatus = async () => {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };

      try {
        const response = await fetch(
          `https://xumm.app/api/v1/platform/kyc-status/${user.username}`,
          options
        );
        const data = await response.json();
        setKycStatus(data.kycApproved ? 'Approved' : 'Not Approved');
      } catch (error) {
        console.error('Error fetching KYC status:', error);
        setKycStatus('Error');
      }
    };

    const setUserRank = () => {
      if (user.rank && rankColors(theme)[user.rank]) {
        setRank(user.rank);
      } else {
        setRank('Member');
      }
    };

    const fetchNFTs = async () => {
      try {
        const response = await axios.get(`https://api.xrpscan.com/api/v1/account/${user.username}/nfts`);
        setNftCount(response.data.length);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setNftCount(0);
      }
    };

    setUserRank();
    fetchTokenLines();
    fetchUserImage();
    fetchAccountInfo();
    fetchIssuedTokens();
    fetchLastActive();
    fetchKYCStatus();
    fetchNFTs();
  }, [user, theme]);

  const getPLColor = (pl) => (pl?.startsWith('+') ? 'green' : 'red');

  const truncateUsername = (name) => {
    return name.length > 12 ? name.slice(0, 12) + '...' : name;
  };

  const getCurrentStatus = () => {
    if (user.currentStatus) {
      return user.currentStatus;
    }
    
    return 'Unknown';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        maxWidth: 400,
        width: '100%',
        border: '2px solid white', // Add white border
        borderRadius: '16px' // Increase border radius for a softer look
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            alt={username}
            src={userImage || '/static/crossmark.webp'}
            sx={{ width: 80, height: 80, border: `2px solid ${rankColors(theme)[rank]}` }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold" noWrap>
              {truncateUsername(username)}
            </Typography>
            <Chip
              label={rank}
              sx={{
                bgcolor: rankColors(theme)[rank],
                color: '#fff',
                fontWeight: 'bold',
                boxShadow: rankGlowEffect(theme)[rank]
              }}
            />
          </Box>
        </Stack>

        <Divider />

        <Grid container spacing={1}>
          <InfoItem label="Account" value={user.username} />
          <InfoItem label="XUMM KYC" value={kycStatus || 'Loading...'} />
          <InfoItem label="Joined" value={joinedDate || 'Loading...'} />
          <InfoItem label="Last Active" value={lastActive || 'Loading...'} />
          <InfoItem
            label="P/L"
            value={user.profitLoss || 'N/A'}
            valueColor={getPLColor(user.profitLoss)}
          />
          <InfoItem label="NFTs" value={nftCount || 'None'} />
          <InfoItem label="Tokens" value={tokenCount || 'None'} />
          <InfoItem label="Chats" value={user.activePosts} />
          <InfoItem label="Currently" value={getCurrentStatus()} />
          <InfoItem label="Reserve XRP" value={reserveXrp ? `${reserveXrp} XRP` : 'Loading...'} />
          <InfoItem
            label="Available XRP"
            value={availableXrpBalance ? `${availableXrpBalance} XRP` : 'Loading...'}
          />
        </Grid>

        <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
          <Button variant="contained" color="primary" onClick={() => handleSendTip(user)}>
            Tip
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => handleTrade(user)}>
            Trade
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleSendMessage(user)}>
            Message
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

const InfoItem = ({ label, value, valueColor }) => (
  <Grid item xs={6}>
    <Typography variant="caption" display="block" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight="medium" color={valueColor}>
      {value}
    </Typography>
  </Grid>
);

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
