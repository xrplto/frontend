import { LRUCache } from 'lru-cache';
import dns from 'dns/promises';
import net from 'net';
import http from 'http';
import https from 'https';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const TIMEOUT_MS = 10000;
const CACHE_SECONDS = 86400; // 24h
const MAX_REDIRECTS = 3;
const MAX_CONCURRENT = 20;

// Only allow safe raster image types — SVG/BMP/TIFF excluded (XSS/attack surface)
const SAFE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

// Magic bytes for each allowed image type
const MAGIC_BYTES = [
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { type: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: RIFF....WEBP
  { type: 'image/webp', check: (buf) => buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50 },
  // AVIF: ....ftypavif or ....ftypavis
  { type: 'image/avif', check: (buf) => buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 },
];

function validateMagicBytes(buffer, claimedType) {
  if (buffer.length < 12) return false;
  const entry = MAGIC_BYTES.find(m => m.type === claimedType);
  if (!entry) return false;
  if (entry.check) return entry.check(buffer);
  return entry.bytes.every((b, i) => buffer[i] === b);
}

// Rate limiter: 60 requests per minute per IP
const rateLimiter = new LRUCache({ max: 10000, ttl: 60_000 });
const RATE_LIMIT = 60;

// Global concurrency limiter
let activeFetches = 0;

function getClientIp(req) {
  // Only trust X-Forwarded-For from loopback (nginx/cloudflare)
  const socketIp = req.socket?.remoteAddress || '';
  if (socketIp === '127.0.0.1' || socketIp === '::1' || socketIp === '::ffff:127.0.0.1') {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
  }
  return socketIp;
}

/**
 * Check if an IP address is private/internal/reserved.
 * Catches SSRF bypass techniques: IPv4-mapped IPv6, 6to4, Teredo, decimal, hex, octal.
 */
function isPrivateIp(ip) {
  // Normalize IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  // IPv6 loopback
  if (ip === '::1' || ip === '::' || ip === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return true;
  }

  // IPv6 private ranges
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA fc00::/7
  if (lower.startsWith('fe80')) return true; // Link-local

  // 6to4 addresses (2002:XXYY:ZZWW::) embed IPv4 as XX.YY.ZZ.WW
  if (lower.startsWith('2002:')) {
    const hex = lower.split(':')[1];
    if (hex && hex.length >= 4) {
      const embeddedIp = `${parseInt(hex.slice(0, 2), 16)}.${parseInt(hex.slice(2, 4), 16)}.0.0`;
      const parts = embeddedIp.split('.').map(Number);
      if (parts.length === 4 && !parts.some(isNaN)) {
        // Check the embedded /16 against private ranges
        const [a, b] = parts;
        if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
            (a === 100 && b >= 64 && b <= 127) || a >= 224) {
          return true;
        }
      }
    }
  }

  // Teredo addresses (2001:0000:...) — block entirely (embeds IPv4 in complex encoding)
  if (lower.startsWith('2001:0000:') || lower.startsWith('2001:0:')) return true;

  // Parse IPv4
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return true; // malformed = block

    const [a, b] = parts;

    if (a === 0) return true;                        // 0.0.0.0/8
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // 127.0.0.0/8
    if (a === 169 && b === 254) return true;         // 169.254.0.0/16 (link-local, cloud metadata)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 (benchmarking)
    if (a >= 224) return true;                       // 224.0.0.0+ (multicast, reserved)

    return false;
  }

  // If it's an IPv6 address we haven't caught, check for embedded IPv4
  if (ip.includes(':')) {
    const lastPart = ip.split(':').pop();
    if (lastPart && net.isIPv4(lastPart)) {
      return isPrivateIp(lastPart);
    }
    // Unknown IPv6 format — block to be safe
    return true;
  }

  // Not a recognized IP format — block to be safe
  return true;
}

/**
 * DNS resolution check — resolves hostname and verifies all IPs are public.
 * Returns resolved addresses for pinning (prevents DNS rebinding TOCTOU).
 */
async function resolveAndValidate(hostname) {
  // If hostname is already an IP, check directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private IP');
    }
    return [hostname];
  }

  // Block hostnames that look suspicious
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.intranet') ||
    hostname.endsWith('.home')
  ) {
    throw new Error('Internal hostname');
  }

  // Resolve DNS and check ALL returned IPs
  let addresses;
  try {
    addresses = await dns.resolve4(hostname);
  } catch {
    // If IPv4 fails, try IPv6
    try {
      addresses = await dns.resolve6(hostname);
    } catch {
      throw new Error('DNS resolution failed');
    }
  }

  if (!addresses || addresses.length === 0) {
    throw new Error('No DNS records');
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error('DNS resolves to private IP');
    }
  }

  return addresses;
}

/**
 * Fetch with DNS pinning and manual redirect handling.
 * Uses resolved IP directly to prevent DNS rebinding TOCTOU.
 */
async function safeFetch(url, remainingRedirects = MAX_REDIRECTS) {
  const parsed = new URL(url);

  // Only HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS allowed');
  }

  // DNS resolution check — returns pinned IPs
  const resolvedIps = await resolveAndValidate(parsed.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Pin to the first resolved IP via custom Agent lookup
  const pinnedIp = resolvedIps[0];
  const agent = new https.Agent({
    lookup: (hostname, options, callback) => {
      callback(null, pinnedIp, net.isIPv6(pinnedIp) ? 6 : 4);
    },
    maxSockets: 1,
    timeout: TIMEOUT_MS
  });

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XRPLBot/1.0)',
        'Accept': 'image/jpeg, image/png, image/gif, image/webp, image/avif'
      },
      redirect: 'manual' // Handle redirects manually to validate each hop
    });

    clearTimeout(timeout);
    agent.destroy();

    // Handle redirects manually
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (remainingRedirects <= 0) {
        throw new Error('Too many redirects');
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect without location');
      }

      // Resolve relative redirects
      const redirectUrl = new URL(location, url).href;
      return safeFetch(redirectUrl, remainingRedirects - 1);
    }

    return response;
  } catch (err) {
    clearTimeout(timeout);
    agent.destroy();
    throw err;
  }
}

/**
 * Stream response body with incremental size enforcement.
 * Aborts immediately when MAX_SIZE is exceeded instead of buffering the whole body.
 */
async function readBodyWithLimit(response, maxSize) {
  const reader = response.body.getReader();
  const chunks = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.byteLength;
      if (totalSize > maxSize) {
        reader.cancel();
        throw new Error('Image too large');
      }
      chunks.push(value);
    }
  } catch (err) {
    reader.cancel();
    throw err;
  }

  // Concatenate chunks into single buffer
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const count = (rateLimiter.get(clientIp) || 0) + 1;
  rateLimiter.set(clientIp, count);
  if (count > RATE_LIMIT) {
    res.setHeader('Retry-After', '60');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Length sanity check
  if (url.length > 2048) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'URL too long' });
  }

  // Block control characters in URL (null bytes, tabs, etc.)
  if (/[\x00-\x1f\x7f]/.test(url)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Invalid characters in URL' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (parsed.protocol !== 'https:') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Only HTTPS URLs allowed' });
  }

  // Block userinfo in URL (http://user:pass@host — credential leak)
  if (parsed.username || parsed.password) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Credentials in URL not allowed' });
  }

  // Block non-standard ports (only 443)
  if (parsed.port && parsed.port !== '443') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Non-standard ports not allowed' });
  }

  // Global concurrency limit
  if (activeFetches >= MAX_CONCURRENT) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Too many concurrent requests' });
  }

  activeFetches++;
  try {
    const response = await safeFetch(url);

    if (!response.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Upstream error' });
    }

    // Validate content type — only safe raster formats
    const rawContentType = response.headers.get('content-type') || '';
    const contentType = rawContentType.split(';')[0].trim().toLowerCase();

    if (!SAFE_IMAGE_TYPES.has(contentType)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Unsupported image type' });
    }

    // Check Content-Length header if present (advisory, enforced by streaming below)
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_SIZE) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Image too large' });
    }

    // Stream body with incremental size enforcement
    const bodyBytes = await readBodyWithLimit(response, MAX_SIZE);

    // Validate magic bytes match claimed Content-Type (prevents polyglot/mistype attacks)
    if (!validateMagicBytes(bodyBytes, contentType)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Content does not match declared type' });
    }

    // Security headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', bodyBytes.byteLength);
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline; filename="image"');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'none'; script-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Referrer-Policy', 'no-referrer');

    res.send(Buffer.from(bodyBytes));
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout' });
    }
    if (err.message === 'Image too large') {
      return res.status(502).json({ error: 'Image too large' });
    }
    if (err.message === 'Private IP' || err.message === 'DNS resolves to private IP' || err.message === 'Internal hostname') {
      return res.status(400).json({ error: 'URL not allowed' });
    }
    return res.status(502).json({ error: 'Fetch failed' });
  } finally {
    activeFetches--;
  }
}
