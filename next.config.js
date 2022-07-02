// const withImages = require('next-images')
// module.exports = withImages()
const isProd = process.env.RUN_ENV === 'production'

console.log(`Production: ${isProd}`)

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//     enabled: process.env.ANALYZE === 'true',
// })
  
// module.exports = withBundleAnalyzer({ })

module.exports = {
    poweredByHeader: false,
    assetPrefix: isProd ? 'https://xrpl.to' : '',
}
