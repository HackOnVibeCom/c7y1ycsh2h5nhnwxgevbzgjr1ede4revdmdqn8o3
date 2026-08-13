import { useAppStore } from "../store/appStore";

const EXAMPLES = [
  "https://play.google.com/store/apps/details?id=com.duolingo",
  "https://apps.apple.com/app/duolingo-language-lessons/id570060128",
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "1 listing analyzed",
      "28-rule quality gate score",
      "AI rewrite (1×)",
      "Promo kit: deep link, QR, banner",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$5.99",
    period: "per month",
    features: [
      "Unlimited listings",
      "Target-score 90 revisions",
      "Roadmap & fix prioritization",
      "Unlimited promo kits",
      "Priority AI model",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Grading API",
    price: "$49",
    period: "per month",
    features: [
      "POST /api/analyze for your pipeline",
      "Same 28-rule quality gate",
      "Score before you publish",
      "CI-friendly JSON responses",
    ],
    cta: "Get API key",
    highlight: false,
  },
];

export function Landing() {
  const setStep = useAppStore((s) => s.setStep);

  return (
    <div>
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">LaunchDesk</p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Your AI app-launch copilot
        </h1>
        <p className="max-w-lg text-lg text-slate-300">
          Paste your App Store or Play Store link. LaunchDesk grades your listing,
          rewrites it with our 28-rule quality gate, and generates a verified promo
          kit — deep links, QR codes and smart banners.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("analyze")}
            className="rounded-lg bg-cyan-500 px-7 py-3 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Analyze my app →
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((u) => (
              <span key={u} className="rounded-full bg-slate-800 text-xs text-slate-300 px-3 py-1">
                {u}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-16">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Pricing</h2>
          <p className="mt-1 text-sm text-slate-400">
            Start free — every launch deserves a quality gate.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "flex flex-col gap-4 rounded-xl border border-cyan-500/50 bg-cyan-500/10 p-5"
                  : "flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              }
            >
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={
                  plan.highlight
                    ? "rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    : "rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}