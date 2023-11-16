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
	env: {
		API_URL: process.env.API_URL,
		MAINTENANCE: process.env.MAINTENANCE,
	},
	async rewrites() {
		return [
			{
				source: '/token-ratings',
				destination: '/rankings/token-ratings',
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
				source: '/most-viewed-pages',
				destination: '/rankings/most-viewed-tokens',
			},
			{
				source: '/new',
				destination: '/rankings/new',
			},
		]
	},
}
