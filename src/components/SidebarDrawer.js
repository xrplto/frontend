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
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
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
      <Accordion
        sx={{
          boxShadow: 'none',
          '&:before': { display: 'none' },
          backgroundColor: 'transparent'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id="panel-header"
          aria-controls="panel-content"
          sx={{ 
            minHeight: '52px', 
            '&.Mui-expanded': { minHeight: '52px' },
            px: 1.5,
            '& .MuiAccordionSummary-content': {
              my: 1.5
            }
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Tokens</Typography>
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
              pt: 1.5,
              pb: 1,
              fontWeight: 700,
              color: 'text.secondary',
              display: 'block',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Launchpads
          </Typography>
          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/view/firstledger"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <OpenInNewIcon sx={{ fontSize: '20px', color: '#0C53B7' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>FirstLedger</Typography>
            </Box>
          </MenuItem>
          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/view/magnetic-x"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img src="/magneticx-logo.webp" alt="MagneticX" style={{ width: 20, height: 20 }} />
              <Typography sx={{ fontSize: '0.9rem' }}>MagneticX</Typography>
            </Box>
          </MenuItem>
          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/view/xpmarket"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img src="/static/xpmarket.webp" alt="XPMarket" style={{ width: 20, height: 20 }} />
              <Typography sx={{ fontSize: '0.9rem' }}>XPMarket</Typography>
            </Box>
          </MenuItem>
          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/view/ledgermeme"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LedgerMemeIcon sx={{ fontSize: '20px', color: '#cfff04' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>LedgerMeme</Typography>
            </Box>
          </MenuItem>
          <Divider sx={{ my: 1 }} />

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
            Token Discovery
          </Typography>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/trending"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalFireDepartmentIcon sx={{ fontSize: '20px', color: '#B71D18' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Trending</Typography>
            </Box>
          </MenuItem>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/spotlight"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SearchIcon sx={{ fontSize: '20px', color: '#0C53B7' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Spotlight</Typography>
            </Box>
          </MenuItem>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/most-viewed"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VisibilityIcon sx={{ fontSize: '20px', color: '#7635DC' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Most Viewed</Typography>
            </Box>
          </MenuItem>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/gainers/24h"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrendingUpIcon sx={{ fontSize: '20px', color: '#007B55' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Gainers</Typography>
            </Box>
          </MenuItem>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/new"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FiberNewIcon sx={{ fontSize: '20px', color: '#B76E00' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>New</Typography>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

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
            Market Analysis
          </Typography>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/market-metrics"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TroubleshootIcon sx={{ fontSize: '20px', color: '#0C53B7' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Market Metrics</Typography>
            </Box>
          </MenuItem>

          <MenuItem 
            sx={{ 
              py: 1, 
              px: 2, 
              minHeight: '44px',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }} 
            component={Link} 
            href="/top-traders"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmojiEventsIcon sx={{ fontSize: '20px', color: '#B78100' }} />
              <Typography sx={{ fontSize: '0.9rem' }}>Top Traders</Typography>
            </Box>
          </MenuItem>
        </AccordionDetails>
      </Accordion>
      <Link underline="none" color="inherit" href="/collections" rel="noreferrer noopener nofollow">
        <MenuItem sx={{ py: 1.5, px: 2, minHeight: '52px' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>NFTs</Typography>
        </MenuItem>
      </Link>
      <Link underline="none" color="inherit" href="/swap" rel="noreferrer noopener nofollow">
        <MenuItem sx={{ py: 1.5, px: 2, minHeight: '52px' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Swap</Typography>
        </MenuItem>
      </Link>
      <Divider sx={{ my: 2 }} />
      <Stack
        direction="column"
        spacing={2}
        sx={{ px: 2, pb: 3 }}
        alignItems="stretch"
      >
        <Box sx={{ width: '100%' }}>
          <Wallet />
        </Box>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <ThemeSwitcher />
          <CurrencySwithcer />
        </Stack>
      </Stack>
    </Drawer>
  );
}
