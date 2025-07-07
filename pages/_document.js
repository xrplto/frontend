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
        {/* Move non-critical scripts to the end and defer them */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Defer Cloudflare Rocket Loader if needed
              if (typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  // Load rocket loader after main content
                  setTimeout(() => {
                    const script = document.createElement('script');
                    script.src = '/cloudflare-static/rocket-loader.min.js';
                    script.defer = true;
                    document.body.appendChild(script);
                  }, 3000);
                });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}