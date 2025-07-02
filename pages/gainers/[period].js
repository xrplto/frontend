import { useState, useMemo } from 'react';
import { Box, Container, Grid, styled, Toolbar, useMediaQuery } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import AppMenu from 'src/components/AppMenu';
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

function GainersPage({ data, period }) {
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
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Box
        sx={{
          width: '100%',
          px: { xs: 0, sm: 2, md: 3 },
          py: { xs: 0, sm: 0, md: 0 },
          mt: { xs: 0, sm: 0, md: 0 },
          mb: { xs: 0, sm: 0, md: 0 },
          [(theme) => theme.breakpoints.down('md')]: {
            marginTop: '-1px'
          }
        }}
      >
        <Summary />
      </Box>

      <Container maxWidth="xl">
        <Grid container direction="row" justifyContent="left" alignItems="stretch" spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            {data && data.tags ? (
              <>
                <TokenList tags={data.tags} tokens={tokens} tMap={tMap} setTokens={setTokens} />
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
      {isMobile ? <AppMenu /> : ''}
      <Footer />
    </OverviewWrapper>
  );
}

export default GainersPage;

export async function getStaticPaths() {
  return {
    paths: [
      { params: { period: '5m' } },
      { params: { period: '1h' } },
      { params: { period: '24h' } },
      { params: { period: '7d' } }
    ],
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  // Map URL periods to API sortBy parameters
  const periodMap = {
    '5m': 'pro5m',
    '1h': 'pro1h',
    '24h': 'pro24h',
    '7d': 'pro7d'
  };

  const sortBy = periodMap[params.period];
  if (!sortBy) {
    return { notFound: true };
  }

  const data = await getTokens(sortBy, 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = `https://xrpl.to/gainers/${params.period}`;
    ogp.title = `${params.period.toUpperCase()} Gainers XRPL Tokens | Top Performers | XRP Ledger`;
    ogp.url = `https://xrpl.to/gainers/${params.period}`;
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc = `Discover the top performing XRPL tokens over the last ${params.period}. Track the biggest gainers and price increases on the XRP Ledger ecosystem.`;

    ogp.keywords = `${params.period} gainers XRPL tokens, top performers XRP, price increases, crypto gainers, DEX tokens, XRP ecosystem gainers`;
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

    ret = { data, ogp, period: params.period };
  }

  return {
    props: ret,
    revalidate: 60
  };
}
