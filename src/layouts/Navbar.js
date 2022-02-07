import * as React from 'react';
//import PropTypes from 'prop-types';
//import { useTheme, ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
//import { Icon } from '@iconify/react';
//import menu2Fill from '@iconify/icons-eva/menu-2-fill';
// material
import { alpha, styled } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar/*, IconButton*/ } from '@mui/material';
// components
//
import AccountPopover from './AccountPopover';

import Logo from '../components/Logo';

import { Link as RouterLink/*, useLocation*/ } from 'react-router-dom';

//import LightModeIcon from '@mui/icons-material/LightMode';
//import DarkModeIcon from '@mui/icons-material/DarkMode';
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

const APPBAR_MOBILE = 64;
//const APPBAR_DESKTOP = 72;

const RootStyle = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
  //backgroundColor: alpha(theme.palette.background.default, 0.72),
  backgroundColor: alpha("#00AB88", 0.4),
}));

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_MOBILE
}));

// ----------------------------------------------------------------------
//      <MyApp/>
/*function MyApp() {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    return (
      <Box>
        {theme.palette.mode} mode
        <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Box>
    );
}*/

export default function Navbar() {
  return (
    <RootStyle>
		<ToolbarStyle>

    	<Box component={RouterLink} to="/" sx={{ px: 2.5, py: 3, display: 'inline-flex' }}>
      		<Logo />
		</Box>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
          <AccountPopover />
        </Stack>
      </ToolbarStyle>
    </RootStyle>
  );
}
