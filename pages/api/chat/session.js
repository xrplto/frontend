import { validateSameOrigin } from '../ws/session';

// Valid XRP classic address: starts with 'r', 25-35 base58 chars
const XRP_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export default async function handler(req, res) {
  // Same-origin validation — prevents unauthenticated token harvesting
  if (!validateSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'Missing wallet' });

  // Validate wallet format before forwarding to upstream
  if (!XRP_ADDRESS_RE.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  const CHAT_API_KEY = process.env.CHAT_API_KEY;
  if (!CHAT_API_KEY) {
    return res.status(500).json({ error: 'Chat service unavailable' });
  }

  try {
    const response = await fetch(
      `https://api.xrpl.to/api/chat/session?wallet=${encodeURIComponent(wallet)}`,
      { headers: { 'X-Api-Key': CHAT_API_KEY } }
    );
    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: data.error || 'Failed to get session' });
    }

    res.json({ token: data.token, wsUrl: data.wsUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get chat session' });
  }
}
