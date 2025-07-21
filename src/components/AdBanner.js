import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, ToggleButton, ToggleButtonGroup, Stack, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

export default function AdBanner({ onPurchase }) {
  const [open, setOpen] = useState(false);
  const [impressions, setImpressions] = useState(1000);
  const [pricingModel, setPricingModel] = useState('cpm'); // 'cpm' or 'cpc'
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);
  
  const cpmRate = 5; // $5 per 1000 impressions
  const cpcRate = 0.60; // $0.60 per click
  const xrpPriceUSD = metrics.USD ? 1 / metrics.USD : 2.5; // Real XRP/USD rate
  
  // Calculate costs
  const pricePerImpression = cpmRate / 1000; // $0.005 per impression
  const estimatedCTR = 0.02; // 2% CTR estimate
  const estimatedClicks = Math.round(impressions * estimatedCTR);
  
  const totalUSD = pricingModel === 'cpm' 
    ? impressions * pricePerImpression 
    : estimatedClicks * cpcRate;
  const totalXRP = totalUSD / xrpPriceUSD;

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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Purchase Ad Credits</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Purchase credits for future ad campaigns. Actual usage depends on impressions/clicks delivered.
          </Typography>
          
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Pricing Model
              </Typography>
              <ToggleButtonGroup
                value={pricingModel}
                exclusive
                onChange={(e, value) => value && setPricingModel(value)}
                fullWidth
                size="large"
              >
                <ToggleButton value="cpm">
                  CPM (Cost per 1000 views)
                </ToggleButton>
                <ToggleButton value="cpc">
                  CPC (Cost per click)
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Box>
              <TextField
                fullWidth
                type="number"
                label={pricingModel === 'cpm' ? "Number of Impressions" : "Estimated Impressions"}
                value={impressions}
                onChange={(e) => setImpressions(Math.max(1, parseInt(e.target.value) || 0))}
                variant="outlined"
              />
            </Box>
            
            <Divider />
            
            <Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: 1 }}>
              {pricingModel === 'cpm' ? (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Rate:</Typography>
                    <Typography variant="body2">${cpmRate} per 1000 impressions</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Per impression:</Typography>
                    <Typography variant="body2">${pricePerImpression} each</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="bold">Total:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${totalUSD.toFixed(2)} ≈ {totalXRP.toFixed(2)} XRP
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Rate:</Typography>
                    <Typography variant="body2">${cpcRate} per click</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Estimated clicks:</Typography>
                    <Typography variant="body2">~{estimatedClicks} (2% CTR)</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="bold">Estimated total:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${totalUSD.toFixed(2)} ≈ {totalXRP.toFixed(2)} XRP
                    </Typography>
                  </Box>
                </Stack>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Current rate: 1 XRP = ${xrpPriceUSD.toFixed(3)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePurchase}>Purchase Credits</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}