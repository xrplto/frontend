// const withImages = require('next-images')
// module.exports = withImages()
const isProd = process.env.NODE_ENV === 'production'

module.exports = {
    poweredByHeader: false,
    assetPrefix: isProd ? 'https://xrpl.to' : '',
}
