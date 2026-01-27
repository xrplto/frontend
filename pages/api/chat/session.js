const CHAT_API_KEY = 'xrpl_p3PKb-sf3JfGCtcUIdRS_UV8acyvQ1ta';

export default async function handler(req, res) {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'Missing wallet' });

  try {
    const response = await fetch(
      `https://api.xrpl.to/api/chat/session?apiKey=${CHAT_API_KEY}&wallet=${wallet}`
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
