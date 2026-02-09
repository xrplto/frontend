// Internal API key for frontend WebSocket connections (same tier as chat)
const WS_API_KEY = process.env.CHAT_API_KEY;

const WS_ENDPOINTS = {
  sync: () => `wss://api.xrpl.to/ws/sync/`,
  creator: (id) => `wss://api.xrpl.to/ws/creator/${id}`,
  ohlc: (id, params) => `wss://api.xrpl.to/ws/ohlc/${id}${params ? '?' + params : ''}`,
  history: (id, params) => `wss://api.xrpl.to/ws/history/${id}${params ? '?' + params : ''}`,
  token: (id, params) => `wss://api.xrpl.to/ws/token/${id}${params ? '?' + params : ''}`,
  orderbook: (params) => `wss://api.xrpl.to/ws/orderbook${params ? '?' + params : ''}`,
  balance: (id) => `wss://api.xrpl.to/ws/account/balance/${id}`,
  balancePair: (id, params) => `wss://api.xrpl.to/ws/account/balance/pair/${id}${params ? '?' + params : ''}`,
  holders: (id, params) => `wss://api.xrpl.to/ws/holders/${id}${params ? '?' + params : ''}`,
  ledger: () => `wss://api.xrpl.to/ws/ledger`,
};

export default function handler(req, res) {
  const { type, id, ...params } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing type parameter' });
  }

  const builder = WS_ENDPOINTS[type];
  if (!builder) {
    return res.status(400).json({ error: `Unknown WebSocket type: ${type}` });
  }

  // Build query params string (excluding type and id)
  const queryParams = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // Build base URL
  let wsUrl = builder(id, queryParams);

  // Append API key
  const separator = wsUrl.includes('?') ? '&' : '?';
  wsUrl += `${separator}apiKey=${WS_API_KEY}`;

  res.json({ wsUrl });
}
