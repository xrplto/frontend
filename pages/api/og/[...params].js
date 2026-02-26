import { ImageResponse } from 'next/og';
import sharp from 'sharp';

export const runtime = 'nodejs';

// Brand colors — match scripts/generate-og-images.js exactly
const BRAND_BLUE = '#3f96fe';
const BRAND_CYAN = '#38bdf8';
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.5)';
const TEXT_SUBTLE = 'rgba(255, 255, 255, 0.25)';
const API_BASE = 'https://api.xrpl.to/v1';
const IMG_SIZE = 300;

// Cache font at module level (TTF required — WOFF2 not supported by Bun Edge runtime)
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  fontCache = await fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf'
  ).then((r) => r.arrayBuffer());
  return fontCache;
}

// Fetch token data from API
async function fetchTokenData(slug) {
  try {
    const res = await fetch(`${API_BASE}/token/${slug}?desc=yes`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch (e) {
    return null;
  }
}

// Fetch collection data from API
async function fetchCollectionData(slug) {
  try {
    const res = await fetch(`${API_BASE}/nft/collections/${slug}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

// Fetch NFT data from API
async function fetchNftData(nftokenid) {
  try {
    const res = await fetch(`${API_BASE}/nft/${nftokenid}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

// Trusted domains for image fetching (prevent SSRF)
const TRUSTED_IMAGE_HOSTS = ['s1.xrpl.to', 'xrpl.to', 'ipfs.io'];

// Fetch image, convert to PNG via sharp, return as base64 data URI
async function fetchImageAsDataUri(url) {
  try {
    // Validate URL is from a trusted domain to prevent SSRF
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !TRUSTED_IMAGE_HOSTS.includes(parsed.hostname)) {
      return null;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 500000) return null;
    const pngBuf = await sharp(buf).resize(300, 300, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${pngBuf.toString('base64')}`;
  } catch {
    return null;
  }
}

// All page templates
const PAGES = {
  index: { title: 'XRPL.to', subtitle: 'XRP Ledger Token Prices & Analytics', icon: 'chart' },
  trending: { title: 'Trending Tokens', subtitle: 'Most popular tokens on XRPL', icon: 'fire' },
  spotlight: { title: 'Spotlight', subtitle: 'Featured XRPL tokens', icon: 'star' },
  'most-viewed': { title: 'Most Viewed', subtitle: 'Popular tokens by views', icon: 'eye' },
  new: { title: 'New Tokens', subtitle: 'Recently listed on XRPL', icon: 'sparkle' },
  'amm-pools': { title: 'AMM Pools', subtitle: 'Liquidity pools & APY analytics', icon: 'pool' },
  swap: { title: 'Swap', subtitle: 'Trade tokens on XRPL DEX', icon: 'swap' },
  collections: { title: 'NFT Collections', subtitle: 'Browse XRPL NFT collections', icon: 'grid' },
  'nft-traders': { title: 'NFT Traders', subtitle: 'Top NFT traders on XRPL', icon: 'users' },
  'token-traders': { title: 'Token Traders', subtitle: 'Top token traders on XRPL DEX', icon: 'users' },
  'nft-market': { title: 'NFT Market', subtitle: 'XRPL NFT market analytics', icon: 'chart' },
  'token-market': { title: 'Token Market', subtitle: 'XRPL token market analytics', icon: 'chart' },
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
  'collection-create': {
    title: 'Create Collection',
    subtitle: 'Launch your NFT collection',
    icon: 'plus'
  },
  'collection-import': {
    title: 'Import Collection',
    subtitle: 'Import existing NFTs',
    icon: 'import'
  },
  wallet: { title: 'Wallet', subtitle: 'Manage your XRPL wallet', icon: 'wallet' },
  dashboard: { title: 'Dashboard', subtitle: 'Portfolio & analytics overview', icon: 'chart' },
  faucet: { title: 'XRP Faucet', subtitle: 'Get testnet XRP', icon: 'droplet' },
  signup: { title: 'Sign Up', subtitle: 'Create your account', icon: 'user' },
  scams: { title: 'Scam Tokens', subtitle: 'Known scams on XRPL', icon: 'alert' },
  mpt: { title: 'Multi-Purpose Tokens', subtitle: 'MPT on XRP Ledger', icon: 'blocks' },
  bridge: { title: 'Bridge', subtitle: 'Cross-chain transfers', icon: 'swap' }
};

// Dynamic page handlers
async function getTokenConfig(token) {
  const name = token.name || token.currency || 'Token';
  const user = token.user || '';
  const desc = token.description
    ? token.description.slice(0, 120) + (token.description.length > 120 ? '...' : '')
    : '';
  const logoUrl = token.md5 ? `https://s1.xrpl.to/token/${token.md5}` : null;
  let image = null;
  if (logoUrl) {
    try {
      image = await fetchImageAsDataUri(logoUrl);
    } catch {
      image = null;
    }
  }

  // Stats for display
  const stats = [];
  if (token.exch) {
    const price = Number(token.exch);
    stats.push({ label: 'Price', value: `${price < 0.01 ? price.toFixed(8) : price.toFixed(4)} XRP` });
  }
  if (token.pro24h !== undefined) {
    const change = Number(token.pro24h);
    stats.push({ label: '24h', value: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, positive: change >= 0 });
  }
  if (token.holders) {
    stats.push({ label: 'Holders', value: formatCompact(token.holders) });
  }
  if (token.marketcap) {
    stats.push({ label: 'MCap', value: `${formatCompact(token.marketcap)} XRP` });
  }

  return { title: name, user, description: desc, image, isToken: true, stats };
}

function formatCompact(num) {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return String(num);
}

function getCollectionConfig(data) {
  const stats = [];
  if (data.floor) stats.push({ label: 'Floor', value: `${formatCompact(Math.round(data.floor))} XRP` });
  if (data.totalVolume) stats.push({ label: 'Volume', value: `${formatCompact(Math.round(data.totalVolume))} XRP` });
  if (data.owners) stats.push({ label: 'Owners', value: formatCompact(data.owners) });
  if (data.items) stats.push({ label: 'Items', value: formatCompact(data.items) });
  return {
    title: data.name || 'NFT Collection',
    user: data.nfts ? `${data.nfts} NFTs on XRPL` : 'NFT Collection on XRPL',
    description: '',
    image: data.image,
    stats,
    isToken: true
  };
}

function getNftConfig(data) {
  const desc = data.description
    ? data.description.slice(0, 120) + (data.description.length > 120 ? '...' : '')
    : '';
  const stats = [];
  if (data.volume) stats.push({ label: 'Volume', value: `${formatCompact(Math.round(data.volume))} XRP` });
  if (data.rarity_rank && data.total) stats.push({ label: 'Rarity', value: `#${data.rarity_rank} / ${data.total}` });
  else if (data.total) stats.push({ label: 'Supply', value: String(data.total) });
  if (data.cost) {
    const amt = typeof data.cost === 'object' ? data.cost.amount : data.cost;
    if (amt) stats.push({ label: 'Price', value: `${formatCompact(Number(amt))} XRP` });
  }
  return {
    title: data.name || 'XRPL NFT',
    user: data.collection || 'NFT on XRP Ledger',
    description: desc,
    image: data.image,
    stats,
    isToken: true
  };
}

function getTagConfig(tag) {
  return { title: decodeURIComponent(tag || 'Category'), subtitle: 'XRPL Token Category' };
}

function getGainersConfig(period) {
  const labels = { '1h': '1 Hour', '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days' };
  return { title: 'Top Gainers', subtitle: `Biggest movers in ${labels[period] || period}` };
}

function getProfileConfig(data) {
  return {
    title: data.name || `${(data.address || '').slice(0, 8)}...`,
    subtitle: 'XRPL Wallet Profile'
  };
}

function getTxConfig(data) {
  return { title: 'Transaction', subtitle: `${(data.hash || '').slice(0, 16)}...` };
}

function getLedgerConfig(data) {
  return { title: `Ledger #${data.index || ''}`, subtitle: 'XRP Ledger Block' };
}

// ═══════════════════════════════════════════════════════════════
// TOKEN / NFT LAYOUT — Side-by-side (matches scripts/generate-og-images.js)
// ═══════════════════════════════════════════════════════════════
function TokenLayout({ config }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000000'
      }}
    >
      {/* Background: radial gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse 70% 70% at 30% 50%, #0a1628 0%, #050a14 50%, #000000 100%)'
        }}
      />
      {/* Ambient glow behind token image */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: 120,
          width: 500,
          height: 500,
          borderRadius: 9999,
          transform: 'translateY(-50%)',
          background: 'radial-gradient(circle, rgba(63,150,254,0.06) 0%, rgba(63,150,254,0) 70%)'
        }}
      />
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${BRAND_BLUE} 30%, ${BRAND_CYAN} 70%, transparent 100%)`
        }}
      />
      {/* Content area */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          padding: '0 80px',
          gap: 60,
          position: 'relative'
        }}
      >
        {/* Left: text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }}
        >
          {/* Logo */}
          <img
            src="https://xrpl.to/logo/xrpl-to-logo-white.svg"
            height={24}
            style={{ marginBottom: 40 }}
          />
          {/* Token name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: TEXT_WHITE,
              lineHeight: 1.1,
              letterSpacing: -1,
              marginBottom: 8
            }}
          >
            {config.title}
          </div>
          {/* Issuer / subtitle */}
          {config.user && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 20
              }}
            >
              {config.user}
            </div>
          )}
          {/* Gradient separator */}
          <div
            style={{
              width: 48,
              height: 2,
              borderRadius: 1,
              background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_CYAN})`,
              marginBottom: 20
            }}
          />
          {/* Description */}
          {config.description && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: TEXT_MUTED,
                maxWidth: 420,
                lineHeight: 1.5
              }}
            >
              {config.description}
            </div>
          )}
          {/* Stats row */}
          {config.stats && config.stats.length > 0 && (
            <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
              {config.stats.map((stat, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: TEXT_SUBTLE, letterSpacing: 1 }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: stat.positive === true ? '#08AA09' : stat.positive === false ? '#ef4444' : TEXT_WHITE
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: IMG_SIZE + 8,
            height: IMG_SIZE + 8,
            borderRadius: 32,
            border: '1px solid rgba(63,150,254,0.12)',
            backgroundColor: 'rgba(63,150,254,0.04)',
            flexShrink: 0
          }}
        >
          {config.image ? (
            <img
              src={config.image}
              width={IMG_SIZE}
              height={IMG_SIZE}
              style={{ width: IMG_SIZE, height: IMG_SIZE, borderRadius: 28 }}
            />
          ) : (
            <div
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 28,
                backgroundColor: 'rgba(63,150,254,0.08)'
              }}
            >
              <div style={{ fontSize: 100, fontWeight: 700, color: BRAND_BLUE }}>
                {config.title.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Domain — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 400, color: TEXT_SUBTLE, letterSpacing: 2 }}>
          xrpl.to
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATIC PAGE LAYOUT — Centered, symmetrical (matches scripts/generate-og-images.js)
// ═══════════════════════════════════════════════════════════════
function StaticLayout({ config }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000000'
      }}
    >
      {/* Background: radial gradient for depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, #0a1628 0%, #050a14 50%, #000000 100%)'
        }}
      />
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          width: 600,
          height: 600,
          borderRadius: 9999,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(63,150,254,0.08) 0%, rgba(63,150,254,0) 70%)'
        }}
      />
      {/* Top accent bar — gradient line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${BRAND_BLUE} 30%, ${BRAND_CYAN} 70%, transparent 100%)`
        }}
      />
      {/* Logo — top center */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <img src="https://xrpl.to/logo/xrpl-to-logo-white.svg" height={26} />
      </div>
      {/* Center content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginTop: 10
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: TEXT_WHITE,
            lineHeight: 1.1,
            textAlign: 'center',
            letterSpacing: -1,
            marginBottom: 16
          }}
        >
          {config.title}
        </div>
        {/* Gradient separator */}
        <div
          style={{
            width: 64,
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_CYAN})`,
            marginBottom: 20
          }}
        />
        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: TEXT_MUTED,
            lineHeight: 1.5,
            textAlign: 'center',
            maxWidth: 600
          }}
        >
          {config.subtitle}
        </div>
      </div>
      {/* Domain — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 400, color: TEXT_SUBTLE, letterSpacing: 2 }}>
          xrpl.to
        </div>
      </div>
    </div>
  );
}

// Simple in-memory rate limiter to prevent OG image generation floods
const ogRateLimit = { active: 0, maxConcurrent: 5 };

export default async function handler(req, res) {
  // Reject if too many concurrent OG image generations
  if (ogRateLimit.active >= ogRateLimit.maxConcurrent) {
    res.setHeader('Retry-After', '2');
    return res.status(429).json({ error: 'Too many requests, try again shortly' });
  }
  ogRateLimit.active++;
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3002';
    const url = new URL(req.url, `${protocol}://${host}`);
    const pathParts = url.pathname.replace('/api/og/', '').split('/').filter(Boolean);
    const searchParams = url.searchParams;

    const type = pathParts[0] || 'index';
    let config;

    // Route to appropriate handler
    if (type === 'index') {
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=vol24hxrp&sortType=desc&limit=1`);
        const data = await r.json();
        const g = data.global || {};
        const h = data.H24 || {};
        if (data.count) stats.push({ label: 'Tokens', value: formatCompact(data.count) });
        if (g.gDexVolume) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(g.gDexVolume))} XRP` });
        if (g.gMarketcap) stats.push({ label: 'MCap', value: `${formatCompact(Math.round(g.gMarketcap))} XRP` });
        if (h.activeAddresses24H) stats.push({ label: '24h Active', value: formatCompact(h.activeAddresses24H) });
        // Use top token's logo as image
        const topToken = (data.tokens || [])[0];
        if (topToken?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${topToken.md5}`);
        }
      } catch {}
      config = { ...PAGES.index, stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'trending') {
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=trendingScore&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        if (data.total) stats.push({ label: 'Total Tokens', value: formatCompact(data.total) });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.uniqueTraders24H) stats.push({ label: 'Traders 24h', value: formatCompact(data.H24.uniqueTraders24H) });
        if (data.H24?.transactions24H) stats.push({ label: '24h Txns', value: formatCompact(data.H24.transactions24H) });
        const topToken = (data.tokens || [])[0];
        if (topToken?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${topToken.md5}`);
        }
      } catch {}
      config = { ...PAGES.trending, stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'spotlight') {
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=assessmentScore&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        const top = (data.tokens || [])[0];
        if (top?.name) stats.push({ label: '#1 Rated', value: top.name });
        if (top?.assessmentScore) stats.push({ label: 'Score', value: top.assessmentScore.toFixed(2) });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.uniqueTraders24H) stats.push({ label: 'Traders 24h', value: formatCompact(data.H24.uniqueTraders24H) });
        if (top?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${top.md5}`);
        }
      } catch {}
      config = { ...PAGES.spotlight, stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'most-viewed') {
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=nginxScore&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        const top = (data.tokens || [])[0];
        if (top?.name) stats.push({ label: '#1 Viewed', value: top.name });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.uniqueTraders24H) stats.push({ label: 'Traders 24h', value: formatCompact(data.H24.uniqueTraders24H) });
        if (data.H24?.transactions24H) stats.push({ label: '24h Txns', value: formatCompact(data.H24.transactions24H) });
        if (top?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${top.md5}`);
        }
      } catch {}
      config = { ...PAGES['most-viewed'], stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'new') {
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=dateon&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        if (data.total) stats.push({ label: 'Total Tokens', value: formatCompact(data.total) });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.activeAddresses24H) stats.push({ label: 'Active Wallets', value: formatCompact(data.H24.activeAddresses24H) });
        if (data.H24?.transactions24H) stats.push({ label: '24h Txns', value: formatCompact(data.H24.transactions24H) });
        const topToken = (data.tokens || [])[0];
        if (topToken?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${topToken.md5}`);
        }
      } catch {}
      config = { ...PAGES['new'], stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'amm-pools') {
      const stats = [];
      try {
        const r = await fetch(`${API_BASE.replace('/v1', '')}/api/amm?sortBy=fees&status=active&page=0&limit=1&includeAPY=true`);
        const data = await r.json();
        const s = data.summary || {};
        if (s.totalLiquidity) stats.push({ label: 'Liquidity', value: `${formatCompact(Math.round(s.totalLiquidity))} XRP` });
        if (s.totalVolume24h) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(s.totalVolume24h))} XRP` });
        if (s.totalVolume7d) stats.push({ label: '7d Volume', value: `${formatCompact(Math.round(s.totalVolume7d))} XRP` });
        if (s.totalFees7d) stats.push({ label: '7d Fees', value: `${formatCompact(Math.round(s.totalFees7d))} XRP` });
      } catch {}
      config = { ...PAGES['amm-pools'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'rsi-analysis') {
      const stats = [];
      try {
        const [rsiRes, tokensRes] = await Promise.all([
          fetch(`${API_BASE}/rsi?sortBy=rsi24h&sortType=desc&limit=1&timeframe=24h&activeOnly=true&excludeNeutral=true`),
          fetch(`${API_BASE}/tokens?limit=1`)
        ]);
        const rsiData = await rsiRes.json();
        const tokensData = await tokensRes.json();
        const g = tokensData.global || {};
        if (rsiData.total) stats.push({ label: 'Active', value: formatCompact(rsiData.total) });
        if (g.avgRSI24h) stats.push({ label: 'Avg RSI 24h', value: g.avgRSI24h.toFixed(1) });
        if (g.avgRSI7d) stats.push({ label: 'Avg RSI 7d', value: g.avgRSI7d.toFixed(1) });
        if (g.avgRSI) stats.push({ label: 'Avg RSI', value: g.avgRSI.toFixed(1) });
      } catch {}
      config = { ...PAGES['rsi-analysis'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'token-market') {
      const stats = [];
      try {
        const startDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
        const r = await fetch(`${API_BASE}/token/analytics/market?startDate=${startDate}`);
        const data = await r.json();
        const h24 = data.aggregates?.['24h'] || {};
        const pct = data.percentChanges || {};
        const bal = data.traderBalances || {};
        if (h24.volume) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(h24.volume))} XRP` });
        if (h24.trades) stats.push({ label: '24h Trades', value: formatCompact(h24.trades) });
        if (bal.tradersAll) stats.push({ label: 'Traders', value: formatCompact(bal.tradersAll) });
        if (pct.volume24hPct !== undefined) {
          const v = pct.volume24hPct;
          stats.push({ label: 'Volume Change', value: `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, positive: v >= 0 });
        }
      } catch {}
      config = { ...PAGES['token-market'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'nft-market') {
      const stats = [];
      try {
        const r = await fetch(`${API_BASE}/nft/analytics/market`);
        const data = await r.json();
        const s = data.summary || {};
        const p = data.percentChanges || {};
        if (s.total24hVolume) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(s.total24hVolume))} XRP` });
        if (s.total24hSales) stats.push({ label: '24h Sales', value: formatCompact(s.total24hSales) });
        if (s.activeTraders24h) stats.push({ label: 'Traders', value: formatCompact(s.activeTraders24h) });
        if (p.volume24hPct !== undefined) {
          const pct = p.volume24hPct;
          stats.push({ label: 'Volume Change', value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 });
        }
      } catch {}
      config = { ...PAGES['nft-market'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'token-traders') {
      const stats = [];
      try {
        const [tradersRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/token/analytics/traders?sortBy=totalProfit&limit=1&page=1`),
          fetch(`${API_BASE}/token/analytics/traders/summary`)
        ]);
        const tradersData = await tradersRes.json();
        const summaryData = await summaryRes.json();
        const total = tradersData.pagination?.total || 0;
        const bal = summaryData.traderBalances || {};
        if (total) stats.push({ label: 'Traders', value: formatCompact(total) });
        if (bal.balanceAll) stats.push({ label: 'Balance', value: `${formatCompact(Math.round(bal.balanceAll))} XRP` });
        if (bal.traders24h) stats.push({ label: '24h Active', value: formatCompact(bal.traders24h) });
        if (bal.traders30d) stats.push({ label: '30d Active', value: formatCompact(bal.traders30d) });
      } catch {}
      config = { ...PAGES['token-traders'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'nft-traders') {
      const stats = [];
      try {
        const [tradersRes, marketRes] = await Promise.all([
          fetch(`${API_BASE}/nft/analytics/traders?sortBy=combinedProfit&limit=1&page=1`),
          fetch(`${API_BASE}/nft/analytics/market`)
        ]);
        const tradersData = await tradersRes.json();
        const marketData = await marketRes.json();
        const total = tradersData.pagination?.total || 0;
        const bal = marketData.traderBalances || {};
        if (total) stats.push({ label: 'Traders', value: formatCompact(total) });
        if (bal.balanceAll) stats.push({ label: 'Balance', value: `${formatCompact(Math.round(bal.balanceAll))} XRP` });
        if (bal.traders24h) stats.push({ label: '24h Active', value: formatCompact(bal.traders24h) });
        if (bal.pctChange24h) {
          const pct = bal.pctChange24h;
          stats.push({ label: '24h Change', value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 });
        }
      } catch {}
      config = { ...PAGES['nft-traders'], stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'news') {
      const stats = [];
      try {
        const r = await fetch(`${API_BASE}/news?page=1&limit=1`);
        const data = await r.json();
        const total = data.pagination?.total || 0;
        const s24 = data.sentiment?.['24h'] || {};
        const sources = data.sources?.length || 0;
        if (total) stats.push({ label: 'Articles', value: formatCompact(total) });
        if (s24.Bullish) stats.push({ label: 'Bullish', value: `${parseFloat(s24.Bullish).toFixed(1)}%`, positive: true });
        if (s24.Bearish) stats.push({ label: 'Bearish', value: `${parseFloat(s24.Bearish).toFixed(1)}%`, positive: false });
        if (sources) stats.push({ label: 'Sources', value: formatCompact(sources) });
      } catch {}
      config = { ...PAGES.news, stats: stats.length ? stats : undefined, isToken: true };
    } else if (type === 'collections') {
      const stats = [];
      let topImage = null;
      try {
        const res = await fetch(`${API_BASE}/nft/collections?page=0&limit=1&sortBy=totalVol24h&order=desc&includeGlobalMetrics=true`);
        const data = await res.json();
        const gm = data.globalMetrics || {};
        if (gm.totalCollections) stats.push({ label: 'Collections', value: formatCompact(gm.totalCollections) });
        if (gm.total24hVolume) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(gm.total24hVolume))} XRP` });
        if (gm.totalMarketCap) stats.push({ label: 'NFT MCap', value: `${formatCompact(Math.round(gm.totalMarketCap))} XRP` });
        if (gm.activeTraders24h) stats.push({ label: '24h Traders', value: formatCompact(gm.activeTraders24h) });
        // Use top collection's logo as image
        const topCol = (data.collections || [])[0];
        if (topCol?.logoImage) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/nft-collection/${topCol.logoImage}`);
        }
      } catch {}
      config = { ...PAGES.collections, stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (PAGES[type]) {
      config = { ...PAGES[type] };
    } else if (type === 'token') {
      const slug = pathParts[1];
      const tokenData = await fetchTokenData(slug);
      if (tokenData) {
        config = await getTokenConfig(tokenData);
      } else {
        const fallbackMd5 = searchParams.get('md5');
        const fallbackImage = fallbackMd5
          ? await fetchImageAsDataUri(`https://s1.xrpl.to/token/${fallbackMd5}`)
          : null;
        config = {
          title: searchParams.get('name') || slug || 'Token',
          user: '',
          description: '',
          image: fallbackImage,
          isToken: true
        };
      }
    } else if (type === 'collection') {
      const slug = pathParts[1];
      let image = searchParams.get('image');
      let name = searchParams.get('name');
      let nfts = searchParams.get('nfts');
      let floor = 0, totalVolume = 0, owners = 0, items = 0;
      // Fetch from API if missing image/name
      if (!image || !name) {
        const col = await fetchCollectionData(slug);
        if (col) {
          name = name || (typeof col.name === 'object' ? col.name.collection_name : col.name) || slug;
          image = image || (col.logoImage ? `https://s1.xrpl.to/nft-collection/${col.logoImage}` : null);
          nfts = nfts || col.nfts || col.items;
          floor = col.floor || 0;
          totalVolume = col.totalVolume || 0;
          owners = col.owners || 0;
          items = col.items || 0;
        }
      }
      const collectionImage = image ? await fetchImageAsDataUri(image) : null;
      config = getCollectionConfig({ name, slug, nfts, image: collectionImage, floor, totalVolume, owners, items });
    } else if (type === 'nft') {
      const nftokenid = pathParts[1];
      let image = searchParams.get('image');
      let name = searchParams.get('name');
      let collection = searchParams.get('collection');
      let nftDescription = '';
      let nftVolume = 0, nftRarityRank = 0, nftTotal = 0, nftCost = null;
      // Fetch from API if missing
      if (!image || !name) {
        const nftData = await fetchNftData(nftokenid);
        if (nftData) {
          const meta = nftData.meta || {};
          name = name || meta.name || meta.Name || 'NFT';
          collection = collection || (typeof nftData.collection === 'string' ? nftData.collection : nftData.collection?.name) || '';
          nftDescription = meta.description || '';
          nftVolume = nftData.volume || 0;
          nftRarityRank = nftData.rarity_rank || 0;
          nftTotal = nftData.total || 0;
          nftCost = nftData.cost || null;
          if (!image) {
            // Use files[].thumbnail (hosted on s1.xrpl.to) — much more reliable than IPFS
            const files = nftData.files || [];
            for (const f of files) {
              const thumb = f.thumbnail || {};
              const src = thumb.medium || thumb.small;
              if (src) {
                image = src.startsWith('http') ? src : `https://s1.xrpl.to/nft/${src}`;
                break;
              }
            }
          }
        }
      }
      const nftImage = image ? await fetchImageAsDataUri(image) : null;
      config = getNftConfig({ name, nftokenid, collection, image: nftImage, description: nftDescription, volume: nftVolume, rarity_rank: nftRarityRank, total: nftTotal, cost: nftCost });
    } else if (type === 'tag' || type === 'view') {
      const tag = pathParts[1] || '';
      const stats = [];
      let topImage = null;
      let tagName = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?tag=${encodeURIComponent(tag)}&sortBy=vol24hxrp&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        if (data.count) stats.push({ label: 'Tokens', value: formatCompact(data.count) });
        const top = (data.tokens || [])[0];
        if (top?.vol24h) stats.push({ label: '24h Volume', value: `${formatCompact(Math.round(top.vol24h))} XRP` });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.uniqueTraders24H) stats.push({ label: 'Traders 24h', value: formatCompact(data.H24.uniqueTraders24H) });
        if (top?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${top.md5}`);
        }
        tagName = data.tagName;
      } catch {}
      const tagConfig = getTagConfig(tag);
      if (tagName) tagConfig.title = tagName;
      config = { ...tagConfig, stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'gainers') {
      const period = pathParts[1] || '24h';
      const sortMap = { '5m': 'pro5m', '1h': 'pro1h', '24h': 'pro24h', '7d': 'pro7d' };
      const stats = [];
      let topImage = null;
      try {
        const r = await fetch(`${API_BASE}/tokens?sortBy=${sortMap[period] || 'pro24h'}&sortType=desc&page=0&limit=1`);
        const data = await r.json();
        const top = (data.tokens || [])[0];
        if (top?.name) stats.push({ label: '#1 Gainer', value: top.name });
        if (top?.[sortMap[period]]) stats.push({ label: `${period} Change`, value: `${top[sortMap[period]] > 0 ? '+' : ''}${top[sortMap[period]].toFixed(1)}%`, positive: top[sortMap[period]] > 0 });
        if (data.H24?.tradedTokens24H) stats.push({ label: 'Traded 24h', value: formatCompact(data.H24.tradedTokens24H) });
        if (data.H24?.uniqueTraders24H) stats.push({ label: 'Traders 24h', value: formatCompact(data.H24.uniqueTraders24H) });
        if (top?.md5) {
          topImage = await fetchImageAsDataUri(`https://s1.xrpl.to/token/${top.md5}`);
        }
      } catch {}
      config = { ...getGainersConfig(period), stats: stats.length ? stats : undefined, image: topImage, isToken: true };
    } else if (type === 'profile' || type === 'address') {
      const address = pathParts[1] || '';
      const stats = [];
      let avatarImage = null;
      try {
        const r = await fetch(`${API_BASE}/account/balance/${address}`);
        const data = await r.json();
        if (data.balance != null) stats.push({ label: 'Balance', value: `${formatCompact(Math.round(data.balance))} XRP` });
        if (data.ownerCount != null) stats.push({ label: 'Objects', value: formatCompact(data.ownerCount) });
        if (data.inception) stats.push({ label: 'Since', value: data.inception.split('T')[0] });
        if (data.reserve) stats.push({ label: 'Reserve', value: `${data.reserve} XRP` });
      } catch {}
      // Fetch NFT profile avatar
      try {
        const ur = await fetch(`${API_BASE.replace('/v1', '')}/api/user/${address}`);
        const ud = await ur.json();
        if (ud.user?.avatar) {
          avatarImage = await fetchImageAsDataUri(ud.user.avatar);
        }
      } catch {}
      const name = searchParams.get('name');
      const profileConfig = getProfileConfig({ address, name });
      config = { ...profileConfig, stats: stats.length ? stats : undefined, image: avatarImage, isToken: true };
    } else if (type === 'tx') {
      config = getTxConfig({ hash: pathParts[1] });
    } else if (type === 'ledger-block') {
      config = getLedgerConfig({ index: pathParts[1] });
    } else if (type === 'collection-edit') {
      config = {
        title: 'Edit Collection',
        subtitle: searchParams.get('name') || 'Manage your NFT collection'
      };
    } else {
      config = PAGES.index;
    }

    const font = await getFont();
    const isToken = !!config.isToken;

    const imageResponse = new ImageResponse(
      isToken ? <TokenLayout config={config} /> : <StaticLayout config={config} />,
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }]
      }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.status(200).end(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error('[og] Error:', e);
    res.status(500).end('Error generating image');
  } finally {
    ogRateLimit.active--;
  }
}
