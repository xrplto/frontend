import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function AdBanner({ onPurchase }) {
  const [open, setOpen] = useState(false);
  const [impressions, setImpressions] = useState(1000);
  const [pricingModel, setPricingModel] = useState('cpm'); // 'cpm' or 'cpc'
  const theme = useTheme();
  
  const cpmRate = 5; // $5 per 1000 impressions
  const cpcRate = 0.60; // $0.60 per click
  const xrpRate = 2.5; // Example XRP rate, you should fetch real rate
  
  // Calculate costs
  const pricePerImpression = cpmRate / 1000; // $0.005 per impression
  const estimatedCTR = 0.02; // 2% CTR estimate
  const estimatedClicks = Math.round(impressions * estimatedCTR);
  
  const totalUSD = pricingModel === 'cpm' 
    ? impressions * pricePerImpression 
    : estimatedClicks * cpcRate;
  const totalXRP = totalUSD / xrpRate;

  const handlePurchase = () => {
    onPurchase?.({ 
      impressions, 
      pricingModel,
      totalXRP, 
      totalUSD,
      estimatedClicks: pricingModel === 'cpc' ? estimatedClicks : null
    });
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
        <DialogTitle>Purchase Ad Credits</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Purchase credits for future ad campaigns. Actual usage depends on impressions/clicks delivered.
          </Typography>
          
          <ToggleButtonGroup
            value={pricingModel}
            exclusive
            onChange={(e, value) => value && setPricingModel(value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="cpm">
              CPM (Cost per 1000 views)
            </ToggleButton>
            <ToggleButton value="cpc">
              CPC (Cost per click)
            </ToggleButton>
          </ToggleButtonGroup>
          
          <TextField
            fullWidth
            type="number"
            label={pricingModel === 'cpm' ? "Number of Impressions" : "Estimated Impressions"}
            value={impressions}
            onChange={(e) => setImpressions(Math.max(1, parseInt(e.target.value) || 0))}
            sx={{ mb: 2 }}
          />
          
          {pricingModel === 'cpm' ? (
            <>
              <Typography variant="body2" gutterBottom>
                Rate: ${cpmRate} per 1000 impressions (${pricePerImpression} each)
              </Typography>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Total: ${totalUSD.toFixed(2)} ≈ {totalXRP.toFixed(2)} XRP
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" gutterBottom>
                Rate: ${cpcRate} per click
              </Typography>
              <Typography variant="body2" gutterBottom>
                Estimated clicks: ~{estimatedClicks} (based on 2% CTR)
              </Typography>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Estimated total: ${totalUSD.toFixed(2)} ≈ {totalXRP.toFixed(2)} XRP
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePurchase}>Purchase</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}