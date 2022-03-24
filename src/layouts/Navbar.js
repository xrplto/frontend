import * as React from 'react';
import { useContext } from 'react'
import Context from '../Context'
// material
import {styled, alpha/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, IconButton } from '@mui/material';
// components
//
import AccountPopover from './AccountPopover';

import Logo from './Logo';

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
import { useSelector, useDispatch } from "react-redux";

import {
    setPage,
    setRowsPerPage,
    selectContent,
    /*setOrder,
    setOrderBy,
    loadTokens*/
} from "../redux/tokenSlice";
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

// ----------------------------------------------------------------------
export default function Navbar() {
    const dispatch = useDispatch();
    const { toggleThisTheme, isDarkMode } = useContext(Context);

    const reloadPage = () => {
        dispatch(setRowsPerPage(100));
        dispatch(setPage(0));
    }
    return (
        <StackStyle direction="row" spacing={2} sx={{pl:2, pr:2, pt:4, pb:0.5}} alignItems="center">
            <Box
                component={RouterLink}
                to="/" sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }}
                onClick={() => { reloadPage(); }}
            >
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
