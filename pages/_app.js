import Head from 'next/head';
import React, { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import ThemeProvider from 'src/theme/ThemeProvider';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from 'src/theme/createEmotionCache';
import { CssBaseline, styled } from '@mui/material';
import { ContextProvider, AppContext } from 'src/AppContext';
import { useContext, useEffect, useState } from 'react';
import './zMain.css';
import { SnackbarProvider } from 'notistack';
import i18n from 'src/utils/i18n';

// Polyfills for Safari iOS compatibility
if (typeof window !== 'undefined') {
  // Add requestIdleCallback polyfill for Safari
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function (callback, options) {
      const timeout = options?.timeout || 0;
      const startTime = Date.now();
      return setTimeout(function () {
        callback({
          didTimeout: timeout > 0 && Date.now() - startTime > timeout,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - startTime));
          }
        });
      }, 1);
    };
  }

  if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function (id) {
      clearTimeout(id);
    };
  }
}

// Error logging handled by ErrorDebugger component

// Lazy load non-critical components
const XSnackbar = dynamic(() => import('src/components/Snackbar'), {
  ssr: false,
  loading: () => null
});
const TransactionAlert = dynamic(() => import('src/components/TransactionAlert'), {
  ssr: false,
  loading: () => null
});
const PinnedChartTracker = dynamic(() => import('src/components/PinnedChartTracker'), {
  ssr: false,
  loading: () => null
});
const Wallet = dynamic(() => import('src/components/Wallet'), { ssr: false, loading: () => null });
const ErrorDebugger = dynamic(
  () => import('src/components/ErrorDebugger').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null
  }
);

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

const clientSideEmotionCache = createEmotionCache();

// Inline ProgressBar styled components
const ProgressBarContainer = styled('div')(({ theme, show }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  zIndex: 9999,
  opacity: show ? 1 : 0,
  transition: 'opacity 0.2s ease-in-out'
}));

const ProgressBarFill = styled('div')(({ theme, progress }) => ({
  height: '100%',
  backgroundColor: theme.palette.primary.main,
  width: `${progress}%`,
  transition: 'width 0.3s ease-out',
  boxShadow: `0 0 10px ${theme.palette.primary.main}`
}));

// Inline ProgressBar component
function AppProgressBar({ router }) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;

    const handleStart = () => {
      setShow(true);
      setProgress(10);
    };

    const handleComplete = () => {
      setProgress(100);
      timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 200);
    };

    const handleError = () => {
      setProgress(100);
      timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      if (timer) clearTimeout(timer);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router.events]);

  // Simulate progress while loading
  useEffect(() => {
    let interval;
    if (show && progress > 0 && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [show, progress]);

  return (
    <ProgressBarContainer show={show}>
      <ProgressBarFill progress={progress} />
    </ProgressBarContainer>
  );
}

// Inline PageLayout component
function AppPageLayout({ children }) {
  const { accountProfile, open } = useContext(AppContext);
  const router = useRouter();

  // Check if we're on the API docs page
  const isApiDocsPage = router.pathname === '/api-docs';

  return (
    <div>
      {/* Main content with padding for fixed headers */}
      <div
        style={{
          paddingTop: isApiDocsPage ? '0' : '56px',
          marginRight: accountProfile && open ? '350px' : '0',
          transition: 'margin-right 0.3s ease'
        }}
      >
        {children}
      </div>

      {/* Embedded wallet panel - positioned below header */}
      {accountProfile && open && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            right: '0',
            width: '350px',
            height: 'calc(100vh - 48px)',
            zIndex: 1000
          }}
        >
          <Wallet embedded={true} />
        </div>
      )}
    </div>
  );
}

function XRPLToApp({ Component, pageProps, router, emotionCache = clientSideEmotionCache }) {
  // Treat MAINTENANCE env as boolean string ("true"/"false")
  const isUnderMaintenance = process.env.MAINTENANCE === 'true';

  // Inline snackbar hook logic (previously useSnackbar hook)
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [variant, setVariant] = useState('success');

  const openSnackbar = (msg, variant) => {
    setMsg(msg);
    setVariant(variant);
    setIsOpen(true);
  };

  const closeSnackbar = () => {
    setIsOpen(false);
  };

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
    <CacheProvider value={emotionCache}>
      <>
        <Head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
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
          <meta name="theme-color" content="#147DFE" />
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
          <AppProgressBar router={router} />
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
                <AppPageLayout>
                  <Component {...pageProps} />
                </AppPageLayout>
                <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
                <TransactionAlert />
                {typeof window !== 'undefined' && ErrorDebugger && <ErrorDebugger />}
              </PinnedChartTracker>
            </SnackbarProvider>
          </ThemeProvider>
        </ContextProvider>
      </>
    </CacheProvider>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(XRPLToApp);
