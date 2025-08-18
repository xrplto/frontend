import Head from 'next/head';
import React, { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { ContextProvider } from 'src/AppContext';
import { useSnackbar } from 'src/components/useSnackbar';
import './zMain.css';
import { SnackbarProvider } from 'notistack';
import i18n from 'src/utils/i18n';
import PageLayout from 'src/components/PageLayout';

// Polyfills for Safari iOS compatibility
if (typeof window !== 'undefined') {
  // Add requestIdleCallback polyfill for Safari
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback, options) {
      const timeout = options?.timeout || 0;
      const startTime = Date.now();
      return setTimeout(function() {
        callback({
          didTimeout: timeout > 0 && (Date.now() - startTime) > timeout,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - startTime));
          }
        });
      }, 1);
    };
  }
  
  if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function(id) {
      clearTimeout(id);
    };
  }
}

// Error logging for mobile debugging
if (typeof window !== 'undefined') {
  // Capture and log unhandled errors
  window.addEventListener('error', (e) => {
    const errorInfo = {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error?.stack || (typeof e.error === 'object' ? JSON.stringify(e.error) : e.error),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Log to console for mobile Safari debugging
    console.error('Global Error:', errorInfo);
    
    // Store error in localStorage for later retrieval
    try {
      const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errors.push(errorInfo);
      // Keep only last 10 errors
      if (errors.length > 10) errors.shift();
      localStorage.setItem('errorLogs', JSON.stringify(errors));
    } catch (err) {
      console.error('Failed to log error to localStorage:', err);
    }
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    const errorInfo = {
      type: 'unhandledrejection',
      reason: typeof e.reason === 'object' ? JSON.stringify(e.reason) : (e.reason?.toString() || e.reason),
      stack: e.reason?.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.error('Unhandled Rejection:', errorInfo);
    
    try {
      const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errors.push(errorInfo);
      if (errors.length > 10) errors.shift();
      localStorage.setItem('errorLogs', JSON.stringify(errors));
    } catch (err) {
      console.error('Failed to log rejection to localStorage:', err);
    }
  });
}

// Lazy load non-critical components
const XSnackbar = dynamic(() => import('src/components/Snackbar'), { ssr: false });
const TransactionAlert = dynamic(() => import('src/components/TransactionAlert'), { ssr: false });
const NextNProgress = dynamic(() => import('nextjs-progressbar'), { ssr: false });
const PinnedChartTracker = dynamic(() => import('src/components/PinnedChartTracker'), { ssr: false });
const Wallet = dynamic(() => import('src/components/Wallet'), { ssr: false });
const ErrorDebugger = dynamic(() => import('src/components/ErrorDebugger').catch(() => null), { 
  ssr: false,
  loading: () => null 
});

// Move static schema outside component to prevent recreation
const jsonLdSchema = {
  '@context': 'http://schema.org/',
  '@type': 'Organization',
  name: 'xrpl.to',
  logo: 'https://xrpl.to/logo/xrpl-to-logo-white.svg',
  url: 'https://xrpl.to/',
  sameAs: [
    'https://twitter.com/xrplto',
    'https://www.facebook.com/xrplto',
    'https://www.instagram.com/xrplto',
    'https://www.reddit.com/r/xrplto',
    'https://medium.com/@xrpl.to',
    'https://www.crunchbase.com/organization/xrpl-to',
    'https://www.linkedin.com/company/xrplto/'
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '7102 Foster Court',
    addressRegion: 'Sunnyvale',
    postalCode: '94087',
    addressCountry: 'US'
  }
};

function XRPLToApp({ Component, pageProps, router }) {
  const isUnderMaintenance = process.env.MAINTENANCE;
  const { isOpen, msg, variant, openSnackbar, closeSnackbar } = useSnackbar();

  // Memoize ogp to prevent unnecessary re-renders
  const ogp = useMemo(() => pageProps.ogp || {}, [pageProps.ogp]);
  const data = pageProps.data;

  // Memoize JSON-LD script content
  const jsonLdScript = useMemo(() => JSON.stringify(jsonLdSchema), []);

  // Early return for maintenance mode
  if (isUnderMaintenance && router.pathname !== '/status/maintenance') {
    if (typeof window !== 'undefined') {
      router.push('/status/maintenance');
    }
    return null;
  }

  return (
    <>
      <Head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="en" />
        <meta content="xrpl.to" name="author" />
        <meta name="copyright" content="xrpl.to" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Cache-Control" content="no-cache" />
        <meta
          name="google-site-verification"
          content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc"
        />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" type="image/webp" sizes="32x32" href="/icons/favicon-32x32.webp" />
        <link rel="icon" type="image/webp" sizes="16x16" href="/icons/favicon-16x16.webp" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="/icons/favicon.ico" type="image/x-icon" />
        <link rel="canonical" href={ogp.canonical} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />

        <title>{ogp.title}</title>
        <meta name="description" content={ogp.desc} />
        <meta property="og:site_name" content="xrpl.to" />

        {/* Facebook Meta Tags */}
        <meta property="og:url" content={ogp.url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${ogp.title} | xrpl.to`} />
        <meta property="og:description" content={ogp.desc} />
        <meta property="og:image" content={ogp.imgUrl} />
        <meta property="og:image:type" content={ogp.imgType || 'image/png'} />
        <meta property="og:image:width" content={ogp.imgWidth || '1200'} />
        <meta property="og:image:height" content={ogp.imgHeight || '630'} />
        {ogp.imgAlt && <meta property="og:image:alt" content={ogp.imgAlt} />}

        {/* Additional Open Graph images for better fallback support */}
        {ogp.images &&
          ogp.images.slice(1).map((img, index) => (
            <React.Fragment key={img.url}>
              <meta property="og:image" content={img.url} />
              <meta property="og:image:type" content={img.type} />
              <meta property="og:image:width" content={img.width} />
              <meta property="og:image:height" content={img.height} />
              {img.alt && <meta property="og:image:alt" content={img.alt} />}
            </React.Fragment>
          ))}

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="xrpl.to" />
        <meta property="twitter:url" content={ogp.url} />
        <meta name="twitter:title" content={`${ogp.title} | xrpl.to`} />
        <meta name="twitter:description" content={ogp.desc} />
        <meta name="twitter:image" content={ogp.imgUrl} />
      </Head>

      <ContextProvider data={data} openSnackbar={openSnackbar}>
        <NextNProgress />
        <ThemeProvider>
          <SnackbarProvider
            maxSnack={2}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
          >
            <PinnedChartTracker>
              <CssBaseline />
              <PageLayout>
                <Component {...pageProps} />
              </PageLayout>
              <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
              <TransactionAlert />
              {typeof window !== 'undefined' && ErrorDebugger && <ErrorDebugger />}
            </PinnedChartTracker>
          </SnackbarProvider>
        </ThemeProvider>
      </ContextProvider>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(XRPLToApp);
