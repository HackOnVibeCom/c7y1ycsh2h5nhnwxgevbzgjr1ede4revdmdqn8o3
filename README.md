# LaunchDesk 🚀

**Your AI app-launch copilot.** Paste your App Store or Play Store link → get a
graded ASO report, an AI rewrite that clears a 28-rule quality gate, and a verified
promo kit (deep links, QR codes, smart banners, per-channel publish payloads).

Built for **HackOnVibe — August 2026** · Track: **Business Success**.

> **Live demo (Real AI):** https://launchdesk.pages.dev
> **Live demo (org / CI):** https://2026-08-nashki.hackonvibe.com

## Problem

Indie & solo developers publish a new mobile app, then face the "Day 1" promotion
wall: they don't know their listing is weak, can't afford a marketing agency, and
have no easy way to fix the store listing or start promoting. LaunchDesk closes
that gap — a functional backend, real store data, and deterministic quality gates,
so every output is personally tied to the app the user pasted.

## Why it makes business sense

App-store discovery is pay-to-win: developers who gamble with a weak listing lose
millions of impression, while agencies charge $200–$2,000/mo for what LaunchDesk
automates in seconds. LaunchDesk is the low-cost "marketing developer" solo devs
can't afford — it grades their listing against a transparent 28-rule quality gate,
rewrites copy until the score clears, and hands them publishable launch assets. The
business model is a freemium funnel: **free** Analyze + one Revise per app (zero
setup, no key) draws users in; **Pro** (recurring or per-grant subscription) unlocks
unlimited revisions, batch app tracking, and priority AI extraction. TAM = the
millions of indie/solo developers who publish to the App Store and Google Play but
can't pay an agency — an underserved, developer-heavy, globally distributed market.

## Features

1. **Paste & Grade** — fetch the real listing from the Apple Lookup API (retry +
   `apps.apple.com` scrape fallback) or Google Play (locale fallback + HTML
   extraction of screenshots/trailer video/full description/developer), scored
   against **28 deterministic ASO rules** (title, subtitle, keywords, description,
   visual, social proof, category, metadata).
2. **AI Rewrite Loop** — rewrite the listing so it clears the quality gate. Uses
   OpenRouter when a key is present; otherwise a deterministic engine keeps the
   product working **zero-setup** (it never breaks in a demo).
3. **AI-first extraction** — when an OpenRouter key is present, an AI pass cleans
   the text fields (title, description, category, developer, price) from the
   fetched page; screenshots and video URLs stay deterministic (real URLs from the
   page, never invented). AI failure → automatic fallback to the deterministic
   extractor.
4. **Promo Kit** — generates a custom deep link, scannable QR code, smart-banner
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
- Set `OPENROUTER_API_KEY` (Encrypt) and optionally `OPENROUTER_MODEL` (default
  `openrouter/auto`) under Pages → `launchdesk` → Settings → Variables and Secrets,
  then redeploy.
- Verify: `GET /api/envcheck` returns `{"hasOpenRouterKey":true,...}`,
  `POST /api/revise` returns `"source":"ai"`, and `POST /api/analyze` returns
  AI-refined listings (currently verified live on https://launchdesk.pages.dev:
  Mobile Legends → B/83, Duolingo → B/86, TikTok → A/90).

## Project structure

```
functions/api/    Cloudflare Pages Functions (analyze, revise, kit, health)
src/lib/aso-rules 28 deterministic ASO rules + scorer (the quality gate)
src/lib/extract  Apple Lookup API (retry + apps.apple.com scrape fallback) + Play Store HTML fetch (locale fallback, screenshot/trailer/full-description extraction) + AI-first text refinement (ai.ts)
src/lib/llm       OpenRouter client + deterministic fallback
src/lib/promo     deep link / QR / smart banner / publish payload
src/components    Landing, Analyze, Result, Revise, PromoKit
src/store         Zustand persisted app state
```

## License

MIT
