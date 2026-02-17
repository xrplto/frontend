export default async function handler(req, res) {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'Missing wallet' });

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
