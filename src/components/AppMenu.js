import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import ShowChartIcon from '@mui/icons-material/ShowChart';
import StarRateIcon from '@mui/icons-material/StarBorderPurple500Outlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import Paper from '@mui/material/Paper';
import { useRouter } from 'next/router';

export default function AppMenu() {
  const router = useRouter();
  const [value, setValue] = useState("market");

  useEffect(() => {
    switch (value) {
      case "market":
        router.push("/");
        break;
      case "watchlist":
        router.push("/watchlist");
        break;
      case "swap":
        router.push("/swap");
        break;
      case "login":
        router.push("/model");
        break;
    }
  }, [value])

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
          <BottomNavigationAction label="Markets" value="market" icon={<ShowChartIcon />} />
          <BottomNavigationAction label="Watchlist" value="watchlist" icon={<StarRateIcon />} />
          <BottomNavigationAction label="Swap" value="swap" icon={<CurrencyExchangeIcon />} />
          <BottomNavigationAction label="Login" value="login" icon={<AccountCircleOutlinedIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}