import axiosLib from 'axios';

const API_KEY = 'xrpl_p3PKb-sf3JfGCtcUIdRS_UV8acyvQ1ta';
const BASE_URL = 'https://api.xrpl.to';

const api = axiosLib.create({
  baseURL: BASE_URL,
  headers: { 'X-Api-Key': API_KEY }
});

// Attach static methods to api instance
api.isCancel = axiosLib.isCancel;
api.CancelToken = axiosLib.CancelToken;

// Fetch wrapper with auth
export const apiFetch = (url, options = {}) => {
  const headers = { 'X-Api-Key': API_KEY, ...options.headers };
  return fetch(url, { ...options, headers });
};

// Track pending sequences per account
const pendingSequences = new Map();

// Submit transaction via API
// Simulate transaction to preview results (XLS-69)
// Returns { success, engine_result, delivered_amount, meta } without submitting
export async function simulateTransaction(tx) {
  const [seqRes, feeRes] = await Promise.all([
    fetch(`${BASE_URL}/v1/submit/account/${tx.Account}/sequence`).then(r => r.json()),
    fetch(`${BASE_URL}/v1/submit/fee`).then(r => r.json())
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

  const simRes = await fetch(`${BASE_URL}/v1/submit/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify({ tx_json: prepared })
  }).then(r => r.json());
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
  const [seqRes, feeRes] = await Promise.all([
    fetch(`${BASE_URL}/v1/submit/account/${tx.Account}/sequence`).then(r => r.json()),
    fetch(`${BASE_URL}/v1/submit/fee`).then(r => r.json())
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
  const submitRes = await fetch(`${BASE_URL}/v1/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_blob: signed.tx_blob })
  }).then(r => r.json());

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

  if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
    const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
    const pwd = await ws.getSecureItem(`wallet_pwd_${walletId}`);
    if (pwd) seed = (await ws.getWallet(address, pwd))?.seed;
  } else if (accountProfile.wallet_type === 'device') {
    const deviceKeyId = await deviceFingerprint.getDeviceId();
    if (deviceKeyId) {
      const pwd = await ws.getWalletCredential(deviceKeyId);
      if (pwd) seed = (await ws.getWallet(address, pwd))?.seed;
    }
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

export default api;
