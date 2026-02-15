# Genfeed CLI

**Unified CLI for Genfeed.ai (`@genfeedai/cli`). Generate, train, publish, and manage AI content from the terminal.**

Project guidance lives in `.agents/`. Docs in `.agents/`.

## Tech Stack

- TypeScript (ESM)
- Commander.js (CLI framework)
- chalk, ora (UI)
- Inquirer (interactive prompts)
- zod (validation)
- ofetch (HTTP client)
- socket.io-client (real-time)
- Biome (lint/format)
- Vitest (tests)
- bun (runtime + bundler)

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Run CLI from source (bun run src/index.ts)
bun run build            # Build to dist/ (bun build)
bun run build:standalone # Compile standalone binary (gf)
bun run lint             # Biome check
bun run lint:fix         # Biome auto-fix
bun run typecheck        # tsc --noEmit
bun run test             # Vitest run
bun run test:watch       # Vitest watch mode
```

## Structure

- `src/index.ts` - Entry point, Commander program setup
- `src/commands/` - CLI commands (login, generate, train, publish, darkroom, etc.)
- `src/commands/generate/` - Image and video generation subcommands
- `src/api/` - API client layer (auth, brands, darkroom-api, images, videos)
- `src/api/client.ts` - Base HTTP client (ofetch)
- `src/config/` - Config schema (zod) and persistent store
- `src/middleware/` - Auth guard middleware
- `src/scripts/` - Script runner
- `src/ui/` - Terminal theme (chalk colors)
- `src/utils/` - Shared utilities
- `tests/` - Test files

## Binary

Published as `@genfeedai/cli` on npm. Binary names: `genfeed`, `gf`.

## Critical Rules

1. **No `any` types** -- define interfaces
2. **No `console.log`** -- use ora spinners or chalk-themed output via `src/ui/theme.ts`
3. **ESM only** -- `"type": "module"` in package.json
4. **Biome enforced** -- lint-staged runs on commit via husky

## Docs

- `.agents/SESSIONS/` - Session logs
- `../.agents/` - Workspace-level architecture/rules/SOPs
