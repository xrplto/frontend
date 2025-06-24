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
import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

function TermsPage() {
  const theme = useTheme();

  const termsSections = [
    {
      title: 'Acceptance of Terms',
      content:
        'By accessing or using xrpl.to, you affirm that you have read, understood, and agreed to be bound by this Agreement, as well as any additional terms and conditions and policies referenced herein. If you do not agree to this Agreement, you may not access or use xrpl.to.'
    },
    {
      title: 'Modification of Agreement',
      content:
        'We reserve the right to modify, amend, or replace this Agreement at any time, at our sole discretion. Any changes to this Agreement will be effective immediately upon posting the modified version on xrpl.to. It is your responsibility to review this Agreement periodically to ensure that you are aware of any modifications. Your continued use of xrpl.to after the modifications constitutes your acceptance of the updated Agreement.'
    },
    {
      title: 'Use of xrpl.to',
      subsections: [
        {
          subtitle: 'Eligibility',
          text: 'To access and use xrpl.to, you must be at least 18 years old or of legal age in your jurisdiction. By using xrpl.to, you represent and warrant that you meet the eligibility requirements.'
        },
        {
          subtitle: 'Compliance with Applicable Laws',
          text: 'You agree to comply with all applicable laws, regulations, and third-party rights while using xrpl.to. You are solely responsible for ensuring that your use of xrpl.to is in compliance with all applicable laws and regulations.'
        },
        {
          subtitle: 'Account Registration',
          text: 'Certain features of xrpl.to may require you to create an account. However, xrpl.to primarily relies on Web3 login, such as XUMM Wallet, where users do not have to register accounts. When using Web3 login, you will be prompted to connect your XUMM Wallet or other compatible Web3 wallet to access the features of xrpl.to. It is important to note that xrpl.to does not collect or store any account credentials. The authentication and authorization process is handled securely through the Web3 login interface. You are responsible for ensuring the security and confidentiality of your Web3 wallet and for all activities that occur under your account. You agree to take appropriate measures to protect your wallet.'
        }
      ]
    },
    {
      title: 'Intellectual Property Rights',
      subsections: [
        {
          subtitle: 'Ownership',
          text: 'xrpl.to and all associated intellectual property rights are owned by us or our licensors. This Agreement does not grant you any rights to use our trademarks, logos, or other proprietary materials.'
        },
        {
          subtitle: 'License',
          text: 'Subject to your compliance with this Agreement, we grant you a limited, non-exclusive, non-transferable, revocable license to use xrpl.to for personal, non-commercial purposes.'
        },
        {
          subtitle: 'Restrictions',
          text: 'You may not copy, modify, distribute, sell, lease, reverse engineer, or create derivative works based on xrpl.to or any part thereof unless expressly authorized by us in writing.'
        }
      ]
    },
    {
      title: 'Disclaimer of Warranty',
      subsections: [
        {
          subtitle: 'As Is Basis',
          text: 'xrpl.to is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not guarantee that xrpl.to will be uninterrupted, error-free, or secure. Your use of xrpl.to is at your own risk.'
        },
        {
          subtitle: 'Warranty Disclaimer',
          text: 'We disclaim all warranties, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising out of the course of dealing or usage of trade.'
        }
      ]
    },
    {
      title: 'Limitation of Liability',
      subsections: [
        {
          subtitle: 'Damages Limitation',
          text: 'To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or in connection with your use of xrpl.to.'
        },
        {
          subtitle: 'Aggregate Liability',
          text: 'In no event shall our aggregate liability for any claims arising out of or relating to this Agreement or your use of xrpl.to exceed the amount you paid, if any, to us for using xrpl.to.'
        }
      ]
    }
  ];

  const additionalSections = [
    {
      title: 'Indemnification',
      content:
        "You agree to indemnify, defend, and hold harmless xrpl.to and its affiliates, directors, officers, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your breach of this Agreement, your use of xrpl.to, or any violation of applicable laws or third-party rights."
    },
    {
      title: 'Third-Party Websites and Services',
      content:
        'xrpl.to may contain links to third-party websites or services that are not owned or controlled by us. We do not endorse or assume any responsibility for the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any third-party websites or services.'
    },
    {
      title: 'Termination',
      content:
        'We may, at our sole discretion, terminate or suspend your access to xrpl.to without prior notice or liability, for any reason whatsoever, including but not limited to a breach of this Agreement. Upon termination, your right to use xrpl.to will immediately cease, and any provisions of this Agreement that are intended to survive termination shall continue to apply.'
    },
    {
      title: 'Governing Law and Jurisdiction',
      content:
        'This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction]. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of [Jurisdiction].'
    },
    {
      title: 'Severability',
      content:
        'If any provision of this Agreement is held to be invalid, illegal, or unenforceable under any applicable law, such provision shall be deemed modified to the extent necessary to make it valid, legal, and enforceable. If it cannot be so modified, the provision shall be severed from this Agreement, and the remaining provisions shall remain in full force and effect.'
    }
  ];

  const disclaimerSubsections = [
    {
      subtitle: 'Informational Purposes',
      text: 'The content on xrpl.to is strictly for informational purposes only. Nothing on or in the service shall constitute or be construed as an offering of any currency, security, or any financial instrument or as investment advice or investment recommendations. xrpl.to does not provide recommendations as to whether to purchase a currency, security, or instrument or offer investment strategies. The content on this service should not be considered as sufficient information upon which to base an investment strategy. No content on xrpl.to is tailored to the specific needs of any individual, entity, or group of individuals. xrpl.to expresses no opinion as to the future or expected value of any currency, security, or other interest.'
    },
    {
      subtitle: 'No Investment Recommendations',
      text: 'xrpl.to does not explicitly or implicitly recommend or suggest any investment strategy of any kind. The content on the service is not intended to be used as a basis for any financial product or other product without the express prior written consent of xrpl.to.'
    },
    {
      subtitle: 'Use at Your Own Risk',
      text: 'Your use of xrpl.to is at your sole risk. The service is provided on an "as is" and "as available" basis. xrpl.to expressly disclaims all warranties of any kind, whether express, implied, or statutory, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.'
    },
    {
      subtitle: 'No Liability for Loss',
      text: 'xrpl.to shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses resulting from the use of or inability to use the service or from any content posted on the service, whether based on warranty, contract, tort (including negligence), or any other legal theory, and whether or not xrpl.to has been informed of the possibility of such damage, even if a limited remedy set forth herein is found to have failed its essential purpose.'
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
                  background: 'linear-gradient(45deg, #2e7d32, #66bb6a)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Terms and Conditions
              </Typography>
              <Chip
                label="Last updated: May 27, 2023"
                color="success"
                variant="outlined"
                sx={{ fontSize: '1rem', py: 2 }}
              />
            </Box>

            <Grid container spacing={4}>
              {/* Main Terms Sections */}
              {termsSections.map((section, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.primary.main}08)`,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{ fontWeight: 600, color: 'success.main', mb: 3 }}
                      >
                        {section.title}
                      </Typography>
                      {section.content ? (
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {section.content}
                        </Typography>
                      ) : (
                        <Stack spacing={3}>
                          {section.subsections.map((item, itemIndex) => (
                            <Box key={itemIndex}>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}
                              >
                                {item.subtitle}
                              </Typography>
                              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                {item.text}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
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
                        {section.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Disclaimer and Limitation Section */}
              <Grid item xs={12}>
                <Card
                  elevation={3}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.error.main}08)`,
                    border: `1px solid ${theme.palette.warning.main}30`
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'warning.main', mb: 3 }}
                    >
                      Disclaimer and Limitation of Liability
                    </Typography>
                    <Stack spacing={3}>
                      {disclaimerSubsections.map((item, index) => (
                        <Box key={index}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}
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

              {/* Contact Section */}
              <Grid item xs={12}>
                <Card
                  elevation={3}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main' }}
                    >
                      Contact Us
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                      If you have any questions about this Agreement, please contact us at{' '}
                      <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        hello@xrpl.to
                      </Typography>
                    </Typography>
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

export default TermsPage;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  // https://api.xrpl.to/api/banxa/currencies
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    var t1 = performance.now();

    const res = await axios.get(`${BASE_URL}/banxa/currencies`);

    data = res.data;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

    console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
  }
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'Terms of use';
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
