import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import ShowChartIcon from '@mui/icons-material/ShowChart';
import StarRateIcon from '@mui/icons-material/StarBorderPurple500Outlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';

import Paper from '@mui/material/Paper';

export default function AppMenu() {
  const [value, setValue] = React.useState(0);
  return (
    <Box sx={{ pb: 7 }}>
      <CssBaseline />
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1005 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
        >
          <BottomNavigationAction label="Markets" icon={<ShowChartIcon />} />
          <BottomNavigationAction label="Watchlist" icon={<StarRateIcon  />} />
          <BottomNavigationAction label="Swap" icon={<CurrencyExchangeIcon />} />
          <BottomNavigationAction label="Login" icon={<AccountCircleOutlinedIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}