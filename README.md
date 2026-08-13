# LaunchDesk 🚀

**Your AI app-launch copilot.** Paste your App Store or Play Store link → get a
graded ASO report, an AI rewrite that clears a 28-rule quality gate, and a verified
promo kit (deep links, QR codes, smart banners, per-channel publish payloads).

Built for **HackOnVibe — August 2026** · Track: **Global Impact**.

> **Live demo (Real AI):** https://launchdesk.pages.dev
> **Live demo (org / CI):** https://2026-08-nashki.hackonvibe.com

## Problem

Indie & solo developers publish a new mobile app, then face the "Day 1" promotion
wall: they don't know their listing is weak, can't afford a marketing agency, and
have no easy way to fix the store listing or start promoting. LaunchDesk closes
that gap — a functional backend, real store data, and deterministic quality gates,
so every output is personally tied to the app the user pasted.

## Features

1. **Paste & Grade** — fetch the real listing from the Apple Lookup API or Google
   Play metadata, then score it against **28 deterministic ASO rules** (title,
   subtitle, keywords, description, visual, social proof, category, metadata).
2. **AI Rewrite Loop** — rewrite the listing so it clears the quality gate. Uses
   OpenRouter when a key is present; otherwise a deterministic engine keeps the
   product working **zero-setup** (it never breaks in a demo).
3. **Promo Kit** — generates a custom deep link, scannable QR code, smart-banner
   HTML snippet, and per-channel publish copy (X, LinkedIn, Reddit, Telegram).

## Stack

- **Frontend:** Vite + React 19 + Tailwind CSS v4 (static SPA)
- **Backend:** Cloudflare Pages Functions (`functions/api/*.ts`)
- **LLM:** OpenRouter (optional) + deterministic fallback
- **State:** Zustand (persisted to `localStorage`)
- **CI/CD:** GitHub Actions → Cloudflare Pages

## Local development

```bash
npm install
npm run dev          # Vite dev server on :5173
npm test             # unit tests (vitest)
npm run typecheck    # tsc --noEmit
npm run build        # static build -> dist/
```

**Enabling real AI output (optional):**
```bash
cp .dev.vars.example .dev.vars   # add OPENROUTER_API_KEY=
```
Everything works without a key — the deterministic fallback engine produces valid,
useful revisions so the product never fails during a live demo.

## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/analyze` | `{ storeUrl }` → listing + 28-rule score |
| POST | `/api/revise` | `{ listing, targetScore }` → AI/deterministic rewrite + before/after score |
| POST | `/api/kit` | `{ listing }` → deep link, QR, smart banner, publish payload |
| GET | `/api/health` | liveness check |
| GET | `/api/envcheck` | diagnostic: reports whether `OPENROUTER_API_KEY` is present (boolean only) |

## Deployment

Push to `main` → GitHub Actions builds and deploys to Cloudflare Pages.
Live at: `https://2026-08-nashki.hackonvibe.com`

### Manual deploy (optional)

This project is a **Cloudflare Pages** app (static `dist/` + `functions/`), not a
Worker. When deploying manually from the Cloudflare dashboard, upload the
**built assets** (`dist/`) to the existing **Pages** project `2026-08-nashki` —
do not create a new Worker (that raises
`Missing entry-point to Worker script or to assets directory`).

From the CLI the correct command is:

```bash
npm run build        # produces dist/
npm run deploy       # wrangler pages deploy dist --project-name=2026-08-nashki
npm run deploy:own   # deploy to your own account: project "launchdesk"
```

> Note: do not add a `wrangler.jsonc` to this repo — Cloudflare may misdetect the
> project as a Worker (`Missing entry-point to Worker script or to assets directory`).
> It was intentionally removed.

**Keeping your own repo in sync (optional):**

The repo is mirrored to `https://github.com/ikhsanRamadhan/launchdesk` so you have
your own copy. It does **not** auto-sync — pull the upstream changes and push them
manually whenever the source repo updates:

```bash
git pull origin main      # pull latest from HackOnVibeCom/2026-08-nashki
git push upstream main    # mirror to ikhsanRamadhan/launchdesk
```

> Note: a Cloudflare Pages project that is **Direct Upload** cannot be switched to
> Git integration (per Cloudflare docs). `launchdesk.pages.dev` therefore stays a
> manual deploy: `npm run build && npm run deploy:own`.

**Enabling real AI output on your own Pages project:**
- Set `OPENROUTER_API_KEY` (Encrypt) and `OPENROUTER_MODEL=openrouter/auto-beta` under
  Pages → `launchdesk` → Settings → Variables and Secrets, then redeploy.
- Verify: `GET /api/envcheck` returns `{"hasOpenRouterKey":true,...}`.

## Project structure

```
functions/api/    Cloudflare Pages Functions (analyze, revise, kit, health)
src/lib/aso-rules 28 deterministic ASO rules + scorer (the quality gate)
src/lib/extract   Apple Lookup API + Play Store metadata fetch
src/lib/llm       OpenRouter client + deterministic fallback
src/lib/promo     deep link / QR / smart banner / publish payload
src/components    Landing, Analyze, Result, Revise, PromoKit
src/store         Zustand persisted app state
```

## License

MIT
