# HackOnVibe — Project Questionnaire · LaunchDesk

**0. Live demo**

- Primary: **https://launchdesk.pages.dev** (real AI, OpenRouter key configured)
- Org/CI: **https://2026-08-nashki.hackonvibe.com**
- Repo: https://github.com/HackOnVibeCom/2026-08-nashki

**1. What does your application/service do?**

LaunchDesk is an AI app-launch copilot for indie and solo mobile developers. Paste
your App Store or Play Store link and LaunchDesk fetches real listing, scores it
against 28 deterministic ASO rules (a transparent "quality gate"), rewrites the
listing so it clears gate, and generates verified promo kit — custom deep
link, scannable QR code, smart-banner HTML, and per-channel publish copy (X,
LinkedIn, Reddit, Telegram). Every output is derived from actual app user
pasted — no static mock data. Extraction is AI-first when the OpenRouter key is
present (AI cleans the text fields; screenshots/video always come from the real
page), with automatic fallback to the deterministic extractor — so the demo never
breaks. Verified live: Mobile Legends (Play) → B/83, Duolingo (Play) → B/86,
TikTok (App Store) → A/90.

**2. Who is the target audience?**

Solo and indie mobile app developers, small studios (1–5 people), and hackathon
builders who ship an app but can't afford a marketing agency. The core persona is a
developer who is great at building but has no dedicated ASO / launch marketing
support — the largest underserved group in the app economy.

**3. Which countries are the expected buyers of this service?**

Global, with a focus on developer-heavy emerging markets where agency services are
prohibitively expensive: Southeast Asia (Indonesia, Vietnam, Philippines, Thailand),
India, Latin America (Brazil, Mexico), and parts of Africa. The product is a web app
that works on any device and its output can target any store locale — including a
non-English path as a roadmap item. We frame this as the **Business Success** play:
turning developers' strongest asset — a built product — into a marketable one, with
agency-quality promotion at a price a solo dev can actually afford.

**4. Who are your competitors?**

Raw general-purpose LLMs (ChatGPT / Claude) — no 28-rule quality gate, no store
integration, and no verifiable score; ASO analytics suites (Sensor Tower, AppTweak,
AppFollow) — analysis only, expensive, no rewrite loop or promo kit; AI copywriters
(Jasper, Copy.ai) — not app-aware and no quality gate; freelance marketers/agencies —
slow and unaffordable for solo devs. LaunchDesk combines deterministic, transparent
scoring with a rewrite loop and publishable promo assets in one free-to-try product.

**6. How does LaunchDesk grow as a business?**

A freemium funnel built on the demo itself: **Free** (Analyze + one Revise per app +
promo kit) requires no setup and no key, so it spreads by word of mouth inside
developer communities. **Pro / subscription** (per-grant or recurring) unlocks
unlimited revisions, batch tracking across an app portfolio, saved A/B variants, and
priority AI extraction. Because every artifact is derived from real store data and a
deterministic, judge-verifiable quality gate, the value is visible before any payment
— which compresses the trial-to-pay step and keeps churn low.

**5. What is your advantage?**

Three differentiators: (1) **A deterministic 28-rule quality gate** — every revision
must clear a high score before it is shown, and the before→after score delta proves
the improvement instead of just claiming it; (2) **Real integration, zero-mock** —
the listing is fetched from the real store APIs (Apple Lookup + Play Store HTML,
including screenshots and trailer video) and every artifact derives from the
user's own app; extraction is AI-first when a key is present — the AI cleans the
text fields while screenshots/video always come from the real page; (3) **Never
breaks in a demo** — OpenRouter powers real AI output when a key is available, and
a deterministic fallback engine keeps everything working with zero setup. It
closes the loop: analyze → rewrite (with measured improvement) → launch assets.
