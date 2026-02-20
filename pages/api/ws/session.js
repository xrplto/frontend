// Internal API key for frontend WebSocket connections (same tier as chat)
const WS_API_KEY = process.env.CHAT_API_KEY;

function makeEndpoints(wsHost) {
  return {
    sync: () => `wss://${wsHost}/ws/sync`,
    creator: (id) => `wss://${wsHost}/ws/creator/${id}`,
    ohlc: (id, params) => `wss://${wsHost}/ws/ohlc/${id}${params ? '?' + params : ''}`,
    history: (id, params) => `wss://${wsHost}/ws/history/${id}${params ? '?' + params : ''}`,
    token: (id, params) => `wss://${wsHost}/ws/token/${id}${params ? '?' + params : ''}`,
    orderbook: (params) => `wss://${wsHost}/ws/orderbook${params ? '?' + params : ''}`,
    balance: (id) => `wss://${wsHost}/ws/account/balance/${id}`,
    balancePair: (id, params) => `wss://${wsHost}/ws/account/balance/pair/${id}${params ? '?' + params : ''}`,
    holders: (id, params) => `wss://${wsHost}/ws/holders/${id}${params ? '?' + params : ''}`,
    ledger: () => `wss://${wsHost}/ws/ledger`,
  };
}

// Allowed origins for API key distribution
const ALLOWED_ORIGINS = ['https://xrpl.to', 'https://dev.xrpl.to', 'http://localhost:3002'];

// Simple in-memory rate limiter per IP (10 requests per 10 seconds)
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 10000;
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}
// Cleanup stale entries every 60s
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now - entry.start > RATE_WINDOW * 2) rateLimitMap.delete(ip);
    }
  }, 60000);
}

// Shared origin validation — reused by ws/session and chat/session
export function validateSameOrigin(req) {
  const origin = (req.headers.origin || '').trim();
  const secFetchSite = (req.headers['sec-fetch-site'] || '').trim();

  // Sec-Fetch-Site is a forbidden header (cannot be set by JS in browsers).
  // Browsers send it on all fetch/XHR requests. If present and 'same-origin',
  // the request is definitively from the same origin — no further check needed.
  if (secFetchSite === 'same-origin') {
    // If Origin IS present (e.g. POST requests), verify it matches allowlist.
    // Browsers omit Origin on same-origin GET/HEAD, so absence is expected.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return false;
    return true;
  }

  // No Sec-Fetch-Site header (non-browser client like curl/Postman) — block.
  // Non-browser clients can spoof Origin but cannot produce Sec-Fetch-Site.
  return false;
}

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limit per IP
  const clientIp = req.socket?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { type, id, ...params } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing type parameter' });
  }

  // Validate id parameter — only allow safe characters (alphanumeric, hyphens, underscores, dots)
  // Prevents path traversal (../../../evil) and injection in wsUrl construction
  if (id && !/^[a-zA-Z0-9_.\-]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id parameter' });
  }

  const endpoints = makeEndpoints('api.xrpl.to');

  // Use hasOwnProperty to prevent prototype pollution — endpoints['constructor'],
  // endpoints['toString'], etc. would resolve to Object.prototype methods and leak the API key.
  if (!Object.prototype.hasOwnProperty.call(endpoints, type)) {
    return res.status(400).json({ error: 'Unknown WebSocket type' });
  }
  const builder = endpoints[type];

  // Build query params string (excluding type and id)
  const queryParams = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // Build base URL
  let wsUrl = builder(id, queryParams);

  // Return API key separately — never embed it in the URL.
  // Clients must send {type:"auth", apiKey} as the first WS message.
  res.json({ wsUrl, apiKey: WS_API_KEY });
}
