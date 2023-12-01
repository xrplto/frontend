import Head from 'next/head';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { ContextProvider } from 'src/AppContext';
import XSnackbar from 'src/components/Snackbar';
import { useSnackbar } from 'src/components/useSnackbar';
import "./zMain.css";

function XRPLToApp({ Component, pageProps, router }) {
  const isUnderMaintenance = process.env.MAINTENANCE; // Set this variable to enable or disable maintenance mode
  const { isOpen, msg, variant, openSnackbar, closeSnackbar } = useSnackbar();

  // Check if we're under maintenance and not already on the maintenance page
  if (isUnderMaintenance && router.pathname !== '/status/maintenance') {
    if (typeof window !== 'undefined') {
      router.push('/status/maintenance');
    }
    return null;
  }

  const ogp = pageProps.ogp || {};
  const data = pageProps.data;

  const jsonLdSchema = {
    "@context": "http://schema.org/",
    "@type": "Organization",
    "name": "xrpl.to",
    "logo": "https://xrpl.to/logo/xrpl-to-logo-white.svg",
    "url": "https://xrpl.to/",
    "sameAs": [
      "https://twitter.com/xrplto",
      "https://www.facebook.com/xrplto",
      "https://www.instagram.com/xrplto",
      "https://www.reddit.com/r/xrplto",
      "https://medium.com/@xrpl.to",
      "https://www.crunchbase.com/organization/xrpl-to",
      "https://www.linkedin.com/company/xrplto/"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "7102 Foster Court",
      "addressRegion": "Sunnyvale",
      "postalCode": "94087",
      "addressCountry": "US"
    }
  };

  return (
    <>
      <Head>
        {/* <!-- HTML Meta Tags --> */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="en" />
        <meta content="xrpl.to" name="author" />
        <meta name="copyright" content="xrpl.to" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        {/* <!-- May result in lower load time fetching from the server directly! --> */}
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Cache-Control" content="no-cache" />
        <meta name="google-site-verification" content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc" />

        <link rel="apple-touch-icon" sizes="192x192" href="/icons/apple-icon.webp" />
        <link rel="icon" type="image/webp" sizes="16x16" href="/icons/favicon-16x16.webp" />
        <link rel="icon" type="image/webp" sizes="32x32" href="/icons/favicon-32x32.webp" />
        <link rel="icon" type="image/webp" sizes="32x32" href="/icons/favicon-96x96.webp" />

        <link rel="manifest" href="/icons/site.webmanifest" />
        {/* <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#121619" /> */}
        <meta name="msapplication-TileColor" content="#121619" />
        <meta name="theme-color" content="#ffffff"/>
        <link rel="shortcut icon" href="/icons/favicon.ico" type="image/x-icon" />
        <link rel="canonical" href={ogp.canonical} />

        {/* Add your JSON-LD schema here */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>

        <title>{ogp.title}</title>
        <meta name="description" content={ogp.desc} />
        <meta property="og:site_name" content="xrpl.to" />

        {/* Facebook Meta Tags */}
        <meta property="og:url" content={ogp.url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${ogp.title} | xrpl.to`} />
        <meta property="og:description" content={ogp.desc} />
        <meta property="og:image" content={ogp.imgUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="315" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary" />
        <meta property="twitter:domain" content="xrpl.to" />
        <meta property="twitter:url" content={ogp.url} />
        <meta name="twitter:title" content={`${ogp.title} | xrpl.to`} />
        <meta name="twitter:description" content={ogp.desc} />
        <meta name="twitter:image" content={ogp.imgUrl} />
        <meta name="twitter:image:src" content={ogp.imgUrl} />
      </Head>
      <noscript>
        {/* <!-- webxtor SEO fix --> */}
        <ContextProvider data={data} openSnackbar={openSnackbar}>
          {/* <!-- <ThemeProvider> --> */}
          {/* <!-- <CssBaseline /> --> */}
          <Component {...pageProps} />
          <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
          {/* <!-- </ThemeProvider> --> */}
        </ContextProvider>
      </noscript>

      <ContextProvider data={data} openSnackbar={openSnackbar}>
        <ThemeProvider>
          <CssBaseline />
          <Component {...pageProps} />
          <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
        </ThemeProvider>
      </ContextProvider>
    </>
  );
}

export default XRPLToApp;
