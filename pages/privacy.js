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
  useTheme,
  List,
  ListItem
} from '@mui/material';
import axios from 'axios';
// import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { BASE_URL } from 'src/utils/constants';

function PrivacyPage() {
  const theme = useTheme();

  const sections = [
    {
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We may collect certain personal information from you when you use xrpl.to, such as your XRP Ledger address, transaction history, and account information. We only collect personal information that is necessary for the operation and functionality of the App.'
        },
        {
          subtitle: 'Non-Personal Information',
          text: 'We may also collect non-personal information, such as your device information, IP address, browser type, and operating system, in order to improve the App and provide a better user experience.'
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Provision of Services',
          text: 'We use the information we collect to provide and improve the services offered by xrpl.to. This includes processing transactions, facilitating XRP Ledger functionalities, and ensuring the security and integrity of the App.'
        },
        {
          subtitle: 'Communication',
          text: 'We may use your personal information to communicate with you, respond to your inquiries, and provide you with updates or information related to xrpl.to.'
        },
        {
          subtitle: 'Statistical Analysis',
          text: 'We may aggregate and anonymize non-personal information for statistical analysis and research purposes to improve our services, enhance user experience, and develop new features.'
        }
      ]
    },
    {
      title: 'Information Sharing and Disclosure',
      content: [
        {
          subtitle: 'Service Providers',
          text: 'We may engage third-party service providers to assist us in operating and maintaining xrpl.to. These service providers may have access to your personal information only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by law, regulation, or legal process, or if we believe it is necessary to protect the rights, property, or safety of xrpl.to, its users, or others.'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of all or a portion of our assets, your personal information may be transferred or disclosed as part of the transaction. We will take steps to ensure the confidentiality of your personal information is maintained.'
        }
      ]
    }
  ];

  const additionalSections = [
    {
      title: 'Data Security',
      text: 'We implement appropriate security measures to protect the information we collect from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.'
    },
    {
      title: 'Third-Party Links',
      text: 'xrpl.to may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to review the privacy policies of those sites before providing any personal information.'
    },
    {
      title: "Children's Privacy",
      text: 'xrpl.to is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected personal information from a child, we will promptly delete it from our records.'
    },
    {
      title: 'Changes to this Privacy Policy',
      text: 'We reserve the right to modify this Privacy Policy at any time. If we make material changes, we will notify you by posting the updated Privacy Policy on xrpl.to. Your continued use of the App after the changes have been made constitutes your acceptance of the revised Privacy Policy.'
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
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Privacy Policy
              </Typography>
              <Chip
                label="Effective Date: May 27, 2023"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1rem', py: 2 }}
              />
            </Box>

            {/* Introduction Card */}
            <Card elevation={2} sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}>
                  At xrpl.to, we are committed to protecting your privacy and ensuring the security
                  of your personal information. This Privacy Policy explains how we collect, use,
                  and disclose information when you access or use our web application on the XRP
                  Ledger ("xrpl.to" or the "App"). By using xrpl.to, you consent to the practices
                  described in this Privacy Policy.
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={4}>
              {/* Main Policy Sections */}
              {sections.map((section, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}
                      >
                        {section.title}
                      </Typography>
                      <Stack spacing={3}>
                        {section.content.map((item, itemIndex) => (
                          <Box key={itemIndex}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, mb: 1, color: 'secondary.main' }}
                            >
                              {item.subtitle}
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {item.text}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Additional Sections */}
              {additionalSections.map((section, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card elevation={2} sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                      >
                        {section.title}
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {section.text}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Contact Section */}
              <Grid item xs={12}>
                <Card
                  elevation={3}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}10, ${theme.palette.primary.main}10)`,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'secondary.main', textAlign: 'center' }}
                    >
                      Contact Us
                    </Typography>
                    <Stack spacing={2} sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        If you have any questions, concerns, or requests regarding this Privacy
                        Policy or the privacy practices of xrpl.to, please contact us at{' '}
                        <Typography
                          component="span"
                          sx={{ color: 'primary.main', fontWeight: 600 }}
                        >
                          hello@xrpl.to
                        </Typography>
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Please note that this Privacy Policy applies only to the use of xrpl.to and
                        does not extend to any other websites, platforms, or services that may be
                        linked or integrated with xrpl.to.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Timeline Card */}
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600, textAlign: 'center', mb: 3 }}
                    >
                      Policy Updates
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3
                      }}
                    >
                      <Chip
                        label="May 27, 2023"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="body1">Privacy Policy Creation</Typography>
                    </Box>
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

export default PrivacyPage;

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
    ogp.title = 'Privacy Policy';
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
