import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography, Button, Grid, Paper, Divider, Chip, Tabs, Tab, Stack, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { format } from 'date-fns'; // Make sure to install this package if not already present
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { isInstalled, submitBulkTransactions } from '@gemwallet/api';
import { Client, xrpToDrops } from 'xrpl';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import sdk from "@crossmarkio/sdk";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.75, 2),
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const NFTRADE_URL = 'http://65.108.136.237:5333';

function TradeOffer({ _id, status, timestamp, fromAddress, toAddress, isOutgoing, itemsSent, itemsRequested }) {
  console.log('TradeOffer props:', { _id, status, timestamp, fromAddress, toAddress, isOutgoing, itemsSent, itemsRequested });

  const { accountProfile } = useContext(AppContext);
  console.log('accountProfile:', accountProfile);

  const [tradeStatus, setTradeStatus] = useState(status);
  console.log('tradeStatus:', tradeStatus);

  const offer = isOutgoing ? {
    toAddress: toAddress,
    offering: itemsSent,
    wanting: itemsRequested
  } : {
    fromAddress: fromAddress,
    offering: itemsSent,
    wanting: itemsRequested
  };
  console.log('offer:', offer);

  // Add this console.log statement to log the trade offer details
  console.log('Trade Offer:', { _id, status, timestamp, fromAddress, toAddress, isOutgoing, itemsSent, itemsRequested, offer });

  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);

  const handleReactions = async(tradeId, actionType) => {
    console.log('handleReactions called with:', { tradeId, actionType });
    
    if(actionType === 'accept') {
      let payRequested = await handleTradeAccept(tradeId, itemsRequested, fromAddress);
      console.log(payRequested, "payRequested");
      if(!payRequested) {
        console.log('Trade acceptance failed or was cancelled');
        // You could add some user feedback here, e.g.:
        // setErrorMessage('Transaction was cancelled or failed. Please try again.');
        return false;
      }
    }
    
    // Only proceed with updating the trade status if it's not an 'accept' action
    // or if the 'accept' action was successful (payRequested is true)
    if (actionType !== 'accept' || payRequested) {
      try {
        let action_ret = await axios.post(`${NFTRADE_URL}/trades/reactions`, {
          tradeId: tradeId,
          actionType: actionType,
        });
        console.log(action_ret, "status from middleware");
        setTradeStatus(actionType);
      } catch (error) {
        console.error('Error updating trade status:', error);
      }
    }
  };

  const processTxhash = async(paymentResult, tradeId) => {
    console.log('processTxhash called with:', { paymentResult, tradeId });
    console.log('Processing transaction hash:', paymentResult);

    if (!paymentResult || !paymentResult.result || !paymentResult.result.transactions) {
      console.error('Invalid payment result structure:', paymentResult);
      await axios.post(`${NFTRADE_URL}/update-trade`, {
        tradeId: tradeId,
        itemType: 'rejected',
        index: 0,
        hash: 'rejected-hash',
      });
      return;
    }

    const tokenHash = paymentResult.result.transactions;
    console.log('Token hashes:', tokenHash);

    if (Array.isArray(tokenHash)) {
      for (let i = 0; i < tokenHash.length; i++) {
        if (tokenHash[i] && tokenHash[i].hash && tokenHash[i].hash.length === 64) {
          await axios.post(`${NFTRADE_URL}/update-trade`, {
            tradeId: tradeId,
            itemType: 'requested',
            index: i,
            hash: tokenHash[i].hash
          });
        } else {
          console.warn(`Invalid hash at index ${i}:`, tokenHash[i]);
        }
      }
    } else if (typeof tokenHash === 'object' && tokenHash.hash) {
      // Handle case where tokenHash is a single object
      await axios.post(`${NFTRADE_URL}/update-trade`, {
        tradeId: tradeId,
        itemType: 'requested',
        index: 0,
        hash: tokenHash.hash
      });
    } else {
      console.error('Unexpected tokenHash structure:', tokenHash);
    }
  }
    
  const handleTradeAccept = async (tradeId, itemsRequested, fromAddress) => {
    console.log('handleTradeAccept called with:', { tradeId, itemsRequested, fromAddress });
    try {
      const response = await isInstalled();
      console.log('isInstalled response:', response);
      if (response.result.isInstalled) {
        const paymentTxData = itemsRequested.map((offer, index) => (
          offer.token_type === 'token' ?
            {
              TransactionType: "Payment",
              Account: accountProfile.account,
              Amount: offer.currency === 'XRP' ? xrpToDrops(`${offer.amount}`) : {
                currency: offer.currency,
                value: `${offer.amount}`,
                issuer: offer.issuer
              },
              Destination: fromAddress,
              Fee: "12",
              SourceTag: 20221212,
              DestinationTag: 20221212,
            }
             : 
            {
              TransactionType: "NFTokenCreateOffer",
              Account: accountProfile.account,
              NFTokenID: offer.token_address,
              Amount: "0",
              Destination: fromAddress,
              Flags: 1,
            }
        ));

        console.log('paymentTxData:', paymentTxData);

        const wallet_type = accountProfile.wallet_type;
        console.log('wallet_type:', wallet_type);

        switch (wallet_type) {
          case "xaman":
          case "gem":
            console.log('Submitting bulk transactions for xaman/gem');
            const result = await submitBulkTransactions({
              transactions: paymentTxData
            });
            console.log('submitBulkTransactions result:', result);
            if (result.type === "reject") {
              console.log('Transaction was rejected or cancelled by the user');
              return false;
            }
            if (result && result.result && result.result.transactions) {
              await processTxhash(result, tradeId);
              return true;
            }
            break;

          case "crossmark":
            console.log('Submitting bulk transactions for crossmark');
            try {
              const crossmarkResult = await sdk.methods.bulkSignAndSubmitAndWait(paymentTxData);
              console.log('crossmark response:', crossmarkResult);
              if (crossmarkResult && crossmarkResult.response) {
                await processTxhash(crossmarkResult, tradeId);
                return true;
              }
            } catch (error) {
              console.log('Crossmark transaction was rejected or cancelled:', error);
              return false;
            }
            break;

          default:
            console.error("Unsupported wallet type:", wallet_type);
        }
      }
      return false;
    } catch (err) {
      console.error("Error in handleTradeAccept:", err);
      return false;
    }
  };

  const handleDeclineClick = () => {
    setOpenDeclineDialog(true);
  };

  const handleDeclineConfirm = () => {
    setOpenDeclineDialog(false);
    handleReactions(_id, 'decline');
  };

  const handleDeclineCancel = () => {
    setOpenDeclineDialog(false);
  };

  const renderStatusInfo = () => {
    const formattedDate = timestamp ? format(new Date(timestamp), 'MMM d, yyyy HH:mm') : '';
    console.log('renderStatusInfo:', { formattedDate, tradeStatus });
    console.log(formattedDate, tradeStatus, "here is render status info");
    switch (tradeStatus) {
      case 'completed':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', mt: 2 }}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2">Trade Completed</Typography>
              {/* <Typography variant="caption">{formattedDate}</Typography> */}
            </Box>
          </Box>
        );
      case 'decline':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', mt: 2 }}>
            <CancelOutlinedIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2">Trade Declined</Typography>
              {/* <Typography variant="caption">{formattedDate}</Typography> */}
            </Box>
          </Box>
        );
      case 'return':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', mt: 2 }}>
            <CancelOutlinedIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2">Trade Canceled</Typography>
              {/* <Typography variant="caption">{formattedDate}</Typography> */}
            </Box>
          </Box>
        );
      case 'pending':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isOutgoing ? (
              <StyledButton variant="outlined" color="error" onClick={() => handleReactions(_id, 'return')} size="small">
                Return items
              </StyledButton>
            ) : (
              <>
                <StyledButton variant="outlined" color="error" onClick={handleDeclineClick} size="small">
                  Decline
                </StyledButton>
                <StyledButton variant="contained" color="primary" onClick={() => handleReactions(_id, 'accept')} size="small">
                  Accept Trade
                </StyledButton>
              </>
            )}
          </Box>
        );
      case 'accepted':
      default:
        return null;
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Trade Offer
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {isOutgoing ? `To: ${offer.toAddress}` : `From: ${offer.fromAddress}`}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={4}>
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {isOutgoing ? "You're offering:" : "They're offering:"}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {offer.offering.map((item) => {
              if (!item.currency) return null;
              const uniqueKey = `${item.currency}-${item.amount}-${item.token_type}`;
              return item.token_type !== 'NFT' ? (
                <Chip
                  key={uniqueKey}
                  label={`${item.amount} ${normalizeCurrencyCodeXummImpl(item.currency).toUpperCase()}`}
                  color="primary"
                  variant="outlined"
                />
              ) : (
                <Chip
                  key={uniqueKey}
                  label={`NFT ${item.currency}`}
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {isOutgoing ? "You want:" : "They want:"}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {offer.wanting.map((item) => {
              if (!item.currency) return null;
              const uniqueKey = `${item.currency}-${item.amount}-${item.token_type}`;
              return item.token_type !== 'NFT' ? (
                <Chip
                  key={uniqueKey}
                  label={`${item.amount} ${normalizeCurrencyCodeXummImpl(item.currency).toUpperCase()}`}
                  color="secondary"
                  variant="outlined"
                />
              ) : (
                <Chip
                  key={uniqueKey}
                  label={`NFT ${item.currency}`}
                  color="secondary"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {renderStatusInfo()}
      </Box>
      <Dialog
        open={openDeclineDialog}
        onClose={handleDeclineCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Decline"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you would like to cancel this trade?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeclineCancel}>Cancel</Button>
          <Button onClick={handleDeclineConfirm} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trade-tabpanel-${index}`}
      aria-labelledby={`trade-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `trade-tab-${index}`,
    'aria-controls': `trade-tabpanel-${index}`,
  };
}

function Trades() {
  const { accountProfile } = useContext(AppContext);
  console.log('Trades component accountProfile:', accountProfile);

  const [tabValue, setTabValue] = useState(0);
  console.log('tabValue:', tabValue);

  const [tradeHistory, setTradeHistory] = useState([]);
  console.log('tradeHistory:', tradeHistory);

  const handleTabChange = (event, newValue) => {
    console.log('handleTabChange called with newValue:', newValue);
    setTabValue(newValue);
    fetchTradesHistory(newValue);
  };

  useEffect(() => {
    console.log('Trades component useEffect called');
    fetchTradesHistory(tabValue);
  }, []);
  
  const fetchTradesHistory = async(newTabValue) => {
    console.log('fetchTradesHistory called with newTabValue:', newTabValue);
    await axios.post(`${NFTRADE_URL}/trades`, {
      userAddress: accountProfile.account,
      tradeType: newTabValue
    })
    .then((res) => {
      console.log('fetchTradesHistory response:', res.data);
      setTradeHistory(res.data);
    })
    .catch((error) => {
      console.error('Error fetching trade history:', error);
    });
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Active Trades
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="trade tabs">
          <Tab label="Incoming" {...a11yProps(0)} />
          <Tab label="Outgoing" {...a11yProps(1)} />
        </Tabs>
      </Box>
      {
        tradeHistory.length > 0 ? 
        <>
          <TabPanel value={tabValue} index={0}>
            {
              tabValue === 0 &&  
              tradeHistory.map((trade) => 
                <TradeOffer key={trade._id} {...trade} isOutgoing={false} />
              )
            }
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {
              tabValue === 1 &&  (
              tradeHistory.map((trade) => 
                <TradeOffer key={trade._id} {...trade} isOutgoing={true} />
              ))
            }
          </TabPanel>
        </>
        :
        <Stack alignItems="center" mt={10} justifyContent="center" height="100%">
          <ErrorOutlineIcon fontSize="large" sx={{ mb: 2, color: 'text.secondary' }} />
          <Typography variant="body1" color="text.secondary">
            No Trades found
          </Typography>
        </Stack>
      }
    </Box>
  );
}

export default Trades;
