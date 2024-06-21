
import { Box, styled, Stack, Toolbar, Container, useTheme } from "@mui/material";
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import Portfolio from "src/portfolio";
import { useContext } from "react";
import { AppContext } from 'src/AppContext'

const OverviewWrapper = styled(Box)(
    ({ theme }) => `
        // overflow: hidden;
        flex: 1;
    `
);

const OverView = () => {

    const { accountProfile, openSnackbar } = useContext(AppContext);

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar />
            <Header />
            <Container maxWidth="xl">
                <Stack
                    direction="row"
                    justifyContent="center"
                    // sx={{
                    //     mt: {xs: 4, sm: -10}
                    // }}
                    style={{
                        height: '100%',
                        minHeight: '100vh'
                    }}
                >
                    <Portfolio />
                </Stack>
            </Container>

            <ScrollToTop />
            <Footer />

        </OverviewWrapper>
    )
}

export default OverView;