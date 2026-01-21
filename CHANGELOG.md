# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-21

### Added

- Initial release of the Genfeed CLI
- `genfeed login` - Authenticate with API key
- `genfeed logout` - Remove stored credentials
- `genfeed whoami` - Display current user information
- `genfeed brands` - List and select brands
- `genfeed brands select` - Select active brand
- `genfeed generate image` - Generate AI images
- `genfeed generate video` - Generate AI videos
- `genfeed status` - Check generation job status
- Configuration persistence via `conf`
- Colorful terminal output with `chalk`
- Interactive prompts with `@inquirer/prompts`
- Progress spinners with `ora`

[Unreleased]: https://github.com/genfeedai/cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/genfeedai/cli/releases/tag/v0.1.0
