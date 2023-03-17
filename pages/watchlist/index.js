import { useState, useEffect, useRef } from 'react';

// Material
import {
    Box,
    Container,
    Grid,
    styled,
    Toolbar
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenList from 'src/TokenList';
import SummaryWatchList from 'src/TokenList/SummaryWatchList';


// overflow: scroll;
// overflow: auto;
// overflow: hidden;
const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

function Overview({data}) {
    const [tokens, setTokens] = useState([]);

    const tMap = new Map();
    for (var t of tokens) {
        tMap.set(t.md5, t);
    }

    const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

    const account = accountProfile?.account;

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar />
            <Header />
            
            <Container maxWidth="xl">
                <Grid
                    container
                    direction="row"
                    justifyContent="left"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12} md={12} lg={8} >
                        <SummaryWatchList />
                    </Grid>
                    <Grid item xs={12} md={12} lg={12} >
                        {account &&
                            <TokenList
                                showWatchList={true}
                                tokens={tokens}
                                tMap={tMap}
                                setTokens={setTokens}
                            />
                        }
                    </Grid>
                </Grid>
            </Container>

            <ScrollToTop />

            <Footer />

        </OverviewWrapper>
    );
}

export default Overview;
