// next.config.js

// 1. Import the Bundle Analyzer plugin
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// 2. (Optional) Import the next-images plugin if you need to handle image imports
// Uncomment the lines below if you want to use next-images
// const withImages = require('next-images');

// 3. Determine if the environment is production
const isProd = process.env.RUN_ENV === 'production'; 

module.exports = withBundleAnalyzer({
  // If you're using next-images, chain the plugins like this:
  // ...withImages({
  
  // Your Next.js configuration
  poweredByHeader: false, // Hides the X-Powered-By header for security and performance
  assetPrefix: isProd ? 'https://xrpl.to' : '', // Sets the asset prefix based on the environment

  // Environment variables accessible on the client-side
  env: {
    API_URL: process.env.API_URL,
    MAINTENANCE: process.env.MAINTENANCE,
  },

  // URL rewrites for cleaner URLs
  async rewrites() {
    return [
      {
        source: '/most-viewed-tokens',
        destination: '/rankings/most-viewed-tokens',
      },
      {
        source: '/best-tokens',
        destination: '/rankings/best-tokens',
      },
      {
        source: '/trending-tokens',
        destination: '/rankings/trending-tokens',
      },
      {
        source: '/gainers-losers',
        destination: '/rankings/gainers-losers',
      },
      {
        source: '/new',
        destination: '/rankings/new',
      },
    ];
  },

  // Performance optimizations
  reactStrictMode: true, // Enables React Strict Mode for highlighting potential problems
  compress: true, // Enables gzip compression for responses
  optimizeFonts: true, // Optimizes font loading
  swcMinify: true, // Uses SWC for faster JavaScript and TypeScript minification

  // (Optional) Additional configurations can be added here
  // If using next-images, uncomment the closing brace below
  // }),
});
