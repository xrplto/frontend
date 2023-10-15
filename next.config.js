// const withImages = require('next-images')
// module.exports = withImages()

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//     enabled: process.env.ANALYZE === 'true',
// })
  
// module.exports = withBundleAnalyzer({ })

// const { i18n } = require('./next-i18next.config');
const isProd = process.env.RUN_ENV === 'production'
module.exports = {
	i18n: {
		locales: ['en', 'es'],
		defaultLocale: 'en',
		localeDetection: false,
	  },
	  trailingSlash: true,
    poweredByHeader: false,
    assetPrefix: isProd ? 'https://xrpl.to' : '',
	env: {
		API_URL: process.env.API_URL,
	},
}


