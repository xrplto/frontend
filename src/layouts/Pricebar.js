import * as React from 'react';
import { useContext } from 'react'
import Context from '../Context'
// material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar, IconButton } from '@mui/material';
// components
//
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
const APPBAR_MOBILE = 64;
//const APPBAR_DESKTOP = 72;
// boxShadow: theme.customShadows.z1,
const RootStyle = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px'
    //backgroundColor: alpha("#00AB88", 0.7),
}));

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_MOBILE
}));

// ----------------------------------------------------------------------
export default function Pricebar() {
    const { toggleThisTheme, isDarkMode } = useContext(Context);

    return (
    <RootStyle>
        <ToolbarStyle>
            <Box sx={{ px: 2.5, py: 3, display: 'inline-flex' }}>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                <IconButton onClick={() => { toggleThisTheme('isDarkMode') }} >
                </IconButton>
            </Stack>
        </ToolbarStyle>
    </RootStyle>
    );
}
