// const withImages = require('next-images');

// const redirects = {
//   async redirects() {
//     return [
//       {
//         source: '/dashboards',
//         destination: '/dashboards/tasks',
//         permanent: true
//       }
//     ];
//   }
// };

// module.exports = withImages(redirects);

/** @type {import('next').NextConfig} */
const nextConfig = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    reactStrictMode: true,
    async redirects() {
        return [
            {
                source: '/dashboards',
                destination: '/dashboards/tasks',
                permanent: true,
            }
        ]
    }
}

module.exports = nextConfig
