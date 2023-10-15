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
import { useRouter } from "next/router";

function Footer() {
  const { darkMode } = useContext(AppContext);

  const img_black = "/logo/xrpl-to-logo-black.svg";
  const img_white = "/logo/xrpl-to-logo-white.svg";

  const img = darkMode ? img_white : img_black;
  const router = useRouter();
 

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
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>
                    {/* Products */}
                    {router.locale === 'en' ? 'Products' : router.locale === 'es' ? 'Productos' : 'Products'}
                    </Typography>
                  <Link
                    href="https://xrpscan.com/"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Explore XRP Ledger */}
                    {router.locale === 'en' ? 'Explore XRP Ledger' : router.locale === 'es' ? 'Explorar el libro mayor XRP' : 'Explore XRP Ledger'}
                    </Typography>
                  </Link>
                  <Link
                    href="/swap"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    // target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Token Swap */}
                    {router.locale === 'en' ? 'Token Swap' : router.locale === 'es' ? 'Intercambio de tokens' : 'Token Swap'}
                    </Typography>
                  </Link>
                  <Link
                    href="/buy-xrp"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    // target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Buy XRP */}
                    {router.locale === 'en' ? 'Buy XRP' : router.locale === 'es' ? 'Comprar XRP' : 'Buy XRP'}
                    </Typography>
                  </Link>
                  <Link
                    href="https://docs.xrpl.to"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Token API */}
                    {router.locale === 'en' ? 'Token API' : router.locale === 'es' ? 'API de tokens' : 'Token API'}
                    </Typography>
                  </Link>

                  <Link
                    href="/sitemap/token"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Sitemap */}
                    {router.locale === 'en' ? 'Sitemap' : router.locale === 'es' ? 'Mapa del sitio' : 'Sitemap'}
                    </Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>
                  {/* Company */}
                    {router.locale === 'en' ? 'Company' : router.locale === 'es' ? 'Compañía' : 'Company'}
                  </Typography>
                  <Link
                    href="/about"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* About us */}
                    {router.locale === 'en' ? 'About us' : router.locale === 'es' ? 'Sobre nosotros' : 'About us'}
                    </Typography>
                  </Link>
                  <Link
                    href="/terms"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Terms of use */}
                    {router.locale === 'en' ? 'Terms of use' : router.locale === 'es' ? 'Condiciones de uso' : 'Terms of use'}
                    </Typography>
                  </Link>
                  <Link
                    href="/privacy"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Privacy Policy */}
                    {router.locale === 'en' ? 'Privacy Policy' : router.locale === 'es' ? 'política de privacidad' : 'Privacy Policy'}
                    </Typography>
                  </Link>
                  <Link
                    href="/rules"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Community Rules */}
                    {router.locale === 'en' ? 'Community Rules' : router.locale === 'es' ? 'Reglas de la comunidad' : 'Community Rules'}
                    </Typography>
                  </Link>
                  <Link
                    href="/disclaimer"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Disclaimer */}
                    {router.locale === 'en' ? 'Disclaimer' : router.locale === 'es' ? 'Descargo de responsabilidad' : 'Disclaimer'}
                    </Typography>
                  </Link>
                  <Link
                    href="/approach"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Approach */}
                    {router.locale === 'en' ? 'Approach' : router.locale === 'es' ? 'Acercarse' : 'Approach'}
                    </Typography>
                  </Link>
                  <Link
                    href="/careers"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Careers */}
                    {router.locale === 'en' ? 'Careers' : router.locale === 'es' ? 'Carreras' : 'Careers'}
                    </Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>
                  {/* Support */}
                    {router.locale === 'en' ? 'Support' : router.locale === 'es' ? 'Apoyo' : 'Support'}
                  </Typography>
                  <Link
                    href="https://hmc0r1fnxt5.typeform.com/to/jd3HUclQ"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Request Form */}
                    {router.locale === 'en' ? 'Request Form' : router.locale === 'es' ? 'Request Form' : 'Request Form'}
                    </Typography>
                  </Link>
                  <Link
                    href="https://hmc0r1fnxt5.typeform.com/to/jd3HUclQ"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Contact Support */}
                    {router.locale === 'en' ? 'Contact Support' : router.locale === 'es' ? 'Soporte de contacto' : 'Contact Support'}
                    </Typography>
                  </Link>
                  <Link
                    href="/faq"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* FAQ */}
                    {router.locale === 'en' ? 'FAQ' : router.locale === 'es' ? 'FAQ' : 'FAQ'}
                    </Typography>
                  </Link>
                  <Link
                    href="/glossary"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Glossary */}
                    {router.locale === 'en' ? 'Glossary' : router.locale === 'es' ? 'Glosario' : 'Glossary'}
                    </Typography>
                  </Link>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                <Stack>
                  <Typography variant='h2' sx={{ fontWeight: 600 }}>
                  {/* Socials */}
                    {router.locale === 'en' ? 'Socials' : router.locale === 'es' ? 'Socials' : 'Socials'}
                  </Typography>

                  <Link
                    href="https://twitter.com/xrplto"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Twitter */}
                    {router.locale === 'en' ? 'Twitter' : router.locale === 'es' ? 'Gorjeo' : 'Twitter'}
                    </Typography>
                  </Link>
                  
                  <Link
                    href="https://www.facebook.com/xrpl.to/"
                    sx={{ mt: 2, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Facebook */}
                    {router.locale === 'en' ? 'Facebook' : router.locale === 'es' ? 'Facebook' : 'Facebook'}
                    </Typography>
                  </Link>
                  <Link
                    href="https://t.me/xrplto/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Telegram */}
                    {router.locale === 'en' ? 'Telegram' : router.locale === 'es' ? 'Telegrama' : 'Telegram'}
                    </Typography>
                  </Link>
                  
                  <Link
                    href="https://www.reddit.com/r/xrplto/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                    >
                    <Typography variant='link'>
                    {/* Reddit */}
                    {router.locale === 'en' ? 'Reddit' : router.locale === 'es' ? 'Reddit' : 'Reddit'}
                    </Typography>
                  </Link>
                  <Link
                    href="https://xrpl.to/discord/"
                    sx={{ mt: 1.5, display: 'inline-flex' }}
                    underline="none"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Typography variant='link'>
                    {/* Discord */}
                    {router.locale === 'en' ? 'Discord' : router.locale === 'es' ? 'Discordia' : 'Discord'}
                    </Typography>
                  </Link>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ mt: 3 }}>
                        <Typography textAlign="left" variant="subtitle1">
                        &copy; {/* &copy; 2023 XRPL.to. All rights reserved */}
                    {router.locale === 'en' ? '2023 XRPL.to. All rights reserved' : router.locale === 'es' ? '2023 XRPL.a. Reservados todos los derechos' : '2023 XRPL.to. All rights reserved'}
                        </Typography>
                    </Grid>
        </Grid>
      </Container>
    </FooterWrapper>
  );
}

export default Footer;
