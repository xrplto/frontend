# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL INSTRUCTIONS - MUST FOLLOW

### DO NOT RUN THESE COMMANDS
1. **DO NOT START `npm run dev`** - Development server should not be started
2. **DO NOT RUN `npm run build`** - Build process should not be initiated
3. **DO NOT RUN `npm install`** - Package installation should not be executed

### API URL CONFIGURATION
**NEVER use process.env for API URLs in client-side code**
- Always hardcode API URLs directly: `const BASE_URL = 'https://api.xrpl.to';`
- DO NOT use `process.env.API_URL` or `process.env.NEXT_PUBLIC_API_URL`
- Client-side environment variables are unreliable and cause 404 errors
- Hardcoded URLs work in both development and production

### PERFORMANCE AND DEBUGGING RULES
1. **NEVER DISABLE FEATURES TO FIX PERFORMANCE ISSUES**
   - Always fix the root cause, don't remove functionality
   - Users expect features to work, not disappear
   - Performance problems must be solved through optimization, not feature removal

2. **PROPER DEBUGGING APPROACH**
   - Profile and identify the exact bottleneck
   - Optimize hot paths (frequent function calls, large loops)
   - Use memoization, caching, and lazy loading appropriately
   - Implement virtualization for large lists
   - Fix memory leaks at their source

3. **FORBIDDEN SHORTCUTS**
   - ❌ Commenting out chart components
   - ❌ Disabling animations or visual effects
   - ❌ Removing useTheme() calls without proper optimization
   - ❌ Replacing libraries with placeholder content
   - ❌ Temporarily disabling WebSocket updates

4. **CORRECT OPTIMIZATION PATTERNS**
   - ✅ Memoize expensive calculations with useMemo
   - ✅ Use React.memo with proper comparison functions
   - ✅ Implement intersection observers for lazy loading
   - ✅ Cache theme values to reduce context reads
   - ✅ Optimize rendering with virtualization for large lists
   - ✅ Use requestAnimationFrame for smooth animations

### Understanding User Requirements
1. **Read the ENTIRE request carefully**
   - Pay attention to specific words like "directly", "only", "do not hardcode"
   - If user says "use API", that means fetch from API, not create local logic
   - Understand the difference between using API data vs creating local interpretations

2. **Ask for clarification if needed**
   - If requirements seem ambiguous, ask before implementing
   - Don't make assumptions about what would be "better" or "more helpful"
   - Implement exactly what was asked, nothing more, nothing less

### API Integration Rules
1. **NEVER hardcode values that should come from APIs**
   - Categories, tags, and filters must ALWAYS be fetched from API endpoints
   - Do not hardcode category names, icons, or filtering logic
   - Let the API be the single source of truth for all dynamic data

2. **Follow user instructions EXACTLY**
   - Read requirements carefully and implement precisely what is asked
   - Do not add "helpful" additions that weren't requested
   - If the user says "use API directly", do NOT create local filtering or categorization

3. **API-First Approach**
   - Always check if data can be fetched from an API endpoint before creating local logic
   - Use API parameters for filtering instead of client-side filtering when possible
   - Trust the API's categorization and data structure

### Common API Endpoints
- `/tags` - Get available tags/categories
- `/tokens` - Get tokens with various filters and sorting
- `/trending` - Get trending tokens
- `/spotlight` - Get spotlight tokens
- `/gainers/[period]` - Get top gainers
- `/new` - Get new tokens
- `/most-viewed` - Get most viewed tokens
- `/api/amm-pools` - Get AMM pools with APY, volume, fees, liquidity metrics

#### AMM Pools API (`/api/amm-pools`)
Returns all Automated Market Maker pools with pre-calculated APY metrics, trading volumes, fees earned, and liquidity data. APY calculations are updated every minute.

**Query Parameters:**
- `status` (default: `active`) - Filter by status: `active`, `deleted`, `all`
- `issuer` - Filter pools containing tokens from this issuer address
- `currency` - Filter pools containing this currency code (checks both assets)
- `sortBy` (default: `fees`) - Sort order:
  - `fees` - Highest 7d fees earned (most reliable)
  - `apy` - Highest 7d APY percentage
  - `liquidity` - Most XRP liquidity
  - `volume` - Highest 7d trading volume
  - `created` - Newest pools first

**Response Fields:**
- `_id` - Unique pool identifier (MD5 hash)
- `ammAccount` - AMM account address managing this pool
- `asset1`, `asset2` - Token pair with `currency` and `issuer`
- `currentLiquidity` - Latest liquidity snapshot (asset1Amount, asset2Amount, lpTokenBalance)
- `lpTokenCurrency` - LP token currency code
- `tradingFee` - Fee in basis points (1000 = 1%, 500 = 0.5%)
- `status` - Pool status: `active` or `deleted`
- `apy24h` / `apy7d` - Metrics with:
  - `apy` - Annualized Percentage Yield (percentage)
  - `volume` - Trading volume in XRP equivalent
  - `fees` - Fees earned in XRP
  - `liquidity` - Total pool liquidity in XRP (XRP side × 2)
  - `trades` - Number of trades in period

**Usage Examples:**
```javascript
// Top pools by fees earned (most reliable)
GET /api/amm-pools?sortBy=fees

// Highest APY pools
GET /api/amm-pools?sortBy=apy

// All pools for a specific token
GET /api/amm-pools?issuer=rXXX&currency=MTG

// Most liquid XRP pools
GET /api/amm-pools?currency=XRP&sortBy=liquidity

// Recently created pools
GET /api/amm-pools?sortBy=created
```

**Important Notes:**
- APY calculated from XRP-denominated volume only (liquidity: 0 for token/token pools)
- High APY + low liquidity = risky (prefer sortBy=fees)
- Metrics update every 60 seconds
- Response time: ~100-150ms for all 5000+ pools

### Implementation Patterns to AVOID
```javascript
// ❌ WRONG - Hardcoding categories
const categories = [
  { value: 'trending', label: 'Trending', icon: '🔥' },
  { value: 'stable', label: 'Stablecoins', icon: '💵' }
];

// ❌ WRONG - Local filtering logic
if (t.name.includes('usd') || t.name.includes('stable')) {
  // Don't do this
}

// ❌ WRONG - Assuming tag structure
if (tagLower.some(t => t.includes('meme'))) {
  // Don't interpret tags locally
}
```

### Implementation Patterns to USE
```javascript
// ✅ CORRECT - Fetch from API
const tagsRes = await axios.get(`${BASE_URL}/tags`);
const categories = tagsRes.data; // Use as-is from API

// ✅ CORRECT - Let API do filtering
const filtered = await axios.get(
  `${BASE_URL}/tokens?tag=${selectedTag}`
);

// ✅ CORRECT - Use API response directly
setTokens(apiResponse.data.tokens); // Don't transform
```

## Project Overview

XRPL.to is a comprehensive XRP Ledger analytics and trading platform built with Next.js. It provides real-time token prices, NFT marketplace functionality, DEX trading interfaces, and portfolio management.

## Development Commands

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server (port 3001)
npm start

# Format code with Prettier
npm run format

# Analyze bundle size
npm run analyze
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.5 with React
- **UI**: Tailwind CSS, Emotion Styled Components, Lucide React Icons
- **State**: Redux Toolkit with Redux Persist
- **Blockchain**: XRPL library v3.1.0
- **Charts**: Highcharts, ApexCharts, ECharts, Recharts
- **Real-time**: WebSocket (react-use-websocket, socket.io-client)
- **Wallets**: Device Authentication (WebAuthn/Passkeys)

### Directory Structure
- `pages/` - Next.js routes (token details, swap, collections, etc.)
- `src/components/` - Shared UI components
- `src/TokenDetail/` - Token analytics page components
- `src/collection/` - NFT collection components
- `src/redux/` - Redux store configuration and slices
- `src/utils/` - Utility functions including XRPL parsing
- `public/locales/` - i18n translations (en, es)

### Key Features
1. **Token Analytics**: Real-time price charts, order books, trading history
2. **NFT Marketplace**: Collection browsing, NFT trading, offer management
3. **DEX Trading**: Direct trading with order placement
4. **Portfolio Management**: User holdings tracking for tokens and NFTs
5. **Device Authentication**: WebAuthn/Passkey-based wallet system with deterministic multi-wallet support

## Environment Configuration

Create `.env` file based on `.env.example`:
- `API_URL` - Backend API endpoint
- `RUN_ENV` - Environment (production/development)
- `MAINTENANCE` - Maintenance mode flag

## Code Standards

- **Formatting**: Prettier with 100 char lines, single quotes, 2-space indent
- **Linting**: ESLint with Next.js core web vitals
- **Styling**: Tailwind CSS with Emotion CSS-in-JS for custom components
- **State Management**: Redux slices in `src/redux/`

## Important Patterns

### XRPL Integration
- Amount parsing utilities in `src/utils/parse/`
- Transaction handling in `src/utils/tx.js`
- WebSocket connections for real-time data

### Routing
- Dynamic routes use `[slug]` pattern
- Token routes: `/token/[...slug]`
- NFT routes: `/nft/[...nftokenid]`
- Collection routes: `/collection/[slug]`

### Theme System
- Light/Dark themes in `src/theme/`
- Custom isDark prop pattern (no theme provider in new components)
- Use `const isDark = themeName === 'XrplToDarkTheme'` from AppContext

## UI Design Guidelines - MUST FOLLOW

### Technology Stack
**DO NOT USE Material-UI (MUI)** - The codebase has migrated away from MUI.

**Approved Stack:**
1. **Styling**: Tailwind CSS with `cn()` utility (see `pages/news.js`)
2. **Custom Components**: @emotion/styled for styled components
3. **Icons**: Lucide React (`lucide-react`)
4. **State Management**: React hooks (useState, useEffect, useContext)
5. **Theme**: Custom isDark prop pattern (no theme provider)

### Clean, Minimalist Design Principles
1. **Flat Design Only**
   - NO gradients on buttons or backgrounds
   - NO box shadows or drop shadows
   - NO 3D effects or transforms
   - Use solid colors with alpha transparency for depth

2. **Borders and Radius**
   - Border radius: `rounded-xl` (12px) for containers
   - Border width: `border-[1.5px]` consistently
   - Border colors: `border-white/10` (dark) or `border-gray-200` (light)

3. **Typography**
   - Font weights: 400-500 (normal-medium) - NO bold 600+
   - Font sizes: `text-sm`, `text-[13px]`, `text-[15px]`
   - Uppercase for labels: `text-[11px] font-medium uppercase tracking-wide`
   - Use `font-normal` by default

4. **Spacing**
   - Padding: `p-4`, `px-4 py-2`
   - Gaps: `gap-2`, `gap-4`
   - Margins: `mb-4`, `mt-4`

5. **Color Palette**
   - Primary: `#4285f4` (blue) / CSS variable `text-primary`
   - Dark mode: `bg-black`, `text-white`, `border-white/10`
   - Light mode: `bg-white`, `text-gray-900`, `border-gray-200`
   - Hover: `hover:border-primary hover:bg-primary/5`

6. **Buttons**
   ```jsx
   // ✅ CORRECT Tailwind pattern
   <button
     className={cn(
       "rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal",
       isDark ? "border-gray-700 hover:border-primary" : "border-gray-300 hover:bg-gray-100"
     )}
   >
     Button Text
   </button>
   ```

7. **Icons**
   - Use Lucide React: `import { Icon } from 'lucide-react'`
   - Size: `<Icon size={14} />` or `<Icon size={16} />`
   - NO emoji icons

8. **Hover States**
   - Subtle only: `hover:border-primary hover:bg-primary/5`
   - NO transforms, NO animations
   - Border color emphasis only

9. **Theme Pattern**
   ```jsx
   const { themeName } = useContext(AppContext);
   const isDark = themeName === 'XrplToDarkTheme';

   <div className={cn(isDark ? "bg-black text-white" : "bg-white text-gray-900")}>
   ```

### Example Implementation (see pages/news.js)
```jsx
import { cn } from 'src/utils/cn';
import { Search } from 'lucide-react';

function Component({ isDark }) {
  return (
    <div className={cn(
      "rounded-xl border-[1.5px] p-4",
      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
    )}>
      <button className={cn(
        "flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal",
        isDark ? "border-white/15 hover:bg-primary/5" : "border-gray-300 hover:bg-gray-100"
      )}>
        <Search size={14} />
        Search
      </button>
    </div>
  );
}
```

## Wallet Authentication System Architecture

### Overview
The wallet system supports multiple authentication methods (OAuth providers, Email, Passkeys) with 25 wallets per authentication method. Each method uses a unified storage system with encrypted wallets in IndexedDB and profile metadata in localStorage.

### Core Components - DO NOT MODIFY WITHOUT UNDERSTANDING

#### 1. `src/utils/encryptedWalletStorage.js`
**Purpose**: Unified encrypted wallet storage handling all authentication methods

**Key Methods - CRITICAL BEHAVIOR**:

1. **`handleSocialLogin(profile, accessToken, backend)`** (lines 695-788)
   - Called during OAuth callback to check if user has existing wallets
   - **MUST follow this exact flow**:
     - Check for stored password in IndexedDB: `wallet_pwd_${provider}_${userId}`
     - If password exists:
       - First try localStorage for quick profile lookup
       - **FALLBACK**: If localStorage empty, decrypt ALL wallets from IndexedDB using stored password
       - Restore profiles to localStorage (lines 731-774)
       - Return `{ success: true, wallet, allWallets, requiresPassword: false }`
     - If no password: Return `{ requiresPassword: true, action: 'create' }`
   - **WHY**: Prevents re-asking for password on subsequent logins when localStorage is cleared

2. **`getAllWalletsForProvider(provider, providerId, password)`** (lines 669-688)
   - Decrypts ALL wallets from IndexedDB for a specific OAuth provider
   - Used for auto-loading wallets on re-login
   - Filters by `provider` and `provider_id` fields

3. **`setSecureItem(key, value)`** (lines 203-217)
   - Stores passwords in IndexedDB (not localStorage) when key starts with `wallet_pwd_`
   - Uses `storeProviderPassword()` for encryption
   - **NEVER store passwords in plain localStorage**

4. **`getSecureItem(key)`** (lines 219-232)
   - Retrieves passwords from IndexedDB when key starts with `wallet_pwd_`
   - Uses `getProviderPassword()` for decryption

#### 2. `src/components/Wallet.js`
**Purpose**: Main wallet modal and OAuth authentication handlers

**Critical Flow - DO NOT BREAK**:

1. **OAuth Redirect Check (lines 2339-2375)**
   ```javascript
   // Check for OAuth session data
   const oauthToken = sessionStorage.getItem('oauth_temp_token');
   const oauthProvider = sessionStorage.getItem('oauth_temp_provider');

   if (oauthToken && oauthProvider) {
     if (!accountProfile) {
       // Only redirect if user is NOT logged in
       window.location.href = '/wallet-setup';
     } else {
       // User already logged in - clean up stale OAuth data
       sessionStorage.removeItem('oauth_temp_token');
       // ... clear all oauth_temp_* keys
     }
   }
   ```
   - **WHY**: Prevents redirect loop when stale OAuth data exists after login

2. **Password Storage After Wallet Creation** (lines 1603-1606)
   ```javascript
   const walletId = `${provider}_${user.id}`;
   await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, oauthPassword);
   ```
   - **CRITICAL**: Must save password to enable auto-login on subsequent logins

3. **Session Cleanup** (lines 1589-1596)
   ```javascript
   sessionStorage.removeItem('oauth_temp_token');
   sessionStorage.removeItem('oauth_temp_provider');
   sessionStorage.removeItem('oauth_temp_user');
   sessionStorage.removeItem('oauth_action');
   ```
   - **MUST happen immediately after wallet creation**
   - Prevents redirect loop on page refresh

#### 3. `pages/wallet-setup.js`
**Purpose**: Dedicated password setup page for new OAuth users

**Flow**:
1. Validates OAuth session data from sessionStorage (lines 52-70)
2. Redirects to home if no valid OAuth data
3. Creates 25 wallets on password submit (lines 101-138)
4. Saves password for provider (lines 157-159)
5. Clears OAuth session data (lines 145-149)
6. Logs in and redirects to home (lines 177-185)

### Storage Architecture - NEVER CHANGE

#### Data Locations
1. **IndexedDB (`XRPLWalletDB`)**:
   - Encrypted wallet seeds (address, publicKey, seed)
   - Encrypted provider passwords (`__pwd__${providerId}`)
   - Lookup hashes for quick retrieval

2. **localStorage**:
   - `profiles` - Array of wallet metadata (NO seeds)
   - Encrypted auth tokens and user data (`jwt_enc`, `authMethod_enc`)
   - Backup flags (`wallet_needs_backup_${address}`)

3. **sessionStorage (temporary)**:
   - OAuth flow data (cleared after setup):
     - `oauth_temp_token` - JWT from OAuth provider
     - `oauth_temp_provider` - Provider name (google, twitter, email)
     - `oauth_temp_user` - User profile data
     - `oauth_action` - Action type (create/login)

#### Profile Structure
```javascript
{
  account: 'rXXX...',        // XRPL address
  address: 'rXXX...',        // Same as account
  publicKey: 'ED...',        // Public key
  wallet_type: 'oauth',      // Type: oauth, device
  provider: 'twitter',       // OAuth provider
  provider_id: '12345',      // Provider user ID
  accountIndex: 0,           // Wallet index (0-24)
  createdAt: 1234567890,     // Timestamp
  tokenCreatedAt: 1234567890 // UI timestamp
  // NOTE: seed is NEVER in profiles - only in encrypted IndexedDB
}
```

### Authentication Flow - MUST MAINTAIN

#### First Time Login (New User)
1. User clicks OAuth button (Google/Twitter/Email)
2. Redirected to OAuth provider
3. Returns to `/callback` with auth code/token
4. `callback.js` calls `handleSocialLogin()`
5. No password found → `requiresPassword: true`
6. Redirect to `/wallet-setup` with session data
7. User creates password → 25 wallets generated
8. Password saved to IndexedDB: `wallet_pwd_${provider}_${userId}`
9. Wallets encrypted and stored in IndexedDB
10. Profiles saved to localStorage
11. Session data cleared
12. User logged in

#### Subsequent Login (Returning User)
1. User clicks OAuth button
2. Returns to `/callback` with auth code/token
3. `callback.js` calls `handleSocialLogin()`
4. **Password found in IndexedDB** ✅
5. Check localStorage for profiles:
   - **Found**: Return profiles immediately (fast path)
   - **Empty**: Decrypt all wallets from IndexedDB using stored password
6. Restore profiles to localStorage
7. Return `requiresPassword: false`
8. Auto-login with first wallet
9. No password prompt needed

### Critical Rules - NEVER VIOLATE

1. **NEVER remove the IndexedDB fallback** (lines 731-774 in encryptedWalletStorage.js)
   - localStorage can be cleared by user/browser
   - IndexedDB is persistent and contains encrypted wallets
   - System MUST decrypt from IndexedDB when localStorage is empty

2. **NEVER ask for password if stored password exists AND wallets decrypt successfully**
   - Stored password = wallets were created before
   - Auto-decrypt and restore profiles

3. **ALWAYS clear OAuth session data after wallet creation**
   - Prevents redirect loops
   - Session data is temporary for setup only

4. **NEVER store wallet seeds in localStorage**
   - Seeds only in encrypted IndexedDB
   - Profiles in localStorage contain addresses only

5. **Provider password key format MUST be**: `wallet_pwd_${provider}_${userId}`
   - Used to identify returning users
   - Enables auto-login without password prompt

### Debugging Common Issues

**Issue**: User redirected to `/wallet-setup` even when already logged in
- **Cause**: Stale `oauth_temp_*` keys in sessionStorage
- **Fix**: Lines 2359-2364 in Wallet.js clear stale data when user is logged in

**Issue**: User asked for password on every login
- **Cause**: Password exists but localStorage profiles cleared
- **Fix**: Lines 731-774 in encryptedWalletStorage.js decrypt from IndexedDB

**Issue**: Lost all wallets after logout
- **Cause**: localStorage cleared, no IndexedDB fallback
- **Fix**: MUST have IndexedDB decryption fallback (current implementation)

## Wallet Encryption Standards

### Encryption Requirements (OWASP 2025)
1. **PBKDF2 Key Derivation**
   - Minimum 600,000 iterations for PBKDF2-HMAC-SHA256
   - Minimum 210,000 iterations for PBKDF2-HMAC-SHA512
   - Use unique salt per wallet (16+ bytes)

2. **AES-GCM Encryption**
   - 256-bit key length
   - 12-byte IV (unique per encryption)
   - Authenticated encryption mode

3. **Storage Format**
   - Combine salt + IV + encrypted data
   - Store as base64 string for portability
   - Include version number for future migrations

4. **PIN Security**
   - Minimum 6 digits
   - No sequential patterns (123456)
   - No repeating patterns (111111)
   - Enhanced with static entropy before key derivation

### Implementation Pattern
```javascript
// Key derivation (600k iterations for OWASP compliance)
const key = await crypto.subtle.deriveKey({
  name: 'PBKDF2',
  salt: salt,
  iterations: 600000,  // OWASP 2025 standard
  hash: 'SHA-256'
}, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

// Encryption format: base64(salt || iv || ciphertext)
```