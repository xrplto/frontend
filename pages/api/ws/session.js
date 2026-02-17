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

export default function handler(req, res) {
  const { type, id, ...params } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing type parameter' });
  }

  // Use the request host for WebSocket URLs so they resolve from the browser
  const host = req.headers.host || 'api.xrpl.to';
  const wsHost = host.startsWith('dev.') ? host : 'api.xrpl.to';
  const endpoints = makeEndpoints(wsHost);

  const builder = endpoints[type];
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

  // Return API key separately — never embed it in the URL.
  // Clients must send {type:"auth", apiKey} as the first WS message.
  res.json({ wsUrl, apiKey: WS_API_KEY });
}
