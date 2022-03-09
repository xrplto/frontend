import * as React from 'react';
import { useContext } from 'react'
import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, FormGroup, FormControlLabel, Switch, Stack, AppBar, Toolbar, IconButton } from '@mui/material';
// components
//
import AccountPopover from './AccountPopover';

import Logo from '../components/Logo';

import { Link as RouterLink/*, useLocation*/ } from 'react-router-dom';

//import LightModeIcon from '@mui/icons-material/LightMode';
//import DarkModeIcon from '@mui/icons-material/DarkMode';
// import {
//     Brightness4 as Brightness4Icon,
//     BrightnessHigh as BrightnessHighIcon,
// } from '@mui/icons-material'

import { Icon } from '@iconify/react'; 
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
//const APPBAR_MOBILE = 64;
const APPBAR_DESKTOP = 72;
// boxShadow: theme.customShadows.z1,

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_DESKTOP
}));

// ----------------------------------------------------------------------
export default function Navbar() {
    const { toggleThisTheme, isDarkMode } = useContext(Context);

    return (
        <ToolbarStyle>
            <Box component={RouterLink} to="/" sx={{ px: 2.5, py: 3, display: 'inline-flex' }}>
                <Logo />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                <AccountPopover />
                <IconButton onClick={() => { toggleThisTheme('isDarkMode') }} >
                    {isDarkMode ? (
                        <Icon icon={baselineBrightnessHigh} />
                    ) : (
                        <Icon icon={baselineBrightness4} />
                    )}
                </IconButton>
            </Stack>
        </ToolbarStyle>
    );
}
