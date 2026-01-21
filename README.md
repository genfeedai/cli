# @genfeedai/cli

[![npm version](https://img.shields.io/npm/v/@genfeedai/cli.svg)](https://www.npmjs.com/package/@genfeedai/cli)
[![CI](https://github.com/genfeedai/cli/actions/workflows/ci.yml/badge.svg)](https://github.com/genfeedai/cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```
   ___            __             _    ___ _    ___
  / __|___ _ _   / _|___ ___ ___| |  / __| |  |_ _|
 | (_ / -_) ' \ |  _/ -_) -_) -_) | | (__| |__ | |
  \___\___|_||_||_| \___\___\___|_|  \___|____|___|

  > What image | video do you want to create? _
```

CLI tool for [Genfeed.ai](https://genfeed.ai) - Generate AI images and videos from your terminal.

## Requirements

- Node.js 18+
- A [Genfeed.ai](https://genfeed.ai) account with API access

## Installation

Using bun (recommended):

```bash
bun add -g @genfeedai/cli
```

Using npm:

```bash
npm install -g @genfeedai/cli
```

## Quick Start

Login with your API key:

```bash
genfeed login
```

Generate an image:

```bash
genfeed generate image "A futuristic cityscape at sunset"
```

Generate a video:

```bash
genfeed generate video "A drone flying over mountains"
```

## Authentication

Get your API key from the [Genfeed.ai dashboard](https://app.genfeed.ai/settings/api-keys).

Interactive login:

```bash
genfeed login
```

Non-interactive login:

```bash
genfeed login --key gf_live_xxx
```

Check current user:

```bash
genfeed whoami
```

Logout:

```bash
genfeed logout
```

## Commands

### Brand Management

List all brands:

```bash
genfeed brands
```

Select active brand:

```bash
genfeed brands select
```

Show current brand:

```bash
genfeed brands current
```

### Image Generation

Basic generation:

```bash
genfeed generate image "Your prompt here"
```

With options:

```bash
genfeed generate image "Your prompt" --model imagen-4 --width 1920 --height 1080 --output ./image.jpg
```

Don't wait for completion:

```bash
genfeed generate image "Your prompt" --no-wait
```

### Video Generation

Basic generation:

```bash
genfeed generate video "Your prompt here"
```

With options:

```bash
genfeed generate video "Your prompt" --model google-veo-3 --duration 10 --resolution 1080p --output ./video.mp4
```

### Check Status

Check image status:

```bash
genfeed status <id>
```

Check video status:

```bash
genfeed status <id> --type video
```

## Options

### Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON (for scripting) |
| `--help` | Show help |
| `--version` | Show version |

### Generation Options

| Option | Description |
|--------|-------------|
| `-m, --model <model>` | Model to use |
| `-b, --brand <id>` | Override active brand |
| `-o, --output <path>` | Download to file |
| `--no-wait` | Don't wait for completion |

### Image-specific Options

| Option | Description |
|--------|-------------|
| `-w, --width <px>` | Image width |
| `-h, --height <px>` | Image height |

### Video-specific Options

| Option | Description |
|--------|-------------|
| `-d, --duration <sec>` | Video duration |
| `-r, --resolution <res>` | Resolution (720p, 1080p, 4k) |

## Scripting

Use `--json` for machine-readable output:

Get image URL:

```bash
URL=$(genfeed generate image "prompt" --json | jq -r '.url')
```

Check status programmatically:

```bash
STATUS=$(genfeed status abc123 --json | jq -r '.status')
```

## Configuration

Config is stored in `~/.config/genfeed/config.json`:

```json
{
  "apiKey": "gf_live_xxx",
  "apiUrl": "https://api.genfeed.ai/v1",
  "activeBrand": "507f1f77bcf86cd799439011",
  "defaults": {
    "imageModel": "imagen-4",
    "videoModel": "google-veo-3"
  }
}
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
