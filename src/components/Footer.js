import React, { useContext } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { alpha, Box, Container, Grid, Link, Stack, styled, Typography } from '@mui/material';
import { AppContext } from 'src/AppContext';

const FooterWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
  `
);

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(1)};
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
  `
);

function Footer() {
  const { darkMode } = useContext(AppContext);

  const img_black = "/logo/xrpl-to-logo-black.svg";
  const img_white = "/logo/xrpl-to-logo-white.svg";

  const img = darkMode ? img_white : img_black;
 

  return (
    <FooterWrapper>
      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          mb: 8,
          '& .MuiLink-root': {
            color: 'rgb(160, 160, 160) !important',
            '&:hover': {
              color: darkMode ? '#007B55 !important  ' : '#5569ff !important',
            },
          },
        }}
      >
        <Grid container>
          <Grid item xs={12} md={5} lg={5} sx={{ mt: 3 }}>
            <Link
              href="/"
              sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }}
              underline="none"
              rel="noreferrer noopener nofollow"
            >
              <LazyLoadImage src={img} width={125} height={46} alt="XRPL.to Logo" />
            </Link>
          </Grid>

          <Grid item xs={12} md={7} lg={7} sx={{ mt: 3 }}>
            <Grid container>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>Products</Typography>
                  <Link
                    href="https://xrpscan.com/"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Explore XRP Ledger</Typography>
                  </Link>
                  <Link
                    href="/swap"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    // target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Token Swap</Typography>
                  </Link>
                  <Link
                    href="/buy-xrp"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    // target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Buy XRP</Typography>
                  </Link>
                  <Link
                    href="https://docs.xrpl.to"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Token API</Typography>
                  </Link>

                  <Link
                    href="/sitemap/token"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Sitemap</Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>Company</Typography>
                  <Link
                    href="/about"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>About us</Typography>
                  </Link>
                  <Link
                    href="/terms"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Terms of use</Typography>
                  </Link>
                  <Link
                    href="/privacy"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Privacy Policy</Typography>
                  </Link>
                  <Link
                    href="/rules"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Community Rules</Typography>
                  </Link>
                  <Link
                    href="/disclaimer"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Disclaimer</Typography>
                  </Link>
                  <Link
                    href="/approach"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Approach</Typography>
                  </Link>
                  <Link
                    href="/careers"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Careers</Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>Support</Typography>
                  <Link
                    href="https://hmc0r1fnxt5.typeform.com/to/jd3HUclQ"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Request Form</Typography>
                  </Link>
                  <Link
                    href="https://hmc0r1fnxt5.typeform.com/to/jd3HUclQ"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Contact Support</Typography>
                  </Link>
                  <Link
                    href="/faq"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>FAQ</Typography>
                  </Link>
                  <Link
                    href="/glossary"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Glossary</Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>Socials</Typography>

                  <Link
                    href="https://twitter.com/xrplto"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Twitter</Typography>
                  </Link>
                  
                  <Link
                    href="https://www.facebook.com/xrpl.to/"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Facebook</Typography>
                  </Link>
                  <Link
                    href="https://t.me/xrplto/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Telegram</Typography>
                  </Link>
                  
                  <Link
                    href="https://www.reddit.com/r/xrplto/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Reddit</Typography>
                  </Link>
                  <Link
                    href="https://xrpl.to/discord/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>Discord</Typography>
                  </Link>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ mt: 3 }}>
                        <Typography textAlign="left" variant="subtitle1">
                            &copy; 2023 XRPL.to. All rights reserved
                        </Typography>
                    </Grid>
        </Grid>
      </Container>
    </FooterWrapper>
  );
}

export default Footer;
