import { validateSameOrigin } from '../ws/session';

const BASE_URL = 'https://api.xrpl.to';
const CHAT_API_KEY = process.env.CHAT_API_KEY;

// Valid XRP classic address: starts with 'r', 25-35 base58 chars
const XRP_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

// Allowed mod actions
const ALLOWED_ACTIONS = ['ban', 'unban', 'mute', 'unmute'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!CHAT_API_KEY) {
    return res.status(500).json({ error: 'Chat service unavailable' });
  }

  const { action } = req.query;

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const { wallet, duration } = req.body || {};

  if (!wallet || !XRP_ADDRESS_RE.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Validate duration if provided (must be a positive number)
  if (duration !== undefined && duration !== null) {
    const dur = Number(duration);
    if (!Number.isFinite(dur) || dur < 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/v1/chat/${action}`, {
      method: 'POST',
      headers: { 'X-Api-Key': CHAT_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, duration })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Mod action failed' });
  }
}
