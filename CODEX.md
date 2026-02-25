# Genfeed CLI

Codex-specific entry point. Unified CLI tool (`@genfeedai/cli`) — generate, train, publish, manage AI content.

## Codex-Specific Notes

- **No network**: API calls will fail in sandbox. Focus on code structure, types, validation.
- **ESM only**: `"type": "module"` — use `.js` extensions in imports.
- **No `console.log`**: use ora spinners or chalk-themed output via `src/ui/theme.ts`.

## Key Entry Points

- **Entry**: `src/index.ts`
- **Commands**: `src/commands/`
- **API client**: `src/api/client.ts`
- **Config**: `src/config/`

## Documentation

- `.agents/SESSIONS/` - Session logs
- `../.agents/` - Workspace-level architecture and rules
- `CLAUDE.md` - Full reference
