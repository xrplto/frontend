# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL INSTRUCTIONS - MUST FOLLOW

### DO NOT RUN THESE COMMANDS
1. **DO NOT START `npm run dev`** - Development server should not be started
2. **DO NOT RUN `npm run build`** - Build process should not be initiated
3. **DO NOT RUN `npm install`** - Package installation should not be executed

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
- **UI**: Material-UI v5, Emotion, Styled Components
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
- **Styling**: Emotion CSS-in-JS, Material-UI theme system
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
- Theme provider wraps entire app
- Material-UI theme customization