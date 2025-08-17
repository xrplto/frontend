import React from 'react';
import {
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  useTheme
} from '@mui/material';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function AboutPage() {
  const theme = useTheme();

  const timelineData = [
    { date: 'November 2021', event: 'XRPL.to Launches' },
    {
      date: 'December 2021',
      event: 'xrpl.to concludes the year with a monthly page view count of 55,000.'
    },
    { date: 'July 2022', event: 'XRPL Grants Wave 3 Recipient' },
    { date: 'August 2022', event: 'On-Ramp Fiat Integration' },
    {
      date: 'October 2022',
      event: 'XRPL.to introduces a weighted market cap for tokens with low liquidity.'
    },
    { date: 'February 2023', event: 'Full XRPL History Implemented' },
    { date: 'April 2023', event: 'Public API Documentation Released' }
  ];

  return (
    <Box>
      <Toolbar id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', my: 6 }}>
              <Typography
                variant="h1"
                sx={{
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                About xrpl.to
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                The largest price-tracking onchain app for tokenized assets on the XRPL ecosystem
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {/* Mission Statement Card */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main' }}
                    >
                      Our Mission
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}>
                      At XRPL.to, we make XRPL tokens discoverable and efficient globally by
                      empowering retail users with unbiased, high-quality, and accurate information.
                      We strive to provide all relevant and current information on XRPL tokens,
                      currencies, and assets in a single, easy-to-find location.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Company Info Card */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}10, ${theme.palette.primary.main}10)`,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'secondary.main' }}
                    >
                      Our Story
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}>
                      Founded in November 2021 by NFT Labs, XRPL.to provides up-to-date XRPL token
                      prices, charts, and data for emerging XRPL DEX markets. Our efforts have been
                      recognized by Bloomberg, New York Times, and Digital Trends.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Timeline Section */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mt: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}
                    >
                      Our Journey
                    </Typography>
                    <Stack spacing={3}>
                      {timelineData.map((item) => (
                        <Box
                          key={item.date}
                          sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}
                        >
                          <Chip
                            label={item.date}
                            color="primary"
                            variant="outlined"
                            sx={{
                              minWidth: 140,
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              flex: 1,
                              pt: 0.5,
                              lineHeight: 1.6,
                              fontSize: '1rem'
                            }}
                          >
                            {item.event}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* How We Work Section */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mt: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                      How XRPL.to Works
                    </Typography>
                    
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Comprehensive XRPL Market Insights
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      At XRPL.to, we aggregate and present up-to-date information on all tokens, currencies, and
                      assets within the XRP Ledger ecosystem. Our goal is to serve as your all-in-one resource
                      for XRPL market data, providing the tools and insights needed to navigate the
                      decentralized finance landscape effectively.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Interactive Live & Historical Token Charts
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      Each token's dedicated page features dynamic charts showcasing both live and historical
                      price movements. Customize your view by selecting specific date ranges to analyze trends
                      from an asset's inception to the present. These charts are freely accessible to all users,
                      offering valuable insights at no cost.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Transparent Token Price Calculations
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      Our token prices reflect real-time data from the XRP Ledger DEX, ensuring transparency and
                      accuracy. This means that as the XRP Ledger produces new ledgers, our platform updates to
                      provide the latest information. For developers and analysts seeking programmatic access,
                      our comprehensive{' '}
                      <Typography component="a" href="/api-docs" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        XRPL API documentation
                      </Typography>{' '}
                      provides detailed guidance on integrating and utilizing our data feeds.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      XRPL Token Valuation Methodology
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      We calculate the market capitalization of XRPL tokens by multiplying the total circulating
                      supply by the current reference price. This approach offers a clear and consistent metric
                      for assessing the value of individual assets within the XRP Ledger.
                    </Typography>

                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Global XRPL Token Market Overview
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      As of June 1, 2025, the XRP Ledger hosts approximately 9,752 tokens, encompassing a
                      diverse array of currencies and projects. XRPL.to automatically lists all tokens available
                      on the ledger, providing a comprehensive view of the ecosystem. While we strive to present
                      accurate information, we encourage users to conduct their own research to assess the
                      legitimacy and potential of each project.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Understanding XRPL Tokens
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      Within the XRP Ledger, assets other than XRP are represented as tokens, which can be
                      either fungible or non-fungible. These tokens facilitate a wide range of applications,
                      including stablecoins backed by external assets, community credits, and unique digital
                      collectibles. The ledger's design ensures that tokens are issued and held through{' '}
                      <Typography component="a" href="https://xrpl.org/trust-lines-and-issuing.html" target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        trust lines
                      </Typography>
                      , providing flexibility and security for various use cases.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      NFT Trading on the XRP Ledger
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      XRPL.to offers a seamless NFT trading experience, allowing users to explore, buy, and
                      sell non-fungible tokens directly on the XRP Ledger. Our platform provides detailed
                      information about collections, individual NFTs, ownership history, and current market
                      offers, making it easy to participate in the growing XRPL NFT ecosystem.
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Advanced Trading & Portfolio Management
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      Beyond market data, XRPL.to features comprehensive trading tools including real-time
                      order books, trade execution capabilities, and portfolio tracking. Monitor your token
                      holdings, track transaction history, and manage your digital assets all in one place.
                      Our platform supports both casual investors and professional traders with tools designed
                      for every level of expertise.
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Stay Informed with XRPL.to
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
                      Join our growing community of XRPL enthusiasts and stay updated with the latest market
                      trends, token launches, and ecosystem developments. XRPL.to is committed to being your
                      trusted companion in the XRP Ledger journey, providing the data, tools, and insights
                      you need to make informed decisions in the evolving world of decentralized finance.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Additional Info Card */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mt: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Get Involved
                    </Typography>
                    <Stack spacing={2}>
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        To understand the process of listing tokens projects and exchanges on
                        xrpl.to, please refer to our listing policy and frequently asked questions.
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        xrpl.to attracts millions of users annually through web, mobile platforms,
                        and social media including Twitter, Telegram, Facebook, and Instagram. We
                        also host Twitter spaces for community engagement.
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        For advertising opportunities or business inquiries, contact us at{' '}
                        <Typography
                          component="span"
                          sx={{ color: 'primary.main', fontWeight: 600 }}
                        >
                          hello@xrpl.to
                        </Typography>
                        . Visit our careers page to discover job openings.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}

export default AboutPage;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  // https://api.xrpl.to/api/banxa/currencies
  // const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    // var t1 = performance.now();
    // const res = await axios.get(`${BASE_URL}/banxa/currencies`);
    // data = res.data;
    // var t2 = performance.now();
    // var dt = (t2 - t1).toFixed(2);
    // console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
  }
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'About us';
    ogp.url = 'https://xrpl.to/';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    //ogp.desc = 'Meta description here';

    ret = { data, ogp };
  }

  return {
    props: ret, // will be passed to the page component as props
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10 // In seconds
  };
}
