import * as React from 'react';
import { useContext } from 'react'
import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar, IconButton } from '@mui/material';
// components
//
import AccountPopover from './AccountPopover';

import Logo from '../components/Logo';

import { Link as RouterLink/*, useLocation*/ } from 'react-router-dom';

//import LightModeIcon from '@mui/icons-material/LightMode';
//import DarkModeIcon from '@mui/icons-material/DarkMode';
import {
    Brightness4 as Brightness4Icon,
    BrightnessHigh as BrightnessHighIcon,
} from '@mui/icons-material'
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

const APPBAR_MOBILE = 64;
//const APPBAR_DESKTOP = 72;

const RootStyle = styled(AppBar)(({ theme }) => ({
  boxShadow: theme.customShadows.z8,
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
  backgroundColor: alpha(theme.palette.background.paper, 0.72),
  //backgroundColor: alpha("#00AB88", 0.7),
}));

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_MOBILE
}));

// ----------------------------------------------------------------------
export default function Navbar() {
    const { toggleThisTheme, isDarkMode } = useContext(Context);

    return (
    <RootStyle>
        <ToolbarStyle>

            <Box component={RouterLink} to="/" sx={{ px: 2.5, py: 3, display: 'inline-flex' }}>
                <Logo />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                <IconButton onClick={() => { toggleThisTheme('isDarkMode') }} >
                    {isDarkMode ? (
                        <BrightnessHighIcon />
                    ) : (
                        <Brightness4Icon />
                    )}
                </IconButton>

                <AccountPopover />
            </Stack>
        </ToolbarStyle>
    </RootStyle>
    );
}
