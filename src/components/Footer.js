import React, { useContext } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
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
            color: 'rgb(160, 160, 160) !important',
            '&:hover': {
              color: darkMode ? '#007B55 !important' : '#5569ff !important'
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
              <LazyLoadImage src={img} width={100} height={37} alt="XRPL.to Logo" />
            </Link>
          </Grid>

          <Grid item xs={12} md={7} lg={7} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {[
                {
                  title: 'Products',
                  links: [
                    { href: '/swap', label: 'Token Swap' },
                    { href: '/buy-xrp', label: 'Buy XRP' },
                    { href: 'https://docs.xrpl.to', label: 'Token API' },
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
              ].map((section, index) => (
                <Grid item xs={6} sm={6} md={3} lg={3} key={index} sx={{ mt: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="h2" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {section.title}
                    </Typography>
                    {section.links.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        sx={{ ...linkStyles, mt: idx === 0 ? 1 : 0.75 }}
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
              &copy; 2024 xrpl.to. All rights reserved
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </FooterWrapper>
  );
}

export default Footer;
