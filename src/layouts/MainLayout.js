import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
// material
import { alpha, styled } from '@mui/material/styles';
import {
    AppBar,
    Container,
    Slide,
    useScrollTrigger,
} from '@mui/material';
//
import Topbar from './Topbar';
import Navbar from './Navbar';
// ----------------------------------------------------------------------

const APP_BAR_DESKTOP = 64;

const RootStyle = styled('div')({
    display: 'flex',
    minHeight: '100%'
});

const MainStyle = styled('div')(({ theme }) => ({
    flexGrow: 1,
    minHeight: '100%',
    paddingTop: APP_BAR_DESKTOP,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(10)
}));

const AppBarStyle = styled(AppBar)(({ theme }) => ({
    //position: 'static',
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.default, 0.9),
    borderRadius: '0px',
    color: theme.palette.text.primary,
    //backgroundColor: alpha("#00AB88", 0.7),
    borderBottom: '0.05em solid',
    borderBottomColor: alpha('#919EAB', 0.24),
}));

function HideOnScroll(props) {
    const { children, window } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    /*const trigger = useScrollTrigger({
        target: window ? window() : undefined,
    });*/

    const trigger = useScrollTrigger({
        target: window ? window() : undefined,
        disableHysteresis: true,
        threshold: 100,
    });

    return (
      <Slide appear={false} direction="down" in={!trigger}>
        {children}
      </Slide>
    );
}
  
HideOnScroll.propTypes = {
    children: PropTypes.element.isRequired,
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window: PropTypes.func,
};

// ----------------------------------------------------------------------
export default function MainLayout() {
    /*<CssBaseline />
    <AppBar position="static">
        <Container maxWidth="lg">
            <ToolBar>
                <Typography>Logo</Typography>
            </ToolBar>
        </Container>
    </AppBar>*/

    return (
        <RootStyle>
            {/* <CssBaseline /> */}
            <HideOnScroll>
                <AppBarStyle>
                    <Container maxWidth="xl">
                        <Navbar />
                    </Container>
                </AppBarStyle>
            </HideOnScroll>

            <HideOnScroll>
                <AppBarStyle>
                    <Container maxWidth="xl">
                        <Topbar />
                    </Container>
                </AppBarStyle>
            </HideOnScroll>

            {/* <AppBarStyle>
                <Topbar />
            </AppBarStyle> */}

            <MainStyle>
                <Outlet />
            </MainStyle>
        </RootStyle>
    );
}
