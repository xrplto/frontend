import React, { useContext } from 'react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

function OGPTestPage({ imageUrls }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <div>
      <div id="back-to-top-anchor" className="h-6" />
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-4">
        <h2 className={cn("mb-4 text-center text-3xl font-normal", isDark ? "text-white" : "text-gray-900")}>
          Open Graph Test Page
        </h2>

        <div className={cn("mb-4 rounded-xl border-[1.5px] p-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
          <h4 className={cn("mb-2 text-xl font-normal", isDark ? "text-white" : "text-gray-900")}>
            OGP Image Gallery
          </h4>
          <p className={cn("mb-3 text-[15px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>
            All 13 Open Graph images for testing social media preview functionality
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {imageUrls.map((url, index) => (
              <div key={index} className={cn("rounded-xl border-[1.5px] p-1", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
                <p className={cn("mb-1 text-[13px] font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Image {index + 1}
                </p>
                <img
                  src={url}
                  alt={`OGP Image ${index + 1}`}
                  className="mb-1 h-[200px] w-full rounded-lg object-cover"
                />
                <p className={cn("block break-all text-[11px] font-normal", isDark ? "text-gray-500" : "text-gray-500")}>
                  {url.split('/').pop()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className={cn("rounded-xl border-[1.5px] p-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
              <h5 className={cn("mb-2 text-lg font-normal", isDark ? "text-white" : "text-gray-900")}>
                Primary OGP Image
              </h5>
              <div className={cn("mb-3 rounded-xl border-[1.5px] p-2", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
                <img
                  src={imageUrls[0]}
                  alt="Primary Open Graph Image"
                  className="h-auto max-h-[400px] w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="inline-flex rounded-lg border-[1.5px] border-primary bg-primary px-3 py-1 text-[13px] font-normal text-white">
                  Primary Image
                </span>
                <span className={cn("inline-flex rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal", isDark ? "border-white/15" : "border-gray-300")}>
                  Dimensions: 1200x630
                </span>
                <span className={cn("inline-flex rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal", isDark ? "border-white/15" : "border-gray-300")}>
                  Format: WEBP
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className={cn("rounded-xl border-[1.5px] p-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
              <h5 className={cn("mb-2 text-lg font-normal", isDark ? "text-white" : "text-gray-900")}>
                Social Media Preview
              </h5>
              <p className={cn("mb-2 text-[13px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>
                This is how your link will appear when shared:
              </p>

              <div className={cn("rounded-xl border-[1.5px] p-2", isDark ? "border-white/10" : "border-gray-200")}>
                <div
                  className="mb-2 h-[150px] w-full rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrls[0]})` }}
                />
                <p className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                  OGP Test Page | xrpl.to
                </p>
                <p className={cn("text-[13px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>
                  Testing Open Graph image display functionality on XRPL.to platform
                </p>
                <p className={cn("text-[11px] font-normal", isDark ? "text-gray-500" : "text-gray-500")}>
                  xrpl.to
                </p>
              </div>
            </div>

            <div className={cn("mt-3 rounded-xl border-[1.5px] p-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white")}>
              <h5 className={cn("mb-2 text-lg font-normal", isDark ? "text-white" : "text-gray-900")}>
                OGP Tags Used
              </h5>
              <div className="flex flex-col gap-1">
                <p className={cn("font-mono text-[13px] font-normal", isDark ? "text-gray-300" : "text-gray-700")}>
                  og:title
                </p>
                <p className={cn("font-mono text-[13px] font-normal", isDark ? "text-gray-300" : "text-gray-700")}>
                  og:description
                </p>
                <p className={cn("font-mono text-[13px] font-normal", isDark ? "text-gray-300" : "text-gray-700")}>
                  og:image
                </p>
                <p className={cn("font-mono text-[13px] font-normal", isDark ? "text-gray-300" : "text-gray-700")}>
                  og:url
                </p>
                <p className={cn("font-mono text-[13px] font-normal", isDark ? "text-gray-300" : "text-gray-700")}>
                  twitter:card
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className={cn("mb-2 text-center text-xl font-normal", isDark ? "text-white" : "text-gray-900")}>
            Test Your OGP Tags
          </h4>
          <p className={cn("text-center text-[15px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>
            You can validate this page's Open Graph tags using tools like Facebook's Sharing
            Debugger or Twitter Card Validator
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default OGPTestPage;

export async function getStaticProps() {
  const imageHashes = [
    'e5f0ebf229d8ecc45501da95d789e495',
    'ba234e3563c6fdf22c8a1724465f3365',
    '61fcbf477da5394b35b47fbf5eab38e6',
    'cd9499746c1b2e041563a9724330b3e6',
    '0413ca7cfc258dfaf698c02fe304e607',
    '3ea807e02dbf5f092d27bde3391adc8a',
    'fe8c16be4b0505d9df97e8cb12758b02'
  ];

  const imageUrls = [
    ...imageHashes.map((hash) => `http://s1.xrpl.to/ogp/${hash}`),
    'https://s1.xrpl.to/ogp/landing.webp',
    'https://s1.xrpl.to/ogp/new.webp',
    'https://s1.xrpl.to/ogp/5m.webp',
    'https://s1.xrpl.to/ogp/1h.webp',
    'https://s1.xrpl.to/ogp/24h.webp',
    'https://s1.xrpl.to/ogp/7d.webp',
    'https://s1.xrpl.to/ogp/news.webp'
  ];

  const ogp = {
    canonical: 'https://xrpl.to/ogp-test',
    title: 'OGP Test Page',
    url: 'https://xrpl.to/ogp-test',
    imgUrl: imageUrls[0],
    imgType: 'image/webp',
    imgWidth: '1200',
    imgHeight: '630',
    imgAlt: 'XRPL.to Open Graph Test Image',
    desc: 'Testing Open Graph image display functionality on XRPL.to platform',
    images: imageUrls.map((url, index) => ({
      url,
      type: 'image/webp',
      width: '1200',
      height: '630',
      alt: `XRPL.to Open Graph Test Image ${index + 1}`
    }))
  };

  return {
    props: {
      ogp,
      imageUrls
    },
    revalidate: 60 // Revalidate every minute for testing
  };
}
