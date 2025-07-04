import React, { forwardRef } from 'react';
import {
  Link,
  MenuItem,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
  SvgIcon
} from '@mui/material';

import Logo from './Logo';
import Wallet from './Wallet';
import ThemeSwitcher from './ThemeSwitcher';
import PhoneDropDown from './PhoneDropDown';
import Drawer from './Drawer';
import CurrencySwithcer from './CurrencySwitcher';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Icons for menu items
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
// All other icons previously imported for market and resource links are no longer needed

const LedgerMemeIcon = forwardRef((props, ref) => {
  // Filter out any non-DOM props that might cause warnings
  const { width, darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} ref={ref} viewBox="0 0 26 26">
      <g transform="scale(0.55)">
        <rect fill="#cfff04" width="36" height="36" rx="8" ry="8" x="0" y="0"></rect>
        <g>
          <g>
            <path
              fill="#262626"
              d="M25.74,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
            ></path>
            <path
              fill="#262626"
              d="M27.43,10.62c-0.45-0.46-1.05-0.72-1.69-0.72s-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78Z"
            ></path>
            <path
              fill="#262626"
              d="M10.22,9.68c0.64,0,1.24-0.26,1.69-0.72l2.69-2.76h-1.64l-1.87,1.92c-0.23,0.24-0.55,0.37-0.88,0.37s-0.64-0.13-0.88-0.37l-1.87-1.92h-1.64l2.69,2.76c0.45,0.46,1.05,0.72,1.69,0.72Z"
            ></path>
            <path
              fill="#262626"
              d="M10.22,9.90c-0.64,0-1.24,0.26-1.69,0.72l-2.71,2.78h1.64l1.89-1.93c0.23-0.24,0.55-0.37,0.88-0.37s0.64,0.13,0.88,0.37l1.89,1.93h1.64l-2.71-2.78c-0.45-0.46-1.05-0.72-1.69-0.72Z"
            ></path>
          </g>
          <path
            fill="#262626"
            d="M5.81,17.4c0,6.73,5.45,12.18,12.18,12.18s12.18-5.45,12.18-12.18H5.81Z"
          ></path>
        </g>
      </g>
    </SvgIcon>
  );
});

LedgerMemeIcon.displayName = 'LedgerMemeIcon';

export default function SidebarDrawer({ toggleDrawer, isOpen }) {
  return (
    <Drawer toggleDrawer={toggleDrawer} isOpen={isOpen} title={' '}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id="panel-header"
          aria-controls="panel-content"
          sx={{ minHeight: '48px', '&.Mui-expanded': { minHeight: '48px' } }}
        >
          <Typography variant="s6">Tokens</Typography>
        </AccordionSummary>
        <AccordionDetails style={{ padding: '0', margin: '0' }}>
          {/* Removed "All Tokens" as per user request */}
          {/*
          <MenuItem sx={{ py: 0.5, px: 1.5 }} component={Link} href="/">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ fontSize: '16px', color: '#637381' }} />
              <span>All Tokens</span>
            </Box>
          </MenuItem>
          */}
          <Typography
            variant="caption"
            sx={{
              px: 2,
              pt: 1,
              pb: 0,
              fontWeight: 'bold',
              color: 'text.secondary',
              display: 'block'
            }}
          >
            Launchpads
          </Typography>
          <MenuItem sx={{ py: 0.5, px: 1.5 }} component={Link} href="/view/firstledger">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <OpenInNewIcon sx={{ fontSize: '16px', color: '#0C53B7' }} />
              <span>FirstLedger</span>
            </Box>
          </MenuItem>
          <MenuItem sx={{ py: 0.5, px: 1.5 }} component={Link} href="/view/magnetic-x">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="/magneticx-logo.webp" alt="MagneticX" style={{ width: 16, height: 16 }} />
              <span>MagneticX</span>
            </Box>
          </MenuItem>
          <MenuItem sx={{ py: 0.5, px: 1.5 }} component={Link} href="/view/xpmarket">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="/static/xpmarket.webp" alt="XPMarket" style={{ width: 16, height: 16 }} />
              <span>XPMarket</span>
            </Box>
          </MenuItem>
          <MenuItem sx={{ py: 0.5, px: 1.5 }} component={Link} href="/view/ledgermeme">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LedgerMemeIcon sx={{ fontSize: '16px', color: '#cfff04' }} />
              <span>LedgerMeme</span>
            </Box>
          </MenuItem>
        </AccordionDetails>
      </Accordion>
      <Link underline="none" color="inherit" href="/swap" rel="noreferrer noopener nofollow">
        <MenuItem sx={{ py: 0.5, px: 1.5 }}>
          <Typography variant="s6">Swap</Typography>
        </MenuItem>
      </Link>
      <Stack
        direction="row"
        spacing={0}
        sx={{ mr: 0, pl: 2 }}
        alignItems="center"
        justifyContent="space-around"
        flexWrap="wrap"
      >
        <Wallet />
        <ThemeSwitcher />
        <CurrencySwithcer />
      </Stack>
      <Box sx={{ pb: 3 }} />
    </Drawer>
  );
}
