# PLAN.md — LaunchDesk (HackOnVibe August 2026, Global Impact)

> Status: **scaffolding** · Updated: 2026-08-13 · Author: solo (Ikhsandadan)
> Target: **Juara 1 Track Global Impact** · Deadline hard cutoff: **Senin 17 Agu 2026 10:00 WIB**

---

## 1. Konteks (zero-context)

Proyek hackathon solo. Repo: `HackOnVibeCom/2026-08-nashki`, auto-deploy ke Cloudflare
Pages (`2026-08-nashki.hackonvibe.com`) via `.github/workflows/deploy.yml`.

Pipeline deploy:
- package.json di root dengan script `build` → Node 20, `npm ci`/`npm install`, `npm run build`.
- Output deteksi otomatis dari `dist`/`build`/`out`/`.output/public`/`.next-export` (ada `index.html`).
- SPA fallback: `_redirects` (`/* /index.html 200`) ditulis otomatis ke output.
- Backend = **Cloudflare Pages Functions** (folder `functions/` di root repo, handler `fetch`, Web-standard).

Tema: *"Best practical code integration for actual promotion of a newly created mobile application.
Priority pada implementasi yang bisa diverifikasi juri (ide saja tidak dinilai)."*

Kriteria juri: *"A functional backend is valued more highly than visual aesthetics."*

### Riset juri (Juli 2026) — pelajaran yang wajib dihindari
- ❌ Data statis/mock yang tak merespons input user → juri menilai "MVP tidak diimplementasikan".
- ❌ "Edit" me-reset state user.
- ❌ Klaim fitur di deskripsi tapi tak ada di produk.
- ✅ Deterministic 28-rule engine = "moat" yang dipuji juri ("quality gate", "only entry with built-in quality gate").
- ✅ Produk harus jalan end-to-end tanpa API key (deterministic fallback) → tak pernah mati saat demo.
- ✅ "3 complete workflows better than 8 impressive screens."
- ✅ Data simulasi boleh, tapi harus diberi label jelas `Simulasi`/`Real`.

---

## 2. Keputusan arsitektur (sudah disepakati user)

| Keputusan | Pilihan |
|---|---|
| Frontend | Vite + React 19 + Tailwind v4 (SPA statis) |
| Backend | Cloudflare Pages Functions (`functions/api/*.ts`) |
| LLM | OpenRouter **free model** (fallback ke model tanpa key di `.dev.vars`/env) |
| State | Zustand + persist ke localStorage (key `launchdesk-state-v1`) |
| Data store | Apple Lookup API + Google Play metadata (tanpa auth, real integration) |
| Nama produk | **LaunchDesk** |

### Env / Secrets (repo vars / env)
- `OPENROUTER_API_KEY` — di `.dev.vars.example` + docs, jangan commit key asli.

---

## 3. Struktur file (file yang dibuat/dimodifikasi)

```
.
├── index.html                      → diganti jadi Vite entry (root div + /src/main.tsx)
├── package.json                    → deps: react, react-dom, zod, zustand; dev: vite, tailwind, vitest, typescript
├── vite.config.ts                  → plugin react + tailwindcss
├── tsconfig.json                   → strict, no any
├── tailwind.config.ts              → content: ["./index.html", "./src/**/*.{ts,tsx}"]
├── .dev.vars.example               → OPENROUTER_API_KEY=
├── functions/api/
│   ├── analyze.ts                  → POST { storeUrl } → listing + 28-rule score (real fetch)
│   ├── revise.ts                   → POST { appContext, listing, targetScore } → AI revision + re-score
│   ├── kit.ts                      → POST { appContext } → promo kit (deep link, QR, smart banner, payload)
│   └── health.ts                   → GET → { ok: true, source: "cf-pages-functions" } (dummy awal)
├── src/
│   ├── main.tsx                    → React root
│   ├── App.tsx                     → router sederhana (3 steps: Analyze → Revise → Launch)
│   ├── styles.css                  → Tailwind import
│   ├── store/
│   │   └── appStore.ts             → Zustand: appContext + listing + score + revisions (persist)
│   ├── lib/
│   │   ├── aso-rules/
│   │   │   ├── rules.ts            → 28 deterministic ASO rules (kategori: title/subtitle/desc/keywords/visual)
│   │   │   ├── scorer.ts           → hitung skor 0-100 + breakdown per rule
│   │   │   └── types.ts            → RuleResult, AsoScore, ListingData
│   │   ├── extract/
│   │   │   ├── apple.ts            → Apple Lookup API (itunes.apple.com/lookup?id=...)
│   │   │   ├── play.ts             → Play Store metadata scrape (fallback if no API)
│   │   │   └── index.ts            → parse URL → { platform, appId } → ListingData
│   │   ├── llm/
│   │   │   ├── openrouter.ts       → call OpenRouter (fetch, POST https://openrouter.ai/api/v1/chat/completions)
│   │   │   ├── fallback.ts         → deterministic revision engine (context-aware, tanpa LLM)
│   │   │   └── index.ts            → try LLM → fallback; selalu return valid JSON via zod
│   │   └── promo/
│   │       ├── deepLink.ts         → generate custom scheme link
│   │       ├── qr.ts               → QR string via https://api.qrserver.com/v1/create-qr-code/?data=...
│   │       ├── smartBanner.ts      → Apple/Google smart banner snippet
│   │       └── payload.ts          → per-kanal publish payload (X/LinkedIn/Reddit/Telegram) + Discord webhook
│   └── components/
│       ├── Landing.tsx             → hero + paste store link + demo example
│       ├── ScoreDial.tsx           → visual skor 0-100
│       ├── RuleBreakdown.tsx       → daftar aturan lulus/gagal + penjelasan
│       ├── RevisePanel.tsx         → before/after diff + re-score CTA
│       ├── PromoKit.tsx            → deep link/QR/smart banner/payload tabs
│       └── ui.tsx                  → Button/Input/Card kecil (borrowing style dari LaunchCopilot)
├── docs/
│   └── (opsional screenshot demo)
├── questionnaire.md                → isi di tahap akhir (root repo)
└── PLAN.md                         → file ini
```

---

## 4. Task terurut (bite-size, TDD, frequent commit)

### Phase 0 — Scaffold (Hari ini, Kamis 13 Agu)
- [ ] T0.1 `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind`, `index.html`, `src/main.tsx`, `src/App.tsx` minimal (Hello LaunchDesk).
- [ ] T0.2 `functions/api/health.ts` dummy endpoint.
- [ ] T0.3 **Push ke main** → verifikasi live `https://2026-08-nashki.hackonvibe.com/api/health` 200. (DE-RISK PIPELINE)
- [ ] T0.4 Vitest setup (`vitest.config.ts`, script `test`), 1 smoke test.
- [ ] T0.5 Commit "scaffold: vite+react+tailwind+cf-functions".

### Phase 1 — Core engine (Jumat 14 Agu)
- [ ] T1.1 `src/lib/aso-rules/types.ts` + `rules.ts` (28 aturan, tiap rule: `id, label, weight, check(listing): {pass, points, hint}`).
- [ ] T1.2 `scorer.ts` — `score(listing): AsoScore` (0-100 + breakdown). TDD: fixtures listing bagus/buruk.
- [ ] T1.3 `extract/apple.ts` + `play.ts` + `index.ts` — parse URL, fetch listing real. TDD: parse berbagai format URL.
- [ ] T1.4 `functions/api/analyze.ts` — wire engine + fetch. Test manual via `wrangler dev` atau vitest unit (fetch mock).
- [ ] T1.5 `src/store/appStore.ts` — Zustand persist; state: `appContext`, `listing`, `score`, `revisions[]`.
- [ ] T1.6 Commit "feat: 28-rule aso engine + real listing fetch + analyze api".

### Phase 2 — AI revise loop (Sabtu 15 Agu, kickoff 01:00 WIB)
- [ ] T2.1 `llm/openrouter.ts` — call OpenRouter (model `openrouter/auto` atau `deepseek/...` free), system prompt + zod output.
- [ ] T2.2 `llm/fallback.ts` — deterministic revision (bisa jalan tanpa key): perbaiki aturan yang gagal dengan template.
- [ ] T2.3 `llm/index.ts` — `reviseListing(...)` try LLM → catch → fallback; hasil selalu `ListingData` valid.
- [ ] T2.4 `functions/api/revise.ts` — POST → revise → re-score → return `{ before, after, scoreBefore, scoreAfter, deltas }`.
- [ ] T2.5 `RevisePanel.tsx` — UI diff before/after + label `Real AI`/`Simulasi` + re-score.
- [ ] T2.6 TDD: revise unit test (fallback path tanpa network; LLM path mock fetch).
- [ ] T2.7 Commit "feat: ai revise loop with deterministic fallback (never breaks in demo)".

### Phase 3 — Promo kit (Sabtu sore–Minggu)
- [ ] T3.1 `lib/promo/deepLink.ts`, `qr.ts`, `smartBanner.ts`, `payload.ts` (+ unit tests).
- [ ] T3.2 `functions/api/kit.ts` — assemble kit dari `appContext`.
- [ ] T3.3 `PromoKit.tsx` — tab: Deep Link / QR / Smart Banner / Publish Payload (copy button).
- [ ] T3.4 Commit "feat: promo kit - deep link, qr, smart banner, publish payload".

### Phase 4 — Dashboard, roadmap, pricing, polish (Minggu)
- [ ] T4.1 Dashboard ringkas: score gauge, aturan gagal top-5, roadmap 30/60/90 (state-derived, label `Simulasi`).
- [ ] T4.2 Pricing page/segment: Free + Pro ($6/bln) + Grading API (moat monetisasi).
- [ ] T4.3 State flow check: "Edit listing" TIDAK me-reset state (regression test).
- [ ] T4.4 UI polish (Landing hero, warna brand, responsive mobile), meta OG.
- [ ] T4.5 Commit "feat: dashboard + roadmap + pricing + polish".

### Phase 5 — Deliverables (Minggu, sebelum cutoff)
- [ ] T5.1 `questionnaire.md` di root repo (format sesuai diskusi Discord/HackOnVibe).
- [ ] T5.2 README.md update (proyek, link live, cara demo).
- [ ] T5.3 Video demo 2–3 menit + voiceover → upload YouTube (Public/Unlisted).
- [ ] T5.4 Submit DoraHacks + kirim link video/questionnaire ke organizers.
- [ ] T5.5 Final commit + tag, verifikasi live final.

---

## 5. Cara test / verifikasi

- Unit: `npm test` (vitest) — wajib hijau sebelum tiap commit fitur.
- Typecheck: `npm run typecheck` (`tsc --noEmit`).
- Lint: `npm run lint` (eslint).
- API lokal: `npx wrangler pages dev .` (jalankan functions + static sekaligus) atau `npm run dev`.
- Verifikasi live: push main → cek `https://2026-08-nashki.hackonvibe.com` dan `/api/health`.
- E2E smoke: buka live URL di browser, jalankan alur Analyze→Revise→Launch dengan link Play nyata
  (contoh: `https://play.google.com/store/apps/details?id=...`).

---

## 6. Jadwal ringkas

| Hari | Fokus |
|---|---|
| Kamis (13) | Scaffold + verifikasi pipeline live |
| Jumat (14) | Engine 28-rule + real fetch + state |
| Sabtu (15) 01:00 WIB kickoff | AI revise loop + before/after |
| Sabtu sore–Minggu | Promo kit + dashboard + pricing + polish |
| Minggu (16) | questionnaire, video, submit. **Cutoff Senin 17 Agu 10:00 WIB** |

---

## 7. Checklist kemenangan (ditandai saat selesai)

- [ ] Live di hackonvibe.com dengan backend Functions berfungsi
- [ ] 28-rule deterministic engine (moat) — skor transparan
- [ ] Personalisasi: input user mengalir ke semua output (tanpa mock statis)
- [ ] Before/after score loop dengan label Real/Simulasi
- [ ] Promo kit: deep link, QR, smart banner, publish payload — verifiable code integration
- [ ] Bisa demo tanpa API key (fallback deterministik)
- [ ] State persist (edit tidak me-reset)
- [ ] Video ≤3 menit + voiceover
- [ ] questionnaire.md di root repo
- [ ] Submit DoraHacks + YouTube sebelum cutoff
