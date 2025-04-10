import React from 'react';
import {
  Stack,
  Avatar,
  Typography,
  Box,
  Grid,
  useTheme,
  Paper,
  Chip,
  Divider, // Add this import
  Button // Add this import as well, since it's used in the component
} from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { activeRankColors, rankGlowEffect } from './RankStyles';
import { Client } from 'xrpl';
import { AppContext } from 'src/AppContext';
import Send from './Send'; // Add this import

const UserSummary = ({ user, rankName = 'Member', rank, handleTrade }) => {
  const theme = useTheme();
  const [tokenCount, setTokenCount] = useState(0);
  const [nft, setNFT] = useState(0);
  const [nftCount, setNftCount] = useState(0);
  const [userImage, setUserImage] = useState(null);
  const [username, setUsername] = useState(user.username); // Initialize with prop, will be updated if available from API
  const [joinedDate, setJoinedDate] = useState(null);
  const [issuedTokens, setIssuedTokens] = useState([]);
  const [lastActive, setLastActive] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [xrpBalance, setXrpBalance] = useState(null);
  const [availableXrpBalance, setAvailableXrpBalance] = useState(null);
  const [reserveXrp, setReserveXrp] = useState(null);
  const [tokenLines, setTokenLines] = useState([]);
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const [sendDialogOpen, setSendDialogOpen] = useState(false); // Add this state

  useEffect(() => {
    const fetchTokenLines = async () => {
      const client = new Client('wss://xrplcluster.com'); // Use the appropriate server

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
          `http://37.27.134.126:5000/api/set-user-image?account=${user.username}`
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

    const fetchNFTs = async () => {
      try {
        const response = await axios.get(
          `https://api.xrpscan.com/api/v1/account/${user.username}/nfts`
        );
        setNftCount(response.data.length);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setNftCount(0);
      }
    };

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

  const isOwnProfile = user.username === accountLogin;

  const handleSend = () => {
    setSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          maxWidth: 450,
          width: '100%',
          border: '2px solid white',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              alt={username}
              src={userImage || '/static/crossmark.webp'}
              sx={{
                width: 70,
                height: 70,
                border: `3px solid ${activeRankColors[rank] || '#808080'}`,
                boxShadow: `0 0 15px ${activeRankColors[rank] || '#808080'}`
              }}
            />
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                noWrap
                gutterBottom
                sx={{
                  color: activeRankColors[rank] || '#808080',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {truncateUsername(username)}
                {rank === 'verified' && (
                  <VerifiedIcon
                    sx={{
                      fontSize: '1.2rem',
                      ml: 0.5,
                      color: '#1DA1F2'
                    }}
                  />
                )}
              </Typography>
              <Chip
                label={rankName}
                sx={{
                  bgcolor: activeRankColors[rank] || '#808080',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: rankGlowEffect(theme)[rank] || 'none',
                  padding: '4px 8px',
                  fontSize: '0.85rem'
                }}
              />
            </Box>
          </Stack>

          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />

          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <InfoItem label="Account" value={user.username} />
              <InfoItem label="XUMM KYC" value={kycStatus || 'Loading...'} />
              <InfoItem label="Joined" value={joinedDate || 'Loading...'} />
              <InfoItem label="Last Active" value={lastActive || 'Loading...'} />
              <InfoItem
                label="P/L"
                value={user.profitLoss || 'N/A'}
                valueColor={getPLColor(user.profitLoss)}
              />
              <InfoItem label="Currently" value={getCurrentStatus()} />
            </Grid>
            <Grid item xs={6}>
              <InfoItem label="NFTs" value={nftCount || 'None'} />
              <InfoItem label="Tokens" value={tokenCount || 'None'} />
              <InfoItem label="Chats" value={user.activePosts} />
              <InfoItem
                label="Reserve XRP"
                value={reserveXrp ? `${reserveXrp} XRP` : 'Loading...'}
              />
              <InfoItem
                label="Available XRP"
                value={availableXrpBalance ? `${availableXrpBalance} XRP` : 'Loading...'}
              />
            </Grid>
          </Grid>

          {!isOwnProfile && (
            <Stack direction="row" spacing={1.5} justifyContent="center" mt={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSend}
                sx={{
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                Send
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleTrade}
                sx={{
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  borderWidth: '2px'
                }}
              >
                Trade
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleSendMessage(user)}
                sx={{
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                Message
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Send open={sendDialogOpen} onClose={handleCloseSendDialog} recipient={user} />
    </>
  );
};

const InfoItem = ({ label, value, valueColor }) => (
  <Box mb={0.75}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight="medium" color={valueColor} sx={{ lineHeight: 1.2 }}>
      {value}
    </Typography>
  </Box>
);

const handleSendTip = (user) => {
  console.log(`Sending to ${user.username}`);
};

const handleSendMessage = (user) => {
  console.log(`Sending message to ${user.username}`);
};

export default UserSummary;
