import React, { useContext } from 'react';
import Image from 'next/image';
import { alpha, Box, Container, Grid, Link, Stack, styled, Typography } from '@mui/material';
import { AppContext } from 'src/AppContext';

const FooterWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing(1)};
  `
);

function Footer() {
  const { darkMode } = useContext(AppContext);
  const img = darkMode ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';

  const linkStyles = {
    mt: 0.75,
    display: 'inline-flex',
    underline: 'none',
    target: '_blank',
    rel: 'noreferrer noopener'
  };

  return (
    <FooterWrapper>
      <Container
        maxWidth="xl"
        sx={{
          mt: 2,
          mb: 4,
          '& .MuiLink-root': {
            color: darkMode ? 'rgb(189, 189, 189) !important' : 'rgb(97, 97, 97) !important',
            '&:hover': {
              color: darkMode ? '#00C853 !important' : '#3949AB !important'
            }
          }
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={5} lg={5} sx={{ mt: 1 }}>
            <Link
              href="/"
              sx={{ pl: 0, pr: 0, py: 2 }}
              underline="none"
              rel="noreferrer noopener nofollow"
            >
              <Image src={img} width={100} height={37} alt="XRPL.to Logo" priority />
            </Link>
          </Grid>

          <Grid item xs={12} md={7} lg={7} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {[
                {
                  title: 'Products',
                  links: [
                    { href: '/swap', label: 'Token Swap' },
                    { href: '/market-metrics', label: 'Market Metrics' },
                    { href: '/top-traders', label: 'Top Traders' },
                    { href: '/api-docs', label: 'Token API' },
                    { href: '/sitemap/tokens', label: 'Sitemap' }
                  ]
                },
                {
                  title: 'Company',
                  links: [
                    { href: '/about', label: 'About us' },
                    { href: '/terms', label: 'Terms of use' },
                    { href: '/privacy', label: 'Privacy Policy' },
                    { href: '/disclaimer', label: 'Disclaimer' }
                  ]
                },
                {
                  title: 'Support',
                  links: [
                    { href: 'https://hmc0r1fnxt5.typeform.com/to/jd3HUclQ', label: 'Request Form' },
                    { href: '/faq', label: 'FAQ' }
                  ]
                },
                {
                  title: 'Socials',
                  links: [
                    { href: 'https://twitter.com/xrplto', label: 'Twitter' },
                    { href: 'https://www.facebook.com/xrpl.to/', label: 'Facebook' },
                    { href: 'https://t.me/xrplto/', label: 'Telegram' },
                    { href: 'https://www.reddit.com/r/xrplto/', label: 'Reddit' },
                    { href: 'https://xrpl.to/discord/', label: 'Discord' }
                  ]
                }
              ].map((section) => (
                <Grid item xs={6} sm={6} md={3} lg={3} key={section.title} sx={{ mt: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="h2" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {section.title}
                    </Typography>
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        sx={{ ...linkStyles, mt: link === section.links[0] ? 1 : 0.75 }}
                      >
                        <Typography variant="link" sx={{ fontSize: '0.9rem' }}>
                          {link.label}
                        </Typography>
                      </Link>
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography textAlign="left" variant="subtitle1" sx={{ fontSize: '0.85rem' }}>
              &copy; 2025 xrpl.to. All rights reserved
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </FooterWrapper>
  );
}

export default Footer;
