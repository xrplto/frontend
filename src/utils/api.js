import axiosLib from 'axios';

const REMOTE_BASE = 'https://api.xrpl.to';
const PROXY_BASE = '/api/proxy';
const isServer = typeof window === 'undefined';

const api = axiosLib.create({
  baseURL: isServer ? REMOTE_BASE : PROXY_BASE
});

// Add API key for server-side requests (SSR with full URLs)
api.interceptors.request.use((config) => {
  if (isServer) {
    config.headers['X-Api-Key'] = process.env.CHAT_API_KEY;
  }
  // Rewrite remote URLs to proxy on client-side
  if (!isServer && config.url?.startsWith(REMOTE_BASE)) {
    config.url = config.url.replace(REMOTE_BASE, PROXY_BASE);
    config.baseURL = ''; // Prevent double-prepending since URL is now a full proxy path
  }
  return config;
});

// Attach static methods to api instance
api.isCancel = axiosLib.isCancel;
api.CancelToken = axiosLib.CancelToken;

// Fetch wrapper with auth - client calls go through proxy
export const apiFetch = (url, options = {}) => {
  const resolvedUrl = isServer ? url : url.replace(REMOTE_BASE, PROXY_BASE);
  if (isServer) {
    const headers = { 'X-Api-Key': process.env.CHAT_API_KEY, ...options.headers };
    return fetch(resolvedUrl, { ...options, headers });
  }
  return fetch(resolvedUrl, options);
};

// Track pending sequences per account
const pendingSequences = new Map();

// Submit transaction via API
// Simulate transaction to preview results (XLS-69)
// Returns { success, engine_result, delivered_amount, meta } without submitting
export async function simulateTransaction(tx) {
  const base = isServer ? REMOTE_BASE : PROXY_BASE;
  const headers = isServer ? { 'X-Api-Key': process.env.CHAT_API_KEY } : {};

  const [seqRes, feeRes] = await Promise.all([
    fetch(`${base}/v1/submit/account/${tx.Account}/sequence`, { headers }).then((r) => r.json()),
    fetch(`${base}/v1/submit/fee`, { headers }).then((r) => r.json())
  ]);
  if (!seqRes.success) throw new Error(seqRes.error || 'Failed to get sequence');

  // Prepare unsigned tx for simulation
  const prepared = {
    ...tx,
    Sequence: seqRes.sequence,
    Fee: feeRes.open_ledger_fee || feeRes.median_fee || '12',
    LastLedgerSequence: seqRes.ledger_index + 20,
    SigningPubKey: '' // Must be empty for simulate
  };

  const simRes = await fetch(`${base}/v1/submit/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ tx_json: prepared })
  }).then((r) => r.json());
  // API returns data directly (not nested in .result)
  const meta = simRes.meta || {};

  // Extract delivered_amount from metadata
  let deliveredAmount = meta.delivered_amount;
  if (typeof deliveredAmount === 'string') {
    deliveredAmount = parseInt(deliveredAmount, 10) / 1000000; // drops to XRP
  } else if (deliveredAmount?.value) {
    deliveredAmount = parseFloat(deliveredAmount.value);
  }

  return {
    success: simRes.engine_result === 'tesSUCCESS',
    engine_result: simRes.engine_result,
    engine_result_message: simRes.engine_result_message,
    delivered_amount: deliveredAmount,
    meta
  };
}

export async function submitTransaction(wallet, tx) {
  const base = isServer ? REMOTE_BASE : PROXY_BASE;
  const headers = isServer ? { 'X-Api-Key': process.env.CHAT_API_KEY } : {};

  const [seqRes, feeRes] = await Promise.all([
    fetch(`${base}/v1/submit/account/${tx.Account}/sequence`, { headers }).then((r) => r.json()),
    fetch(`${base}/v1/submit/fee`, { headers }).then((r) => r.json())
  ]);
  if (!seqRes.success) throw new Error(seqRes.error || 'Failed to get sequence');
  if (!feeRes.success) throw new Error(feeRes.error || 'Failed to get fee');

  // Use higher of API sequence or pending sequence
  const pending = pendingSequences.get(tx.Account) || 0;
  const sequence = Math.max(seqRes.sequence, pending);
  pendingSequences.set(tx.Account, sequence + 1);

  const prepared = {
    ...tx,
    Sequence: sequence,
    Fee: feeRes.open_ledger_fee || feeRes.median_fee || '12',
    LastLedgerSequence: seqRes.ledger_index + 20
  };

  const signed = wallet.sign(prepared);
  const submitRes = await fetch(`${base}/v1/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ tx_blob: signed.tx_blob })
  }).then((r) => r.json());
  if (!submitRes.success) throw new Error(submitRes.engine_result_message || submitRes.error || 'Submit failed');
  return { ...submitRes, hash: signed.hash };
}

// Get wallet auth headers for protected endpoints
export async function getWalletAuthHeaders(accountProfile) {
  const address = accountProfile?.account;
  if (!address) throw new Error('Not logged in');

  const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
  const ws = new EncryptedWalletStorage();
  let seed = null;

  const deviceKeyId = await deviceFingerprint.getDeviceId();
  if (deviceKeyId) {
    const pwd = await ws.getWalletCredential(deviceKeyId);
    if (pwd) seed = (await ws.getWallet(address, pwd))?.seed;
  }
  if (!seed) throw new Error('Could not retrieve wallet credentials');

  const { Wallet } = await import('xrpl');
  const { sign } = await import('ripple-keypairs');
  const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
  const wallet = Wallet.fromSeed(seed, { algorithm });
  const timestamp = Date.now();
  const messageHex = Buffer.from(`${address}:${timestamp}`).toString('hex');
  const signature = sign(messageHex, wallet.privateKey);

  return {
    'X-Wallet': address,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    'X-Public-Key': wallet.publicKey
  };
}

// Safe redirect for checkout URLs — only allows known payment domains
const ALLOWED_CHECKOUT_ORIGINS = ['https://checkout.stripe.com', 'https://pay.stripe.com'];
export function safeCheckoutRedirect(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (ALLOWED_CHECKOUT_ORIGINS.some(o => parsed.origin === new URL(o).origin)) {
      window.location.href = url;
      return true;
    }
  } catch {}
  return false;
}

// Validate WebSocket URLs — only allow connections to trusted hosts
const ALLOWED_WS_HOSTS = ['api.xrpl.to', 'dev.xrpl.to', 'localhost'];
export function isValidWsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:') return false;
    return ALLOWED_WS_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Safe redirect for OAuth URLs — only allows known OAuth providers
const ALLOWED_OAUTH_HOSTS = ['api.x.com', 'api.twitter.com', 'twitter.com', 'x.com'];
export function safeOAuthRedirect(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (ALLOWED_OAUTH_HOSTS.includes(parsed.hostname)) {
      window.location.href = url;
      return true;
    }
  } catch {}
  return false;
}

export default api;
