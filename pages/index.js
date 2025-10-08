import { useState, useMemo } from 'react';
import { Box, Container, Grid, styled, Toolbar, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/formatters';

// Import all components directly
import Header from 'src/components/Header';
import TokenList from 'src/TokenList';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import Logo from 'src/components/Logo';

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
    padding: 0;
    background: transparent;
    margin: 0;

    h1 {
      color: ${theme.palette.mode === 'dark' ? '#4285f4' : '#2563eb'};
      font-size: 1.75rem;
      font-weight: 500;
      margin: ${theme.spacing(3)} 0 ${theme.spacing(1.5)} 0;
      letter-spacing: -0.01em;
    }

    p {
      color: ${theme.palette.text.secondary};
      font-size: 0.95rem;
      font-weight: 400;
      margin: ${theme.spacing(0.5)} 0;
      opacity: 0.7;
    }
`
);

function MaintenanceView({ isMobile }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: 3
      }}
    >
      <Box
        sx={{
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Logo style={{ width: '120px', height: '42px', margin: '0 auto' }} />
        <MaintenanceMessage>
          <h1>Under Maintenance</h1>
          <p>We're currently performing some updates to improve our service.</p>
          <p>Please check back soon.</p>
        </MaintenanceMessage>
      </Box>
    </Box>
  );
}

function Overview({ data }) {
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
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
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        XRPL Tokens Analytics & Trading Platform
      </h1>

      <Container maxWidth={notificationPanelOpen ? false : "xl"}>
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
          <Grid size={12}>
            {data && data.tags ? (
              <>
                <TokenList tags={data.tags} tokens={tokens} tMap={tMap} setTokens={setTokens} />
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

export default Overview;

export async function getStaticProps() {
  // Fetch only 50 tokens initially to reduce page data size
  const data = await getTokens('vol24hxrp', 'desc', 'yes', false, false, 50);

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
    props: ret,
    // Revalidate every 5 seconds (adjust as needed)
    revalidate: 5
  };
}
