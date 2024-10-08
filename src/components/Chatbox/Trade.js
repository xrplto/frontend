// Trade.js
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
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TradeNFTPicker from './TradeNFTPicker';
import { AppContext } from 'src/AppContext';
import { Client, xrpToDrops } from 'xrpl';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import CryptoJS from 'crypto-js';
import { isInstalled, submitBulkTransactions } from '@gemwallet/api';
import axios from 'axios';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const BASE_URL = 'https://api.xrpl.to/api';
const NFTRADE_URL = 'http://65.108.136.237:5333';

const BASE_RESERVE = 10;
const OWNER_RESERVE = 2;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.background.default,
  color: theme.palette.text.primary,
  padding: theme.spacing(3, 4),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  background: theme.palette.background.paper,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  textTransform: 'none',
  fontWeight: 600,
}));

const Trade = ({ open, onClose, tradePartner }) => {
  const { accountProfile } = useContext(AppContext);
  const [selectedLoggedInUserAssets, setSelectedLoggedInUserAssets] = useState([]);
  const [selectedPartnerAssets, setSelectedPartnerAssets] = useState([]);
  const [loggedInUserXrpBalance, setLoggedInUserXrpBalance] = useState(0);
  const [partnerXrpBalance, setPartnerXrpBalance] = useState(0);
  const [loggedInUserTokens, setLoggedInUserTokens] = useState([]);
  const [partnerTokens, setPartnerTokens] = useState([]);
  const [loggedInUserOffers, setLoggedInUserOffers] = useState([{ currency: 'XRP', amount: 0, token_type: 'token' }]);
  const [partnerOffers, setPartnerOffers] = useState([{ currency: 'XRP', amount: 0, token_type: 'token' }]);
  const [loggedInUserLines, setLoggedInUserLines] = useState([]);
  const [partnerLines, setPartnerLines] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    if (open && accountProfile && tradePartner) {
      fetchBalances();
    }
    console.log(open, "open = open", tradePartner)
  }, [open, accountProfile, tradePartner]);

  const fetchBalances = async () => {
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

      const loggedInUserLines = await client.request({
        command: 'account_lines',
        account: accountProfile.account,
      });
      setLoggedInUserLines(loggedInUserLines.result.lines);

      const partnerLines = await client.request({
        command: 'account_lines',
        account: tradePartner.username,
      });
      setPartnerLines(partnerLines.result.lines);

      // Process the lines to set tokens
      setLoggedInUserTokens(processLines(loggedInUserLines.result.lines, accountProfile.account));
      setPartnerTokens(processLines(partnerLines.result.lines, tradePartner.username));

    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      client.disconnect();
    }
  };

  const getLines = () => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=${rows}`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          setTotal(ret.total);
          setLines(ret.lines);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      })
      .then(function () {
        setLoading(false);
      });
  };

  const processLines = (lines, account) => {
    return lines.map(line => {
      const { currency, account: issuer } = line;
      const balance = account === line.account ? Math.abs(Number(line.balance)) : Number(line.balance);
      const currencyName = normalizeCurrencyCodeXummImpl(currency);
      const md5 = CryptoJS.MD5(issuer + "_" + currency).toString();
      return {
        currencyName: currencyName,
        currency,
        issuer,
        balance,
        md5,
      };
    });
  };

  // Selection handler for Logged-In User
  const handleLoggedInUserAssetSelect = (nft) => {
    setSelectedLoggedInUserAssets((prev) => {
      const exists = prev.some(asset => asset.NFTokenID === nft.NFTokenID);
      if (exists) {
        // Deselect the NFT
        return prev.filter(asset => asset.NFTokenID !== nft.NFTokenID);
      } else {
        // Select the NFT
        return [...prev, nft];
      }
    });
  };

  // Selection handler for Partner
  const handlePartnerAssetSelect = (nft) => {
    setSelectedPartnerAssets((prev) => {
      const exists = prev.some(asset => asset.NFTokenID === nft.NFTokenID);
      if (exists) {
        // Deselect the NFT
        return prev.filter(asset => asset.NFTokenID !== nft.NFTokenID);
      } else {
        // Select the NFT
        return [...prev, nft];
      }
    });
  };

  const handleAddOffer = (isLoggedInUser) => {
    if (isLoggedInUser) {
      setLoggedInUserOffers([...loggedInUserOffers, { currency: 'XRP', amount: 0, token_type: 'token' }]);
    } else {
      setPartnerOffers([...partnerOffers, { currency: 'XRP', amount: 0, token_type: 'token' }]);
    }
  };

  const handleRemoveOffer = (index, isLoggedInUser) => {
    if (isLoggedInUser) {
      setLoggedInUserOffers(loggedInUserOffers.filter((_, i) => i !== index));
    } else {
      setPartnerOffers(partnerOffers.filter((_, i) => i !== index));
    }
  };

  const handleOfferChange = (index, field, value, isLoggedInUser) => {
    const updateOffers = (offers) =>
      offers.map((offer, i) => {
        if (field === 'currency') {
          const selectedToken = loggedInUserTokens.filter(token => token.currency === value);
          console.log(selectedToken, "selectedToken")
          return i === index ? { ...offer, [field]: value, issuer: selectedToken[0]?.issuer, token_type: 'token' } : offer
        }
        return i === index ? { ...offer, [field]: value } : offer
      });
      
    if (isLoggedInUser) {
      setLoggedInUserOffers(updateOffers(loggedInUserOffers));
    } else {
      setPartnerOffers(updateOffers(partnerOffers));
    }
  };

  const addTrustLine = (async(wallet_address, currency) => {
    axios
        .get(`${NFTRADE_URL}/trustline/add/${wallet_address}/${currency}`)
        .then(async(res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            console.log(ret, "message from trustline");
          }
        })
        .catch((err) => {
          console.log('Error on setting account lines!!!', err);
        })
  });

  const getTrustLines = async(currency) => {
    const MIDDLEMAN_ADDRESS = 'rKxpqFqHWFWRzBuSkjZGHg9HXUYMGn6zbk';
    axios
        .get(`${BASE_URL}/account/lines/${MIDDLEMAN_ADDRESS}`)
        .then(async(res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const trustlines = ret.lines;

            const trustlineStatus = await trustlines.find((trustline) => {
              return (
                (trustline.LowLimit.issuer === MIDDLEMAN_ADDRESS ||
                  trustline.HighLimit.issuer) &&
                trustline.LowLimit.currency === currency
              );
            });
            console.log(trustlineStatus, "trustlineStatus from")
            if(trustlineStatus === undefined) {
              // add trust line
              await addTrustLine(MIDDLEMAN_ADDRESS, currency)
            }
          }
        })
        .catch((err) => {
          console.log('Error on getting account lines!!!', err);
        })
  }
        
  const handleTrade = async() => {
    // const loggedInUserAssets = selectedLoggedInUserAssets;
    
    let validateTrade = true;
    loggedInUserOffers.map((tokenInfo, index) => {
      if(tokenInfo.currency !== 'XRP')
         getTrustLines(tokenInfo.currency);

      if(tokenInfo.amount === 0) {
        showNotification(`Invalid token amount for ${tokenInfo.currency}`, 'error');
        validateTrade = false;
      }
    });

    // console.log(tet, "check tet");
    console.log(loggedInUserOffers, "loggedInUserOffers")
    
    // check trust line
    if(!validateTrade)
      return false;
    
    // Implement trade logic here
    try {
      isInstalled().then(async (response) => {
        if (response.result.isInstalled) {
          let itemsSent = loggedInUserOffers;
          if(selectedLoggedInUserAssets.length > 0) {
            selectedLoggedInUserAssets.map((item, index) => {
              let temp = new Array();
              temp.currency = item.name;
              temp.amount = 0;
              temp.token_type = 'NFT';
              temp.issuer = '';
              temp.token_address = item.NFTokenID;
              temp.token_icon = item.ufile.image;
              itemsSent.push(temp)
            })
          }
          let itemsRequested = partnerOffers;
          if(selectedPartnerAssets.length > 0) {
            selectedPartnerAssets.map((item, index) => {
              let temp = new Array();
              temp.currency = item.name;
              temp.amount = 0;
              temp.token_type = 'NFT';
              temp.issuer = '';
              temp.token_address = item.NFTokenID;
              temp.token_icon = item.ufile.image;
              itemsRequested.push(temp)
            })
          }

          console.log(itemsSent, " check token sfor itemsSent")
          console.log(partnerOffers, " check token sfor partnerOffers")
          const tradeData = await axios.post(`${NFTRADE_URL}/trade`, {
            fromAddress: accountProfile.account,
            toAddress: tradePartner.username,
            itemsSent: itemsSent,
            itemsRequested: partnerOffers,
          });
          
          const paymentTxData = loggedInUserOffers.map((offer, index) => ({
            TransactionType: "Payment",
            Account: accountProfile.account,
            Amount: offer.currency === 'XRP' ? xrpToDrops(`${offer.amount}`) : {
              currency: offer.currency,
              value: `${offer.amount}`,
              issuer: offer.issuer
            },
            Destination: "rKxpqFqHWFWRzBuSkjZGHg9HXUYMGn6zbk",
            Fee: "12",
            SourceTag: 20221212,
            DestinationTag: 20221212,
          }));
          console.log(paymentTxData, "paymentTxData = ", loggedInUserOffers)
          

          const nftxData = selectedLoggedInUserAssets.map((offer, index) => ({
            TransactionType: "NFTokenCreateOffer",
            Account: accountProfile.account,
            NFTokenID: offer.NFTokenID,
            Amount: "0",
            Destination: "rKxpqFqHWFWRzBuSkjZGHg9HXUYMGn6zbk",
            Flags: 1,
          }));
         
          const result = await submitBulkTransactions({
            transactions: paymentTxData.concat(nftxData)
          });

          const requestedData = tradeData.data;
          const tokenHash = result.result.transactions;
          for (let i = 0; i < tokenHash.length; i++) {
            await axios.post(`${NFTRADE_URL}/update-trade`, {
              tradeId: requestedData.tradeId,
              itemType: 'sent',
              index: i,
              hash: tokenHash[i]['hash']
            });
          }

        }
      })
    } catch (err) {
      console.log(err);
    }
  };

  const handleClose = () => {
    setSelectedLoggedInUserAssets([]);
    setSelectedPartnerAssets([]);
    setLoggedInUserOffers([{ currency: 'XRP', amount: 0, token_type: 'token' }]);
    setPartnerOffers([{ currency: 'XRP', amount: 0, token_type: 'token' }]);
    onClose();
  };

  const renderSelectedAssets = (assets) => (
    <Box>
      {assets.map((asset) => (
        <Typography key={asset.NFTokenID || asset.id} variant="body2">
          {asset.meta?.name || asset.meta?.Name || 'Unnamed NFT'} ({asset.NFTokenID || asset.id})
        </Typography>
      ))}
    </Box>
  );

  const renderOffers = (offers, tokens, isLoggedInUser) => (
    <Box>
      {offers.map((offer, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <Select
            value={offer.currency}
            onChange={(e) => handleOfferChange(index, 'currency', e.target.value, isLoggedInUser)}
            sx={{ width: '40%', mr: 1, borderRadius: 2 }}
          >
            <MenuItem value="XRP">XRP</MenuItem>
            {tokens.map((token) => (
              <MenuItem key={`${token.currency}-${token.issuer}`} value={token.currency}>
                {token.currencyName} ({token.balance.toFixed(6)})
              </MenuItem>
            ))}
          </Select>
          <TextField
            type="number"
            value={offer.amount}
            onChange={(e) => handleOfferChange(index, 'amount', Number(e.target.value), isLoggedInUser)}
            inputProps={{ min: 0, step: 0.000001 }}
            sx={{ width: '40%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <IconButton onClick={() => handleRemoveOffer(index, isLoggedInUser)} sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      ))}
      <StyledButton
        onClick={() => handleAddOffer(isLoggedInUser)}
        variant="outlined"
        size="small"
        startIcon={<AddCircleOutlineIcon />}
      >
        Add Token
      </StyledButton>
    </Box>
  );

  // Move the check here, after all hooks have been called
  if (!accountProfile || !tradePartner) {
    return null; // or return a loading indicator
  }

  return (
    <StyledDialog
      open={open}
      onClose={() => { }}
      maxWidth="lg"
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <StyledDialogTitle>
        <Typography variant="h5" fontWeight="bold">Asset Exchange</Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: (theme) => theme.palette.text.secondary,
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <StyledPaper elevation={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Your Portfolio</Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                Available XRP: <Box component="span" fontWeight="bold">{loggedInUserXrpBalance.toFixed(6)} XRP</Box>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tokens to Offer:</Typography>
              {renderOffers(loggedInUserOffers, loggedInUserTokens, true)}
              <Box mt={3} mb={3}>
                <Divider />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Select Assets to Offer:</Typography>
              <TradeNFTPicker
                onSelect={handleLoggedInUserAssetSelect}
                account={accountProfile.account}
                isPartner={false}
                selectedAssets={selectedLoggedInUserAssets} // Pass selected assets
              />
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Selected Assets:</Typography>
                {renderSelectedAssets(selectedLoggedInUserAssets)}
              </Box>
            </StyledPaper>
          </Grid>
          <Grid item xs={6}>
            <StyledPaper elevation={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>{tradePartner.username}'s Portfolio</Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                Available XRP: <Box component="span" fontWeight="bold">{partnerXrpBalance.toFixed(6)} XRP</Box>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tokens to Request:</Typography>
              {renderOffers(partnerOffers, partnerTokens, false)}
              <Box mt={3} mb={3}>
                <Divider />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Select Assets to Request:</Typography>
              <TradeNFTPicker
                onSelect={handlePartnerAssetSelect}
                account={tradePartner.username}
                isPartner={true}
                selectedAssets={selectedPartnerAssets} // Pass selected assets
              />
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Selected Assets:</Typography>
                {renderSelectedAssets(selectedPartnerAssets)}
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </StyledDialogContent>
      <DialogActions sx={{ padding: (theme) => theme.spacing(3), borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <StyledButton onClick={handleClose} variant="outlined">Close</StyledButton>
        <StyledButton
          onClick={handleTrade}
          variant="contained"
          color="primary"
          startIcon={<SwapHorizIcon />}
        >
          Propose Exchange
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

export default Trade;
