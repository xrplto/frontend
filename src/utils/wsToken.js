/**
 * Shared WS token cache — one token for all WebSocket connections.
 *
 * The token is an HMAC-signed credential that proves the request came from
 * our frontend server. It's multi-use within its 5-minute TTL.
 *
 * Benefits:
 * - 1 HTTP request per 4 min per user (instead of 1 per WS connection)
 * - Reconnects reuse the cached token instantly (no round-trip)
 * - Concurrent fetches are deduplicated (thundering herd protection)
 * - Token auto-refreshes at 80% TTL before expiry
 */

const TOKEN_TTL_MS = 300_000; // 5 min (must match API)
const REFRESH_AT = 0.8; // Refresh at 80% of TTL (4 min)

let cachedToken = null;
let cachedAt = 0;
let inflightRequest = null;

function isValid() {
  return cachedToken && (Date.now() - cachedAt) < TOKEN_TTL_MS * REFRESH_AT;
}

/**
 * Get a valid wsToken. Returns cached token if fresh, otherwise fetches a new one.
 * Concurrent callers share the same in-flight request.
 */
export async function getWsToken() {
  if (isValid()) return cachedToken;

  // Deduplicate concurrent requests
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    try {
      // Fetch a token using the lightest endpoint (sync type, no id needed)
      const res = await fetch('/api/ws/session?type=sync');
      if (!res.ok) return cachedToken || null; // fallback to stale token
      const data = await res.json();
      const url = data.wsUrl || '';
      // Extract wsToken from URL
      const match = url.match(/[?&]wsToken=([^&]+)/);
      if (match) {
        cachedToken = decodeURIComponent(match[1]);
        cachedAt = Date.now();
      }
      return cachedToken;
    } catch {
      return cachedToken || null;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

/**
 * Build a WS URL with the cached token appended.
 * @param {string} baseWsUrl - e.g. "wss://api.xrpl.to/ws/ohlc/abc123?interval=5m"
 */
export function buildWsUrl(baseWsUrl, token) {
  if (!baseWsUrl || !token) return null;
  const sep = baseWsUrl.includes('?') ? '&' : '?';
  return `${baseWsUrl}${sep}wsToken=${encodeURIComponent(token)}`;
}

// Route map — must match pages/api/ws/session.js makeEndpoints()
const WS_HOST = 'api.xrpl.to';
const ROUTES = {
  sync: () => `wss://${WS_HOST}/ws/sync`,
  creator: (id) => `wss://${WS_HOST}/ws/creator/${id}`,
  ohlc: (id, qs) => `wss://${WS_HOST}/ws/ohlc/${id}${qs ? '?' + qs : ''}`,
  history: (id, qs) => `wss://${WS_HOST}/ws/history/${id}${qs ? '?' + qs : ''}`,
  token: (id, qs) => `wss://${WS_HOST}/ws/token/${id}${qs ? '?' + qs : ''}`,
  orderbook: (_, qs) => `wss://${WS_HOST}/ws/orderbook${qs ? '?' + qs : ''}`,
  balance: (id) => `wss://${WS_HOST}/ws/account/balance/${id}`,
  balancePair: (id, qs) => `wss://${WS_HOST}/ws/account/balance/pair/${id}${qs ? '?' + qs : ''}`,
  holders: (id, qs) => `wss://${WS_HOST}/ws/holders/${id}${qs ? '?' + qs : ''}`,
  ledger: () => `wss://${WS_HOST}/ws/ledger`,
};

/**
 * Get a full WS URL for a given session type.
 * Reuses the cached token — no HTTP round-trip if token is fresh.
 */
export async function getSessionWsUrl(type, id, params = {}) {
  const token = await getWsToken();
  if (!token) return null;

  const builder = ROUTES[type];
  if (!builder) return null;

  const qs = new URLSearchParams(params).toString();
  const base = builder(id, qs);
  return buildWsUrl(base, token);
}
