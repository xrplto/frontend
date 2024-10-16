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
import { Client, xrpToDrops, isoTimeToRippleTime } from 'xrpl';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import CryptoJS from 'crypto-js';
import { isInstalled, submitBulkTransactions, submitTransaction } from '@gemwallet/api';
import axios from 'axios';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { configureMemos } from 'src/utils/parse/OfferChanges';
import sdk from "@crossmarkio/sdk";
import WarningIcon from '@mui/icons-material/Warning';

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
  const [xamanStep, setXamanStep] = useState(0);
  const [xamanTitle, setXamanTitle] = useState(0);
  const [allowedTokens, setAllowedTokens] = useState([]);
  const [nftWarning, setNftWarning] = useState('');
  const [loggedInUserBalanceWarnings, setLoggedInUserBalanceWarnings] = useState({});
  const [partnerBalanceWarnings, setPartnerBalanceWarnings] = useState({});
  const [trustlineWarnings, setTrustlineWarnings] = useState({});

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
      fetchAllowedTokens();
    }
    console.log(open, "open = open", tradePartner)
  }, [open, accountProfile, tradePartner]);

  const fetchBalances = async () => {
    const client = new Client('wss://ws.xrpl.to');
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
      let newSelection;
      if (exists) {
        newSelection = prev.filter(asset => asset.NFTokenID !== nft.NFTokenID);
      } else {
        newSelection = [...prev, nft];
      }
      
      // Check if there's enough XRP for the reserve
      const requiredReserve = newSelection.length * 2;
      if (loggedInUserXrpBalance < requiredReserve) {
        setNftWarning(`Warning: You need at least ${requiredReserve} XRP in reserve to trade ${newSelection.length} NFT${newSelection.length > 1 ? 's' : ''}. Your current available balance is ${loggedInUserXrpBalance.toFixed(6)} XRP.`);
      } else {
        setNftWarning('');
      }
      
      return newSelection;
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
    const tokens = isLoggedInUser ? loggedInUserTokens : partnerTokens;
    let newOffer = { amount: 0, token_type: 'token' };

    // Find the first non-XRP currency, or use XRP if it's the only option
    const existingOffers = isLoggedInUser ? loggedInUserOffers : partnerOffers;
    const xrpAlreadyOffered = existingOffers.some(offer => offer.currency === 'XRP');

    if (xrpAlreadyOffered && tokens.length > 0) {
      // Select the first non-XRP token
      const firstNonXrpToken = tokens.find(token => token.currency !== 'XRP');
      if (firstNonXrpToken) {
        newOffer.currency = firstNonXrpToken.currency;
        newOffer.issuer = firstNonXrpToken.issuer;
      } else {
        newOffer.currency = 'XRP';
      }
    } else {
      // If XRP is not offered or there are no other tokens, default to XRP
      newOffer.currency = 'XRP';
    }

    if (isLoggedInUser) {
      setLoggedInUserOffers([...loggedInUserOffers, newOffer]);
    } else {
      setPartnerOffers([...partnerOffers, newOffer]);
    }
  };

  const handleRemoveOffer = (index, isLoggedInUser) => {
    if (isLoggedInUser) {
      setLoggedInUserOffers(loggedInUserOffers.filter((_, i) => i !== index));
    } else {
      setPartnerOffers(partnerOffers.filter((_, i) => i !== index));
    }
  };

  const handleOfferChange = async (index, field, value, isLoggedInUser) => {
    const updateOffers = async (offers) => {
      let selectedToken;
      let _offers = offers.map((offer, i) => {
        if (i === index) {
          if (field === 'currency') {
            selectedToken = isLoggedInUser
              ? loggedInUserTokens.find(token => token.currency === value)
              : partnerTokens.find(token => token.currency === value);
            return {
              ...offer,
              [field]: value,
              issuer: selectedToken?.issuer,
              token_type: 'token'
            };
          } else if (field === 'amount') {
            // Add a decimal point to the first zero, but not to subsequent zeros
            let newValue = value;
            if (value === '0' && (!offer.amount || offer.amount === '')) {
              newValue = '0.';
            } else if (value === '0' && offer.amount === '0.') {
              newValue = '0.'; // Keep it as '0.' if a second zero is entered
            }
            return { ...offer, [field]: newValue === '' ? '' : newValue };
          }
        }
        return offer;
      });

      if (field === 'currency') {
        if (value === 'XRP') {
          _offers[index] = {
            ..._offers[index],
            fee: 0
          };
        } else if (selectedToken) {
          const fee = await axios.get(`https://api.xrpl.to/api/token/${selectedToken?.md5}`);
          _offers[index] = {
            ..._offers[index],
            fee: fee.data.token.issuer_info.transferRate
          };
        }
      }

      // Check balance and set warning only for logged-in user
      if (field === 'amount' && isLoggedInUser) {
        const offer = _offers[index];
        if (value === '') {
          // Remove the warning if the input is empty
          setLoggedInUserBalanceWarnings(prev => {
            const { [index]: _, ...rest } = prev;
            return rest;
          });
        } else {
          let balance;
          if (offer.currency === 'XRP') {
            balance = loggedInUserXrpBalance;
          } else {
            const token = loggedInUserTokens.find(t => t.currency === offer.currency && t.issuer === offer.issuer);
            balance = token ? token.balance : 0;
          }
          
          if (Number(value) > balance) {
            setLoggedInUserBalanceWarnings(prev => ({
              ...prev,
              [index]: `Insufficient balance. Available: ${balance.toFixed(6)} ${offer.currency}`
            }));
          } else {
            setLoggedInUserBalanceWarnings(prev => {
              const { [index]: _, ...rest } = prev;
              return rest;
            });
          }
        }
      }

      // Check for trustline and XRP balance only for partner offers (tokens requested by logged-in user)
      if (!isLoggedInUser && field === 'currency') {
        if (value === 'XRP') {
          // Remove trustline warning when switching back to XRP
          setTrustlineWarnings(prev => {
            const { [index]: _, ...rest } = prev;
            return rest;
          });
        } else {
          const trustlineExists = loggedInUserLines.some(line => 
            line.currency === value && line.account === _offers[index].issuer
          );
          
          if (!trustlineExists) {
            const requiredXRP = 2; // 2 XRP required for each new trustline
            const existingTrustlineCount = Object.keys(trustlineWarnings).length;
            const availableXRP = loggedInUserXrpBalance - (existingTrustlineCount * 2);
            
            if (availableXRP < requiredXRP) {
              setTrustlineWarnings(prev => ({
                ...prev,
                [index]: `Warning: Insufficient XRP balance to set up a trustline for ${value}. You need at least ${requiredXRP} XRP, but only have ${availableXRP.toFixed(2)} XRP available.`
              }));
            } else {
              setTrustlineWarnings(prev => ({
                ...prev,
                [index]: `Note: A new trustline for ${value} will be set up, requiring 2 XRP from your balance.`
              }));
            }
          } else {
            setTrustlineWarnings(prev => {
              const { [index]: _, ...rest } = prev;
              return rest;
            });
          }
        }
      }

      return _offers;
    }

    if (isLoggedInUser) {
      setLoggedInUserOffers(await updateOffers(loggedInUserOffers));
    } else {
      setPartnerOffers(await updateOffers(partnerOffers));
    }
  };

  const addTrustLine = (async (wallet_address, currency, issuer) => {
    axios
      .get(`${NFTRADE_URL}/trustline/add/${wallet_address}/${currency}/${issuer}`)
      .then(async (res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          console.log(ret, "message from trustline");
        }
      })
      .catch((err) => {
        console.log('Error on setting account lines!!!', err);
      })
  });

  const getTrustLines = async (wallet_address, currency, issuer) => {
    axios
      .get(`${BASE_URL}/account/lines/${wallet_address}`)
      .then(async (res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          const trustlines = ret.lines;

          const trustlineStatus = await trustlines.find((trustline) => {
            return (
              (trustline.LowLimit.issuer === wallet_address ||
                trustline.HighLimit.issuer) &&
              trustline.LowLimit.currency === currency
            );
          });
          console.log(trustlineStatus, "trustlineStatus from")
          if (trustlineStatus === undefined) {
            // add trust line
            await addTrustLine(wallet_address, currency, issuer)
          }
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      })
  }

  const handleTrade = async () => {
    console.log("Starting handleTrade function");
    const middle_wallet_address = 'rKxpqFqHWFWRzBuSkjZGHg9HXUYMGn6zbk';
    let validateTrade = true;

    console.log("Validating trade offers");
    loggedInUserOffers.forEach((tokenInfo, index) => {
      console.log(`Validating offer ${index}:`, tokenInfo);
      if (tokenInfo.currency !== 'XRP' && tokenInfo.token_type !== 'NFT' && tokenInfo.amount === 0) {
        console.log(`Invalid token amount for ${normalizeCurrencyCodeXummImpl(tokenInfo.currency)}`);
        showNotification(`Invalid token amount for ${normalizeCurrencyCodeXummImpl(tokenInfo.currency)}`, 'error');
        validateTrade = false;
      }
    });

    if (!validateTrade) {
      console.log("Trade validation failed");
      return false;
    }

    try {
      console.log("Preparing items to be sent");
      let itemsSent = [...loggedInUserOffers];
      console.log("Initial itemsSent:", itemsSent);

      selectedLoggedInUserAssets.forEach(nft => {
        console.log("Adding NFT to itemsSent:", nft);
        itemsSent.push({
          currency: nft.name,
          amount: 0,
          token_type: 'NFT',
          issuer: nft.issuer,
          token_address: nft.NFTokenID,
          token_icon: nft.ufile?.image,
        });
      });

      console.log("Final itemsSent:", itemsSent);

      console.log("Preparing items to be requested");
      let itemsRequested = partnerOffers.filter(offer => 
        offer.token_type === 'NFT' || (offer.token_type === 'token' && offer.amount > 0)
      );
      console.log("Initial itemsRequested:", itemsRequested);

      selectedPartnerAssets.forEach(nft => {
        console.log("Adding NFT to itemsRequested:", nft);
        itemsRequested.push({
          currency: nft.name,
          amount: 0,
          token_type: 'NFT',
          issuer: nft.issuer,
          token_address: nft.NFTokenID,
          token_icon: nft.ufile?.image,
        });
      });

      console.log("Final itemsRequested:", itemsRequested);

      console.log("Preparing payment transaction data");
      let paymentTxData = [];
      
      // Check for required trustlines and add TrustSet transactions if needed
      let totalRequiredXRP = 0;
      for (const offer of itemsRequested) {
        if (offer.currency !== 'XRP' && offer.token_type !== 'NFT') {
          const trustlineExists = loggedInUserLines.some(line => 
            line.currency === offer.currency && line.account === offer.issuer
          );
          
          if (!trustlineExists) {
            totalRequiredXRP += 2;
            if (loggedInUserXrpBalance < totalRequiredXRP) {
              console.log(`Insufficient XRP balance for trustline: ${offer.currency}`);
              showNotification(`Insufficient XRP balance to set up trustline for ${offer.currency}`, 'error');
              return;
            }
            
            console.log(`Adding TrustSet transaction for ${offer.currency}`);
            paymentTxData.push({
              TransactionType: "TrustSet",
              Account: accountProfile.account,
              LimitAmount: {
                currency: offer.currency,
                issuer: offer.issuer,
                value: "1000000000000" // Set a high limit, adjust as needed
              }
            });
          }
        }
      }

      // Add the existing payment transactions
      paymentTxData = [...paymentTxData, ...itemsSent.map(offer => {
        if (offer.token_type === 'NFT') {
          console.log("Preparing NFT offer transaction");
          return {
            TransactionType: "NFTokenCreateOffer",
            Account: accountProfile.account,
            NFTokenID: offer.token_address,
            Amount: "0",
            Flags: 1,
            Destination: middle_wallet_address,
            Memos: configureMemos('XRPNFT-nft-create-sell-offer', '', `https://xrpnft.com/nft/${offer.token_address}`)
          };
        } else {
          console.log("Preparing token/XRP payment transaction");
          let txData = {
            TransactionType: "Payment",
            Account: accountProfile.account,
            Amount: offer.currency === 'XRP' ? xrpToDrops(`${offer.amount}`) : {
              currency: offer.currency,
              value: `${offer.amount - offer.amount * (offer.fee || 0) / 100}`,
              issuer: offer.issuer
            },
            Destination: middle_wallet_address,
            Fee: "12",
            SourceTag: 20221212,
          };

          if (offer.currency !== 'XRP') {
            txData.SendMax = {
              currency: offer.currency,
              value: `${offer.amount}`,
              issuer: offer.issuer
            };
          }

          return txData;
        }
      })];

      console.log("Final payment transaction data:", paymentTxData);

      console.log("Processing wallet type:", accountProfile.wallet_type);
      const wallet_type = accountProfile.wallet_type;
      let transactionHashes = [];

      switch (wallet_type) {
        case "xaman":
          console.log("Xaman wallet not implemented yet");
          break;

        case "gem":
          console.log("Checking if GemWallet is installed");
          const isGemInstalled = await isInstalled();
          if (isGemInstalled.result.isInstalled) {
            console.log("GemWallet is installed, submitting bulk transactions");
            const result = await submitBulkTransactions({ transactions: paymentTxData });
            console.log("Bulk transaction result:", result);
            if (result.result.transactions.every(tx => tx.hash)) {
              transactionHashes = result.result.transactions.map(tx => tx.hash);
              console.log("Transaction hashes:", transactionHashes);
            } else {
              console.log("Transaction failed or didn't return a hash");
              showNotification("Transaction failed. Please try again.", "error");
              return;
            }
          } else {
            console.log("GemWallet is not installed");
            showNotification("GemWallet is not installed", "error");
            return;
          }
          break;

        case "crossmark":
          console.log("Processing with Crossmark wallet");
          try {
            const { response } = await sdk.methods.bulkSignAndSubmitAndWait(paymentTxData, { isModifiable: false });
            console.log("Crossmark response:", response);
            if (response.data.meta.isSuccess) {
              transactionHashes = response.data.resp.map(item => item.result.hash);
              console.log("Transaction hashes:", transactionHashes);
            } else {
              console.log("Transaction failed");
              showNotification("Transaction failed. Please try again.", "error");
              return;
            }
          } catch (error) {
            console.error("Error with Crossmark transaction:", error);
            showNotification("Transaction failed. Please try again.", "error");
            return;
          }
          break;

        default:
          console.error("Unsupported wallet type:", wallet_type);
          showNotification("Unsupported wallet type", "error");
          return;
      }

      // Only proceed if we have transaction hashes
      if (transactionHashes.length > 0) {
        console.log("Sending trade data to server");
        const tradeData = await axios.post(`${NFTRADE_URL}/trade`, {
          fromAddress: accountProfile.account,
          toAddress: tradePartner.username,
          itemsSent: itemsSent,
          itemsRequested: itemsRequested,
        });
        console.log("Trade data response:", tradeData.data);

        await processTxhash(transactionHashes, tradeData.data.tradeId);
      } else {
        console.log("No transaction hashes received");
        showNotification("Failed to process the trade. Please try again.", "error");
      }

    } catch (err) {
      console.error("Error in handleTrade:", err);
      showNotification("An error occurred while processing the trade", "error");
    }

    console.log("handleTrade function completed");
  };
  const processTxhash = async (paymentResult, tradeId) => {
    if (!paymentResult) {
      await axios.post(`${NFTRADE_URL}/update-trade`, {
        tradeId: tradeId,
        itemType: 'rejected',
        index: 0,
        hash: 'rejected-hash',
      });
    } else {
      const tokenHash = paymentResult;
      for (let i = 0; i < tokenHash.length; i++) {
        if (tokenHash[i]['hash'].length === 64) {
          await axios.post(`${NFTRADE_URL}/update-trade`, {
            tradeId: tradeId,
            itemType: 'sent',
            index: i,
            hash: tokenHash[i]['hash']
          });
        }
      }
    }
  }
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

  const fetchAllowedTokens = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/account/lines/rKxpqFqHWFWRzBuSkjZGHg9HXUYMGn6zbk?page=0&limit=100`);
      if (response.data.result === "success") {
        const tokens = response.data.lines.map(line => ({
          currency: line.Balance.currency,
          issuer: line._token2
        }));
        setAllowedTokens(tokens);
      }
    } catch (error) {
      console.error('Error fetching allowed tokens:', error);
    }
  };

  const isTokenAllowed = (currency, issuer) => {
    return allowedTokens.some(token => 
      token.currency === currency && token.issuer === issuer
    );
  };

  const renderOffers = (offers, tokens, isLoggedInUser) => (
    <Box>
      {offers.map((offer, index) => (
        <Box key={index} display="flex" flexDirection="column" mb={2}>
          <Box display="flex" alignItems="center">
            <Select
              value={offer.currency}
              onChange={(e) => handleOfferChange(index, 'currency', e.target.value, isLoggedInUser)}
              sx={{ width: '40%', mr: 1, borderRadius: 2 }}
            >
              <MenuItem value="XRP">XRP</MenuItem>
              {tokens.filter(token => isTokenAllowed(token.currency, token.issuer)).map((token) => (
                <MenuItem key={`${token.currency}-${token.issuer}`} value={token.currency}>
                  {token.currencyName} ({token.balance.toFixed(6)})
                </MenuItem>
              ))}
            </Select>
            <TextField
              type="text" // Changed from "number" to "text" to allow for the decimal point
              value={offer.amount !== undefined ? offer.amount : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and one decimal point
                if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleOfferChange(index, 'amount', value, isLoggedInUser);
                }
              }}
              inputProps={{ min: 0, step: 0.000001 }}
              placeholder="0"
              sx={{
                width: '40%',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& input::placeholder': {
                  color: 'text.disabled',
                  opacity: 1,
                },
              }}
            />
            <IconButton onClick={() => handleRemoveOffer(index, isLoggedInUser)} sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {isLoggedInUser && loggedInUserBalanceWarnings[index] && offer.amount > 0 && (
            <Typography variant="caption" color="error" display="flex" alignItems="center" mt={1}>
              <WarningIcon fontSize="small" style={{ marginRight: 4 }} />
              {loggedInUserBalanceWarnings[index]}
            </Typography>
          )}
          {!isLoggedInUser && trustlineWarnings[index] && offer.amount > 0 && (
            <Typography variant="caption" color="error" display="flex" alignItems="center" mt={1}>
              <WarningIcon fontSize="small" style={{ marginRight: 4 }} />
              {trustlineWarnings[index]}
            </Typography>
          )}
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

  // Update the isTradeValid function
  const isTradeValid = () => {
    const loggedInUserHasItem = loggedInUserOffers.some(offer => offer.amount !== undefined) || selectedLoggedInUserAssets.length > 0;
    const partnerHasItem = partnerOffers.some(offer => offer.amount !== undefined) || selectedPartnerAssets.length > 0;
    const noBalanceWarnings = Object.keys(loggedInUserBalanceWarnings).length === 0;
    const noTrustlineWarnings = Object.keys(trustlineWarnings).length === 0;
    return loggedInUserHasItem && partnerHasItem && noBalanceWarnings && noTrustlineWarnings;
  };

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
                selectedAssets={selectedLoggedInUserAssets}
              />
              {nftWarning && (
                <Box mt={2} p={2} bgcolor="warning.light" borderRadius={2}>
                  <Typography variant="body2" color="warning.dark" display="flex" alignItems="center">
                    <WarningIcon fontSize="small" style={{ marginRight: 8 }} />
                    {nftWarning}
                  </Typography>
                </Box>
              )}
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
          disabled={!isTradeValid()} // Disable the button if the trade is not valid
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