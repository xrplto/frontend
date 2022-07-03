// const withImages = require('next-images')
// module.exports = withImages()

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//     enabled: process.env.ANALYZE === 'true',
// })
  
// module.exports = withBundleAnalyzer({ })

const isProd = process.env.RUN_ENV === 'production'
module.exports = {
    poweredByHeader: false,
    assetPrefix: isProd ? 'https://xrpl.to' : '',
}
