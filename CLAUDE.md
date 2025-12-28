# CLAUDE.md

## CRITICAL RULES

### DO NOT RUN
- `npm run dev` / `npm run build` / `npm install`

### API URLs
**Always hardcode**: `const BASE_URL = 'https://api.xrpl.to';`
Never use `process.env` for API URLs in client-side code.

### Performance
Never disable features to fix performance. Use memoization, virtualization, lazy loading instead.

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

**Colors**: Primary `#4285f4`, Success `emerald-400`, Error `red-400`, Warning `amber-400`

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
