# GenFeed CLI — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-07
**Author:** Vincent / Blaise
**Status:** Draft

---

## Executive Summary

The GenFeed CLI (`genfeed`) is the terminal-first interface to the entire GenFeed platform. It mirrors every capability of the web frontend while adding local creation tools ("Forge") that power LoRA training, dataset management, and direct ComfyUI generation. Any AI agent — Claude Code, Codex, Devin, Cursor — should be able to operate GenFeed entirely through this CLI.

**Core principle:** If you can do it in the browser, you can do it in the terminal. Plus things you *can't* do in the browser.

---

## Naming

| Old Name | New Name | What It Is |
|----------|----------|------------|
| `genfeedai/cli` | `@genfeedai/cli` | The CLI package (unchanged) |
| `genfeedai/gpu` | **GenFeed Forge** | Local creation toolkit — training, datasets, ComfyUI |
| GPU tools | `genfeed forge <cmd>` | Merged into CLI as `forge` subcommand |
| GPU scripts | `genfeed forge <cmd>` | Same — all local tools become CLI commands |

> **Note:** "Studio" is taken — `remote-studio` already exists in the cloud platform (video composition/editing). Alternatives considered:
> - **Forge** ← recommended (forging models, forging content)
> - Lab
> - Foundry
> - Workshop

**"Forge"** = your local creative workbench. It's where you train models, curate datasets, generate locally via ComfyUI, and manage influencer personas. The cloud API handles publishing, scheduling, analytics. Forge handles creation.

---

## Architecture

### Two Modes

**1. Interactive REPL** (for humans — like Claude Code):
```
$ genfeed
🔥 GenFeed v1.0.0 | Connected to api.genfeed.ai

> /login
  ↳ Opening browser for login...
  ✅ Logged in as vincent@genfeed.ai (GenFeed AI)

> /generate a luxury editorial photo of a woman by the pool
  ↳ Using model: imagen-4 | Brand: GenFeed AI
  ↳ Generating... ██████████ 100% (4.2s)
  ✅ Image ready → https://cdn.genfeed.ai/img/abc123.png

> /train quincylandx
  ↳ Dataset: 20 images (curated)
  ↳ Base model: z-image-turbo | Steps: 1500 | Rank: 32
  ↳ Training... ████░░░░░░ 42% (ETA: 12m)

> /download @farighi.p --limit 30
  ↳ Downloading 30 posts from @farighi.p...
  ↳ ✅ 24 photos | 6 skipped (videos)

> /status
  GPU: ✅ online (18.2/24GB VRAM) | Queue: 1 job
  Brand: GenFeed AI | Plan: Pro
  Models: z-image-turbo, quincylandx.lora

> /settings
  API: https://api.genfeed.ai/v1
  GPU: 100.x.x.x:8188 (Tailscale)
  Model: imagen-4 (cloud) / z-image-turbo (local)

> /help
```

**2. Non-interactive** (for agents/CI/scripts):
```bash
genfeed generate "prompt" --json
genfeed train quincylandx --watch
genfeed download @handle --limit 50
genfeed publish --image ./photo.png --platforms instagram,tiktok
```

Same commands work both ways. REPL uses `/command`, CLI uses `genfeed command`.

### Auth

**Primary: Clerk OAuth** (like `gh auth login`):
```bash
genfeed login              # Opens browser → Clerk OAuth → saves session
genfeed login --browser    # Explicit browser flow
```

**Fallback: API key** (for agents, CI, headless):
```bash
genfeed login --key <api-key>
GENFEED_API_KEY=gf_... genfeed generate "prompt"
```

Session stored in `~/.genfeed/session.json`. API key stored in `~/.genfeed/credentials.json`.

### Flat Command Structure

```
/login              — Clerk OAuth (browser) or API key
/logout             — Clear session
/whoami             — Current user, org, brand, plan

/generate <prompt>  — Generate image or video (cloud or local)
/train <name>       — Train LoRA model on local GPU
/download <@handle> — Download reference images from Instagram
/curate <dir>       — Auto-filter by face detection + quality
/caption <dir>      — Auto-caption dataset with trigger words
/upload <dir>       — Push dataset to GPU instance

/publish            — Create + schedule post to social platforms
/posts              — List posts (draft, scheduled, published)
/brands             — List/switch brands
/personas           — List/switch personas (brand voices)
/workflows          — List/run workflow automations
/prompts            — Saved prompts + templates

/integrations       — Connected platforms (IG, TikTok, X...)
/analytics          — Content performance + trends
/marketplace        — Browse/publish/purchase workflows
/models             — Available models + training status
/knowledge          — Manage knowledge bases

/settings           — Config (GPU host, default model, API URL)
/status             — Jobs, GPU health, queue, account info
/help               — All commands + usage
```

### Global Flags (non-interactive mode)

```
--json              Machine-readable output (every command)
--quiet             Suppress spinners/formatting
--brand <id>        Override active brand
--local             Force local GPU generation (skip cloud)
--cloud             Force cloud generation (skip local)
--help              Command help
```

---

## Phase 1 — Foundation (Current + Fixes)

**Goal:** Make what exists actually work end-to-end.

### 1.1 Auth & Config (rewrite)

**Interactive (REPL):**
```
/login              → Opens browser → Clerk OAuth → saves session token
/login --key <key>  → API key auth (agents/CI fallback)
/logout             → Clear session + credentials
/whoami             → User, org, brand, plan, usage
/settings           → View/edit config interactively
```

**Non-interactive:**
```bash
genfeed login                         # Clerk OAuth (opens browser)
genfeed login --key gf_abc123        # API key (headless)
GENFEED_API_KEY=gf_... genfeed ...   # Env var (CI/CD)
genfeed logout
genfeed whoami --json
```

**Auth priority:**
1. `--key` flag (highest)
2. `GENFEED_API_KEY` env var
3. Saved Clerk session (`~/.genfeed/session.json`)
4. Saved API key (`~/.genfeed/credentials.json`)
5. Interactive login prompt (lowest)

**Session storage:**
```
~/.genfeed/
├── session.json       # Clerk session token (from OAuth)
├── credentials.json   # API key (from --key or manual)
├── config.json        # Settings (GPU host, defaults, etc.)
└── profiles/          # Named profiles for multi-account
```

**Clerk OAuth flow:**
1. CLI starts local HTTP server on random port
2. Opens browser to `app.genfeed.ai/cli-auth?port=PORT`
3. User logs in via Clerk
4. Clerk redirects back to localhost with session token
5. CLI saves token, closes server

**Fix needed:** Current CLI uses Bearer API key only. Need to add Clerk session token support + the browser OAuth dance. The `api-keys.controller.ts` already exists for API key CRUD.

### 1.2 Brands (exists, verify)

```bash
genfeed brands list              # List all brands
genfeed brands list --json       # JSON output
genfeed brands use <id>          # Set active brand
genfeed brands info <id>         # Brand details
```

### 1.3 Generate (exists, verify routes)

```bash
genfeed generate image "prompt"  # Generate image
  --model imagen-4               # Model selection
  --width 1024 --height 1024     # Dimensions
  --output ./image.png           # Download result
  --no-wait                      # Fire and forget
  --json                         # JSON output

genfeed generate video "prompt"  # Generate video
  --model google-veo-3
  --duration 5
  --resolution 1080p
  --output ./video.mp4
```

**Fix needed:** Verify `POST /images` route exists (authenticated, not just `GET /public/images`). Map `CreateImageDto` fields to CLI options.

### 1.4 Status (exists)

```bash
genfeed status <id>              # Check job status
  --type image|video             # Auto-detects if omitted
  --json
  --watch                        # Poll until complete (NEW)
```

---

## Phase 2 — Core Platform Commands

**Goal:** Full content lifecycle from terminal.

### 2.1 Workflows

```bash
genfeed workflows list                     # All workflows
genfeed workflows list --json
genfeed workflows info <id>                # Workflow details + nodes
genfeed workflows run <id>                 # Execute workflow
  --input "key=value"                      # Input variables
  --watch                                  # Stream execution logs
  --json
genfeed workflows status <execution-id>    # Execution status
genfeed workflows logs <execution-id>      # Full execution logs
genfeed workflows history <id>             # Past executions
```

**Maps to:** `workflows.controller.ts`, `workflow-executions.controller.ts`

### 2.2 Posts & Scheduling

```bash
genfeed posts list                         # All posts
  --status draft|scheduled|published
  --brand <id>
genfeed posts create                       # Create post
  --text "caption"
  --image <id-or-path>
  --video <id-or-path>
  --schedule "2026-02-14T10:00:00Z"
  --platforms instagram,tiktok,twitter
genfeed posts schedule <id> <datetime>     # Schedule existing post
genfeed posts publish <id>                 # Publish now
genfeed posts analytics <id>              # Post performance
```

**Maps to:** `posts.controller.ts`, `posts-operations.controller.ts`, `posts-analytics.controller.ts`

### 2.3 Personas

```bash
genfeed personas list                      # All personas/brand voices
genfeed personas use <id>                  # Set active persona
genfeed personas create                    # Interactive creation
  --name "Shayla Moore"
  --voice "luxury editorial"
  --json
genfeed personas content <id>              # Generated content for persona
```

**Maps to:** `personas.controller.ts`, `personas-content.controller.ts`

### 2.4 Prompts

```bash
genfeed prompts list                       # Saved prompts
genfeed prompts templates                  # Prompt templates
genfeed prompts create "prompt text"       # Save a prompt
genfeed prompts optimize "rough prompt"    # AI-optimize a prompt
```

**Maps to:** `prompts.controller.ts`, `prompt-templates.controller.ts`

### 2.5 Integrations

```bash
genfeed integrations list                  # All connected platforms
genfeed integrations connect <platform>    # OAuth flow (opens browser)
  # Supported: instagram, tiktok, twitter, youtube, linkedin,
  #            pinterest, threads, reddit, medium, facebook,
  #            discord, slack, telegram, fanvue
genfeed integrations disconnect <platform>
genfeed integrations status                # Connection health
```

**Maps to:** `integrations.controller.ts` + per-platform controllers

### 2.6 Content Intelligence

```bash
genfeed intel trends                       # Trending topics
genfeed intel creators                     # Creator analysis
genfeed intel patterns                     # Content patterns
genfeed intel playbooks list               # Playbook strategies
genfeed intel generate                     # AI content suggestions
```

**Maps to:** `content-intelligence/controllers/`

---

## Phase 3 — Forge (Local Creation Toolkit)

**Goal:** Merge all GPU tools into the CLI as `genfeed forge`.

### 3.1 Forge Init

```bash
genfeed forge init                        # Set up local workspace
  --gpu-host <tailscale-ip>                # ComfyUI GPU address
  --comfyui-port 8188                      # ComfyUI port
  --ollama-host localhost:11434            # Ollama for prompt gen
```

Creates `~/.genfeed/forge.json`:
```json
{
  "gpu": {
    "host": "100.x.x.x",
    "port": 8188,
    "protocol": "http"
  },
  "ollama": {
    "host": "localhost",
    "port": 11434,
    "model": "mistral-uncensored"
  },
  "workspace": "~/genfeed-forge",
  "models": {
    "base": "z-image-turbo",
    "upscaler": "4x-UltraSharp",
    "resolution": { "width": 832, "height": 1216 }
  }
}
```

### 3.2 Forge Download

```bash
genfeed forge download <username>          # Download IG photos
  --limit 50                                # Max posts
  --login                                   # Auth for higher res
  --videos                                  # Include videos
  --frames                                  # Auto-extract video frames
  --fps 1                                   # Frames per second
  --out models/<username>/dataset/          # Output dir
```

**Replaces:** `insta-dl.sh` + `video-frames.sh`

### 3.3 Forge Curate

```bash
genfeed forge curate <dir>                 # Auto-filter images
  --best 20                                 # Keep top N
  --min-face 80                             # Min face size (px)
  --trash                                   # Move rejects to trash/
  --json                                    # Output scores as JSON
```

**Replaces:** `face-filter.py`

### 3.4 Forge Caption

```bash
genfeed forge caption <dir>                # Auto-caption dataset
  --trigger <word>                          # Trigger word for LoRA
  --model blip2                             # Captioning model
```

**Replaces:** `caption-dataset.py`

### 3.5 Forge Upload

```bash
genfeed forge upload <dir>                 # Push to GPU instance
  --gpu <host>                              # Override GPU host
```

**Replaces:** `upload-dataset.sh`

### 3.6 Forge Train

```bash
genfeed forge train <name>                 # Train LoRA
  --dataset models/<name>/dataset/
  --base z-image-turbo
  --trigger <word>
  --steps 1500
  --lr 1e-4
  --rank 32
  --watch                                   # Stream training logs
  --json
```

### 3.7 Forge Generate

```bash
genfeed forge generate "prompt"            # Generate via local ComfyUI
  --model z-image-turbo
  --lora <name>                             # Apply LoRA
  --width 832 --height 1216
  --upscale 4x                              # 4x-UltraSharp
  --steps 8
  --seed 12345
  --batch 5                                 # Generate multiple
  --output ./outputs/
  --json
```

### 3.8 Forge Prompter

```bash
genfeed forge prompter                     # Interactive prompt gen
  --character shayla                        # Load character persona
  --scene "pool party"                      # Scene description
  --style editorial                         # Photography style
  --model mistral-uncensored               # Ollama model
  --count 5                                 # Generate N variants
  --json
```

**Replaces:** `nsfw-prompter/generate.sh`

### 3.9 Forge Characters

```bash
genfeed forge characters list              # List all characters
genfeed forge characters info <name>       # Persona details
genfeed forge characters create            # Interactive creation
genfeed forge characters generate <name>   # Generate content for char
  --scene "gym workout"
  --count 10
```

**Replaces:** `new-influencer.sh` + per-character generate scripts

### 3.10 Forge Status

```bash
genfeed forge status                       # GPU health + jobs
  --json
```

Output:
```json
{
  "gpu": { "host": "100.x.x.x", "status": "online", "vram": "18.2/24GB" },
  "comfyui": { "status": "running", "queue": 0 },
  "models": [
    { "name": "z-image-turbo", "type": "base", "loaded": true },
    { "name": "quincylandx", "type": "lora", "trained": true }
  ],
  "characters": 6,
  "training_jobs": []
}
```

---

## Phase 4 — Advanced & Agent-First

### 4.1 Campaigns

```bash
genfeed campaigns list
genfeed campaigns create --name "Valentine Drop" --start 2026-02-14
genfeed campaigns posts <id>               # Posts in campaign
genfeed campaigns analytics <id>           # Campaign performance
```

### 4.2 Analytics

```bash
genfeed analytics overview                 # Dashboard summary
genfeed analytics posts --top 10           # Top performing posts
genfeed analytics platforms                # Per-platform breakdown
genfeed analytics export --format csv      # Export data
```

### 4.3 Knowledge Bases

```bash
genfeed knowledge list
genfeed knowledge create --name "Brand Guidelines"
genfeed knowledge upload <id> <file>       # Add document
genfeed knowledge query <id> "question"    # Query KB
```

### 4.4 Marketplace

```bash
genfeed marketplace browse                 # Browse listings
genfeed marketplace search "anime style"
genfeed marketplace publish <workflow-id>  # Publish your workflow
genfeed marketplace purchase <id>
```

### 4.5 MCP Server

```bash
genfeed mcp serve                          # Start MCP server
  --port 3100
  --transport stdio|sse
```

**Maps to:** `mcp.controller.ts` — allows any MCP-compatible agent to use GenFeed tools natively.

### 4.6 Pipelines (Forge → Cloud)

```bash
# Full pipeline: generate locally → publish to cloud
genfeed forge generate "shayla by the pool" --lora shayla --output ./
genfeed posts create --image ./output.png --text "Living my best life 🌊" --schedule tomorrow-10am --platforms instagram,tiktok
```

```bash
# Full pipeline: download → curate → train → generate
genfeed forge download quincylandx --frames --limit 50
genfeed forge curate models/quincylandx/dataset/ --best 20
genfeed forge caption models/quincylandx/dataset/ --trigger quincylandx
genfeed forge train quincylandx --watch
genfeed forge generate "quincylandx editorial studio shot" --lora quincylandx --batch 10
```

---

## Implementation Priority

| Priority | Phase | Commands | Effort | Impact |
|:--------:|:-----:|----------|:------:|:------:|
| **P0** | 1 | Auth, brands, generate, status (fix existing) | 1 week | Unblocks everything |
| **P0** | 3.1-3.3 | Forge init, download, curate | 1 week | Replaces loose scripts |
| **P1** | 2.1 | Workflows | 1 week | Core product value |
| **P1** | 3.6-3.8 | Forge generate, train, prompter | 2 weeks | Full local pipeline |
| **P1** | 2.2 | Posts & scheduling | 1 week | Content lifecycle |
| **P2** | 2.3-2.5 | Personas, prompts, integrations | 2 weeks | Platform depth |
| **P2** | 3.9 | Forge characters | 1 week | Character management |
| **P3** | 2.6 | Content intelligence | 1 week | Differentiation |
| **P3** | 4.1-4.4 | Campaigns, analytics, KB, marketplace | 3 weeks | Full parity |
| **P3** | 4.5 | MCP server | 1 week | Agent ecosystem |

**Total estimated effort:** ~14 weeks for full parity

**Recommended first sprint (2 weeks):**
1. Fix P1 auth flow (API key → Clerk handshake)
2. Merge Forge tools into CLI (download, curate, frames)
3. Wire up `genfeed forge generate` to ComfyUI API
4. Add `--json` to everything

---

## Technical Decisions

### Stack
- **Runtime:** Bun (already in use)
- **CLI framework:** Commander (already in use)
- **Config:** Conf (already in use)
- **HTTP:** ofetch (already in use)
- **Validation:** Zod (already in use)
- **Interactive:** @inquirer/prompts (already in use)
- **NEW:** Python subprocess for face-filter, captioning (cv2, BLIP)

### Distribution
```bash
npm install -g @genfeedai/cli     # npm/bun global install
brew install genfeed              # Homebrew (stretch)
bun build --compile                # Standalone binary
```

### Config Structure
```
~/.genfeed/
├── config.json          # API config (existing Conf store)
├── forge.json          # Forge/GPU config (new)
├── credentials.json     # API keys (encrypted)
└── profiles/            # Named profiles for multi-account
    ├── default.json
    └── work.json
```

### Agent Compatibility Contract
Every command MUST support:
1. `--json` flag → structured JSON output, no spinners
2. `--quiet` flag → no interactive prompts
3. Non-zero exit code on failure
4. `stderr` for errors, `stdout` for data
5. Deterministic output format (JSON:API where applicable)

---

## Open Questions

1. **Auth model for CLI:** API keys (current) vs Clerk session tokens? API keys are better for agents but need to verify the backend supports them for all endpoints.
2. **Forge Python deps:** face-filter needs opencv. Bundle as subprocess or rewrite in JS?
3. **ComfyUI API:** Document the exact WebSocket protocol for queue/generation.
4. **Offline mode:** Should Forge commands work without cloud connection?
5. **Plugin system:** Allow community commands (`genfeed x <plugin-cmd>`)?

---

## Success Metrics

- [ ] Any AI agent can generate + publish content with 3 commands
- [ ] `genfeed forge` replaces all loose shell scripts in gpu/
- [ ] 100% of commands support `--json`
- [ ] Zero manual browser interaction required for content pipeline
- [ ] First paying client onboarded via CLI (not frontend)
