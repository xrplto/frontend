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
        
        {/* Optimize font loading - JetBrains Mono from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
        
        {/* Resource hints for faster loading */}
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