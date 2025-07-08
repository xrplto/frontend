# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Wallets**: GemWallet, Crossmark SDK

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
5. **Multi-wallet Support**: GemWallet and Crossmark integration

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