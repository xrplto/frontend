import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Critical preconnects for performance */}
        <link rel="preconnect" href="https://api.xrpnft.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://s1.xrpnft.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for additional resources */}
        <link rel="dns-prefetch" href="https://xrpl.to" />
        <link rel="dns-prefetch" href="https://s1.xrpl.to" />
        <link rel="dns-prefetch" href="https://api.xrpl.to" />
        
        
        {/* Critical resource preloading */}
        <link rel="preload" href="/_next/static/css" as="style" />
        <link rel="preload" href="/logo/xrpl-to-logo-white.svg" as="image" type="image/svg+xml" />
        <link rel="prefetch" href="/static/empty-folder.png" as="image" />
        
        {/* PWA and mobile optimization */}
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Performance optimizations */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}