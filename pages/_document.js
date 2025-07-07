import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Remove or defer Cloudflare Rocket Loader if not needed */}
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://xrpl.to" />
        <link rel="preconnect" href="https://s1.xrpl.to" />
        <link rel="dns-prefetch" href="https://api.xrpl.to" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}