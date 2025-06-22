import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState } from 'react';
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

function SpotlightPage({ data }) {
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const tMap = new Map();
  const isMobile = useMediaQuery('(max-width:600px)');
  const router = useRouter();

  for (var t of tokens) {
    tMap.set(t.md5, t);
  }

  return (
    <OverviewWrapper>
      {/* Only show Toolbar on desktop - remove on mobile to eliminate spacing */}
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
          // Add negative margin on mobile to close any remaining gap
          [(theme) => theme.breakpoints.down('md')]: {
            marginTop: '-1px' // Pulls Summary closer to header
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

export default SpotlightPage;

export async function getStaticProps() {
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    var t1 = performance.now();

    // Fetch tokens sorted by assessmentScore in descending order
    const res = await axios.get(
      `${BASE_URL}/tokens?start=0&limit=100&sortBy=assessmentScore&sortType=desc&filter=&tags=yes&showNew=false&showSlug=false`
    );

    // Filter the API response to only keep necessary fields
    const essentialTokenFields = [
      'md5',
      'currency',
      'issuer',
      'name',
      'domain',
      'kyc',
      'verified',
      'marketcap',
      'p24h',
      'pro24h',
      'pro1h',
      'pro5m',
      'pro7d',
      'vol24hxrp',
      'vol24htx',
      'vol24hx',
      'usd',
      'exch',
      'tags',
      'holders',
      'trustlines',
      'supply',
      'amount',
      'id',
      'user',
      'slug',
      'date',
      'dateon',
      'tvl',
      'origin',
      'isOMCF',
      'assessmentScore',
      'trendingScore',
      'views'
    ];

    // Use the same data structure as the main index page
    data = {
      ...res.data,
      tokens: res.data.tokens.map((token) => {
        const filteredToken = {};
        essentialTokenFields.forEach((field) => {
          if (token[field] !== undefined) {
            filteredToken[field] = token[field];
          }
        });

        // Add calculated fields
        filteredToken.bearbull = token.pro24h < 0 ? -1 : 1;
        filteredToken.time = Date.now();

        return filteredToken;
      })
    };

    var t2 = performance.now();
    console.log('API call for spotlight page took ' + (t2 - t1) + ' milliseconds.');
  } catch (error) {
    console.error('Error fetching spotlight data:', error);
  }

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for spotlight page
    ogp.canonical = 'https://xrpl.to/spotlight';
    ogp.title = 'Spotlight XRPL Tokens | Curated & Top-Rated | XRP Ledger';
    ogp.url = 'https://xrpl.to/spotlight';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'Discover curated spotlight XRPL tokens with the highest assessment scores. Find top-rated, verified tokens with strong fundamentals on the XRP Ledger ecosystem.';

    // Additional structured metadata for better SEO
    ogp.keywords =
      'spotlight XRPL tokens, top-rated XRP tokens, curated cryptocurrency, verified tokens, assessment score, crypto fundamentals, DEX tokens, XRP ecosystem spotlight';
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
    revalidate: 60 // Revalidate every 60 seconds
  };
}
