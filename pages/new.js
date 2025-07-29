import { useState, useMemo } from 'react';
import { Box, Container, Grid, styled, Toolbar, useMediaQuery } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import HowWeWork from 'src/TokenList/HowWeWork';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/extra';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
    margin: 0;
    padding: 0;
    
    ${theme.breakpoints.down('md')} {
      margin: 0;
      padding: 0;
    }
`
);

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function NewTokensPage({ data }) {
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const tMap = useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      map.set(t.md5, t);
    }
    return map;
  }, [tokens]);
  const isMobile = useMediaQuery('(max-width:600px)');
  const router = useRouter();

  return (
    <OverviewWrapper>
      {/* Only show Toolbar on desktop - remove on mobile to eliminate spacing */}
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Container maxWidth="xl">
        <Box
          sx={{
            width: '100%',
            px: { xs: 0, sm: 0, md: 0 },
            py: { xs: 0, sm: 0, md: 0 },
            mt: { xs: 0, sm: 0, md: 0 },
            mb: { xs: 0, sm: 0, md: 0 },
            // Add negative margin on mobile to close any remaining gap
            [(theme) => theme.breakpoints.down('md')]: {
              marginTop: '-1px' // Pulls Summary closer to header
            }
          }}
        >
          <Summary />
        </Box>
      </Container>

      <Container maxWidth="xl">
        <Grid container direction="row" justifyContent="left" alignItems="stretch" spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            {data && data.tags ? (
              <>
                <TokenList 
                  tags={data.tags} 
                  tokens={tokens} 
                  tMap={tMap} 
                  setTokens={setTokens}
                  initialOrderBy="dateon"
                />
              </>
            ) : (
              <></>
            )}
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <HowWeWork />
          </Grid>
        </Grid>
      </Container>

      <ScrollToTop />
      {/* {isMobile ? <AppMenu /> : ''} */}
      <Footer />
    </OverviewWrapper>
  );
}

export default NewTokensPage;

export async function getStaticProps() {
  const data = await getTokens('dateon', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for new tokens page
    ogp.canonical = 'https://xrpl.to/new';
    ogp.title = 'New XRPL Tokens | Latest Launches | XRP Ledger';
    ogp.url = 'https://xrpl.to/new';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'Discover the newest XRPL tokens and latest launches on the XRP Ledger. Stay updated with fresh token listings and emerging projects in the XRP ecosystem.';

    // Additional structured metadata for better SEO
    ogp.keywords =
      'new XRPL tokens, latest XRP launches, token launches, new cryptocurrency, fresh tokens, DEX tokens, XRP ecosystem new';
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

    // Twitter card metadata
    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

    ret = { data, ogp };
  }

  return {
    props: ret,
    revalidate: 5 // Revalidate every 5 seconds
  };
}
