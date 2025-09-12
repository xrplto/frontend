# Repository Guidelines

## Project Structure & Module Organization
- Framework: Next.js (pages router).
- App code: `pages/` (routes, API under `pages/api/`), `src/` (feature modules).
- Key modules: `src/components/`, `src/redux/`, `src/hooks/`, `src/utils/`, `src/theme/`, `src/TokenList/`, `src/TokenDetail/`.
- Assets & i18n: `public/` (icons, locales, static).
- Config: `next.config.js`, `.eslintrc.json`, `.prettierrc`, `jsconfig.json`.

## Build, Test, and Development Commands
- Dev server: `npm run dev` (port 3002).
- Build: `npm run build` (production bundle).
- Start: `npm start` (serves build on port 3001). Prod: `npm run production` (port 80).
- Static export: `npm run builds` or `npm run export`.
- Bundle analyze: `npm run analyze`.
- Format: `npm run format`.

## Coding Style & Naming Conventions
- Prettier: 2-space indent, single quotes, width 100, no trailing commas.
- ESLint: extends `next/core-web-vitals`; React hook and a11y rules relaxed where practical.
- Components: PascalCase (`TokenRow.jsx`); hooks: `useSomething.js`; utilities: camelCase.
- Pages map to routes (e.g., `pages/market-metrics.js` → `/market-metrics`).
- Prefer function components + hooks; avoid anonymous default exports.

## Testing Guidelines
- No test runner is configured yet. When adding tests, prefer Jest + React Testing Library.
- Location: alongside code as `*.test.js(x)` or under `src/__tests__/`.
- Scope: cover reducers, utils, and complex components. Keep tests deterministic and isolated.

## Commit & Pull Request Guidelines
- Commit style: adopt Conventional Commits where possible: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`.
- PRs must include: purpose/summary, linked issues, before/after screenshots for UI, and brief testing notes.
- Pre-Push checklist: `npm run format`, `npm run build`, remove debug logs, update docs if behavior changes.

## Security & Configuration Tips
- Secrets: copy `.env.example` → `.env`; never commit secrets. Client-exposed env vars must start with `NEXT_PUBLIC_`.
- Network/data: avoid hard-coding endpoints; use config utilities under `src/utils/` when available.
- Accessibility/perf: follow Next.js best practices; prefer `<Image>` unless intentionally using `<img>` (rule is relaxed but be intentional).

