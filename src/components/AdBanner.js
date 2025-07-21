import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function AdBanner({ onPurchase }) {
  const [open, setOpen] = useState(false);
  const [impressions, setImpressions] = useState(100);
  const theme = useTheme();
  
  const pricePerImpression = 1; // $1 per impression
  const xrpRate = 2.5; // Example XRP rate, you should fetch real rate
  const totalUSD = impressions * pricePerImpression;
  const totalXRP = totalUSD / xrpRate;

  const handlePurchase = () => {
    onPurchase?.({ impressions, totalXRP, totalUSD });
    setOpen(false);
  };

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          width: '100%',
          height: 60,
          bgcolor: theme.palette.background.paper,
          p: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Your Ad Here
        </Typography>
      </Box>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Purchase Ad Impressions</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Number of Impressions"
            value={impressions}
            onChange={(e) => setImpressions(Math.max(1, parseInt(e.target.value) || 0))}
            sx={{ mt: 2, mb: 2 }}
          />
          
          <Typography variant="body2" gutterBottom>
            Price per impression: ${pricePerImpression}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Total: ${totalUSD} ≈ {totalXRP.toFixed(2)} XRP
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePurchase}>Purchase</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}