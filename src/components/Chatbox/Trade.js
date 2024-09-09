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
} from '@mui/material';
import TradeNFTPicker from './TradeNFTPicker';
import { AppContext } from 'src/AppContext';
import { Client } from 'xrpl';

const BASE_RESERVE = 10;
const OWNER_RESERVE = 2;

const Trade = ({ open, onClose, tradePartner }) => {
  const { accountProfile } = useContext(AppContext);
  const [selectedLoggedInUserAssets, setSelectedLoggedInUserAssets] = useState([]);
  const [selectedPartnerAssets, setSelectedPartnerAssets] = useState([]);
  const [loggedInUserXrpBalance, setLoggedInUserXrpBalance] = useState(0);
  const [partnerXrpBalance, setPartnerXrpBalance] = useState(0);
  const [loggedInUserXrpOffer, setLoggedInUserXrpOffer] = useState(0);
  const [partnerXrpOffer, setPartnerXrpOffer] = useState(0);

  useEffect(() => {
    if (open) {
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

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} // This prevents the dialog from closing on outside click
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown // This prevents the dialog from closing on Escape key press
      disableBackdropClick // This explicitly disables closing on backdrop click
    >
      <DialogTitle>Trade Assets</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="h6">{accountProfile.username}'s Assets (You)</Typography>
            <Typography variant="body2">Available XRP Balance: {loggedInUserXrpBalance.toFixed(2)} XRP</Typography>
            <TextField
              type="number"
              label="XRP to offer"
              value={loggedInUserXrpOffer}
              onChange={(e) => setLoggedInUserXrpOffer(Number(e.target.value))}
              inputProps={{ min: 0, max: loggedInUserXrpBalance, step: 0.000001 }}
              fullWidth
              margin="normal"
            />
            <TradeNFTPicker 
              onSelect={handleLoggedInUserAssetSelect} 
              account={accountProfile.account}
            />
            <Typography variant="subtitle1" mt={2}>Selected Assets:</Typography>
            {renderSelectedAssets(selectedLoggedInUserAssets)}
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">{tradePartner.username}'s Assets</Typography>
            <Typography variant="body2">Available XRP Balance: {partnerXrpBalance.toFixed(2)} XRP</Typography>
            <TextField
              type="number"
              label="XRP to request"
              value={partnerXrpOffer}
              onChange={(e) => setPartnerXrpOffer(Number(e.target.value))}
              inputProps={{ min: 0, max: partnerXrpBalance, step: 0.000001 }}
              fullWidth
              margin="normal"
            />
            <TradeNFTPicker 
              onSelect={handlePartnerAssetSelect}
              account={tradePartner.username}
            />
            <Typography variant="subtitle1" mt={2}>Selected Assets:</Typography>
            {renderSelectedAssets(selectedPartnerAssets)}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleTrade} variant="contained" color="primary">
          Propose Trade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Trade;