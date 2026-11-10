# Contributing

## Setup

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local   # optional: every key is optional, Leash runs in demo mode without them
npm run dev
```

## Before you push

```bash
npm run check      # typecheck + lint + tests
npm run format     # Prettier
```

CI runs the same checks plus `npm run build` on every push and pull request.

## Where things go

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short:

- Pure rules and types → `lib/domain/` (no I/O, browser-safe)
- Invoice lifecycle → `lib/services/`
- Gemini → `lib/ai/`, PayPal and connectors → `lib/integrations/`
- Settings → `lib/server/env.ts` (the only place that reads `process.env`)
- Logging → `log` from `lib/server/logger.ts` (no `console.*`)

## Ground rules

- **The AI never sends anything.** Anything that reaches a client (approve, send, remind) must come from a user action. Assistant tools may only *prepare* a confirm card. `tests/agent.test.ts` guards this.
- Never commit `.env.local` or `data/`.
- Add or update tests with behaviour changes. Tests run in demo mode with a mocked PayPal API, so they never need real keys.
