import React, { useState, useContext } from 'react';
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
import xrpl from "xrpl";

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
    price: 20,
    description: 'Intermediate rank for XRP enthusiasts',
    icon: WaterIcon,
    color: '#4CAF50'
  },
  {
    id: 'validator',
    name: 'Validator',
    price: 50,
    description: 'Advanced rank with enhanced features',
    icon: VerifiedUserIcon,
    color: '#2196F3'
  },
  {
    id: 'escrow',
    name: 'Escrow Master',
    price: 100,
    description: 'Elite rank with exclusive XRP-themed perks',
    icon: LockIcon,
    color: '#9C27B0'
  },
  {
    id: 'ledger',
    name: 'Ledger Guardian',
    price: 200,
    description: 'Legendary rank for true XRP aficionados',
    icon: SecurityIcon,
    color: '#F44336'
  }
];

const verifiedStatus = {
  id: 'verified',
  name: 'Verified',
  price: 1200,
  description: 'Exclusive verified status with premium benefits',
  icon: VerifiedIcon,
  color: '#1DA1F2'
};

const chatURL = "http://65.108.136.237:5000";

function Store() {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
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
  const [qrType, setQrType] = useState('Payment');

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
          feature: `rank_${rank.id}`,
        })
      });

      if (response.ok) {
        // setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
        let body = {
          TransactionType: "Payment",
          Account: accountProfile.account,
          Amount: xrpl.transferRateToDecimal(rank.price),
          Destination: "rhsxg4xH8FtYc3eR53XDSjTGfKQsaAGaqm",
          Fee: "12",
          SourceTag: 20221212,
          DestinationTag: 20221212,
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
              }).then(({ type, result }) => {
                if (type === "response") {
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
          await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
            if (response.data.meta.isSuccess) {
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
                boxShadow: `0 0 10px ${item.color}`
              })
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: item.color, mr: 1, width: 32, height: 32 }}>
                  <item.icon fontSize="small" />
                </Avatar>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {item.name}
                  {item.id === 'verified' && (
                    <VerifiedIcon sx={{ ml: 1, color: item.color, verticalAlign: 'middle' }} />
                  )}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                {item.description}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}
              >
                Price: {item.price} XRP
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => chooseRank(item)}
                sx={{
                  backgroundColor: item.color,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.palette.augmentColor({ color: { main: item.color } })
                      .dark
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
          type={qrType}
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 2 }}
        >
          XRP Ledger Chat Store
        </Typography>

        <Accordion expanded={expandedCategory === 'ranks'} onChange={handleCategoryChange('ranks')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">XRP Ledger Chat Ranks</Typography>
          </AccordionSummary>
          <AccordionDetails>{renderContent(ranks)}</AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedCategory === 'verified'}
          onChange={handleCategoryChange('verified')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Special Status</Typography>
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
