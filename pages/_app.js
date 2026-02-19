import Head from 'next/head';
import React, { memo, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import ThemeProvider from 'src/theme/ThemeProvider';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from 'src/theme/createEmotionCache';
import { ContextProvider, ThemeContext, WalletContext } from 'src/context/AppContext';
import { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import 'src/styles/globals.css';
import { cn } from 'src/utils/cn';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter'
});


// React.lazy — only imports when rendered (no prefetch unlike next/dynamic)
const TransactionAlert = lazy(() => import('src/components/TransactionAlert'));
const Wallet = lazy(() => import('src/components/Wallet'));
const BridgeTracker = lazy(() => import('src/components/BridgeTracker'));
const Chat = lazy(() => import('src/components/Chat'));

// Defer mounting non-critical components until after hydration + idle time
function useDeferredMount(delay = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), delay || 2000);
    return () => clearTimeout(timer);
  }, []);
  return ready;
}

// Move static schema outside component to prevent recreation
const jsonLdSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'xrpl.to',
    description:
      'Real-time XRP Ledger DEX token prices, charts, and trading. Track thousands of XRPL tokens by volume, market cap, and price action.',
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
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'xrpl.to',
    url: 'https://xrpl.to/'
  }
];

const clientSideEmotionCache = createEmotionCache();

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
    <div
      className={cn(
        'fixed left-0 right-0 top-0 z-[9999] h-[3px] transition-opacity duration-200',
        show ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className="h-full bg-primary transition-[width] duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Inline PageLayout component
function AppPageLayout({ children }) {
  const { accountProfile, open } = useContext(WalletContext);
  const router = useRouter();

  // Check if we're on the API docs page
  const isApiDocsPage = router.pathname === '/api-docs';

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Main content with padding for fixed headers */}
      <main
        style={{
          paddingTop: isApiDocsPage ? '0' : '56px'
        }}
      >
        {children}
      </main>
    </div>
  );
}

// Lazy-load Sonner Toaster — it's ~67KB and only needed for toast notifications
const ThemedToaster = dynamic(
  () =>
    import('sonner').then((mod) => {
      const { Toaster } = mod;
      // eslint-disable-next-line react/display-name
      return function ThemedToasterInner(props) {
        const { themeName } = useContext(ThemeContext);
        const isDark = themeName === 'XrplToDarkTheme';
        return (
          <Toaster
            position="top-right"
            closeButton
            duration={4000}
            theme={isDark ? 'dark' : 'light'}
            gap={8}
            visibleToasts={5}
            expand={true}
            richColors
            toastOptions={{
              className: 'sonner-toast-custom'
            }}
          />
        );
      };
    }),
  { ssr: false }
);

function XRPLToApp({ Component, pageProps, router, emotionCache = clientSideEmotionCache }) {
  // Treat MAINTENANCE env as boolean string ("true"/"false")
  const isUnderMaintenance = process.env.MAINTENANCE === 'true';

  // Sonner toast wrapper for backward compatibility
  // Uses message as ID to prevent duplicate toasts
  const openSnackbar = async (msg, variant) => {
    const { toast } = await import('sonner');
    const id = msg;
    switch (variant) {
      case 'success':
        toast.success(msg, { id });
        break;
      case 'error':
        toast.error(msg, { id });
        break;
      case 'warning':
        toast.warning(msg, { id });
        break;
      case 'info':
      default:
        toast.info(msg, { id });
        break;
    }
  };

  // Defer non-critical components until after hydration + idle
  const deferredReady = useDeferredMount();

  // Memoize ogp to prevent unnecessary re-renders
  const ogp = useMemo(() => pageProps.ogp || {}, [pageProps.ogp]);
  const data = pageProps.data;

  // Memoize JSON-LD script content - use page-specific jsonLd if available
  const jsonLdScript = useMemo(() => {
    if (ogp.jsonLd) {
      return JSON.stringify(ogp.jsonLd);
    }
    return JSON.stringify(jsonLdSchema);
  }, [ogp.jsonLd]);

  // Early return for maintenance mode
  if (isUnderMaintenance && router.pathname !== '/status/maintenance') {
    if (typeof window !== 'undefined') {
      router.push('/status/maintenance');
    }
    return null;
  }

  return (
    <CacheProvider value={emotionCache}>
      <div className={inter.variable}>
        <style jsx global>{`
          body {
            font-family:
              var(--font-inter),
              -apple-system,
              BlinkMacSystemFont,
              'Segoe UI',
              sans-serif;
          }
          code,
          .monospace,
          input[type='number'] {
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
            font-variant-numeric: tabular-nums;
          }
        `}</style>
        <Head>
          {/* Preconnect to image CDN for faster loading */}
          <link rel="preconnect" href="https://s1.xrpl.to" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://s1.xrpl.to" />
          <link rel="preconnect" href="https://api.xrpl.to" crossOrigin="anonymous" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content, viewport-fit=cover"
          />
          <meta name="robots" content="index, follow" />
          <meta name="language" content="en" />
          <meta content="xrpl.to" name="author" />
          <meta name="copyright" content="xrpl.to" />
          <meta
            name="google-site-verification"
            content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc"
          />
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="theme-color" content="#147DFE" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
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
          <meta property="og:type" content={ogp.type || 'website'} />
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
            <AppPageLayout>
              <Component {...pageProps} />
            </AppPageLayout>
            {deferredReady && (
              <Suspense fallback={null}>
                <ThemedToaster />
                <TransactionAlert />
                <Wallet />
                <BridgeTracker />
                <Chat />
              </Suspense>
            )}
          </ThemeProvider>
        </ContextProvider>
      </div>
    </CacheProvider>
  );
}

// Report Web Vitals - logs Core Web Vitals metrics to console in dev
export function reportWebVitals(metric) {
  const { id, name, label, value, startTime } = metric;
  const color =
    name === 'CLS'
      ? value > 0.25
        ? '#ef4444'
        : value > 0.1
          ? '#f59e0b'
          : '#22c55e'
      : name === 'LCP'
        ? value > 4000
          ? '#ef4444'
          : value > 2500
            ? '#f59e0b'
            : '#22c55e'
        : name === 'FID' || name === 'INP'
          ? value > 500
            ? '#ef4444'
            : value > 200
              ? '#f59e0b'
              : '#22c55e'
          : name === 'TTFB'
            ? value > 1800
              ? '#ef4444'
              : value > 800
                ? '#f59e0b'
                : '#22c55e'
            : '#3b82f6';

  const unit = name === 'CLS' ? '' : 'ms';
  const displayValue = name === 'CLS' ? value.toFixed(3) : Math.round(value);

  console.log(
    `%c[WebVital] %c${name}%c ${displayValue}${unit} %c(${label})`,
    'color: #6b7280',
    `color: ${color}; font-weight: bold`,
    `color: ${color}`,
    'color: #6b7280; font-size: 11px'
  );

  // Store metrics on window for easy access via DevTools console
  if (typeof window !== 'undefined') {
    window.__WEB_VITALS__ = window.__WEB_VITALS__ || {};
    window.__WEB_VITALS__[name] = { value, rating: color === '#22c55e' ? 'good' : color === '#f59e0b' ? 'needs-improvement' : color === '#ef4444' ? 'poor' : 'info', id, startTime };
  }
}

// Memoize the component to prevent unnecessary re-renders
export default memo(XRPLToApp);
