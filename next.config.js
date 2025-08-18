// const withImages = require('next-images')
// module.exports = withImages()

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//     enabled: process.env.ANALYZE === 'true',
// })

// module.exports = withBundleAnalyzer({ })

const isProd = process.env.RUN_ENV === 'production';
module.exports = {
  poweredByHeader: false,
  assetPrefix: isProd ? 'https://xrpl.to' : '',
  env: {
    API_URL: process.env.API_URL,
    MAINTENANCE: process.env.MAINTENANCE
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
        source: '/fonts/:path*',
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
        source: '/logo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400'
          }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/most-viewed-tokens',
        destination: '/rankings/most-viewed-tokens'
      },
      {
        source: '/best-tokens',
        destination: '/rankings/best-tokens'
      },
      {
        source: '/trending-tokens',
        destination: '/rankings/trending-tokens'
      },
      {
        source: '/gainers-losers',
        destination: '/rankings/gainers-losers'
      },
      {
        source: '/new',
        destination: '/rankings/new'
      }
    ];
  },
  // Add performance optimizations
  reactStrictMode: true,
  compress: true,
  // Optimize webpack bundle
  webpack: (config, { isServer }) => {
    // Split chunks more aggressively
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
            test(module) {
              return module.resource && !module.resource.includes('node_modules');
            }
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = require('crypto').createHash('sha256');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true
          },
          mui: {
            name: 'mui',
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            priority: 35,
            reuseExistingChunk: true,
          },
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](highcharts|apexcharts|echarts|recharts)[\\/]/,
            priority: 25,
            reuseExistingChunk: true,
          }
        }
      }
    };
    
    // Reduce initial bundle size
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias
      };
    }
    
    return config;
  }
};
