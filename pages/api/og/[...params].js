import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const BRAND_BLUE = '#3f96fe';
const BG_DARK = '#0a0a0a';

// Cache font at module level
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  fontCache = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2'
  ).then((r) => r.arrayBuffer());
  return fontCache;
}

// All page templates
const PAGES = {
  // Static pages
  index: { title: 'XRPL.to', subtitle: 'XRP Ledger Token Prices & Analytics', icon: 'chart' },
  trending: { title: 'Trending Tokens', subtitle: 'Most popular tokens on XRPL', icon: 'fire' },
  spotlight: { title: 'Spotlight', subtitle: 'Featured XRPL tokens', icon: 'star' },
  'most-viewed': { title: 'Most Viewed', subtitle: 'Popular tokens by views', icon: 'eye' },
  new: { title: 'New Tokens', subtitle: 'Recently listed on XRPL', icon: 'sparkle' },
  'amm-pools': { title: 'AMM Pools', subtitle: 'Liquidity pools & APY analytics', icon: 'pool' },
  swap: { title: 'Swap', subtitle: 'Trade tokens on XRPL DEX', icon: 'swap' },
  collections: { title: 'NFT Collections', subtitle: 'Browse XRPL NFT collections', icon: 'grid' },
  'nft-traders': { title: 'NFT Traders', subtitle: 'Top NFT traders on XRPL', icon: 'users' },
  watchlist: { title: 'Watchlist', subtitle: 'Track your favorite tokens', icon: 'bookmark' },
  news: { title: 'News', subtitle: 'Latest XRPL ecosystem updates', icon: 'news' },
  about: { title: 'About', subtitle: 'Learn about XRPL.to', icon: 'info' },
  'rsi-analysis': { title: 'RSI Analysis', subtitle: 'Technical analysis for XRPL', icon: 'chart' },
  launch: { title: 'Token Launch', subtitle: 'Launch your token on XRPL', icon: 'rocket' },
  advertise: { title: 'Advertise', subtitle: 'Promote on XRPL.to', icon: 'megaphone' },
  docs: { title: 'Documentation', subtitle: 'XRPL.to API & guides', icon: 'book' },
  404: { title: 'Page Not Found', subtitle: 'This page does not exist', icon: 'alert' },
  ledger: { title: 'Ledger Explorer', subtitle: 'Browse XRPL transactions', icon: 'blocks' },
  'device-login': { title: 'Device Login', subtitle: 'Secure wallet authentication', icon: 'key' },
  'wallet-setup': { title: 'Wallet Setup', subtitle: 'Create your XRPL wallet', icon: 'wallet' },
  'collection-create': { title: 'Create Collection', subtitle: 'Launch your NFT collection', icon: 'plus' },
  'collection-import': { title: 'Import Collection', subtitle: 'Import existing NFTs', icon: 'import' },
};

// Dynamic page handlers
function getTokenConfig(data) {
  const name = data.name || data.currency || 'Token';
  const change = parseFloat(data.change || '0');
  return {
    title: name,
    subtitle: `${data.currency || 'Token'} on XRP Ledger`,
    accent: change >= 0 ? '#22c55e' : '#ef4444',
    price: data.price ? `$${data.price}` : null,
    change: change ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : null,
  };
}

function getCollectionConfig(data) {
  return {
    title: data.name || 'NFT Collection',
    subtitle: `${data.nfts || ''} NFTs on XRPL`,
    image: data.image,
  };
}

function getNftConfig(data) {
  return {
    title: data.name || 'XRPL NFT',
    subtitle: data.collection || 'NFT on XRP Ledger',
    image: data.image,
  };
}

function getTagConfig(tag) {
  return {
    title: decodeURIComponent(tag || 'Category'),
    subtitle: 'XRPL Token Category',
  };
}

function getGainersConfig(period) {
  const labels = { '1h': '1 Hour', '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days' };
  return {
    title: `Top Gainers`,
    subtitle: `Biggest movers in ${labels[period] || period}`,
    accent: '#22c55e',
  };
}

function getProfileConfig(data) {
  return {
    title: data.name || `${(data.address || '').slice(0, 8)}...`,
    subtitle: 'XRPL Wallet Profile',
  };
}

function getTxConfig(data) {
  return {
    title: 'Transaction',
    subtitle: `${(data.hash || '').slice(0, 16)}...`,
  };
}

function getLedgerConfig(data) {
  return {
    title: `Ledger #${data.index || ''}`,
    subtitle: 'XRP Ledger Block',
  };
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.replace('/api/og/', '').split('/').filter(Boolean);
    const searchParams = url.searchParams;

    const type = pathParts[0] || 'index';
    let config;

    // Route to appropriate handler
    if (PAGES[type]) {
      config = { ...PAGES[type], accent: BRAND_BLUE };
    } else if (type === 'token') {
      config = getTokenConfig({
        name: searchParams.get('name'),
        currency: pathParts[1],
        issuer: pathParts[2],
        price: searchParams.get('price'),
        change: searchParams.get('change'),
      });
    } else if (type === 'collection') {
      config = getCollectionConfig({
        name: searchParams.get('name'),
        slug: pathParts[1],
        nfts: searchParams.get('nfts'),
        image: searchParams.get('image'),
      });
    } else if (type === 'nft') {
      config = getNftConfig({
        name: searchParams.get('name'),
        nftokenid: pathParts[1],
        collection: searchParams.get('collection'),
        image: searchParams.get('image'),
      });
    } else if (type === 'tag' || type === 'view') {
      config = getTagConfig(pathParts[1]);
    } else if (type === 'gainers') {
      config = getGainersConfig(pathParts[1] || '24h');
    } else if (type === 'profile') {
      config = getProfileConfig({
        address: pathParts[1],
        name: searchParams.get('name'),
      });
    } else if (type === 'tx') {
      config = getTxConfig({ hash: pathParts[1] });
    } else if (type === 'ledger-block') {
      config = getLedgerConfig({ index: pathParts[1] });
    } else if (type === 'collection-edit') {
      config = { title: 'Edit Collection', subtitle: searchParams.get('name') || 'Manage your NFT collection' };
    } else {
      config = PAGES.index;
    }

    const accent = config.accent || BRAND_BLUE;
    const font = await getFont();

    const image = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BG_DARK,
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}20 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${BRAND_BLUE}15 0%, transparent 40%)`,
            padding: 60,
          }}
        >
          {/* Top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${BRAND_BLUE})` }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_BLUE}, #65abfe)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>X</span>
            </div>
            <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>XRPL.to</span>
          </div>

          {/* Image if present */}
          {config.image && (
            <img src={config.image} width={100} height={100} style={{ borderRadius: 14, marginBottom: 20, border: '2px solid rgba(255,255,255,0.1)' }} />
          )}

          {/* Title */}
          <div style={{ fontSize: 58, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.15, marginBottom: 12, maxWidth: 900 }}>
            {config.title}
          </div>

          {/* Price + Change for tokens */}
          {config.price && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: accent }}>{config.price}</span>
              {config.change && <span style={{ fontSize: 28, color: accent }}>{config.change}</span>}
            </div>
          )}

          {/* Subtitle */}
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 650 }}>
            {config.subtitle}
          </div>

          {/* Domain */}
          <div style={{ position: 'absolute', bottom: 36, right: 56, fontSize: 18, color: BRAND_BLUE }}>
            xrpl.to
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }],
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );

    // Add cache headers
    image.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return image;
  } catch (e) {
    return new Response('Error generating image', { status: 500 });
  }
}
