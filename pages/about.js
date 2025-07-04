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
                      {timelineData.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
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
