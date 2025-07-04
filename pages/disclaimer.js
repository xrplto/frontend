import React from 'react';
import {
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
  Card,
  CardContent,
  useTheme,
  Alert,
  AlertTitle
} from '@mui/material';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function DisclaimerPage() {
  const theme = useTheme();

  const disclaimerSections = [
    {
      title: 'No Investment Advice',
      content:
        "The information provided on xrpl.to does not constitute investment advice, financial advice, trading advice, or any other form of advice, and you should not consider any of the website's content as such. Xrpl.to does not recommend that you buy, sell, or hold any cryptocurrency. Please conduct your own due diligence and consult with a financial advisor before making any investment decisions.",
      type: 'warning'
    },
    {
      title: 'Accuracy of Information',
      content:
        'Xrpl.to strives to ensure the accuracy of the information listed on this website; however, it will not be held responsible for any missing or incorrect information. Xrpl.to provides all information "as is." You understand that you use any and all information available on this website at your own risk.',
      type: 'info'
    },
    {
      title: 'Non-Endorsement',
      content:
        'The presence of third-party advertisements and hyperlinks on xrpl.to does not constitute an endorsement, guarantee, warranty, or recommendation by Xrpl.to. Please conduct your own due diligence before deciding to use any third-party services.',
      type: 'info'
    },
    {
      title: 'Affiliate Disclosure',
      content:
        'Xrpl.to may receive compensation for affiliate links. This compensation may be in the form of money or services and could occur without any action from a site visitor. By engaging in activities related to an affiliate link, you acknowledge and understand that some form of compensation may be provided to Xrpl.to. For instance, if you click on an affiliate link, sign up, and trade on an exchange, Xrpl.to may receive compensation. Each affiliate link is clearly indicated with an icon next to it.',
      type: 'success'
    }
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
                  background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Disclaimer
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Important legal information and disclosures
              </Typography>
            </Box>

            {/* Important Notice */}
            <Alert
              severity="warning"
              sx={{
                mb: 4,
                fontSize: '1.1rem',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <AlertTitle sx={{ fontSize: '1.2rem', fontWeight: 600 }}>Important Notice</AlertTitle>
              Please read this disclaimer carefully before using xrpl.to. By accessing and using
              this website, you acknowledge and agree to the terms outlined below.
            </Alert>

            <Grid container spacing={4}>
              {disclaimerSections.map((section) => (
                <Grid item xs={12} md={6} key={section.title}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      background:
                        section.type === 'warning'
                          ? `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.error.main}08)`
                          : section.type === 'success'
                            ? `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.info.main}08)`
                            : `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.primary.main}08)`,
                      border: `1px solid ${
                        section.type === 'warning'
                          ? theme.palette.warning.main + '30'
                          : section.type === 'success'
                            ? theme.palette.success.main + '30'
                            : theme.palette.info.main + '30'
                      }`
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          mb: 3,
                          color:
                            section.type === 'warning'
                              ? 'warning.main'
                              : section.type === 'success'
                                ? 'success.main'
                                : 'info.main'
                        }}
                      >
                        {section.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.7,
                          fontSize: '1.05rem'
                        }}
                      >
                        {section.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Footer Notice */}
            <Card
              elevation={2}
              sx={{
                mt: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Questions or Concerns?
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  If you have any questions about this disclaimer or need clarification on any of
                  these terms, please contact us at{' '}
                  <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    hello@xrpl.to
                  </Typography>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}

export default DisclaimerPage;

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
    ogp.title = 'Disclaimer';
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
