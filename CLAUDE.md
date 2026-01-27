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
