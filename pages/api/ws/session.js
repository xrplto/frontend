import crypto from 'crypto';

// Shared HMAC secret for signing short-lived WS tokens (must match API)
const WS_TOKEN_SECRET = process.env.WS_TOKEN_SECRET;

// Token lifetime: 5 minutes — tokens are multi-use within TTL, shared across all WS connections
const TOKEN_TTL_MS = 300_000;

/**
 * Generate a short-lived HMAC token for WS authentication.
 * Format: <timestamp_hex>.<nonce_hex>.<signature_hex>
 *
 * - timestamp: prevents use after TTL expires
 * - nonce: 8 random bytes — makes each token unique per generation
 * - signature: HMAC-SHA256(timestamp + nonce, secret) — proves origin
 *
 * Tokens are multi-use within their TTL. The browser caches one token and
 * reuses it for all WS connections + reconnects. The raw API key never
 * leaves the server.
 */
function generateWSToken() {
  const timestamp = Date.now().toString(16);
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', WS_TOKEN_SECRET)
    .update(payload)
    .digest('hex'); // Full 256-bit HMAC signature
  return `${timestamp}.${nonce}.${signature}`;
}

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

// Allowed origins for token distribution
const ALLOWED_ORIGINS = ['https://xrpl.to', 'https://dev.xrpl.to', 'http://localhost:3002'];

// Shared origin validation — reused by ws/session and chat/session
//
// Sec-Fetch-Site is a "forbidden header" in BROWSERS (cannot be set by JS),
// but non-browser clients (curl, scripts) can freely set it. So we must also
// verify Origin or Referer to confirm the request actually came from an
// allowed origin — browsers always send at least one of these.
export function validateSameOrigin(req) {
  const origin = (req.headers.origin || '').trim();
  const secFetchSite = (req.headers['sec-fetch-site'] || '').trim();

  if (secFetchSite !== 'same-origin') return false;

  // Origin present → must be in allowlist
  if (origin) return ALLOWED_ORIGINS.includes(origin);

  // No Origin (browsers omit it on same-origin GET/HEAD) — check Referer
  const referer = (req.headers.referer || req.headers.referrer || '').trim();
  if (referer) {
    try {
      const ref = new URL(referer);
      return ALLOWED_ORIGINS.includes(`${ref.protocol}//${ref.host}`);
    } catch { return false; }
  }

  // Neither Origin nor Referer — only curl/scripts reach here. Block.
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

  const { type, id, ...params } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing type parameter' });
  }

  // Validate id parameter — only allow safe characters (alphanumeric, hyphens, underscores, dots)
  // Prevents path traversal (../../../evil) and injection in wsUrl construction
  if (id && !/^[a-zA-Z0-9_.\-]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id parameter' });
  }

  // Types that require an id parameter — without it the wsUrl would contain '/undefined'
  const TYPES_REQUIRING_ID = ['token', 'ohlc', 'history', 'creator', 'balance', 'balancePair', 'holders'];
  if (TYPES_REQUIRING_ID.includes(type) && !id) {
    return res.status(400).json({ error: `Missing id parameter for type '${type}'` });
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

  // Build WS URL with short-lived HMAC token (not the raw API key).
  // Token is valid for 30 seconds — enough time for the browser to connect.
  let wsUrl = builder(id, queryParams);
  const separator = wsUrl.includes('?') ? '&' : '?';
  const wsToken = generateWSToken();
  wsUrl = `${wsUrl}${separator}wsToken=${encodeURIComponent(wsToken)}`;

  res.json({ wsUrl });
}
