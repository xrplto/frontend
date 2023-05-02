import { useContext } from 'react';
import Box from '@mui/material/Box';
import {
  Link,
  MenuItem,
  Drawer as MuiDrawer,
  Typography,
  IconButton,
  Stack
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import Logo from './Logo';
import { AppContext } from 'src/AppContext';
import Wallet from './Wallet';
import ThemeSwitcher from './ThemeSwitcher';

export default function Drawer({ toggleDrawer, isOpen }) {
  const { darkMode } = useContext(AppContext);

  return (
    <MuiDrawer
      open={isOpen}
      onClose={() => toggleDrawer(false)}
      PaperProps={{
        sx: {
          width: '100%'
        }
      }}
    >
      <Box
        id="logo-container-laptop"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: darkMode ? '#17171A' : '#fff',
          px: 2,
          boxShadow:
            'rgba(128, 138, 157, 0.12) 0px 8px 32px, rgba(128, 138, 157, 0.08) 0px 1px 2px'
        }}
      >
        <Logo style={{ marginRight: 10, paddingTop: 15, paddingBottom: 15 }} />
        <IconButton aria-label="close" onClick={() => toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Link
        underline="none"
        color="inherit"
        href="https://xrpl.to"
        rel="noreferrer noopener nofollow"
      >
        <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
          <Typography variant="s6">Tokens</Typography>
        </MenuItem>
      </Link>

      <Link
        underline="none"
        color="inherit"
        href="/swap"
        rel="noreferrer noopener nofollow"
      >
        <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
          <Typography variant="s6">Swap</Typography>
        </MenuItem>
      </Link>

      <Link
        underline="none"
        color="inherit"
        href="/buy-xrp"
        rel="noreferrer noopener nofollow"
        sx={{
          marginBottom: "25px"
        }}
      >
        <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
          <Typography variant="s6">Fiat</Typography>
        </MenuItem>
      </Link>

      <Stack direction="row" spacing={1} sx={{ mr: 2, pl: 3 }} alignItems="center">
        <Wallet />
        <ThemeSwitcher />
      </Stack>
    </MuiDrawer>
  );
}
