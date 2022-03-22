import * as React from 'react';
import { useContext } from 'react'
import Context from '../Context'
// material
import {styled, alpha/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, Toolbar, IconButton } from '@mui/material';
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
const APPBAR_DESKTOP = 72;

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
    minHeight: APPBAR_DESKTOP,
    //boxShadow: theme.customShadows.z0
    borderBottom: '0.05em solid',
    backgroundColor: alpha('#919EAB', 0.8),
    borderBottomColor: alpha('#919EAB', 0.24),
    '& .MuiToolbar-root': {
        paddingLeft: 0,
        paddingRight: 0,
    }
}));

const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    borderBottom: '0.05em solid',
    borderBottomColor: alpha('#919EAB', 0.24),
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

// ----------------------------------------------------------------------
export default function Navbar() {
    const { toggleThisTheme, isDarkMode } = useContext(Context);

    return (
        <StackStyle direction="row" spacing={2} sx={{pl:2, pr:2, pt:0.5, pb:0.5}} alignItems="center">
            <Box component={RouterLink} to="/" sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }}>
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
        </StackStyle>
    );
}
