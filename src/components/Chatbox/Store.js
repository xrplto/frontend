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
  AccordionDetails
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

function Store() {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);

  const handlePurchase = async (rank) => {
    if (!accountProfile?.account) {
      setSnackbarMessage('Please connect your XRP wallet to make a purchase.');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Here you would integrate with XUMM, Crossmark, or GEM wallet for XRP payment
      // For this example, we'll just simulate a successful purchase
      const response = await fetch('http://your-server-url:5000/api/purchase-chat-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: accountProfile.account,
          feature: `rank_${rank.id}`,
          transactionHash: 'simulated_xrp_transaction_hash'
        })
      });

      if (response.ok) {
        setSnackbarMessage(`Successfully purchased ${rank.name} rank!`);
      } else {
        setSnackbarMessage('Failed to purchase rank. Please check your XRP balance and try again.');
      }
    } catch (error) {
      console.error('Error purchasing rank:', error);
      setSnackbarMessage('An error occurred. Please try again later.');
    }

    setSnackbarOpen(true);
  };

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
                onClick={() => handlePurchase(item)}
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
    <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
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
  );
}

export default Store;
