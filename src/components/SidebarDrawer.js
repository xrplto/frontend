import React from 'react';
import {
  Link,
  MenuItem,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

import Logo from './Logo';
import Wallet from './Wallet';
import ThemeSwitcher from './ThemeSwitcher';
import PhoneDropDown from './PhoneDropDown';
import Drawer from './Drawer';
import CurrencySwithcer from './CurrencySwitcher';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function SidebarDrawer({ toggleDrawer, isOpen }) {
  return (
    <Drawer toggleDrawer={toggleDrawer} isOpen={isOpen} title={' '}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id="panel-header"
          aria-controls="panel-content"
        >
          <Typography variant="s6">Tokens</Typography>
        </AccordionSummary>
        <AccordionDetails style={{ padding: '0', margin: '0' }}>
          <PhoneDropDown />
        </AccordionDetails>
      </Accordion>
      <Link underline="none" color="inherit" href="/swap" rel="noreferrer noopener nofollow">
        <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
          <Typography variant="s6">Swap</Typography>
        </MenuItem>
      </Link>
      <Link
        underline="none"
        color="inherit"
        href="/buy-xrp"
        rel="noreferrer noopener nofollow"
        sx={
          {
            // marginBottom: '25px'
          }
        }
      >
        <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
          <Typography variant="s6">Fiat</Typography>
        </MenuItem>
      </Link>
      <Stack direction="row" spacing={0.5} sx={{ mr: 2, pl: 2 }} alignItems="center">
        <Wallet />
        <ThemeSwitcher />
        <CurrencySwithcer />
      </Stack>
    </Drawer>
  );
}
