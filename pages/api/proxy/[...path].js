const API_KEY = process.env.CHAT_API_KEY;
const API_BASE = 'https://api.xrpl.to';

export default async function handler(req, res) {
  const pathSegments = req.query.path;
  if (!pathSegments) return res.status(400).json({ error: 'No path' });

  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  const url = new URL(`/${path}`, API_BASE);

  // Forward query params (exclude internal 'path' param)
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') url.searchParams.set(key, value);
  });

  // Use client-provided X-Api-Key if present, otherwise system key
  const headers = {};
  headers['X-Api-Key'] = req.headers['x-api-key'] || API_KEY;

  // Forward relevant headers
  ['content-type', 'x-wallet', 'x-timestamp', 'x-signature', 'x-public-key'].forEach((h) => {
    if (req.headers[h]) headers[h] = req.headers[h];
  });

  const fetchOptions = { method: req.method, headers };
  if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!headers['content-type']) headers['content-type'] = 'application/json';
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
}
