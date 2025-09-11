// const withImages = require('next-images')
// module.exports = withImages()

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

const isProd = process.env.RUN_ENV === 'production';
const isDev = process.env.RUN_ENV === 'development';

const config = {
  poweredByHeader: false,
  assetPrefix: isProd ? 'https://xrpl.to' : undefined,
  env: {
    API_URL: process.env.API_URL,
    MAINTENANCE: process.env.MAINTENANCE,
    RUN_ENV: process.env.RUN_ENV
  },
  // Generate source maps in development for better debugging
  productionBrowserSourceMaps: isDev,
  compiler: {
    // Disable removeConsole as it can cause issues with module resolution
    // removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 90, 100], // Add quality 100 to resolve warning
    minimumCacheTTL: 3600, // 1 hour cache for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's1.xrpl.to',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'xrpl.to',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 's1.xrpnft.com',
        pathname: '/**'
      }
    ]
  },
  async headers() {
    // Disable caching in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate'
            },
            {
              key: 'Pragma',
              value: 'no-cache'
            },
            {
              key: 'Expires',
              value: '0'
            }
          ]
        }
      ];
    }
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      },
      // Immutable assets - 1 year cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Semi-static assets - 1 week cache with revalidation
      {
        source: '/logo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400'
          }
        ]
      },
      {
        source: '/(.*).webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // SSR pages - short cache with revalidation
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59'
          }
        ]
      },
      {
        source: '/token/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59'
          }
        ]
      },
      {
        source: '/trending',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      {
        source: '/gainers/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      {
        source: '/new',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      {
        source: '/most-viewed',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ];
  },
  reactStrictMode: true,
  compress: true,
  experimental: {
    esmExternals: true,
    webpackMemoryOptimizations: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Webpack config - optimized for performance  
  webpack: (config, { isServer, dev }) => {
    // Ensure proper handling of dynamic imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      // Production optimizations only
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
          splitChunks: {
            chunks: 'all',
            maxSize: 244000, // 244KB chunks for optimal loading
            cacheGroups: {
              // Heavy chart libraries separate chunk
              charts: {
                test: /[\\/]node_modules[\\/](lightweight-charts|highcharts|recharts|echarts|apexcharts)[\\/]/,
                name: 'charts',
                priority: 30,
                chunks: 'all',
              },
              // Material-UI separate chunk
              mui: {
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                name: 'mui', 
                priority: 20,
                chunks: 'all',
              },
              // Large vendor libraries
              vendor: {
                test: /[\\/]node_modules[\\/](react|react-dom|axios|lodash)[\\/]/,
                name: 'vendor',
                priority: 10,
                chunks: 'all',
              }
            }
          }
        };
      }
    }
    
    return config;
  }
};

module.exports = withBundleAnalyzer(config);
