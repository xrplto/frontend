import { useState, useMemo } from 'react';
import { Box, Container, Grid, styled, Toolbar, useMediaQuery } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/extra';

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

function MostViewedPage({ data }) {
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
          <Summary mostViewedTokens={data?.tokens?.slice(0, 5)} />
        </Box>
      </Container>

      <Container maxWidth="xl">
        <Grid container direction="row" justifyContent="left" alignItems="stretch" spacing={3}>
          <Grid size={{ xs: 12, md: 12 }} lg={12}>
            {data && data.tags ? (
              <>
                <TokenList
                  tags={data.tags}
                  tokens={tokens}
                  tMap={tMap}
                  setTokens={setTokens}
                  initialOrderBy="nginxScore"
                />
              </>
            ) : (
              <></>
            )}
          </Grid>
        </Grid>
      </Container>

      <ScrollToTop />
      {/* {isMobile ? <AppMenu /> : ''} */}
      <Footer />
    </OverviewWrapper>
  );
}

export default MostViewedPage;

export async function getServerSideProps() {
  const data = await getTokens('nginxScore', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for most viewed page
    ogp.canonical = 'https://xrpl.to/most-viewed';
    ogp.title = 'Most Viewed XRPL Tokens | Popular & Trending | XRP Ledger';
    ogp.url = 'https://xrpl.to/most-viewed';
    ogp.imgUrl = 'https://s1.xrpl.to/ogp/most-viewed.webp';
    ogp.desc =
      'Explore the most viewed XRPL tokens with highest community interest. Discover popular tokens getting the most attention on the XRP Ledger ecosystem.';

    // Additional structured metadata for better SEO
    ogp.keywords =
      'most viewed XRPL tokens, popular XRP tokens, community interest, token popularity, crypto views, DEX tokens, XRP ecosystem popular';
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

    // Twitter card metadata
    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

    ret = { data, ogp };
  }

  return {
    props: ret
  };
}
