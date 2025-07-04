import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import Paper from '@mui/material/Paper';

export default function AppMenu() {
  return (
    <Box sx={{ pb: 0 }}>
      <CssBaseline />
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1005,
          background: 'none',
          boxShadow: 'none'
        }}
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={null}
          onChange={(event, newValue) => {
            // setValue(newValue);
          }}
          sx={{ background: 'none', display: 'none' }}
        >
          {/* Removed Markets, Watchlist, Swap, and Portfolio/Login menu items */}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
