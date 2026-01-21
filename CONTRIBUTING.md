# Contributing to @genfeedai/cli

Thanks for your interest in contributing to the Genfeed CLI!

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/genfeedai/cli.git
cd cli
```

2. Install dependencies:

```bash
bun install
```

3. Run in development mode:

```bash
bun run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Run CLI in development mode |
| `bun run build` | Build for production |
| `bun run lint` | Run Biome linter |
| `bun run lint:fix` | Fix lint issues |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Configuration is in `biome.json`.

Before submitting a PR:

```bash
bun run lint:fix
bun run typecheck
bun run test
```

## Project Structure

```
src/
├── api/          # API client and service modules
├── commands/     # CLI command implementations
├── config/       # Configuration management
├── ui/           # Terminal UI utilities
└── utils/        # Shared utilities
tests/            # Test files (mirrors src/ structure)
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure all checks pass (`bun run lint && bun run typecheck && bun run test`)
5. Commit with a descriptive message
6. Push to your fork
7. Open a Pull Request

## Commit Messages

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Reporting Issues

When reporting issues, please include:

- CLI version (`genfeed --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior

## Questions?

Open a [GitHub Discussion](https://github.com/genfeedai/cli/discussions) for questions or ideas.
