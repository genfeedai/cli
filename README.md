# @genfeedai/cli

```
  ╭──────────────────────────────────────────────────────────────╮
  │                                                              │
  │     ░██████╗░███████╗███╗░░██╗███████╗███████╗███████╗██████╗│
  │     ██╔════╝░██╔════╝████╗░██║██╔════╝██╔════╝██╔════╝██╔══██╗
  │     ██║░░██╗░█████╗░░██╔██╗██║█████╗░░█████╗░░█████╗░░██║░░██║
  │     ██║░░╚██╗██╔══╝░░██║╚████║██╔══╝░░██╔══╝░░██╔══╝░░██║░░██║
  │     ╚██████╔╝███████╗██║░╚███║██║░░░░░███████╗███████╗██████╔╝
  │     ░╚═════╝░╚══════╝╚═╝░░╚══╝╚═╝░░░░░╚══════╝╚══════╝╚═════╝░
  │                                                              │
  │     ❯ What image | video do you want to create? █            │
  │                                                              │
  ╰──────────────────────────────────────────────────────────────╯
```

CLI tool for [Genfeed.ai](https://genfeed.ai) - Generate AI images and videos from your terminal.

## Installation

```bash
# Using bun (recommended)
bun add -g @genfeedai/cli

# Using npm
npm install -g @genfeedai/cli
```

## Quick Start

```bash
# Login with your API key
genfeed login

# Generate an image
genfeed generate image "A futuristic cityscape at sunset"

# Generate a video
genfeed generate video "A drone flying over mountains"
```

## Authentication

Get your API key from the [Genfeed.ai dashboard](https://app.genfeed.ai/settings/api-keys).

```bash
# Interactive login
genfeed login

# Non-interactive login
genfeed login --key gf_live_xxx

# Check current user
genfeed whoami

# Logout
genfeed logout
```

## Commands

### Brand Management

```bash
# List all brands
genfeed brands

# Select active brand
genfeed brands select

# Show current brand
genfeed brands current
```

### Image Generation

```bash
# Basic generation
genfeed generate image "Your prompt here"

# With options
genfeed generate image "Your prompt" \
  --model imagen-4 \
  --width 1920 \
  --height 1080 \
  --output ./image.jpg

# Don't wait for completion
genfeed generate image "Your prompt" --no-wait
```

### Video Generation

```bash
# Basic generation
genfeed generate video "Your prompt here"

# With options
genfeed generate video "Your prompt" \
  --model google-veo-3 \
  --duration 10 \
  --resolution 1080p \
  --output ./video.mp4
```

### Check Status

```bash
# Check image status
genfeed status <id>

# Check video status
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

```bash
# Get image URL
URL=$(genfeed generate image "prompt" --json | jq -r '.url')

# Check status programmatically
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

## License

MIT
