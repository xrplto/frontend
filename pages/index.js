import axios from 'axios'
import { performance } from 'perf_hooks';
import { useState } from 'react';
import {
    Box,
    Container,
    Grid,
    styled,
    Toolbar,
    useMediaQuery
} from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import AppMenu from 'src/components/AppMenu';
import Summary from 'src/TokenList/Summary';
import HowWeWork from 'src/TokenList/HowWeWork';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

async function fetchInitialTokens(count) {
    try {
        const response = await axios.get(`${process.env.API_URL}/tokens?limit=${count}`);
        return response.data.tokens;
    } catch (error) {
        console.error('Error fetching initial tokens:', error);
        return [];
    }
}

async function fetchTags() {
    try {
        const response = await axios.get(`${process.env.API_URL}/tags`);
        return response.data.tags;
    } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
}

function Overview({ initialTokens, tags }) {
    const [tokens, setTokens] = useState(initialTokens);
    const tMap = new Map(tokens.map(t => [t.md5, t]));
    const isMobile = useMediaQuery('(max-width:600px)');
  
    return (
      <OverviewWrapper>
        <Toolbar id="back-to-top-anchor" />
        {!isMobile ? <Topbar /> : ""}
        <Header />
        { isMobile ? <Topbar /> : "" }
  
        <Container maxWidth="xl">
          <Grid
            container
            direction="row"
            justifyContent="left"
            alignItems="stretch"
            spacing={3}
          >
            <Grid item xs={12} md={12} lg={8}>
              <Summary />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <TokenList
                tags={tags}
                initialTokens={tokens}
                tMap={tMap}
                setTokens={setTokens}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <HowWeWork />
            </Grid>
          </Grid>
        </Container>
  
        <ScrollToTop />
        { isMobile ? <AppMenu/> : "" }
        <Footer />
      </OverviewWrapper>
    );
  }
  
export default Overview;

export async function getStaticProps() {
    const initialTokenCount = 100; // Adjust this number as needed
    const initialTokens = await fetchInitialTokens(initialTokenCount);
    const tags = await fetchTags();

    return {
        props: {
            initialTokens,
            tags,
        },
        revalidate: 60, // Revalidate every 60 seconds
    };
}

