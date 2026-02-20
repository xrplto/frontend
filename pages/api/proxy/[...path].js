const API_KEY = process.env.CHAT_API_KEY;
const API_BASE = 'https://api.xrpl.to';

// Max allowed value for limit/offset params to prevent abuse
const MAX_LIMIT = 100;
const MAX_OFFSET = 100000;

// Allowed API path prefixes — only these are proxied to the backend.
// This prevents access to internal/admin endpoints via the authenticated proxy.
const ALLOWED_PATH_PREFIXES = [
  'v1/tokens', 'v1/token/', 'v1/tags', 'v1/stats', 'v1/search',
  'v1/trending', 'v1/new', 'v1/orderbook', 'v1/ohlc/', 'v1/rsi',
  'v1/history', 'v1/pairs/', 'v1/sparkline/',
  'v1/account/', 'v1/account-tx-explain/', 'v1/holders/', 'v1/creator-activity/',
  'v1/traders/', 'v1/nft', 'v1/submit/', 'v1/amm', 'v1/tx/', 'v1/tx-explain/',
  'v1/ledger/', 'v1/health', 'v1/docs',
  'v1/news', 'v1/launch-token', 'v1/chat/', 'v1/chat/read', 'v1/chat/status',
  'v1/chat/support', 'v1/auth/', 'v1/oauth/',
  'v1/watchlist', 'v1/bridge', 'v1/keys', 'v1/user/',
  'v1/testnet/', 'v1/faucet', 'v1/boost/', 'v1/embed/', 'v1/spin/',
  'v1/banxa/', 'v1/dex/',
  'api/account/', 'api/traders/', 'api/history', 'api/lp-positions/',
  'api/amm', 'api/dex/', 'api/nft/', 'api/user/', 'api/trustlines/',
  'api/watchlist/', 'api/promotion/', 'api/chat/', 'api/tweet/',
  'api/referral/', 'api/tx-explain/'
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

// Rate limiter: 60 requests per 10 seconds per IP
const proxyRateMap = new Map();
const PROXY_RATE_LIMIT = 60;
const PROXY_RATE_WINDOW = 10000;
function checkProxyRate(ip) {
  const now = Date.now();
  const entry = proxyRateMap.get(ip);
  if (!entry || now - entry.start > PROXY_RATE_WINDOW) {
    proxyRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > PROXY_RATE_LIMIT) return false;
  return true;
}
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of proxyRateMap) {
      if (now - entry.start > PROXY_RATE_WINDOW * 2) proxyRateMap.delete(ip);
    }
  }, 60000);
}

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.socket?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkProxyRate(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const pathSegments = req.query.path;
  if (!pathSegments) return res.status(400).json({ error: 'No path' });

  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  // Block path traversal attempts
  if (path.includes('..') || path.includes('//')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Enforce path allowlist — only proxy known API prefixes
  if (!ALLOWED_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  const url = new URL(`/${path}`, API_BASE);

  // Forward query params (exclude internal 'path' param, cap numeric limits,
  // strip MongoDB operator keys as defense-in-depth)
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    // Block MongoDB query operators ($regex, $where, $gt, etc.)
    if (key.startsWith('$') || (typeof value === 'string' && value.startsWith('$'))) return;
    if (key === 'limit') {
      const n = parseInt(value, 10);
      url.searchParams.set(key, String(Math.min(Math.max(0, n || 0), MAX_LIMIT)));
    } else if (key === 'offset') {
      const n = parseInt(value, 10);
      url.searchParams.set(key, String(Math.min(Math.max(0, n || 0), MAX_OFFSET)));
    } else {
      url.searchParams.set(key, value);
    }
  });

  // Always use system API key — never allow client override
  const headers = {};
  headers['X-Api-Key'] = API_KEY;

  // Forward relevant headers
  ['content-type', 'x-wallet', 'x-timestamp', 'x-signature', 'x-public-key'].forEach((h) => {
    if (req.headers[h]) headers[h] = req.headers[h];
  });

  const fetchOptions = { method: req.method, headers };
  if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!headers['content-type']) headers['content-type'] = 'application/json';
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(502).json({ error: 'Proxy error' });
  }
}
