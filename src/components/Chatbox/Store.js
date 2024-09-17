import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Backdrop
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AppContext } from 'src/AppContext';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WaterIcon from '@mui/icons-material/Water';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ConfirmPurchaseDialog from './ConfirmPurchaseDialog';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import axios from 'axios';
import sdk from "@crossmarkio/sdk";
import { ProgressBar } from 'react-loader-spinner';
import QRDialog from 'src/components/QRDialog';
import { alpha } from '@mui/material/styles';

const ranks = [
  {
    id: 'riddler',
    name: 'Riddler',
    price: 5,
    description: 'Entry-level rank for XRP puzzle solvers',
    icon: PsychologyIcon,
    color: '#FFD700'
  },
  {
    id: 'rippler',
    name: 'Rippler',
    price: 0.0001,
    description: 'Intermediate rank for XRP enthusiasts',
    icon: WaterIcon,
    color: '#4CAF50'
  },
  {
    id: 'validator',
    name: 'Validator',
    price: 0.0001,
    description: 'Advanced rank with enhanced features',
    icon: VerifiedUserIcon,
    color: '#2196F3'
  },
  {
    id: 'escrow',
    name: 'Escrow Master',
    price: 0.0001,
    description: 'Elite rank with exclusive XRP-themed perks',
    icon: LockIcon,
    color: '#9C27B0'
  },
  {
    id: 'ledger',
    name: 'Ledger Guardian',
    price: 0.0001,
    description: 'Legendary rank for true XRP aficionados',
    icon: SecurityIcon,
    color: '#F44336'
  }
];

const verifiedStatus = {
  id: 'verified',
  name: 'Verified',
  price: 0.0001,
  description: 'Exclusive verified status with premium benefits',
  icon: VerifiedIcon,
  color: '#1DA1F2'
};

const chatURL = "http://65.108.136.237:5000";
const BASE_URL = process.env.API_URL;

function Store() {
  const theme = useTheme();
  const { accountProfile, enqueueSnackbar } = useContext(AppContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [rank, setRank] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;

        return res;
      } catch (err) { }
    }

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const result = await getDispatchResult();

        if (result && result.dispatched_result === 'tesSUCCESS') {
          const response = await fetch(`${chatURL}/api/purchase-chat-feature`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              account: accountProfile.account,
              feature: `${rank.id}`,
              transactionHash: result?.txid
            })
          });

          if (response.ok) {
            setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
          } else {
            setSnackbarMessage(`Purchasing is failed`);
          }

          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          setSnackbarMessage(`Purchasing is failed`);
          stopInterval();
          return;
        }
      }, 1000);
    };


    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
      handleClose();
    };

    async function getPayload() {
      // console.log(counter + " " + isRunning, uuid);
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
        const resolved_at = res.resolved_at;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) { }
      isRunning = false;
      counter--;
      if (counter <= 0) {
        openSnackbar('Timeout!', 'error');
        handleScanQRClose();
      }
    }
    if (openScanQR) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openScanQR, uuid]);

  const handlePurchase = async () => {
    if (!accountProfile?.account) {
      setSnackbarMessage('Please connect your XRP wallet to make a purchase.');
      setSnackbarOpen(true);
      return;
    }
    const wallet_type = accountProfile?.wallet_type;
    setPageLoading(true);
    try {
      // Here you would integrate with XUMM, Crossmark, or GEM wallet for XRP payment
      // For this example, we'll just simulate a successful purchase
      const response = await fetch(`${chatURL}/api/request-new-chat-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: accountProfile.account,
          feature: `${rank.id}`,
        })
      });

      if (response.ok) {
        // setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
        let body = {
          TransactionType: "Payment",
          Account: accountProfile.account,
          Amount: `${rank.price * 1000000}`,
          Destination: "rhsxg4xH8FtYc3eR53XDSjTGfKQsaAGaqm",
          Fee: "12",
          SourceTag: 20221212,
        }
        if (wallet_type == "xaman") {
          const res2 = await axios.post(`${BASE_URL}/xumm/transfer`, body);
          if (res2.status === 200) {
            const uuid = res2.data.data.uuid;
            const qrlink = res2.data.data.qrUrl;
            const nextlink = res2.data.data.next;

            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }
        }

        else if (wallet_type == "gem") {
          await isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              await submitTransaction({
                transaction: body
              }).then(async ({ type, result }) => {
                if (type === "response") {
                  const response = await fetch(`${chatURL}/api/purchase-chat-feature`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      account: accountProfile.account,
                      feature: `${rank.id}`,
                      transactionHash: result?.hash
                    })
                  });
                  if (response.ok) {
                    setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
                  } else {
                    setSnackbarMessage(`Purchasing is failed`);
                  }
                } else {
                  setPageLoading(false);
                }
              });
            } else {
              enqueueSnackbar("GemWallet is not installed", { variant: "error" });
              setPageLoading(false);
            }
          });
        }

        else if (wallet_type == "crossmark") {
          await sdk.methods.signAndSubmitAndWait(body).then(async ({ response }) => {
            if (response.data.meta.isSuccess) {
              const response = await fetch(`${chatURL}/api/purchase-chat-feature`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  account: accountProfile.account,
                  feature: `${rank.id}`,
                  transactionHash: response.data.resp.result?.hash
                })
              });
              if (response.ok) {
                setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
              } else {
                setSnackbarMessage(`Purchasing is failed`);
              }
            } else {
              setPageLoading(false);
            }
          });
        }
      } else {
        setSnackbarMessage('Failed to purchase rank. Please check your XRP balance and try again.');
      }
    } catch (error) {
      console.error('Error purchasing rank:', error);
      setSnackbarMessage('An error occurred. Please try again later.');
    }

    setSnackbarOpen(true);
    setPageLoading(false);
  };

  const onDisconnectXumm = async (uuid) => {
    setPageLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
      if (res.status === 200) {
        setUuid(null);
      }
    } catch (err) { }
    setPageLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm(uuid);
  };

  const chooseRank = (item) => {
    setRank(item);
    setOpenConfirm(true);
  }

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategory(isExpanded ? category : null);
  };

  const renderContent = (items) => (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} key={item.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: theme.shadows[5]
              },
              ...(item.id === 'verified' && {
                border: `2px solid ${item.color}`,
                boxShadow: `0 0 10px ${alpha(item.color, 0.5)}`
              }),
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              bgcolor: alpha(item.color, 0.1), 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <Avatar sx={{ bgcolor: item.color, width: 36, height: 36 }}>
                <item.icon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', color: item.color }}>
                {item.name}
                {item.id === 'verified' && (
                  <VerifiedIcon sx={{ ml: 1, verticalAlign: 'middle', fontSize: 16 }} />
                )}
              </Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                {item.description}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}
              >
                Price: 0.0001 XRP
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p: 1 }}>
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={() => chooseRank(item)}
                sx={{
                  bgcolor: item.color,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: theme.palette.augmentColor({ color: { main: item.color } }).dark
                  }
                }}
              >
                Purchase
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <>
      <Backdrop
        sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={pageLoading}
      >
        <ProgressBar
          height="80"
          width="80"
          ariaLabel="progress-bar-loading"
          wrapperStyle={{}}
          wrapperClass="progress-bar-wrapper"
          borderColor="#F4442E"
          barColor="#51E5FF"
        />
      </Backdrop>
      <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
        <ConfirmPurchaseDialog open={openConfirm} setOpen={setOpenConfirm} onContinue={handlePurchase} />
        <QRDialog
          open={openScanQR}
          type="Payment"
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
        <Typography
          variant="h6"
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.primary.main, 
            mb: 2,
            textAlign: 'center'
          }}
        >
          XRP Ledger Chat Premium Features
        </Typography>

        <Accordion expanded={expandedCategory === 'ranks'} onChange={handleCategoryChange('ranks')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">XRP Ledger Chat Ranks</Typography>
          </AccordionSummary>
          <AccordionDetails>{renderContent(ranks)}</AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedCategory === 'verified'}
          onChange={handleCategoryChange('verified')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Special Status</Typography>
          </AccordionSummary>
          <AccordionDetails>{renderContent([verifiedStatus])}</AccordionDetails>
        </Accordion>

        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />

      </Box>
    </>
  );
}

export default Store;
