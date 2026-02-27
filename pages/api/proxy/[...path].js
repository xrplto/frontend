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
  'v1/traders/', 'v1/nft', 'v1/submit', 'v1/amm', 'v1/tx/', 'v1/tx-explain/',
  'v1/ledger/', 'v1/health', 'v1/docs',
  'v1/news', 'v1/launch-token', 'v1/chat/', 'v1/chat/read', 'v1/chat/status',
  'v1/chat/support', 'v1/auth/', 'v1/oauth/',
  'v1/watchlist', 'v1/bridge',
  'v1/keys/stripe/', 'v1/keys/purchase', 'v1/keys/verify-payment',
  'v1/user/',
  'v1/testnet/', 'v1/faucet', 'v1/boost/', 'v1/embed/', 'v1/spin/',
  'v1/banxa/', 'v1/dex/', 'v1/tweet/',
  'api/account/', 'api/traders/', 'api/history', 'api/lp-positions/',
  'api/amm', 'api/dex/', 'api/nft/', 'api/user/', 'api/trustlines/',
  'api/watchlist/', 'api/promotion/', 'api/chat/', 'api/tweet/',
  'api/referral/', 'api/tx-explain/',
  'api/platform-report'
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

// Rate limiting handled at Cloudflare/nginx layer — not duplicated here

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pathSegments = req.query.path;
  if (!pathSegments) return res.status(400).json({ error: 'No path' });

  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  // Block path traversal and control character injection
  if (path.includes('..') || path.includes('//') || /[\x00-\x1f\x7f]/.test(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Enforce path allowlist — only proxy known API prefixes
  if (!ALLOWED_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  const url = new URL(`/${path}`, API_BASE);

  // Forward query params (exclude internal 'path' param, cap numeric limits,
  // strip MongoDB operator keys and auth credentials as defense-in-depth)
  const STRIPPED_PARAMS = new Set(['path', 'apiKey', 'api_key', 'wsToken', 'token']);
  Object.entries(req.query).forEach(([key, value]) => {
    if (STRIPPED_PARAMS.has(key)) return;
    // Block MongoDB query operators ($regex, $where, $gt, etc.)
    if (key.startsWith('$') || (typeof value === 'string' && value.startsWith('$'))) return;
    // Strip CRLF characters from values to prevent header injection / response splitting
    if (typeof value === 'string' && /[\r\n]/.test(value)) {
      value = value.replace(/[\r\n]+/g, '');
    }
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

  // Forward client IP so backend rate limiting works per-user, not per-server
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '';
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp;
    headers['X-Real-IP'] = clientIp;
  }

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;
    const response = await fetch(url.toString(), fetchOptions);
    clearTimeout(timeout);
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
