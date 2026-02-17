#!/usr/bin/env node
/**
 * OG Image Generator for XRPL.to
 * Generates Open Graph images for all static pages and tokens
 *
 * Design: Modern, clean, perfectly symmetrical
 * - Subtle radial gradient background (dark navy → black)
 * - Top accent gradient bar (brand blue → cyan)
 * - Centered vertical layout with generous whitespace
 * - WebP output for optimal file size
 *
 * Usage:
 *   node scripts/generate-og-images.js          # Generate static pages only
 *   node scripts/generate-og-images.js --tokens # Generate all token OG images
 *
 * Requires: npm install satori @resvg/resvg-js sharp
 */

const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

// OG Image dimensions (standard)
const WIDTH = 1200;
const HEIGHT = 630;

// Brand colors
const BRAND_BLUE = '#3f96fe';
const BRAND_CYAN = '#38bdf8';
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.5)';
const TEXT_SUBTLE = 'rgba(255, 255, 255, 0.25)';

// API base
const API_BASE = 'https://api.xrpl.to/v1';

// Output directories
const OUTPUT_DIR = path.join(__dirname, '../public/og');
const TOKEN_OUTPUT_DIR = path.join(__dirname, '../public/og/token');

// Logo path
const LOGO_PATH = path.join(__dirname, '../public/logo/xrpl-to-logo-white.svg');

// Check flags
const GENERATE_TOKENS = process.argv.includes('--tokens');
const TEST_MODE = process.argv.includes('--test');

// Fetch token image and convert to PNG base64
async function fetchTokenImage(md5) {
  try {
    const url = `https://s1.xrpl.to/token/${md5}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const pngBuffer = await sharp(Buffer.from(buffer))
      .resize(300, 300, { fit: 'cover' })
      .png()
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (error) {
    console.log(`    Warning: Could not fetch token image for ${md5}`);
    return null;
  }
}

// Page configurations
const PAGES = [
  {
    slug: 'index',
    title: 'XRPL.to',
    subtitle: 'XRP Ledger Token Prices & Analytics',
    icon: 'chart'
  },
  {
    slug: 'trending',
    title: 'Trending Tokens',
    subtitle: 'Most popular tokens on XRPL',
    icon: 'trending'
  },
  { slug: 'spotlight', title: 'Spotlight', subtitle: 'Featured XRPL tokens', icon: 'star' },
  {
    slug: 'gainers',
    title: 'Top Gainers',
    subtitle: 'Biggest price movers on XRPL',
    icon: 'rocket'
  },
  { slug: 'most-viewed', title: 'Most Viewed', subtitle: 'Popular tokens by views', icon: 'eye' },
  { slug: 'new', title: 'New Tokens', subtitle: 'Recently listed on XRPL', icon: 'sparkle' },
  {
    slug: 'amm-pools',
    title: 'AMM Pools',
    subtitle: 'Liquidity pools & APY analytics',
    icon: 'pool'
  },
  { slug: 'swap', title: 'Swap', subtitle: 'Trade tokens on XRPL DEX', icon: 'swap' },
  {
    slug: 'collections',
    title: 'NFT Collections',
    subtitle: 'Browse XRPL NFT collections',
    icon: 'grid'
  },
  { slug: 'nft-traders', title: 'NFT Traders', subtitle: 'Top NFT traders on XRPL', icon: 'users' },
  {
    slug: 'watchlist',
    title: 'Watchlist',
    subtitle: 'Track your favorite tokens',
    icon: 'bookmark'
  },
  { slug: 'news', title: 'News', subtitle: 'Latest XRPL ecosystem updates', icon: 'news' },
  { slug: 'about', title: 'About', subtitle: 'Learn about XRPL.to', icon: 'info' },
  {
    slug: 'rsi-analysis',
    title: 'RSI Analysis',
    subtitle: 'Technical analysis for XRPL tokens',
    icon: 'chart'
  },
  { slug: 'launch', title: 'Token Launch', subtitle: 'Launch your token on XRPL', icon: 'rocket' },
  { slug: 'advertise', title: 'Advertise', subtitle: 'Promote on XRPL.to', icon: 'megaphone' },
  {
    slug: '404',
    title: 'Page Not Found',
    subtitle: 'The page you are looking for does not exist',
    icon: 'alert'
  },
  { slug: 'dashboard', title: 'Dashboard', subtitle: 'Your portfolio overview', icon: 'dashboard' },
  { slug: 'docs', title: 'API Docs', subtitle: 'XRPL.to API reference', icon: 'doc' },
  { slug: 'wallet', title: 'Wallet', subtitle: 'Manage your XRPL wallet', icon: 'wallet' },
  { slug: 'bridge', title: 'Bridge', subtitle: 'Cross-chain token bridge', icon: 'bridge' },
  { slug: 'ledger', title: 'Ledger', subtitle: 'XRPL ledger explorer', icon: 'ledger' },
  { slug: 'nft-market', title: 'NFT Market', subtitle: 'XRPL NFT market analytics', icon: 'grid' },
  {
    slug: 'token-market',
    title: 'Token Market',
    subtitle: 'XRPL token market analytics',
    icon: 'chart'
  },
  {
    slug: 'token-traders',
    title: 'Token Traders',
    subtitle: 'Top token traders on XRPL',
    icon: 'users'
  },
  { slug: 'mpt', title: 'MPT Tokens', subtitle: 'Multi-Purpose Tokens on XRPL', icon: 'token' },
  { slug: 'scams', title: 'Scam Alerts', subtitle: 'Report & track XRPL scams', icon: 'shield' },
  { slug: 'faucet', title: 'Faucet', subtitle: 'Get testnet XRP', icon: 'droplet' },
  { slug: 'signup', title: 'Sign Up', subtitle: 'Create your XRPL.to account', icon: 'key' },
  { slug: 'address', title: 'Account', subtitle: 'XRPL account details & history', icon: 'users' },
  { slug: 'view', title: 'Browse by Tag', subtitle: 'Explore tokens by category', icon: 'grid' }
];

// Icon SVG paths (Lucide-style)
const ICONS = {
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  sparkle:
    '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  pool: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  swap: '<path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><rect x="10" y="6" width="8" height="4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  megaphone: '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  alert:
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  wallet:
    '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  bridge:
    '<path d="M4 18V8"/><path d="M20 18V8"/><path d="M2 8h20"/><path d="M6 8c0-2.2 2.7-4 6-4s6 1.8 6 4"/>',
  ledger:
    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/><path d="M7 16h8"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  dashboard:
    '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  droplet:
    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  token:
    '<circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M8 10h8"/><path d="M8 14h8"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
};

// Helper: create icon as data URL
function iconDataUrl(iconKey, size, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconKey] || ICONS.chart}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Load fonts
async function loadFonts() {
  const interRegular = await fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf'
  ).then((res) => res.arrayBuffer());

  const interBold = await fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf'
  ).then((res) => res.arrayBuffer());

  return [
    { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
    { name: 'Inter', data: interBold, weight: 700, style: 'normal' }
  ];
}

// ═══════════════════════════════════════════════════════════════
// STATIC PAGE LAYOUT — Centered, symmetrical
// ═══════════════════════════════════════════════════════════════
function createStaticOGImage(page, logoDataUrl) {
  const ICON_SIZE = 48;

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
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000000'
      },
      children: [
        // Background: radial gradient for depth
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, #0a1628 0%, #050a14 50%, #000000 100%)'
            }
          }
        },
        // Ambient glow behind center content
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '42%',
              left: '50%',
              width: 600,
              height: 600,
              borderRadius: 9999,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(63,150,254,0.08) 0%, rgba(63,150,254,0) 70%)'
            }
          }
        },
        // Top accent bar — gradient line
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, transparent 0%, ${BRAND_BLUE} 30%, ${BRAND_CYAN} 70%, transparent 100%)`
            }
          }
        },
        // Logo — top center
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center'
            },
            children: [
              {
                type: 'img',
                props: {
                  src: logoDataUrl,
                  style: { height: 26 }
                }
              }
            ]
          }
        },
        // Center content block
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginTop: 10
            },
            children: [
              // Icon in a refined container
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    border: '1px solid rgba(63,150,254,0.15)',
                    backgroundColor: 'rgba(63,150,254,0.06)',
                    marginBottom: 32
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: iconDataUrl(page.icon, ICON_SIZE, BRAND_BLUE),
                        width: ICON_SIZE,
                        height: ICON_SIZE
                      }
                    }
                  ]
                }
              },
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 56,
                    fontWeight: 700,
                    color: TEXT_WHITE,
                    lineHeight: 1.1,
                    textAlign: 'center',
                    letterSpacing: -1,
                    marginBottom: 16
                  },
                  children: page.title
                }
              },
              // Thin separator line
              {
                type: 'div',
                props: {
                  style: {
                    width: 64,
                    height: 2,
                    borderRadius: 1,
                    background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_CYAN})`,
                    marginBottom: 20
                  }
                }
              },
              // Subtitle
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 22,
                    fontWeight: 400,
                    color: TEXT_MUTED,
                    lineHeight: 1.5,
                    textAlign: 'center',
                    maxWidth: 600
                  },
                  children: page.subtitle
                }
              }
            ]
          }
        },
        // Domain — bottom center
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 36,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center'
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 15,
                    fontWeight: 400,
                    color: TEXT_SUBTLE,
                    letterSpacing: 2
                  },
                  children: 'xrpl.to'
                }
              }
            ]
          }
        }
      ]
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// TOKEN LAYOUT — Side-by-side with token image
// ═══════════════════════════════════════════════════════════════
function createTokenOGImage(page, logoDataUrl, tokenImage) {
  const IMG_SIZE = 300;

  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000000'
      },
      children: [
        // Background gradient
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'radial-gradient(ellipse 70% 70% at 30% 50%, #0a1628 0%, #050a14 50%, #000000 100%)'
            }
          }
        },
        // Ambient glow behind token image area
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '50%',
              right: 120,
              width: 500,
              height: 500,
              borderRadius: 9999,
              transform: 'translateY(-50%)',
              background:
                'radial-gradient(circle, rgba(63,150,254,0.06) 0%, rgba(63,150,254,0) 70%)'
            }
          }
        },
        // Top accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, transparent 0%, ${BRAND_BLUE} 30%, ${BRAND_CYAN} 70%, transparent 100%)`
            }
          }
        },
        // Content area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              padding: '0 80px',
              gap: 60,
              position: 'relative'
            },
            children: [
              // Left: text content
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1
                  },
                  children: [
                    // Logo
                    {
                      type: 'img',
                      props: {
                        src: logoDataUrl,
                        style: { height: 24, marginBottom: 40 }
                      }
                    },
                    // Token name
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 64,
                          fontWeight: 700,
                          color: TEXT_WHITE,
                          lineHeight: 1.1,
                          letterSpacing: -1,
                          marginBottom: 8
                        },
                        children: page.title
                      }
                    },
                    // Issuer
                    ...(page.user
                      ? [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 24,
                                fontWeight: 400,
                                color: 'rgba(255,255,255,0.6)',
                                marginBottom: 20
                              },
                              children: page.user
                            }
                          }
                        ]
                      : []),
                    // Separator
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 48,
                          height: 2,
                          borderRadius: 1,
                          background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_CYAN})`,
                          marginBottom: 20
                        }
                      }
                    },
                    // Description
                    ...(page.description
                      ? [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 18,
                                fontWeight: 400,
                                color: TEXT_MUTED,
                                maxWidth: 420,
                                lineHeight: 1.5
                              },
                              children: page.description
                            }
                          }
                        ]
                      : []),
                    // Trade pill
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          marginTop: 28
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                alignItems: 'center',
                                background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_CYAN})`,
                                paddingLeft: 24,
                                paddingRight: 24,
                                paddingTop: 10,
                                paddingBottom: 10,
                                borderRadius: 50
                              },
                              children: [
                                {
                                  type: 'div',
                                  props: {
                                    style: {
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: TEXT_WHITE,
                                      letterSpacing: 1.5
                                    },
                                    children: 'TRADE'
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              // Right: token image
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: IMG_SIZE + 8,
                    height: IMG_SIZE + 8,
                    borderRadius: 32,
                    border: '1px solid rgba(63,150,254,0.12)',
                    backgroundColor: 'rgba(63,150,254,0.04)',
                    flexShrink: 0
                  },
                  children: tokenImage
                    ? [
                        {
                          type: 'img',
                          props: {
                            src: tokenImage,
                            width: IMG_SIZE,
                            height: IMG_SIZE,
                            style: {
                              width: IMG_SIZE,
                              height: IMG_SIZE,
                              borderRadius: 28
                            }
                          }
                        }
                      ]
                    : [
                        {
                          type: 'div',
                          props: {
                            style: {
                              width: IMG_SIZE,
                              height: IMG_SIZE,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 28,
                              backgroundColor: 'rgba(63,150,254,0.08)'
                            },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: 100,
                                    fontWeight: 700,
                                    color: BRAND_BLUE
                                  },
                                  children: page.title.charAt(0)
                                }
                              }
                            ]
                          }
                        }
                      ]
                }
              }
            ]
          }
        },
        // Domain — bottom center
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 28,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center'
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 14,
                    fontWeight: 400,
                    color: TEXT_SUBTLE,
                    letterSpacing: 2
                  },
                  children: 'xrpl.to'
                }
              }
            ]
          }
        }
      ]
    }
  };
}

// Route to correct layout
function createOGImage(page, logoDataUrl, tokenImage) {
  if (page.md5) {
    return createTokenOGImage(page, logoDataUrl, tokenImage);
  }
  return createStaticOGImage(page, logoDataUrl);
}

// Generate SVG → PNG
async function generateImage(page, fonts, logoDataUrl) {
  let tokenImage = null;
  if (page.md5) {
    tokenImage = await fetchTokenImage(page.md5);
  }

  const element = createOGImage(page, logoDataUrl, tokenImage);

  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH }
  });

  const pngData = resvg.render().asPng();
  return sharp(pngData).webp({ quality: 90 }).toBuffer();
}

// Fetch all tokens from API with pagination
async function fetchAllTokens() {
  const tokens = [];
  let offset = 0;
  const limit = TEST_MODE ? 1 : 100;

  console.log(TEST_MODE ? 'TEST MODE: Fetching 1 token...' : 'Fetching tokens from API...');

  while (true) {
    try {
      const url = `${API_BASE}/tokens?limit=${limit}&start=${offset}&sortBy=vol24hxrp&sortType=desc`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`API error at offset ${offset}: ${res.status}`);
        break;
      }

      const data = await res.json();
      const batch = data.tokens || [];

      if (batch.length === 0) break;

      tokens.push(...batch);
      if (!TEST_MODE) console.log(`  Fetched ${tokens.length} tokens...`);

      if (batch.length < limit || TEST_MODE) break;
      offset += limit;

      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.error(`Error fetching tokens at offset ${offset}:`, e.message);
      break;
    }
  }

  return tokens;
}

// Fetch single token with description
async function fetchTokenWithDescription(slug) {
  try {
    const res = await fetch(`${API_BASE}/token/${slug}?desc=yes`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch (e) {
    return null;
  }
}

// Generate token OG image
async function generateTokenImage(token, fonts, logoDataUrl) {
  const page = {
    title: token.name || token.currency || 'Token',
    user: token.user || '',
    description: token.description
      ? token.description.slice(0, 120) + (token.description.length > 120 ? '...' : '')
      : '',
    md5: token.md5
  };

  return generateImage(page, fonts, logoDataUrl);
}

// Main function
async function main() {
  console.log('OG Image Generator for XRPL.to');
  console.log('================================\n');

  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  if (GENERATE_TOKENS && !fs.existsSync(TOKEN_OUTPUT_DIR)) {
    fs.mkdirSync(TOKEN_OUTPUT_DIR, { recursive: true });
    console.log(`Created token output directory: ${TOKEN_OUTPUT_DIR}\n`);
  }

  // Load logo as data URL
  console.log('Loading logo...');
  const logoSvg = fs.readFileSync(LOGO_PATH, 'utf-8');
  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;
  console.log('Logo loaded.\n');

  // Load fonts
  console.log('Loading fonts...');
  const fonts = await loadFonts();
  console.log('Fonts loaded.\n');

  // Generate images for static pages
  console.log('Generating static page OG images...\n');

  for (const page of PAGES) {
    try {
      const png = await generateImage(page, fonts, logoDataUrl);
      const outputPath = path.join(OUTPUT_DIR, `${page.slug}.webp`);
      fs.writeFileSync(outputPath, png);
      console.log(`  [OK] ${page.slug}.webp - ${page.title}`);
    } catch (error) {
      console.error(`  [ERROR] ${page.slug}: ${error.message}`);
    }
  }

  console.log(`\nGenerated ${PAGES.length} static page OG images.`);

  // Generate token OG images if --tokens flag is passed
  if (GENERATE_TOKENS) {
    console.log('\n================================');
    console.log('Generating token OG images...\n');

    const tokens = await fetchAllTokens();
    console.log(`\nFound ${tokens.length} tokens to process.\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    const BATCH_SIZE = 10;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (token) => {
          const md5 = token.md5;
          if (!md5) return { status: 'skip', reason: 'no md5' };

          const outputPath = path.join(TOKEN_OUTPUT_DIR, `${md5}.webp`);

          // Skip if already exists (incremental generation)
          if (fs.existsSync(outputPath)) {
            return { status: 'skip', md5 };
          }

          try {
            const tokenWithDesc = await fetchTokenWithDescription(token.slug || md5);
            const tokenData = tokenWithDesc || token;

            const png = await generateTokenImage(tokenData, fonts, logoDataUrl);
            fs.writeFileSync(outputPath, png);
            return { status: 'ok', md5, name: tokenData.name };
          } catch (e) {
            return { status: 'error', md5, error: e.message };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const r = result.value;
          if (r.status === 'ok') {
            success++;
            console.log(`  [OK] ${r.md5}.webp - ${r.name}`);
          } else if (r.status === 'skip') {
            skipped++;
          } else if (r.status === 'error') {
            failed++;
            console.error(`  [ERROR] ${r.md5}: ${r.error}`);
          }
        } else {
          failed++;
          console.error(`  [ERROR] Batch error: ${result.reason}`);
        }
      }

      if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= tokens.length) {
        console.log(
          `\n  Progress: ${Math.min(i + BATCH_SIZE, tokens.length)}/${tokens.length} (${success} new, ${skipped} skipped, ${failed} failed)\n`
        );
      }

      await new Promise((r) => setTimeout(r, 50));
    }

    console.log('\n================================');
    console.log(`Token OG generation complete:`);
    console.log(`  New: ${success}`);
    console.log(`  Skipped (existing): ${skipped}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${tokens.length}`);
  }

  console.log('\n================================');
  console.log('Done!');
  console.log('\nUsage in pages:');
  console.log('  Static: <meta property="og:image" content="https://dev.xrpl.to/og/{slug}.webp" />');
  console.log(
    '  Tokens: <meta property="og:image" content="https://dev.xrpl.to/og/token/{md5}.webp" />'
  );
}

main().catch(console.error);
