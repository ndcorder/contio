# Contio

A desktop app that orchestrates multi-model LLM discussions. Multiple AI models discuss a user prompt in rounds, like a Roman senate - challenging claims, building on points, and synthesizing positions.

Port of [Curia](https://github.com/kexxt/Curia) from C#/.NET to Tauri + SvelteKit.

## Features

- **Multi-model discussions** - Select 2+ models to debate any topic
- **Provider support** - OpenAI, Anthropic, Google, and OpenRouter
- **Streaming responses** - See responses as they're generated
- **Auto-conclusion** - Optionally end discussions when consensus is reached
- **Discussion summaries** - AI-generated summaries of completed discussions
- **Conversation history** - Persist and revisit past discussions
- **Local storage** - API keys and conversations stored in browser localStorage

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Tauri)

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Configuration

1. Launch the app
2. Go to Settings (gear icon)
3. Enter API keys for the providers you want to use
4. Select default models (optional)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2 |
| Frontend | Svelte 5 (Runes) |
| Meta-Framework | SvelteKit (SPA mode) |
| Language | TypeScript |
| Build Tool | Vite |
| LLM SDKs | openai, @anthropic-ai/sdk, @google/generative-ai |

## Project Structure

```
src/
├── lib/
│   ├── models/          # Type definitions
│   ├── stores/          # Svelte 5 state (runes)
│   ├── providers/       # LLM SDK wrappers
│   ├── orchestration/   # Discussion logic
│   └── persistence/     # localStorage helpers
├── components/          # UI components
└── routes/              # SvelteKit pages
```

## Development

```bash
# Type check
npm run check

# Build frontend only
npm run build

# Run Tauri dev server
npm run tauri dev
```

## License

MIT
