import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Paper, Divider, Chip, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { format } from 'date-fns'; // Make sure to install this package if not already present

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

function TradeOffer({ status, statusDate, isOutgoing }) {
  const offer = isOutgoing ? {
    toAddress: 'rReceiverXRPAddressHere',
    offering: {
      xrp: 150,
      coreum: 300,
      nfts: [
        { name: 'xMoon', id: '#4444' },
        { name: 'xStar', id: '#5555' }
      ]
    },
    wanting: {
      xrp: 50,
      solo: 1000,
      nfts: [
        { name: 'xRocket', id: '#7' }
      ]
    }
  } : {
    fromAddress: 'rSenderXRPAddressHere',
    offering: {
      xrp: 100,
      solo: 500,
      nfts: [
        { name: 'xPunks', id: '#2222' },
        { name: 'xShroom', id: '#3323' }
      ]
    },
    wanting: {
      xrp: 100,
      xspectar: 200,
      nfts: [
        { name: 'xPEPE', id: '#1' }
      ]
    }
  };

  const handleAccept = () => {
    // Implement accept trade logic here
    console.log('Trade accepted');
  };

  const handleReject = () => {
    // Implement reject trade logic here
    console.log('Trade rejected');
  };

  const handleReturnItems = () => {
    // Implement return items logic here
    console.log('Returning items');
  };

  const renderStatusInfo = () => {
    const formattedDate = statusDate ? format(new Date(statusDate), 'MMM d, yyyy HH:mm') : '';

    switch (status) {
      case 'accepted':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', mt: 2 }}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2">Trade Accepted</Typography>
              <Typography variant="caption">{formattedDate}</Typography>
            </Box>
          </Box>
        );
      case 'rejected':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', mt: 2 }}>
            <CancelOutlinedIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2">Trade Rejected</Typography>
              <Typography variant="caption">{formattedDate}</Typography>
            </Box>
          </Box>
        );
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
            {Object.entries(offer.offering).map(([key, value]) => 
              key !== 'nfts' ? (
                <Chip key={key} label={`${value} ${key.toUpperCase()}`} color="primary" variant="outlined" />
              ) : null
            )}
            {offer.offering.nfts.map((nft, index) => (
              <Chip key={index} label={`${nft.name} ${nft.id}`} color="primary" variant="outlined" />
            ))}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {isOutgoing ? "You want:" : "They want:"}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(offer.wanting).map(([key, value]) => 
              key !== 'nfts' ? (
                <Chip key={key} label={`${value} ${key.toUpperCase()}`} color="secondary" variant="outlined" />
              ) : null
            )}
            {offer.wanting.nfts.map((nft, index) => (
              <Chip key={index} label={`${nft.name} ${nft.id}`} color="secondary" variant="outlined" />
            ))}
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {renderStatusInfo()}
        {status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isOutgoing ? (
              <StyledButton variant="outlined" color="error" onClick={handleReturnItems} size="small">
                Return items
              </StyledButton>
            ) : (
              <>
                <StyledButton variant="outlined" color="error" onClick={handleReject} size="small">
                  Decline
                </StyledButton>
                <StyledButton variant="contained" color="primary" onClick={handleAccept} size="small">
                  Accept Trade
                </StyledButton>
              </>
            )}
          </Box>
        )}
      </Box>
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
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
      <TabPanel value={tabValue} index={0}>
        <TradeOffer status="pending" isOutgoing={false} />
        <TradeOffer status="accepted" statusDate="2023-04-15T14:30:00Z" isOutgoing={false} />
        <TradeOffer status="rejected" statusDate="2023-04-14T09:45:00Z" isOutgoing={false} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <TradeOffer status="pending" isOutgoing={true} />
        <TradeOffer status="accepted" statusDate="2023-04-16T10:15:00Z" isOutgoing={true} />
        <TradeOffer status="rejected" statusDate="2023-04-17T11:30:00Z" isOutgoing={true} />
      </TabPanel>
    </Box>
  );
}

export default Trades;