import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Critical preconnects for performance */}
        <link rel="preconnect" href="https://api.xrpnft.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://s1.xrpnft.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for additional resources */}
        <link rel="dns-prefetch" href="https://xrpl.to" />
        <link rel="dns-prefetch" href="https://s1.xrpl.to" />
        <link rel="dns-prefetch" href="https://api.xrpl.to" />
        
        {/* Optimize font loading */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
          media="print"
          onLoad="this.media='all'"
        />
        <noscript>
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
            rel="stylesheet"
          />
        </noscript>
        
        {/* Resource hints for faster loading */}
        <link rel="prefetch" href="/static/empty-folder.png" as="image" />
        
        {/* PWA and mobile optimization */}
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Performance optimizations */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Improve LCP with font preload */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 400 700;
              font-display: swap;
              src: local('Inter'), url('/fonts/inter.woff2') format('woff2');
            }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}