import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import { Client, Wallet } from 'xrpl';

const DefaultPrompts = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddWalletDialog, setOpenAddWalletDialog] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  const generateXrpWallet = async () => {
    setLoading(true);
    setError(null);
    setWalletInfo(null);
    setBalance(null);
    let client;
    try {
      client = new Client('wss://s.altnet.rippletest.net:51233');
      console.log('Connecting to XRPL...');
      await client.connect();
      console.log('Connected. Generating wallet...');
      
      const wallet = Wallet.generate();
      console.log('Wallet generated:', wallet);
      
      setWalletInfo({
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        classicAddress: wallet.classicAddress,
        seed: wallet.seed
      });

      setBalance(0); // Set initial balance to 0 for new wallet
    } catch (error) {
      console.error('Error generating XRP wallet:', error);
      setError(`Failed to generate XRP wallet: ${error.message}`);
    } finally {
      if (client && client.isConnected()) {
        console.log('Disconnecting from XRPL...');
        await client.disconnect();
      }
      setLoading(false);
    }
  };

  const fundWallet = async () => {
    if (!walletInfo) return;
    setLoading(true);
    setError(null);
    let client;
    try {
      client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      const fundResult = await client.fundWallet(walletInfo);
      console.log('Funding result:', fundResult);
      setBalance(Number(fundResult.balance));
    } catch (error) {
      console.error('Error funding wallet:', error);
      setError(`Failed to fund wallet: ${error.message}`);
    } finally {
      if (client && client.isConnected()) {
        await client.disconnect();
      }
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!walletInfo) return;
    setLoading(true);
    setError(null);
    let client;
    try {
      client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      const accountInfo = await client.request({
        command: 'account_info',
        account: walletInfo.classicAddress,
        ledger_index: 'validated'
      });
      const newBalance = Number(accountInfo.result.account_data.Balance) / 1000000; // Convert drops to XRP
      setBalance(newBalance);
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setError(`Failed to refresh balance: ${error.message}`);
    } finally {
      if (client && client.isConnected()) {
        await client.disconnect();
      }
      setLoading(false);
    }
  };

  const handleAddWallet = () => {
    setOpenAddWalletDialog(true);
  };

  const handleCloseAddWalletDialog = () => {
    setOpenAddWalletDialog(false);
    setSeedInput('');
  };

  const handleAddWalletSubmit = async () => {
    setLoading(true);
    setError(null);
    let client;
    try {
      const wallet = Wallet.fromSeed(seedInput);
      client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      const accountInfo = await client.request({
        command: 'account_info',
        account: wallet.classicAddress,
        ledger_index: 'validated'
      });
      const newBalance = Number(accountInfo.result.account_data.Balance) / 1000000; // Convert drops to XRP
      
      setWalletInfo({
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        classicAddress: wallet.classicAddress,
        seed: wallet.seed
      });
      setBalance(newBalance);
      handleCloseAddWalletDialog();
    } catch (error) {
      console.error('Error adding wallet:', error);
      setError(`Failed to add wallet: ${error.message}`);
    } finally {
      if (client && client.isConnected()) {
        await client.disconnect();
      }
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    // In a real application, you would validate the password against a secure backend
    // For this example, we're using a simple hardcoded password
    if (password === 'secret123') {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleOpenHelpDialog = () => {
    setOpenHelpDialog(true);
  };

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      generateXrpWallet();
    }
  }, [isAuthenticated]);

  if (showPasswordPrompt) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Welcome to XRPL Terminal
          </Typography>
          <IconButton onClick={handleOpenHelpDialog} color="primary">
            <HelpIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          XRP Ledger's fastest bot to trade any token on the XRPL.
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Enter Password to Access Terminal
        </Typography>
        <TextField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handlePasswordSubmit}>
          Submit
        </Button>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Welcome to XRPL Terminal
        </Typography>
        <IconButton onClick={handleOpenHelpDialog} color="primary">
          <HelpIcon />
        </IconButton>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        XRP Ledger's fastest bot to trade any token on the XRPL.
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your XRP wallet:
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <>
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={generateXrpWallet}>
            Try Again
          </Button>
        </>
      ) : walletInfo ? (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Classic Address:</strong> {walletInfo.classicAddress}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Seed:</strong> {walletInfo.seed}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Balance:</strong> {balance !== null ? `${balance} XRP` : 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={fundWallet}>
              Fund Wallet
            </Button>
            <Button variant="contained" onClick={generateXrpWallet}>
              Generate New Wallet
            </Button>
            <Button variant="contained" onClick={refreshBalance}>
              Refresh Balance
            </Button>
            <Button variant="contained" onClick={handleAddWallet}>
              Add Wallet
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="warning.main">
          Wallet generation completed, but no information was returned. Check console for details.
        </Typography>
      )}

      <Dialog open={openAddWalletDialog} onClose={handleCloseAddWalletDialog}>
        <DialogTitle>Add Wallet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="seed"
            label="Wallet Seed"
            type="text"
            fullWidth
            variant="standard"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddWalletDialog}>Cancel</Button>
          <Button onClick={handleAddWalletSubmit} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog}>
        <DialogTitle>XRPL Terminal Help</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Welcome to the XRPL Terminal! Here's a quick guide to get you started:
          </Typography>
          <Typography variant="body2" paragraph>
            1. Generate New Wallet: Creates a new XRP wallet for you.
          </Typography>
          <Typography variant="body2" paragraph>
            2. Fund Wallet: Adds test XRP to your wallet (only works on testnet).
          </Typography>
          <Typography variant="body2" paragraph>
            3. Refresh Balance: Updates your wallet's balance.
          </Typography>
          <Typography variant="body2" paragraph>
            4. Add Wallet: Allows you to import an existing wallet using its seed.
          </Typography>
          <Typography variant="body1" paragraph>
            Remember to keep your wallet seed safe and never share it with anyone!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DefaultPrompts;