import { validateSameOrigin } from '../ws/session';

const BASE_URL = 'https://api.xrpl.to';
const CHAT_API_KEY = process.env.CHAT_API_KEY;

// Valid XRP classic address: starts with 'r', 25-35 base58 chars
const XRP_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export default async function handler(req, res) {
  if (!validateSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { action, ticketId, wallet, ...params } = req.query;

  // Validate wallet format if provided
  if (wallet && !XRP_ADDRESS_RE.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  if (!CHAT_API_KEY) {
    return res.status(500).json({ error: 'Chat service unavailable' });
  }

  // Validate ticketId format (MongoDB ObjectId = 24 hex chars)
  if (ticketId && !/^[a-f0-9]{24}$/i.test(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID format' });
  }

  let url;
  const baseParams = wallet ? `wallet=${encodeURIComponent(wallet)}` : '';

  switch (action) {
    case 'list':
      const listParams = new URLSearchParams({ limit: params.limit || '50', offset: params.offset || '0' });
      if (params.status && params.status !== 'all') listParams.set('status', params.status);
      if (wallet) listParams.set('wallet', wallet);
      url = `${BASE_URL}/v1/chat/support/tickets?${listParams}`;
      break;
    case 'get':
      if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });
      url = `${BASE_URL}/v1/chat/support/ticket/${ticketId}${baseParams ? `?${baseParams}` : ''}`;
      break;
    case 'create':
      url = `${BASE_URL}/v1/chat/support/ticket${baseParams ? `?${baseParams}` : ''}`;
      break;
    case 'reply':
      if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });
      url = `${BASE_URL}/v1/chat/support/ticket/${ticketId}/reply${baseParams ? `?${baseParams}` : ''}`;
      break;
    case 'status':
      if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });
      url = `${BASE_URL}/v1/chat/support/ticket/${ticketId}/status${baseParams ? `?${baseParams}` : ''}`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const options = {
      method: req.method,
      headers: { 'X-Api-Key': CHAT_API_KEY, 'Content-Type': 'application/json' }
    };
    if (req.method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Support request failed' });
  }
}
