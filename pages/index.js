import { useState, useMemo, lazy, Suspense } from 'react';
import { Box, Container, Grid, styled, Toolbar, useMediaQuery } from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/extra';

// Eager load critical components
import Header from 'src/components/Header';
import TokenList from 'src/TokenList';

// Lazy load non-critical components
const Topbar = dynamic(() => import('src/components/Topbar'), { ssr: false });
const Footer = dynamic(() => import('src/components/Footer'), { ssr: false });
const ScrollToTop = dynamic(() => import('src/components/ScrollToTop'), { ssr: false });
const Summary = dynamic(() => import('src/TokenList/Summary'));
const HowWeWork = dynamic(() => import('src/TokenList/HowWeWork'));

// Defer i18n loading
if (typeof window !== 'undefined') {
  import('src/utils/i18n');
}

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

const MaintenanceMessage = styled(Box)(
  ({ theme }) => `
    text-align: center;
    padding: ${theme.spacing(8)};
    background: ${theme.palette.background.paper};
    border-radius: ${theme.spacing(1)};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    margin: ${theme.spacing(4)} 0;

    h1 {
      color: ${theme.palette.primary.main};
      margin-bottom: ${theme.spacing(2)};
    }

    p {
      color: ${theme.palette.text.secondary};
      font-size: 1.1rem;
    }
`
);

function MaintenanceView({ isMobile }) {
  return (
    <OverviewWrapper>
      <Container maxWidth="xl">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          style={{ minHeight: '60vh' }}
        >
          <Grid item xs={12} sm={8} md={6}>
            <MaintenanceMessage>
              <h1>Under Maintenance</h1>
              <p>We're currently performing some updates to improve our service.</p>
              <p>Please check back soon!</p>
            </MaintenanceMessage>
          </Grid>
        </Grid>
      </Container>
    </OverviewWrapper>
  );
}

function Overview({ data }) {
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

  const MAINTENANCE_MODE = false; // Set to false to show normal view

  // Add this function to handle safe navigation
  const handleNavigation = (path) => {
    if (router.asPath !== path) {
      router.push(path);
    }
  };

  if (MAINTENANCE_MODE) {
    return <MaintenanceView isMobile={isMobile} />;
  }

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
                <TokenList tags={data.tags} tokens={tokens} tMap={tMap} setTokens={setTokens} />
                {/* <CryptoHeatmap
                    tokens={tokens}
                  /> */}
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

export default Overview;

export async function getStaticProps() {
  const data = await getTokens('vol24hxrp', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata
    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'XRP Ledger Tokens - Live Prices, Charts & Trading Data | XRPL.to';
    ogp.url = 'https://xrpl.to/';
    ogp.imgUrl = 'https://s1.xrpl.to/ogp/landing.webp';
    ogp.desc =
      'Discover XRP Ledger tokens with live prices, market cap, 24h volume & trading charts. Track XRPL DeFi tokens, compare performance & find new opportunities on XRP Ledger.';

    // Additional structured metadata for better SEO
    ogp.keywords =
      'XRP Ledger, XRPL tokens, XRP tokens, cryptocurrency prices, DeFi tokens, crypto charts, market cap, trading volume, XRP ecosystem, digital assets, blockchain tokens, altcoins';
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
