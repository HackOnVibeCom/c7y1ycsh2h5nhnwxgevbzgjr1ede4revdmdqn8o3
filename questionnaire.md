# HackOnVibe — Project Questionnaire · LaunchDesk

**1. What does your application/service do?**

LaunchDesk is an AI app-launch copilot for indie and solo mobile developers. Paste
your App Store or Play Store link and LaunchDesk fetches the real listing, scores it
against 28 deterministic ASO rules (a transparent "quality gate"), rewrites the
listing so it clears the gate, and generates a verified promo kit — a custom deep
link, scannable QR code, smart-banner HTML, and per-channel publish copy (X,
LinkedIn, Reddit, Telegram). Every output is derived from the actual app the user
pasted — no static mock data.

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
non-English path as a roadmap item. This is the "Global Impact" angle: democratizing
app promotion for developers who otherwise cannot compete.

**4. Who are your competitors?**

Raw general-purpose LLMs (ChatGPT / Claude) — no 28-rule quality gate, no store
integration, and no verifiable score; ASO analytics suites (Sensor Tower, AppTweak,
AppFollow) — analysis only, expensive, no rewrite loop or promo kit; AI copywriters
(Jasper, Copy.ai) — not app-aware and no quality gate; freelance marketers/agencies —
slow and unaffordable for solo devs. LaunchDesk combines deterministic, transparent
scoring with a rewrite loop and publishable promo assets in one free-to-try product.

**5. What is your advantage?**

Three differentiators: (1) **A deterministic 28-rule quality gate** — every revision
must clear a high score before it is shown, and the before→after score delta proves
the improvement instead of just claiming it; (2) **Real integration, zero-mock** —
the listing is fetched from the real store APIs and every artifact derives from the
user's own app; (3) **Never breaks in a demo** — OpenRouter powers real AI output
when a key is available, and a deterministic fallback engine keeps everything working
with zero setup. It closes the loop: analyze → rewrite (with measured improvement) →
launch assets.
