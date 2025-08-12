import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect for performance optimization */}
        <link rel="preconnect" href="https://api.xrpnft.com" />
        <link rel="preconnect" href="https://s1.xrpnft.com" />
        <link rel="preconnect" href="https://xrpl.to" />
        <link rel="preconnect" href="https://s1.xrpl.to" />
        <link rel="dns-prefetch" href="https://api.xrpl.to" />
        
        {/* Resource hints for faster loading */}
        <link rel="prefetch" href="/static/empty-folder.png" />
        
        {/* PWA and mobile optimization */}
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        
        {/* Performance optimizations */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}