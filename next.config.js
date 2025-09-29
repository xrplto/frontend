// const withImages = require('next-images')
// module.exports = withImages()

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

// Support RUN_ENV while falling back to NODE_ENV for safety
const isProd = process.env.RUN_ENV
  ? process.env.RUN_ENV === 'production'
  : process.env.NODE_ENV === 'production';
const isDev = process.env.RUN_ENV
  ? process.env.RUN_ENV === 'development'
  : process.env.NODE_ENV !== 'production';

const config = {
  poweredByHeader: false,
  assetPrefix: isProd ? 'https://xrpl.to' : undefined,
  outputFileTracingRoot: __dirname,
  env: {
    API_URL: process.env.API_URL,
    MAINTENANCE: process.env.MAINTENANCE,
    RUN_ENV: process.env.RUN_ENV
  },
  // Only generate production source maps when explicitly enabled elsewhere
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    unoptimized: false,
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
    webpackMemoryOptimizations: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/lab',
      '@mui/system',
      '@mui/utils',
      'date-fns',
      'react-redux',
      '@reduxjs/toolkit',
      'axios',
      'xrpl',
      'echarts',
      'lightweight-charts'
    ]
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
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
        fs: false
      };

      // Production optimizations only
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
          usedExports: true,
          sideEffects: false,
          splitChunks: {
            chunks: 'all',
            maxSize: 100000, // 100KB chunks for better loading
            minSize: 20000,
            maxAsyncRequests: 30,
            maxInitialRequests: 25,
            automaticNameDelimiter: '-',
            cacheGroups: {
              // Default cache group
              default: false,
              defaultVendors: false,
              // Core framework libs - highest priority
              framework: {
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                name: 'framework',
                priority: 50,
                chunks: 'all',
                reuseExistingChunk: true
              },
              // Next.js internals
              nextjs: {
                test: /[\\/]node_modules[\\/](next|styled-jsx)[\\/]/,
                name: 'nextjs',
                priority: 45,
                chunks: 'all'
              },
              // Heavy chart libraries - split and lazy load
              lightweightCharts: {
                test: /[\\/]node_modules[\\/]lightweight-charts[\\/]/,
                name: 'lightweight-charts',
                priority: 42,
                chunks: 'async',
                enforce: true
              },
              echarts: {
                test: /[\\/]node_modules[\\/](echarts|echarts-for-react|zrender)[\\/]/,
                name: 'echarts',
                priority: 41,
                chunks: 'async',
                enforce: true
              },
              // Material-UI core
              muiCore: {
                test: /[\\/]node_modules[\\/]@mui[\\/](material|system|private-theming|styled-engine)[\\/]/,
                name: 'mui-core',
                priority: 35,
                chunks: 'all'
              },
              // Material-UI icons - lazy load
              muiIcons: {
                test: /[\\/]node_modules[\\/]@mui[\\/]icons-material[\\/]/,
                name: 'mui-icons',
                priority: 34,
                chunks: 'async',
                enforce: true
              },
              // Material-UI utilities
              muiUtils: {
                test: /[\\/]node_modules[\\/]@mui[\\/](utils|base|lab|x-[^/]+)[\\/]/,
                name: 'mui-utils',
                priority: 33,
                chunks: 'async'
              },
              // Emotion styling
              emotion: {
                test: /[\\/]node_modules[\\/]@emotion[\\/]/,
                name: 'emotion',
                priority: 32,
                chunks: 'all'
              },
              // Redux and state management
              redux: {
                test: /[\\/]node_modules[\\/](@reduxjs[\\/]toolkit|react-redux|redux|redux-persist|immer)[\\/]/,
                name: 'redux',
                priority: 30,
                chunks: 'all'
              },
              // XRPL blockchain libs - lazy load
              xrpl: {
                test: /[\\/]node_modules[\\/](xrpl|ripple-[^/]+)[\\/]/,
                name: 'xrpl',
                priority: 28,
                chunks: 'async',
                enforce: true
              },
              // Real-time communication - lazy load
              realtime: {
                test: /[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|react-use-websocket)[\\/]/,
                name: 'realtime',
                priority: 27,
                chunks: 'async',
                enforce: true
              },
              // Swiper - lazy load
              swiper: {
                test: /[\\/]node_modules[\\/]swiper[\\/]/,
                name: 'swiper',
                priority: 26,
                chunks: 'async',
                enforce: true
              },
              // Date utilities
              dateUtils: {
                test: /[\\/]node_modules[\\/]date-fns[\\/]/,
                name: 'date-utils',
                priority: 25,
                chunks: 'async'
              },
              // Crypto and auth - lazy load
              crypto: {
                test: /[\\/]node_modules[\\/](crypto-js|@simplewebauthn|scrypt-js)[\\/]/,
                name: 'crypto',
                priority: 24,
                chunks: 'async',
                enforce: true
              },
              // Axios and HTTP
              http: {
                test: /[\\/]node_modules[\\/](axios|follow-redirects)[\\/]/,
                name: 'http',
                priority: 23,
                chunks: 'all'
              },
              // Polyfills
              polyfills: {
                test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|whatwg-fetch)[\\/]/,
                name: 'polyfills',
                priority: 22,
                chunks: 'all'
              },
              // Other utilities
              utilities: {
                test: /[\\/]node_modules[\\/](decimal\.js-light|lru-cache|prop-types)[\\/]/,
                name: 'utilities',
                priority: 21,
                chunks: 'async'
              },
              // React ecosystem
              reactEcosystem: {
                test: /[\\/]node_modules[\\/](react-[^/]+|use-[^/]+|@tanstack)[\\/]/,
                name: 'react-ecosystem',
                priority: 20,
                chunks: 'async'
              },
              // Remaining vendor code
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                priority: 10,
                chunks: 'all',
                reuseExistingChunk: true
              },
              // Common code shared between pages
              common: {
                name: 'common',
                minChunks: 2,
                priority: 5,
                chunks: 'initial',
                reuseExistingChunk: true
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
