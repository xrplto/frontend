#!/usr/bin/env node
/**
 * OG Image Generator for XRPL.to
 * Generates Open Graph images for all static pages
 *
 * Usage: node scripts/generate-og-images.js
 *
 * Requires: npm install satori @resvg/resvg-js
 */

const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

// OG Image dimensions (standard)
const WIDTH = 1200;
const HEIGHT = 630;

// Brand colors
const BRAND_BLUE = '#3f96fe';
const BG_DARK = '#0a0a0a';
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.6)';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/og');

// Page configurations
const PAGES = [
  { slug: 'index', title: 'XRPL.to', subtitle: 'XRP Ledger Token Prices & Analytics', icon: 'chart' },
  { slug: 'trending', title: 'Trending Tokens', subtitle: 'Most popular tokens on XRPL', icon: 'trending' },
  { slug: 'spotlight', title: 'Spotlight', subtitle: 'Featured XRPL tokens', icon: 'star' },
  { slug: 'gainers', title: 'Top Gainers', subtitle: 'Biggest price movers on XRPL', icon: 'rocket' },
  { slug: 'most-viewed', title: 'Most Viewed', subtitle: 'Popular tokens by views', icon: 'eye' },
  { slug: 'new', title: 'New Tokens', subtitle: 'Recently listed on XRPL', icon: 'sparkle' },
  { slug: 'amm-pools', title: 'AMM Pools', subtitle: 'Liquidity pools & APY analytics', icon: 'pool' },
  { slug: 'swap', title: 'Swap', subtitle: 'Trade tokens on XRPL DEX', icon: 'swap' },
  { slug: 'collections', title: 'NFT Collections', subtitle: 'Browse XRPL NFT collections', icon: 'grid' },
  { slug: 'nft-traders', title: 'NFT Traders', subtitle: 'Top NFT traders on XRPL', icon: 'users' },
  { slug: 'watchlist', title: 'Watchlist', subtitle: 'Track your favorite tokens', icon: 'bookmark' },
  { slug: 'news', title: 'News', subtitle: 'Latest XRPL ecosystem updates', icon: 'news' },
  { slug: 'about', title: 'About', subtitle: 'Learn about XRPL.to', icon: 'info' },
  { slug: 'rsi-analysis', title: 'RSI Analysis', subtitle: 'Technical analysis for XRPL tokens', icon: 'chart' },
  { slug: 'launch', title: 'Token Launch', subtitle: 'Launch your token on XRPL', icon: 'rocket' },
  { slug: 'advertise', title: 'Advertise', subtitle: 'Promote on XRPL.to', icon: 'megaphone' },
  { slug: '404', title: 'Page Not Found', subtitle: 'The page you are looking for does not exist', icon: 'alert' },
];

// Icon SVG paths (simplified Lucide-style icons)
const ICONS = {
  chart: '<path d="M3 3v18h18" stroke="currentColor" stroke-width="2" fill="none"/><path d="M18 17V9" stroke="currentColor" stroke-width="2"/><path d="M13 17V5" stroke="currentColor" stroke-width="2"/><path d="M8 17v-3" stroke="currentColor" stroke-width="2"/>',
  trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="16 7 22 7 22 13" stroke="currentColor" stroke-width="2" fill="none"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" stroke-width="2" fill="none"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke="currentColor" stroke-width="2" fill="none"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" stroke="currentColor" stroke-width="2" fill="none"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>',
  sparkle: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" stroke="currentColor" stroke-width="2" fill="none"/>',
  pool: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 12h8" stroke="currentColor" stroke-width="2"/><path d="M12 8v8" stroke="currentColor" stroke-width="2"/>',
  swap: '<path d="M16 3l4 4-4 4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 7H4" stroke="currentColor" stroke-width="2"/><path d="M8 21l-4-4 4-4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4 17h16" stroke="currentColor" stroke-width="2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" fill="none"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" fill="none"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" fill="none"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" stroke-width="2" fill="none"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M18 14h-8" stroke="currentColor" stroke-width="2"/><path d="M15 18h-5" stroke="currentColor" stroke-width="2"/><path d="M10 6h8v4h-8V6Z" stroke="currentColor" stroke-width="2" fill="none"/>',
  info: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 16v-4" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01" stroke="currentColor" stroke-width="2"/>',
  megaphone: '<path d="m3 11 18-5v12L3 13v-2z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" stroke="currentColor" stroke-width="2" fill="none"/>',
  alert: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>',
};

// Load fonts
async function loadFonts() {
  // Use system fonts or download Inter from Google Fonts
  const interRegular = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
  ).then((res) => res.arrayBuffer());

  const interBold = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2'
  ).then((res) => res.arrayBuffer());

  return [
    { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
  ];
}

// Create OG image component (Satori uses JSX-like objects)
function createOGImage(page) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG_DARK,
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(63, 150, 254, 0.15) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(63, 150, 254, 0.1) 0%, transparent 50%)`,
        padding: 60,
        position: 'relative',
      },
      children: [
        // Top border accent
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${BRAND_BLUE}, #65abfe, ${BRAND_BLUE})`,
            },
          },
        },
        // Logo area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            },
            children: [
              // X logo mark (simplified)
              {
                type: 'div',
                props: {
                  style: {
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${BRAND_BLUE}, #65abfe)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 20,
                  },
                  children: {
                    type: 'span',
                    props: {
                      style: {
                        fontSize: 36,
                        fontWeight: 700,
                        color: TEXT_WHITE,
                      },
                      children: 'X',
                    },
                  },
                },
              },
              // XRPL.to text
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: 32,
                    fontWeight: 400,
                    color: TEXT_WHITE,
                    letterSpacing: '-0.02em',
                  },
                  children: 'XRPL.to',
                },
              },
            ],
          },
        },
        // Main title
        {
          type: 'div',
          props: {
            style: {
              fontSize: 72,
              fontWeight: 700,
              color: TEXT_WHITE,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: 900,
            },
            children: page.title,
          },
        },
        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              fontSize: 28,
              color: TEXT_MUTED,
              textAlign: 'center',
              maxWidth: 700,
            },
            children: page.subtitle,
          },
        },
        // Bottom domain
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 40,
              right: 60,
              display: 'flex',
              alignItems: 'center',
            },
            children: [
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: 20,
                    color: BRAND_BLUE,
                  },
                  children: 'xrpl.to',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// Generate SVG and convert to PNG
async function generateImage(page, fonts) {
  const element = createOGImage(page);

  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  });

  return resvg.render().asPng();
}

// Main function
async function main() {
  console.log('OG Image Generator for XRPL.to');
  console.log('================================\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Load fonts
  console.log('Loading fonts...');
  const fonts = await loadFonts();
  console.log('Fonts loaded.\n');

  // Generate images for each page
  console.log('Generating OG images...\n');

  for (const page of PAGES) {
    try {
      const png = await generateImage(page, fonts);
      const outputPath = path.join(OUTPUT_DIR, `${page.slug}.png`);
      fs.writeFileSync(outputPath, png);
      console.log(`  [OK] ${page.slug}.png - ${page.title}`);
    } catch (error) {
      console.error(`  [ERROR] ${page.slug}: ${error.message}`);
    }
  }

  console.log('\n================================');
  console.log(`Generated ${PAGES.length} OG images in ${OUTPUT_DIR}`);
  console.log('\nAdd to your pages:');
  console.log('  <meta property="og:image" content="https://xrpl.to/og/{slug}.png" />');
}

main().catch(console.error);
