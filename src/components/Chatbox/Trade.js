import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  TextField,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TradeNFTPicker from './TradeNFTPicker';
import { AppContext } from 'src/AppContext';
import { Client } from 'xrpl';

const BASE_RESERVE = 10;
const OWNER_RESERVE = 2;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2, 3),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const Trade = ({ open, onClose, tradePartner }) => {
  const { accountProfile } = useContext(AppContext);
  const [selectedLoggedInUserAssets, setSelectedLoggedInUserAssets] = useState([]);
  const [selectedPartnerAssets, setSelectedPartnerAssets] = useState([]);
  const [loggedInUserXrpBalance, setLoggedInUserXrpBalance] = useState(0);
  const [partnerXrpBalance, setPartnerXrpBalance] = useState(0);
  const [loggedInUserXrpOffer, setLoggedInUserXrpOffer] = useState(0);
  const [partnerXrpOffer, setPartnerXrpOffer] = useState(0);

  useEffect(() => {
    if (open && accountProfile && tradePartner) {
      fetchXrpBalances();
    }
  }, [open, accountProfile, tradePartner]);

  const fetchXrpBalances = async () => {
    const client = new Client('wss://s1.ripple.com');
    try {
      await client.connect();

      const loggedInUserInfo = await client.request({
        command: 'account_info',
        account: accountProfile.account,
        ledger_index: 'validated'
      });
      const loggedInUserTotalBalance = Number(loggedInUserInfo.result.account_data.Balance) / 1000000;
      const loggedInUserOwnerCount = loggedInUserInfo.result.account_data.OwnerCount;
      const loggedInUserReserve = BASE_RESERVE + (loggedInUserOwnerCount * OWNER_RESERVE);
      setLoggedInUserXrpBalance(Math.max(0, loggedInUserTotalBalance - loggedInUserReserve));

      const partnerInfo = await client.request({
        command: 'account_info',
        account: tradePartner.username,
        ledger_index: 'validated'
      });
      const partnerTotalBalance = Number(partnerInfo.result.account_data.Balance) / 1000000;
      const partnerOwnerCount = partnerInfo.result.account_data.OwnerCount;
      const partnerReserve = BASE_RESERVE + (partnerOwnerCount * OWNER_RESERVE);
      setPartnerXrpBalance(Math.max(0, partnerTotalBalance - partnerReserve));
    } catch (error) {
      console.error('Error fetching XRP balances:', error);
    } finally {
      client.disconnect();
    }
  };

  const handleLoggedInUserAssetSelect = (nft) => {
    setSelectedLoggedInUserAssets((prev) => {
      const index = prev.findIndex(item => item.id === nft.id);
      if (index === -1) {
        return [...prev, nft];
      } else {
        return prev.filter(item => item.id !== nft.id);
      }
    });
  };

  const handlePartnerAssetSelect = (nft) => {
    setSelectedPartnerAssets((prev) => {
      const index = prev.findIndex(item => item.id === nft.id);
      if (index === -1) {
        return [...prev, nft];
      } else {
        return prev.filter(item => item.id !== nft.id);
      }
    });
  };

  const handleTrade = () => {
    console.log('Trade initiated', {
      loggedInUserAssets: selectedLoggedInUserAssets,
      partnerAssets: selectedPartnerAssets,
      loggedInUserXrpOffer,
      partnerXrpOffer
    });
    // Implement trade logic here
  };

  const handleClose = () => {
    setSelectedLoggedInUserAssets([]);
    setSelectedPartnerAssets([]);
    setLoggedInUserXrpOffer(0);
    setPartnerXrpOffer(0);
    onClose();
  };

  const renderSelectedAssets = (assets) => (
    <Box>
      {assets.map((asset) => (
        <Typography key={asset.id} variant="body2">
          {asset.meta?.name || asset.meta?.Name || 'Unnamed NFT'} ({asset.NFTokenID || asset.nftokenID || asset.id})
        </Typography>
      ))}
    </Box>
  );

  // Move the check here, after all hooks have been called
  if (!accountProfile || !tradePartner) {
    return null; // or return a loading indicator
  }

  return (
    <StyledDialog
      open={open}
      onClose={() => {}}
      maxWidth="lg"
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <StyledDialogTitle>
        Asset Exchange
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <StyledPaper elevation={3}>
              <Typography variant="h6" gutterBottom>{accountProfile.username}'s Portfolio</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Available XRP: {loggedInUserXrpBalance.toFixed(2)} XRP
              </Typography>
              <TextField
                type="number"
                label="XRP to offer"
                value={loggedInUserXrpOffer}
                onChange={(e) => setLoggedInUserXrpOffer(Number(e.target.value))}
                inputProps={{ min: 0, max: loggedInUserXrpBalance, step: 0.000001 }}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <Box mt={2} mb={2}>
                <Divider />
              </Box>
              <Typography variant="subtitle1" gutterBottom>Select Assets to Offer:</Typography>
              <TradeNFTPicker 
                onSelect={handleLoggedInUserAssetSelect} 
                account={accountProfile.account}
                isPartner={false}
              />
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>Selected Assets:</Typography>
                {renderSelectedAssets(selectedLoggedInUserAssets)}
              </Box>
            </StyledPaper>
          </Grid>
          <Grid item xs={6}>
            <StyledPaper elevation={3}>
              <Typography variant="h6" gutterBottom>{tradePartner.username}'s Portfolio</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Available XRP: {partnerXrpBalance.toFixed(2)} XRP
              </Typography>
              <TextField
                type="number"
                label="XRP to request"
                value={partnerXrpOffer}
                onChange={(e) => setPartnerXrpOffer(Number(e.target.value))}
                inputProps={{ min: 0, max: partnerXrpBalance, step: 0.000001 }}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <Box mt={2} mb={2}>
                <Divider />
              </Box>
              <Typography variant="subtitle1" gutterBottom>Select Assets to Request:</Typography>
              <TradeNFTPicker 
                onSelect={handlePartnerAssetSelect}
                account={tradePartner.username}
                isPartner={true}
              />
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>Selected Assets:</Typography>
                {renderSelectedAssets(selectedPartnerAssets)}
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </StyledDialogContent>
      <DialogActions sx={{ padding: (theme) => theme.spacing(3) }}>
        <Button onClick={handleClose} variant="outlined">Cancel</Button>
        <Button 
          onClick={handleTrade} 
          variant="contained" 
          color="primary" 
          startIcon={<SwapHorizIcon />}
        >
          Propose Exchange
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default Trade;