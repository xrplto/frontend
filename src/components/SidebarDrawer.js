import React from 'react';
import { Link, MenuItem, Typography, Stack } from '@mui/material';

import Logo from './Logo';
import Wallet from './Wallet';
import ThemeSwitcher from './ThemeSwitcher';

import Drawer from './Drawer';

export default function SidebarDrawer({ toggleDrawer, isOpen }) {
  return (
    <Drawer
      toggleDrawer={toggleDrawer}
      isOpen={isOpen}
      title={
        <Logo style={{ marginRight: 10, paddingTop: 15, paddingBottom: 15 }} />
      }
    >
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
          marginBottom: '25px'
        }}
      >
        <MenuItem divider={true} sx={{ py: 1.5, px: 3 }}>
          <Typography variant="s6">Fiat</Typography>
        </MenuItem>
      </Link>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mr: 2, pl: 3 }}
        alignItems="center"
      >
        <Wallet />
        <ThemeSwitcher />
      </Stack>
    </Drawer>
  );
}
