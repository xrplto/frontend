import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Grid,
  Paper
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { AppContext } from 'src/AppContext';
import { Client, xrpToDrops } from 'xrpl';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import axios from 'axios';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import WarningIcon from '@mui/icons-material/Warning';
import NFTPicker from './TradeNFTPicker'; // Assuming you have this component

const BASE_URL = process.env.API_URL;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.background.default,
  color: theme.palette.text.primary,
  padding: theme.spacing(3, 4),
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.background.default
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  background: theme.palette.background.paper
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  textTransform: 'none',
  fontWeight: 600
}));

const Tip = ({ open, onClose, recipient }) => {
  const { accountProfile } = useContext(AppContext);
  const [tipType, setTipType] = useState('XRP');
  const [amount, setAmount] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [userTokens, setUserTokens] = useState([]);
  const [userXRPBalance, setUserXRPBalance] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [balanceWarning, setBalanceWarning] = useState('');

  useEffect(() => {
    if (open && accountProfile) {
      fetchBalances();
    }
  }, [open, accountProfile]);

  const fetchBalances = async () => {
    const client = new Client('wss://xrplcluster.com');
    try {
      await client.connect();

      const accountInfo = await client.request({
        command: 'account_info',
        account: accountProfile.account,
        ledger_index: 'validated'
      });
      setUserXRPBalance(Number(accountInfo.result.account_data.Balance) / 1000000);

      const lines = await client.request({
        command: 'account_lines',
        account: accountProfile.account
      });
      setUserTokens(processLines(lines.result.lines));
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      client.disconnect();
    }
  };

  const processLines = (lines) => {
    return lines.map((line) => ({
      currency: normalizeCurrencyCodeXummImpl(line.currency),
      balance: Number(line.balance),
      issuer: line.account
    }));
  };

  const handleTipTypeChange = (event) => {
    setTipType(event.target.value);
    setAmount('');
    setSelectedNFT(null);
    setBalanceWarning('');
  };

  const handleAmountChange = (event) => {
    const value = event.target.value;
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
      validateBalance(value);
    }
  };

  const validateBalance = (value) => {
    const numValue = Number(value);
    if (tipType === 'XRP' && numValue > userXRPBalance) {
      setBalanceWarning(`Insufficient XRP balance. Available: ${userXRPBalance.toFixed(6)} XRP`);
    } else if (tipType !== 'XRP' && tipType !== 'NFT') {
      const token = userTokens.find((t) => t.currency === tipType);
      if (token && numValue > token.balance) {
        setBalanceWarning(
          `Insufficient ${tipType} balance. Available: ${token.balance.toFixed(6)} ${tipType}`
        );
      } else {
        setBalanceWarning('');
      }
    } else {
      setBalanceWarning('');
    }
  };

  const handleNFTSelect = (nft) => {
    setSelectedNFT(nft);
  };

  const handleTip = async () => {
    let txData;

    if (tipType === 'NFT') {
      if (!selectedNFT) {
        showNotification('Please select an NFT to tip', 'error');
        return;
      }
      txData = {
        TransactionType: 'NFTokenCreateOffer',
        Account: accountProfile.account,
        NFTokenID: selectedNFT.NFTokenID,
        Amount: '0',
        Flags: 1,
        Destination: recipient.username
      };
    } else {
      if (!amount || Number(amount) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }
      txData = {
        TransactionType: 'Payment',
        Account: accountProfile.account,
        Amount:
          tipType === 'XRP'
            ? xrpToDrops(amount)
            : {
                currency: tipType,
                value: amount,
                issuer: userTokens.find((t) => t.currency === tipType).issuer
              },
        Destination: recipient.username
      };
    }

    try {
      let txHash;
      switch (accountProfile.wallet_type) {
        case 'gem':
          const isGemInstalled = await isInstalled();
          if (isGemInstalled.result.isInstalled) {
            const result = await submitTransaction({ transaction: txData });
            if (result.result.hash) {
              txHash = result.result.hash;
            } else {
              throw new Error('Transaction failed');
            }
          } else {
            throw new Error('GemWallet is not installed');
          }
          break;

        case 'crossmark':
          const { response } = await sdk.methods.signAndSubmitAndWait(txData);
          if (response.data.meta.isSuccess) {
            txHash = response.data.resp.result.hash;
          } else {
            throw new Error('Transaction failed');
          }
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      showNotification('Tip sent successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error in handleTip:', error);
      showNotification(error.message || 'An error occurred while processing the tip', 'error');
    }
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const isTipValid = () => {
    if (tipType === 'NFT') {
      return selectedNFT !== null;
    } else {
      return amount > 0 && balanceWarning === '';
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Tip {recipient.username}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: (theme) => theme.palette.text.secondary
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <StyledPaper elevation={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Select Tip Type:
              </Typography>
              <Select
                value={tipType}
                onChange={handleTipTypeChange}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="XRP">XRP</MenuItem>
                {userTokens.map((token) => (
                  <MenuItem key={`${token.currency}-${token.issuer}`} value={token.currency}>
                    {token.currency}
                  </MenuItem>
                ))}
                <MenuItem value="NFT">NFT</MenuItem>
              </Select>
            </Grid>
            {tipType !== 'NFT' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Amount:
                </Typography>
                <TextField
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  fullWidth
                  placeholder="0"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    '& input::placeholder': {
                      color: 'text.disabled',
                      opacity: 1
                    }
                  }}
                />
                {balanceWarning && (
                  <Typography
                    variant="caption"
                    color="error"
                    display="flex"
                    alignItems="center"
                    mt={1}
                  >
                    <WarningIcon fontSize="small" style={{ marginRight: 4 }} />
                    {balanceWarning}
                  </Typography>
                )}
              </Grid>
            )}
            {tipType === 'NFT' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Select NFT:
                </Typography>
                <NFTPicker
                  onSelect={handleNFTSelect}
                  account={accountProfile.account}
                  selectedNFT={selectedNFT}
                />
              </Grid>
            )}
          </Grid>
        </StyledPaper>
      </StyledDialogContent>
      <DialogActions
        sx={{
          padding: (theme) => theme.spacing(3),
          borderTop: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <StyledButton onClick={onClose} variant="outlined">
          Cancel
        </StyledButton>
        <StyledButton
          onClick={handleTip}
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          disabled={!isTipValid()}
        >
          Send Tip
        </StyledButton>
      </DialogActions>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </StyledDialog>
  );
};

export default Tip;
