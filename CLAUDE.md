# CLAUDE.md

## CRITICAL RULES

### DO NOT RUN
- `npm run dev` / `npm run build` / `npm install`

### API URLs
**Always hardcode**: `const BASE_URL = 'https://api.xrpl.to';`
Never use `process.env` for API URLs in client-side code.

### Performance
Never disable features to fix performance. Use memoization, virtualization, lazy loading instead.

### No Speculation
Do not speculate or guess. Always provide factual, verifiable data. If uncertain, say "I don't know" and suggest how to investigate.

### API Key Security — NEVER Leak Keys to the Frontend
**The platform API key (`CHAT_API_KEY`) must NEVER appear in browser-visible responses, network requests, localStorage, console output, or client-side code (`src/`).**

**Correct patterns:**
- **WebSocket auth**: `pages/api/ws/session.js` generates a short-lived HMAC token (`wsToken`) signed with `WS_TOKEN_SECRET`. The browser receives only `wsToken=<timestamp>.<signature>` — never the raw API key. The API server verifies the HMAC and grants platform-tier access.
- **REST proxy**: `pages/api/proxy/[...path].js` injects `X-Api-Key` server-side. Client calls `/api/proxy/...` without any key.
- **Chat mod actions**: `pages/api/chat/mod.js` proxies ban/mute/unban/unmute — client sends action + wallet, server injects the key.
- **SSR requests**: `src/utils/api.js` only attaches `CHAT_API_KEY` when `isServer === true`.

**Forbidden:**
- Destructuring `apiKey` from any `/api/ws/session` response in client code
- Sending API keys as WS messages (`ws.send(JSON.stringify({ type: 'auth', apiKey }))`)
- Storing API keys in localStorage/sessionStorage
- Sending `X-Api-Key` header from client-side `fetch`/`apiFetch` calls
- Passing API keys through component props or React context

**WS Token Flow (per OWASP WS Cheat Sheet & Authgear HMAC guide):**
```
Browser → GET /api/ws/session?type=sync  (same-origin only, Sec-Fetch-Site validated)
Server  → nonce = randomBytes(8)
Server  → sig = HMAC-SHA256(timestamp + ":" + nonce, WS_TOKEN_SECRET)
Server  → { wsUrl: "wss://api.xrpl.to/ws/sync?wsToken=<ts>.<nonce>.<sig>" }
Browser → caches token in src/utils/wsToken.js (shared across all WS connections)
Browser → new WebSocket(wsUrl)  (token multi-use, expires in 5 min)
API     → verifyWSToken(): timingSafeEqual + expiry check
API     → scrubs wsToken from ws.data.query (prevents downstream log exposure)
```

**Security properties:**
- HMAC-SHA256 proves token was issued by trusted server (Authgear)
- Timestamp enforces 5-min TTL (OWASP replay prevention)
- `crypto.timingSafeEqual` prevents timing side-channel (OWASP)
- Token is multi-use within TTL — shared across all WS connections per user
- Browser refreshes token at 80% TTL (4 min) with request deduplication
- Auth credentials scrubbed from `ws.data.query` after verification (log safety)

## Project Overview

XRPL.to - XRP Ledger analytics platform with token prices, NFT marketplace, DEX trading, portfolio management.

**Tech Stack**: Next.js 15.3.5, Tailwind CSS, Redux Toolkit, XRPL v3.1.0, Lucide React icons

**Structure**:
- `pages/` - Routes
- `src/components/` - Shared UI
- `src/TokenDetail/` - Token analytics
- `src/NFTCollection/` - NFT components
- `src/redux/` - State management
- `src/utils/` - Utilities & XRPL parsing

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/tokens` | Token list with filters |
| `/trending` | Trending tokens |
| `/new` | New tokens |
| `/tags` | Available categories |
| `/api/amm` | AMM pools (sortBy: fees, apy, liquidity, volume) |
| `/api/tx-explain/{hash}` | AI transaction explanation |
| `wss://api.xrpl.to/ws/sync/` | Real-time token updates |
| `wss://api.xrpl.to/ws/token/{md5}` | Single token stream |

## UI Guidelines

**Stack**: Tailwind CSS + `cn()` utility, Lucide React icons, @emotion/styled
**No MUI. No emojis - use Lucide icons.**

**Theme Pattern**:
```jsx
const { themeName } = useContext(AppContext);
const isDark = themeName === 'XrplToDarkTheme';
```

**Design**: Flat design, no shadows/gradients, `rounded-xl`, `border-[1.5px]`, `border-white/10`

**Layout**: Always fill containers symmetrically. Tables must use flexible `fr` units to distribute columns evenly across full width. Never bunch content to one side.

**Colors**:
- Primary: `#137DFE` (blue)
- Secondary: `gray-500` / `white/50` (grey)
- Success: `#08AA09` (green)
- Warning: `#F6AF01` (amber)
- Accent: `#650CD4` (purple)
- Background: `black` / `white`

## Wallet System

### Storage
- **IndexedDB**: Encrypted seeds, provider passwords
- **localStorage**: Wallet profiles (no seeds), auth tokens
- **sessionStorage**: Temporary OAuth flow data

### Critical Rules
1. Never store seeds in localStorage - IndexedDB only
2. Password key format: `wallet_pwd_${provider}_${userId}`
3. Always decrypt from IndexedDB if localStorage is empty
4. Clear OAuth session data immediately after wallet creation

### IndexedDB Rules
1. **Never hardcode a DB version number.** Always open without a version first (`indexedDB.open(name)`), then bump `db.version + 1` only if stores are missing.
2. **Always close DB connections** after one-off reads. An unclosed connection blocks all version upgrades, causing timeouts across the entire app.
3. **Never do two-phase open** (detect then reopen). Open once, check stores, return if they exist, otherwise close and reopen with version bump.
4. The `_getHmacKey()` in `deviceFingerprint` opens its own connection — it must call `db.close()` when done.

### Key Files
- `src/utils/encryptedWalletStorage.js` - Wallet encryption/storage
- `src/components/Wallet.js` - Auth UI & OAuth handlers
- `pages/wallet-setup.js` - New user password setup

### Secure Seed Access Pattern
Seeds must NEVER be stored unencrypted. Use this pattern for all transaction signing:

```javascript
// 1. Import encrypted storage
const { Wallet } = await import('xrpl');
const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

// 2. Get device fingerprint (stable ID)
const walletStorage = new EncryptedWalletStorage();
const deviceKeyId = await deviceFingerprint.getDeviceId();

// 3. Retrieve password from IndexedDB
const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
if (!storedPassword) throw new Error('Wallet locked');

// 4. Decrypt seed from IndexedDB (memory only)
const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
if (!walletData?.seed) throw new Error('Could not retrieve credentials');

// 5. Create signing wallet in memory
const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
const deviceWallet = Wallet.fromSeed(walletData.seed, { algorithm });

// 6. Sign and submit
const signed = deviceWallet.sign(preparedTx);
```

| Location | What's Stored |
|----------|---------------|
| IndexedDB (encrypted) | Seeds, passwords |
| localStorage | Profiles (NO seeds), auth tokens |
| Memory only | Decrypted seed during signing |

## XRPL Seed Detection

```javascript
// Detect algorithm from seed prefix
const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

// Always specify algorithm
const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
```

| Prefix | Algorithm |
|--------|-----------|
| `sEd...` | ed25519 |
| `s...` | secp256k1 |

## XRPL Transactions

**SourceTag**: Always use `161803` (Golden ratio φ) for all transactions.

## Direct Messages

To open a DM with an XRP address:
```javascript
window.dispatchEvent(new CustomEvent('openDm', { detail: { user: 'rAddress...' } }))
```
